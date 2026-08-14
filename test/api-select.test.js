/**
 * Tests for API select menu:
 * - ApiManager data contract tests (mock config, stubbed saveConfig)
 * - Source-level verification of showApiSelectMenu via brace-counting extraction
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  \u2713 ${name}`);
    } catch (e) {
        failed++;
        console.log(`  \u2717 ${name}`);
        console.log(`    ${e.message}`);
    }
}

/**
 * Extract a function body from source code using brace-counting
 */
function extractFunctionBody(source, signature) {
    const start = source.indexOf(signature);
    if (start === -1) return null;
    const braceStart = source.indexOf('{', start);
    if (braceStart === -1) return null;
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
    }
    return null;
}

const ApiManager = require('../lib/api-manager');

/**
 * Create an ApiManager with custom mock config (no file I/O)
 */
function createMgr(config) {
    const mgr = new ApiManager();
    mgr.config = config;
    mgr.saveConfig = () => {};
    return mgr;
}

function makeApi(overrides = {}) {
    return {
        id: 'api-' + Math.random().toString(36).slice(2, 8),
        name: 'Test API',
        provider: 'custom',
        baseUrl: 'https://example.com',
        authToken: 'fake-encrypted-token',
        model: 'test-model',
        smallFastModel: 'test-model',
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
        successCount: 0,
        failCount: 0,
        lastError: null,
        ...overrides
    };
}

// ─── ApiManager data contract tests ───

