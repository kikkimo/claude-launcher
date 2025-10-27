/**
 * StdinManager - Unified stdin state management
 *
 * This module provides centralized management of stdin operations,
 * preventing conflicts between different modules that need to interact
 * with user input (raw mode, readline, password input, etc.)
 */

const readline = require('readline');
const EventEmitter = require('events');

class StdinManager extends EventEmitter {
    constructor() {
        super();
        this.currentOwner = null;
        this.activeScope = null; // Track currently active scope object
        this.ownerStack = [];
        this.listeners = new Map();
        this.stateHistory = [];
        this.debugMode = process.env.DEBUG_STDIN === 'true';
        // Suspension flag: when true, parent process should not attach/read stdin at all
        this.suspended = false;

        // Save initial state
        this.initialState = this._captureState();

        // Track if we're in a cleanup phase to prevent recursion
        this.isCleaningUp = false;

        // Ctrl+C double-press management
        this.ctrlCCount = 0;
        this.ctrlCTimer = null;
        this.ctrlCEnabled = true; // Flag to enable/disable Ctrl+C monitoring
    }

    /**
     * Capture current stdin state
     */
    _captureState() {
        if (!process.stdin.isTTY) {
            return {
                isTTY: false,
                isPaused: true,
                isRaw: false,
                encoding: 'utf8'
            };
        }

        return {
            isTTY: true,
            isPaused: process.stdin.isPaused ? process.stdin.isPaused() : true,
            isRaw: process.stdin.isRaw || false,
            encoding: process.stdin.readableEncoding || 'utf8',
            listeners: {
                data: process.stdin.listenerCount('data'),
                keypress: process.stdin.listenerCount('keypress'),
                readable: process.stdin.listenerCount('readable')
            }
        };
    }

    /**
     * Apply a state to stdin
     */
    _applyState(state) {
        if (!process.stdin.isTTY || !state.isTTY) {
            return;
        }

        try {
            // Set raw mode
            if (state.isRaw !== undefined) {
                process.stdin.setRawMode(state.isRaw);
            }

            // Set encoding
            if (state.encoding) {
                process.stdin.setEncoding(state.encoding);
            }

            // Pause/resume
            if (state.isPaused) {
                process.stdin.pause();
            } else {
                process.stdin.resume();
            }
        } catch (error) {
            this._debug('Error applying state:', error.message);
        }
    }

    /**
     * Debug logging
     */
    _debug(...args) {
        if (this.debugMode) {
            console.error('[StdinManager]', ...args);
        }
    }

    /**
     * Acquire control of stdin with a specific mode
     * @param {string} mode - 'raw', 'line', 'password'
     * @param {object} options - Additional options
     * @returns {StdinScope} - A scope object to manage the acquired state
     */
    acquire(mode, options = {}) {
        // If suspended, return a no-op scope that does not touch stdin
        if (this.suspended) {
            this._debug(`Acquire ignored (suspended): ${options.id || 'anonymous'} requested ${mode}`);
            return new NoopStdinScope();
        }
        const callerId = options.id || `anonymous_${Date.now()}`;

        if (this.currentOwner && this.currentOwner !== callerId && !options.force) {
            this._debug(`Warning: ${callerId} trying to acquire while ${this.currentOwner} owns stdin`);
            if (!options.allowNested) {
                throw new Error(`Stdin is currently owned by ${this.currentOwner}`);
            }
        }

        // Save current state before acquiring
        const previousState = this._captureState();
        const previousOwner = this.currentOwner;
        const previousScope = this.activeScope;

        // Push to stack if nesting
        if (this.currentOwner && options.allowNested) {
            // Detach listeners from previous scope but do not clear global listeners
            if (previousScope && typeof previousScope.detach === 'function') {
                previousScope.detach();
            }
            this.ownerStack.push({
                owner: this.currentOwner,
                state: previousState,
                scope: previousScope
            });
        } else if (this.currentOwner && !options.allowNested && !options.force) {
            // Disallow stealing stdin without explicit force
            throw new Error(`Stdin is currently owned by ${this.currentOwner}`);
        }

        this.currentOwner = callerId;
        this._debug(`${callerId} acquired stdin in ${mode} mode`);

        // Create scope object
        const scope = new StdinScope(this, callerId, mode, previousState, previousOwner);

        // Apply the requested mode
        switch (mode) {
            case 'raw':
                this._setupRawMode(scope);
                break;
            case 'line':
                this._setupLineMode(scope);
                break;
            case 'password':
                this._setupPasswordMode(scope);
                break;
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }

        // Mark this scope as active
        this.activeScope = scope;

        return scope;
    }

