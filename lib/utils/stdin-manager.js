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
        this.ownerStack = [];
        this.listeners = new Map();
        this.stateHistory = [];
        this.debugMode = process.env.DEBUG_STDIN === 'true';

        // Save initial state
        this.initialState = this._captureState();

        // Track if we're in a cleanup phase to prevent recursion
        this.isCleaningUp = false;
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

        // Push to stack if nesting
        if (this.currentOwner && options.allowNested) {
            this.ownerStack.push({
                owner: this.currentOwner,
                state: previousState
            });
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
            // Clear any existing listeners from other modules
            this._saveAndClearListeners(scope);

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
            // Clear any existing listeners from other modules
            this._saveAndClearListeners(scope);

            // Ensure we're not in raw mode
            if (process.stdin.isTTY) {
                process.stdin.setRawMode(false);
                process.stdin.setEncoding('utf8');
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
        const events = ['data', 'keypress', 'readable', 'end'];
        scope.savedListeners = new Map();

        events.forEach(event => {
            const listeners = process.stdin.listeners(event);
            if (listeners.length > 0) {
                scope.savedListeners.set(event, [...listeners]);
                process.stdin.removeAllListeners(event);
                this._debug(`Saved and cleared ${listeners.length} listeners for '${event}'`);
            }
        });
    }

    /**
     * Restore saved listeners
     */
    _restoreListeners(scope) {
        if (!scope.savedListeners) {
            return;
        }

        scope.savedListeners.forEach((listeners, event) => {
            listeners.forEach(listener => {
                process.stdin.on(event, listener);
            });
            this._debug(`Restored ${listeners.length} listeners for '${event}'`);
        });
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
            this._applyState(previous.state);
            this._debug(`Restored previous owner ${previous.owner}`);
        } else {
            this.currentOwner = null;
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