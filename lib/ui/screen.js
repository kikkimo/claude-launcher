/**
 * Screen Singleton - ANSI terminal rendering layer
 *
 * All UI output goes through this module. Eliminates position drift
 * by using absolute cursor positioning (cursorHome + clearScreen)
 * and alternate screen buffer for isolation.
 */

const ANSI = {
    enterAltScreen: '\x1b[?1049h',
    exitAltScreen: '\x1b[?1049l',
    cursorHome: '\x1b[H',
    clearScreen: '\x1b[2J',
    cursorHide: '\x1b[?25l',
    cursorShow: '\x1b[?25h',
    reset: '\x1b[0m',
};

class Screen {
    constructor() {
        this.inAltScreen = false;
        this.isTTY = process.stdout.isTTY || false;
        this.noAlt = process.env.SCREEN_NO_ALT === '1';
        this.testMode = process.env.SCREEN_TEST === '1';
        this.readlineActive = false;
        this.currentTag = null;
        this._log = [];
    }

    enter() {
        if (!this.isTTY) return;
        if (this.inAltScreen) return;
        if (!this.noAlt) {
            this._rawWrite(ANSI.enterAltScreen);
        }
        this._rawWrite(ANSI.cursorHide);
        this.inAltScreen = true;
    }

    exit() {
        if (!this.inAltScreen) return;
        this._rawWrite(ANSI.cursorShow);
        if (!this.noAlt) {
            this._rawWrite(ANSI.exitAltScreen);
        }
        this.inAltScreen = false;
    }

    exitForHandoff() {
        if (!this.inAltScreen) return;
        this._rawWrite(ANSI.cursorShow);
        this._rawWrite(ANSI.reset);
        if (!this.noAlt) {
            this._rawWrite(ANSI.exitAltScreen);
        }
        if (this.isTTY && process.stdin.isTTY) {
            try { process.stdin.setRawMode(false); } catch (_) {}
        }
        this.inAltScreen = false;
    }

    render(lines) {
        this.currentTag = 'render';
        if (this.isTTY) {
            this._rawWrite(ANSI.cursorHome + ANSI.clearScreen);
        }
        for (const line of lines) {
            this._rawWrite(line + '\n');
        }
        this.currentTag = null;
    }

    write(text) {
        this.currentTag = 'write';
        this._rawWrite(text);
        this.currentTag = null;
    }

    showCursor() {
        if (this.isTTY) {
            this._rawWrite(ANSI.cursorShow);
        }
    }

    hideCursor() {
        if (this.isTTY) {
            this._rawWrite(ANSI.cursorHide);
        }
    }

    isActive() {
        return this.inAltScreen;
    }

    debug(message) {
        if (this.inAltScreen) return; // Suppress during alt-screen
        this._rawStderr(message + '\n');
    }

    setReadlineActive(active) {
        this.readlineActive = active;
        this.currentTag = active ? 'readline' : null;
    }

    getLog() {
        return this._log;
    }

    _rawWrite(data) {
        if (this.testMode) {
            const tag = this.readlineActive ? 'readline' : (this.currentTag || 'untagged');
            this._log.push({ channel: 'stdout', tag, data: data.substring(0, 80), time: Date.now() });
        }
        process.stdout.write(data);
    }

    _rawStderr(data) {
        if (this.testMode) {
            this._log.push({ channel: 'stderr', tag: 'debug', data: data.substring(0, 80), time: Date.now() });
        }
        process.stderr.write(data);
    }
}

module.exports = new Screen();