    /**
     * Setup raw mode for navigation/menu
     */
    _setupRawMode(scope) {
        if (!process.stdin.isTTY) {
            return;
        }

        try {
            // Setup for raw mode
            process.stdin.setRawMode(true);
            process.stdin.setEncoding('utf8');
            process.stdin.resume();

            this._debug(`Raw mode activated for ${scope.ownerId}`);
        } catch (error) {
            this._debug('Error setting up raw mode:', error.message);
            throw error;
        }
    }

    /**
     * Setup line mode for readline interface
     */
    _setupLineMode(scope) {
        try {
            // Ensure we're not in raw mode
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
                process.stdin.setEncoding('utf8');
                // Ensure stream is flowing for readline
                process.stdin.resume();
            }

            this._debug(`Line mode activated for ${scope.ownerId}`);
        } catch (error) {
            this._debug('Error setting up line mode:', error.message);
            throw error;
        }
    }

    /**
     * Setup password mode (raw with echo off)
     */
    _setupPasswordMode(scope) {
        if (!process.stdin.isTTY) {
            return;
        }

        try {
            // Clear any existing listeners from other modules
            this._saveAndClearListeners(scope);

            // Setup for password input
            process.stdin.setRawMode(true);
            process.stdin.setEncoding('utf8');
            process.stdin.resume();

            this._debug(`Password mode activated for ${scope.ownerId}`);
        } catch (error) {
            this._debug('Error setting up password mode:', error.message);
            throw error;
        }
    }

    /**
     * Save and clear existing listeners
     */
    _saveAndClearListeners(scope) {
        // Deprecated: avoid global removeAllListeners which causes deadlocks.
        // Kept for backward compatibility but no-op now.
        scope.savedListeners = new Map();
        this._debug('Skipped global removeAllListeners to preserve pending scopes');
    }

    /**
     * Restore saved listeners
     */
    _restoreListeners(scope) {
        // No-op: we no longer clear global listeners.
    }

    /**
     * Release control of stdin
     */
    release(callerId) {
        if (this.currentOwner !== callerId) {
            this._debug(`Warning: ${callerId} trying to release but current owner is ${this.currentOwner}`);
            return false;
        }

        this._debug(`${callerId} releasing stdin control`);

        // Check if there's a stacked owner to restore
        if (this.ownerStack.length > 0) {
            const previous = this.ownerStack.pop();
            this.currentOwner = previous.owner;
            this.activeScope = previous.scope || null;
            // Reattach previous scope listeners if possible
            if (this.activeScope && typeof this.activeScope.reattach === 'function') {
                this.activeScope.reattach();
            }
            this._applyState(previous.state);
            this._debug(`Restored previous owner ${previous.owner}`);
        } else {
            this.currentOwner = null;
            this.activeScope = null;
            // Restore to safe default state
            this._applyState({
                isTTY: process.stdin.isTTY,
                isPaused: true,
                isRaw: false,
                encoding: 'utf8'
            });
            this._debug('No previous owner, restored to default state');
        }

        return true;
    }

    /**
     * Force reset to initial state (emergency use only)
     */
    forceReset() {
        if (this.isCleaningUp) {
            return; // Prevent recursion
        }

        this.isCleaningUp = true;
        this._debug('Force resetting stdin to initial state');

        try {
            // Clear all listeners
            process.stdin.removeAllListeners();

            // Reset state
            this._applyState(this.initialState);

            // Clear ownership
            this.currentOwner = null;
            this.ownerStack = [];
            this.listeners.clear();
        } catch (error) {
            this._debug('Error during force reset:', error.message);
        } finally {
            this.isCleaningUp = false;
        }
    }

    /**
     * Get current status for debugging
     */
    getStatus() {
        return {
            currentOwner: this.currentOwner,
            stackDepth: this.ownerStack.length,
            currentState: this._captureState(),
            isCleaningUp: this.isCleaningUp
        };
    }

    /**
     * Check if currently waiting for second Ctrl+C
     */
    isCtrlCPending() {
        return this.ctrlCCount > 0;
    }

    /**
     * Cancel Ctrl+C exit intent (called when user presses any other key)
     */
    cancelCtrlC() {
        if (this.ctrlCCount > 0) {
            this.ctrlCCount = 0;
            if (this.ctrlCTimer) {
                clearTimeout(this.ctrlCTimer);
                this.ctrlCTimer = null;
            }
            // Clear the warning text (2 lines: empty line + warning line)
            // Move up to warning line, clear it, then clear empty line above
            process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1 line, clear warning
            process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1 line, clear empty line
            this._debug('Ctrl+C cancelled by user input');
        }
    }

    /**
     * Disable Ctrl+C monitoring
     * Call this before launching Claude Code to prevent Ctrl+C interception
     */
    disableCtrlC() {
        this.ctrlCEnabled = false;
        // Also cancel any pending Ctrl+C state
        if (this.ctrlCCount > 0) {
            this.ctrlCCount = 0;
            if (this.ctrlCTimer) {
                clearTimeout(this.ctrlCTimer);
                this.ctrlCTimer = null;
            }
        }
        this._debug('Ctrl+C monitoring disabled');
    }

    /**
     * Enable Ctrl+C monitoring
     * Call this to re-enable Ctrl+C monitoring after disabling
     */
    enableCtrlC() {
        this.ctrlCEnabled = true;
        this._debug('Ctrl+C monitoring enabled');
    }

    /**
     * Private: Reset Ctrl+C state on timeout
     * Clears warning text after 3 seconds of no input
     */
    _resetCtrlCOnTimeout() {
        this.ctrlCCount = 0;
        this.ctrlCTimer = null;
        // Clear the warning text (2 lines: empty line + warning line)
        // Move up to warning line, clear it, then clear empty line above
        process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1 line, clear warning
        process.stdout.write('\x1b[1A\r\x1b[K'); // Up 1 line, clear empty line
        this._debug('Ctrl+C timer expired - warning cleared, returning to normal operation');
    }

    /**
     * Handle Ctrl+C with double-press confirmation
     * First press: show warning and start 3-second timer
     * Second press (within 3 seconds): exit program
     * Timer expires: reset count and return to normal operation
     * Any other key: cancel and return to normal operation
     *
     * If Ctrl+C monitoring is disabled (e.g., when launching Claude Code),
     * this function does nothing and returns false
     */
    handleCtrlC() {
        // If suspended, do nothing so child process can receive Ctrl+C
        if (this.suspended) {
            this._debug('Ctrl+C ignored (suspended)');
            return false;
        }
        // If Ctrl+C monitoring is disabled, do nothing
        if (!this.ctrlCEnabled) {
            this._debug('Ctrl+C ignored (monitoring disabled)');
            return false;
        }

        this.ctrlCCount++;

        if (this.ctrlCCount === 1) {
            // First Ctrl+C - show warning
            const colors = require('../ui/colors');
            const i18n = require('../i18n');
            console.log('');
            console.log(colors.yellow + '⚠️  ' + i18n.tSync('messages.prompts.ctrl_c_again') + colors.reset);

            // Clear any existing timer
            if (this.ctrlCTimer) {
                clearTimeout(this.ctrlCTimer);
            }

            // Set 3-second timeout to reset count
            this.ctrlCTimer = setTimeout(() => {
                this._resetCtrlCOnTimeout();
            }, 3000);

            return false; // Don't exit yet, continue normal operation

        } else if (this.ctrlCCount >= 2) {
            // Second Ctrl+C within timeout - exit
            if (this.ctrlCTimer) {
                clearTimeout(this.ctrlCTimer);
                this.ctrlCTimer = null;
            }

            const colors = require('../ui/colors');
            const i18n = require('../i18n');
            console.log('');
            console.log(colors.green + i18n.tSync('ui.general.goodbye') + colors.reset);

            // Clean up stdin before exit
            try {
                this.forceReset();
            } catch (error) {
                // Ignore cleanup errors during exit
            }

            process.exit(0);
        }
    }
}