test('no APIs: getApis().length === 0', () => {
    const mgr = createMgr({
        apis: [],
        activeIndex: -1,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.strictEqual(mgr.getApis().length, 0);
});

test('no APIs: getActiveApi() === null', () => {
    const mgr = createMgr({
        apis: [],
        activeIndex: -1,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.strictEqual(mgr.getActiveApi(), null);
});

test('invalid active index: getActiveApi() === null when index out of bounds', () => {
    const mgr = createMgr({
        apis: [makeApi()],
        activeIndex: 99,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    assert.ok(mgr.getApis().length > 0, 'should have APIs');
    assert.strictEqual(mgr.getActiveApi(), null,
        'getActiveApi should return null when activeIndex is out of bounds');
});

test('no active marker when activeIndex is out of bounds', () => {
    const mgr = createMgr({
        apis: [makeApi({ name: 'API-A' }), makeApi({ name: 'API-B' })],
        activeIndex: 99,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });
    const activeApi = mgr.getActiveApi();
    assert.strictEqual(activeApi, null,
        'no API should be marked active when activeIndex is out of bounds');
});

test('setActiveApi changes active + recordLaunchAttempt works', () => {
    const mgr = createMgr({
        apis: [makeApi({ name: 'A' }), makeApi({ name: 'B' })],
        activeIndex: 0,
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        exportPassword: null,
        passwordSkipped: false
    });

    // Switch to second API
    mgr.setActiveApi(1);
    assert.strictEqual(mgr.getActiveApi().name, 'B',
        'active API should be B after setActiveApi(1)');

    // Record launch attempt on the new active API
    const result = mgr.recordLaunchAttempt();
    assert.ok(result, 'recordLaunchAttempt should return the API object');
    assert.strictEqual(result.usageCount, 1);
    assert.strictEqual(result.successCount, 1);
    assert.ok(result.lastUsed !== null);
});

// ─── Source-level verification ───

const launcherSource = fs.readFileSync(
    path.join(__dirname, '..', 'claude-launcher'), 'utf8'
);

test('showApiSelectMenu function exists and contains required patterns', () => {
    const body = extractFunctionBody(launcherSource, 'async function showApiSelectMenu');
    assert.ok(body, 'showApiSelectMenu function should exist in source');

    assert.ok(body.includes('apis.length === 0'),
        'showApiSelectMenu should check apis.length === 0');
    assert.ok(body.includes("'● '") || body.includes('"● "'),
        'showApiSelectMenu should contain active marker string literal');
    assert.ok(body.includes('setActiveApi(choice)'),
        'showApiSelectMenu should call setActiveApi(choice)');
    assert.ok(body.includes('launchClaudeWithApi('),
        'showApiSelectMenu should call launchClaudeWithApi');
    assert.ok(body.includes('return showMenu()'),
        'showApiSelectMenu should return showMenu()');
});

// ─── i18n key verification ───

test('navigation.action.edit key exists in en locale', () => {
    const en = require('../lib/i18n/locales/en');
    assert.ok(en.navigation.action.edit);
    assert.ok(en.navigation.action.remove);
    assert.ok(en.navigation.action.switch);
    assert.ok(en.navigation.action.select);
});

test('navigation.use_arrows_esc does not contain "main menu"', () => {
    const en = require('../lib/i18n/locales/en');
    assert.ok(!en.navigation.use_arrows_esc.includes('main menu'));
});

// ─── Pagination tests ───

console.log('\ncalculatePagination():');

test('single page with 3 APIs and large terminal', () => {
    const { calculatePagination } = require('../lib/ui/interactive-table');
    const { itemsPerPage, totalPages } = calculatePagination(3, 40, false);
    assert.ok(itemsPerPage >= 3, 'Should fit all 3 on one page');
    assert.strictEqual(totalPages, 1);
});

test('multi-page with 7 APIs and rows=30', () => {
    const { calculatePagination } = require('../lib/ui/interactive-table');
    const { itemsPerPage, totalPages } = calculatePagination(7, 30, false);
    assert.ok(itemsPerPage < 7, 'Should not fit all 7');
    assert.ok(totalPages > 1, 'Should need multiple pages');
});

test('switch mode has fewer items per page', () => {
    const { calculatePagination } = require('../lib/ui/interactive-table');
    const normal = calculatePagination(7, 30, false);
    const switchMode = calculatePagination(7, 30, true);
    assert.ok(switchMode.itemsPerPage <= normal.itemsPerPage, 'Switch overhead reduces capacity');
});

test('minimum 1 item per page even on tiny terminal', () => {
    const { calculatePagination } = require('../lib/ui/interactive-table');
    const { itemsPerPage } = calculatePagination(10, 15, false);
    assert.strictEqual(itemsPerPage, 1);
});

test('legacy overflow adds warning line overhead', () => {
    const { calculatePagination } = require('../lib/ui/interactive-table');
    const normal = calculatePagination(99, 30, false, false);
    const legacy = calculatePagination(99, 30, false, true);
    assert.ok(legacy.itemsPerPage <= normal.itemsPerPage, 'Warning line reduces capacity');
});

console.log('\ninitPaginationState():');

test('switch mode positions on active API page', () => {
    const { initPaginationState } = require('../lib/ui/interactive-table');
    const { currentPage, pageSelections } = initPaginationState(3, 3, 5, 'switch', 7);
    assert.strictEqual(currentPage, 1);
    assert.strictEqual(pageSelections[1], 2);
});

test('OOB activeIndex falls back to page 0', () => {
    const { initPaginationState } = require('../lib/ui/interactive-table');
    const { currentPage, pageSelections } = initPaginationState(3, 3, 99, 'switch', 7);
    assert.strictEqual(currentPage, 0);
    assert.strictEqual(pageSelections[0], 0);
});

test('last-page hole falls back to page 0', () => {
    const { initPaginationState } = require('../lib/ui/interactive-table');
    const { currentPage, pageSelections } = initPaginationState(3, 3, 8, 'switch', 7);
    assert.strictEqual(currentPage, 0);
    assert.strictEqual(pageSelections[0], 0);
});

test('non-switch ignores activeIndex', () => {
    const { initPaginationState } = require('../lib/ui/interactive-table');
    const { currentPage } = initPaginationState(3, 3, 5, 'remove', 7);
    assert.strictEqual(currentPage, 0);
});

console.log('\nhandlePageKeyPress():');

test('right arrow advances page with wrap', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    const state = { currentPage: 0, pageSelections: [0, 0, 0], itemsPerPage: 3, totalPages: 3, apiCount: 7 };
    const next = handlePageKeyPress('right', state);
    assert.strictEqual(next.currentPage, 1);
    const wrapped = handlePageKeyPress('right', { ...state, currentPage: 2 });
    assert.strictEqual(wrapped.currentPage, 0);
});

test('left arrow wraps to last page', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    const state = { currentPage: 0, pageSelections: [0, 0, 0], itemsPerPage: 3, totalPages: 3, apiCount: 7 };
    const wrapped = handlePageKeyPress('left', state);
    assert.strictEqual(wrapped.currentPage, 2);
});

test('up/down wraps within page', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    const state = { currentPage: 0, pageSelections: [0, 0], itemsPerPage: 3, totalPages: 2, apiCount: 5 };
    const down = handlePageKeyPress('down', state);
    assert.strictEqual(down.pageSelections[0], 1);
    const up = handlePageKeyPress('up', state);
    assert.strictEqual(up.pageSelections[0], 2); // wraps to last item (index 2)
});

test('enter returns global index', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    const state = { currentPage: 1, pageSelections: [0, 1], itemsPerPage: 3, totalPages: 2, apiCount: 5 };
    const result = handlePageKeyPress('enter', state);
    assert.strictEqual(result.action, 'select');
    assert.strictEqual(result.globalIndex, 4); // page 1, item 1 = 3+1=4
});

test('escape returns cancel', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    const state = { currentPage: 0, pageSelections: [0], itemsPerPage: 3, totalPages: 1, apiCount: 3 };
    const result = handlePageKeyPress('escape', state);
    assert.strictEqual(result.action, 'cancel');
});

test('page selection memory persists', () => {
    const { handlePageKeyPress } = require('../lib/ui/interactive-table');
    let state = { currentPage: 0, pageSelections: [0, 0], itemsPerPage: 3, totalPages: 2, apiCount: 5 };
    state = handlePageKeyPress('down', state); // page 0 item 1
    state = handlePageKeyPress('down', state); // page 0 item 2
    state = handlePageKeyPress('right', state); // go to page 1
    state = handlePageKeyPress('left', state); // back to page 0
    assert.strictEqual(state.pageSelections[0], 2); // still item 2
});

console.log('\nlocale parity:');

test('navigation.use_arrows_page_esc exists in all 11 locales', () => {
    const fs = require('fs');
    const path = require('path');
    const localeDir = path.join(__dirname, '..', 'lib', 'i18n', 'locales');
    // ._*.js are macOS AppleDouble resource-fork files, not locales
    const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.js') && !f.startsWith('._'));
    assert.ok(files.length >= 11, 'Should have at least 11 locale files');
    for (const file of files) {
        const locale = require(path.join(localeDir, file));
        assert.ok(locale.navigation && locale.navigation.use_arrows_page_esc,
            `${file} missing navigation.use_arrows_page_esc`);
    }
});

console.log('\nAPI limit:');

test('addApi throws when at 99 APIs', () => {
    const ApiManager = require('../lib/api-manager');
    const mgr = new ApiManager();
    mgr.config = {
        apis: new Array(99).fill(null).map((_, i) => ({
            id: `test-${i}`, name: `API-${i}`, provider: 'custom',
            baseUrl: `https://example${i}.com`, authToken: 'fake',
            model: `model-${i}`, smallFastModel: `model-${i}`,
            createdAt: new Date().toISOString(), lastUsed: null,
            usageCount: 0, successCount: 0, failCount: 0, lastError: null
        })),
        activeIndex: 0, version: '2.0.0', createdAt: new Date().toISOString(),
        exportPassword: null, passwordSkipped: false
    };
    assert.throws(() => mgr.addApi('https://new.com', 'token-12345678', 'new-model', 'New API'), /maximum 99/i);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
