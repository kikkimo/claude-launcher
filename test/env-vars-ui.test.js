/**
 * Tests for env UI redesign — Menu navigationKey, draft layer, add flow
 */

const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

// --- Intercept stdout ---
const outputLog = [];
const originalWrite = process.stdout.write.bind(process.stdout);
function startCapture() { outputLog.length = 0; process.stdout.write = (data, enc, cb) => { outputLog.push(typeof data === 'string' ? data : data.toString()); return originalWrite(data, enc, cb); }; }
function stopCapture() { process.stdout.write = originalWrite; }
function captured() { return outputLog.join(''); }

// ============================================================
// Task 1: Menu navigationKey extension + non-TTY
// ============================================================

function freshMenu() {
    delete require.cache[require.resolve('../lib/ui/screen')];
    delete require.cache[require.resolve('../lib/ui/menu')];
    const Menu = require('../lib/ui/menu');
    return Menu;
}

console.log('Task 1: Menu navigationKey extension + non-TTY:');

test('displayMenu renders custom navigationKey text', () => {
    const Menu = freshMenu();
    const menu = new Menu();
    menu.setOptions(['A', 'B']);
    const origTSync = require('../lib/i18n').tSync;
    require('../lib/i18n').tSync = (k) => k === 'TEST_NAV_KEY' ? 'Custom Nav Text' : k;

    startCapture();
    menu.displayMenu(null, null, 'TEST_NAV_KEY');
    stopCapture();

    const out = captured();
    assert.ok(out.includes('Custom Nav Text'), 'should render custom nav key');
    assert.ok(!out.includes('navigation.use_arrows'), 'should NOT fallback to default key');
    require('../lib/i18n').tSync = origTSync;
});

test('displayMenu stores _navigationKey (used by navigate for redraw)', () => {
    const Menu = freshMenu();
    const menu = new Menu();
    menu.setOptions(['A']);
    menu.displayMenu(null, null, 'CUSTOM_NAV');
    assert.strictEqual(menu._navigationKey, 'CUSTOM_NAV');
});

test('non-TTY renders number prefixes', () => {
    const Menu = freshMenu();
    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    const menu = new Menu();
    menu.setOptions(['Option A', 'Option B']);

    startCapture();
    menu.displayMenu();
    stopCapture();

    const out = captured();
    assert.ok(out.includes('1.'), 'should have numbered first option');
    assert.ok(out.includes('2.'), 'should have numbered second option');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
});

test('TTY mode does NOT render number prefixes', () => {
    const Menu = freshMenu();
    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    const menu = new Menu();
    menu.setOptions(['Option A', 'Option B']);

    startCapture();
    menu.displayMenu();
    stopCapture();

    const out = captured();
    assert.ok(!out.includes('1.'), 'should NOT have numbered prefix in TTY mode');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
});

console.log(`\nTask 1: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