/**
 * StdinScope - Represents an acquired stdin context
 */
class StdinScope {
    constructor(manager, ownerId, mode, previousState, previousOwner) {
        this.manager = manager;
        this.ownerId = ownerId;
        this.mode = mode;
        this.previousState = previousState;
        this.previousOwner = previousOwner;
        this.isReleased = false;
        this.listeners = new Map();
        this.savedListeners = null;
        this._detached = false;
    }

    /**
     * Add an event listener that will be automatically cleaned up
     */
    on(event, handler) {
        if (this.isReleased) {
            throw new Error('Cannot add listener to released scope');
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
        process.stdin.on(event, handler);

        return this;
    }

    /**
     * Add a one-time event listener
     */
    once(event, handler) {
        if (this.isReleased) {
            throw new Error('Cannot add listener to released scope');
        }

        const wrappedHandler = (...args) => {
            this.removeListener(event, wrappedHandler);
            handler(...args);
        };

        this.on(event, wrappedHandler);
        return this;
    }

    /**
     * Remove an event listener
     */
    removeListener(event, handler) {
        if (this.listeners.has(event)) {
            const handlers = this.listeners.get(event);
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
                process.stdin.removeListener(event, handler);
            }
        }
        return this;
    }

    /**
     * Remove all listeners for this scope
     */
    removeAllListeners() {
        this.listeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                process.stdin.removeListener(event, handler);
            });
        });
        this.listeners.clear();
        return this;
    }

    /**
     * Detach listeners from process.stdin but keep record for later reattach
     */
    detach() {
        if (this._detached) return;
        this.listeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                process.stdin.removeListener(event, handler);
            });
        });
        this._detached = true;
    }

    /**
     * Reattach previously detached listeners
     */
    reattach() {
        if (!this._detached) return;
        this.listeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                process.stdin.on(event, handler);
            });
        });
        this._detached = false;
    }

    /**
     * Release this scope and restore previous state
     */
    release() {
        if (this.isReleased) {
            return false;
        }

        // Remove all our listeners
        this.removeAllListeners();

        // Restore any saved listeners
        this.manager._restoreListeners(this);

        // Restore previous state
        this.manager._applyState(this.previousState);

        // Release from manager
        const released = this.manager.release(this.ownerId);
        this.isReleased = true;

        return released;
    }

    /**
     * Create a readline interface with proper cleanup
     */
    createReadline(options = {}) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            ...options
        });

        // Track for cleanup
        const originalClose = rl.close.bind(rl);
        rl.close = () => {
            originalClose();
            // Additional cleanup if needed
        };

        return rl;
    }
}

// Create singleton instance
const stdinManager = new StdinManager();

// Export both the class and singleton
module.exports = stdinManager;
module.exports.StdinManager = StdinManager;
module.exports.StdinScope = StdinScope;
// Suspension API
stdinManager.suspend = function() {
    this._debug('StdinManager suspended');
    this.suspended = true;
    // Best-effort: clear ctrl-c pending state
    this.cancelCtrlC();
};
stdinManager.resume = function() {
    this._debug('StdinManager resumed');
    this.suspended = false;
};
stdinManager.isSuspended = function() {
    return !!this.suspended;
};

/**
 * Noop scope used when stdin is suspended to prevent attaching listeners
 */
class NoopStdinScope {
    on() { return this; }
    once() { return this; }
    removeListener() { return this; }
    removeAllListeners() { return this; }
    detach() { return this; }
    reattach() { return this; }
    release() { return true; }
    createReadline() { return { question: (_, cb)=>cb && cb(''), close: ()=>{} }; }
}
