// Minimal stub -- will be replaced by Task 1's full implementation
class Screen {
    constructor() {
        this.inAltScreen = false;
        this.isTTY = process.stdout.isTTY || false;
    }
    write(text) { process.stdout.write(text); }
    showCursor() { if (this.isTTY) process.stdout.write('\x1b[?25h'); }
    hideCursor() { if (this.isTTY) process.stdout.write('\x1b[?25l'); }
    debug(message) {
        if (this.inAltScreen) return;
        process.stderr.write(message + '\n');
    }
}

module.exports = new Screen();
