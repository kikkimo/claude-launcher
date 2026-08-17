/**
 * Tests for i18n consistency and the global-update command we advertise.
 *
 * Background: `npm update -g <pkg>` re-reifies the whole global tree, which
 * includes npm itself, so npm's reify-finish step tries to rewrite its builtin
 * npmrc. On Homebrew node (macOS) that file is read-only (0444) and on the
 * Windows installer it lives under Program Files, so the command dies with
 * EACCES/EPERM *after* the package was already installed. `npm install -g
 * <pkg>@latest` only reifies the target package and is unaffected.
 *
 * These tests pin that command everywhere we show it to users, and guard the
 * translation packs against drift.
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
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'lib', 'i18n', 'locales');

// The single command users must be told to run. Keep in sync with the docs.
const GOOD_COMMAND = 'npm install -g @kikkimo/claude-launcher@latest';
const BAD_COMMAND = 'npm update -g';

const LanguageManager = require('../lib/i18n/language-manager');
const LANGS = Object.keys(new LanguageManager().getSupportedLanguages());

// Every user-facing string that names the upgrade command.
const COMMAND_KEYS = ['version.install_command', 'version_check.update_command'];

function loadPack(lang) {
    return require(path.join(LOCALES_DIR, `${lang}.js`));
}

function get(pack, dottedKey) {
    return dottedKey.split('.').reduce((o, k) => (o === undefined ? o : o[k]), pack);
}

/** Collect every leaf key path in a translation pack. */
function leafPaths(obj, prefix = '') {
    const out = [];
    for (const key of Object.keys(obj)) {
        const full = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            out.push(...leafPaths(value, full));
        } else {
            out.push(full);
        }
    }
    return out;
}

/** Read a repo file as UTF-8 text. */
function readRepoFile(relPath) {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ─── Language pack inventory ───

test('locales directory matches the supported-language list exactly', () => {
    const onDisk = fs.readdirSync(LOCALES_DIR)
        .filter(f => f.endsWith('.js') && !f.startsWith('._'))
        .map(f => f.slice(0, -3))
        .sort();
    assert.deepStrictEqual(onDisk, [...LANGS].sort(),
        'every supported language needs a locale file, and vice versa');
});

// ─── Key-set consistency: no language may drift from en ───

const enPack = loadPack('en');
const enKeys = leafPaths(enPack);
const enKeySet = new Set(enKeys);

test('en pack is non-trivial (guards against a broken loader)', () => {
    assert.ok(enKeys.length > 100, `expected >100 keys in en, got ${enKeys.length}`);
});

for (const lang of LANGS) {
    if (lang === 'en') continue;
    test(`${lang}: key set is identical to en (no missing, no extra)`, () => {
        const keys = leafPaths(loadPack(lang));
        const keySet = new Set(keys);
        const missing = enKeys.filter(k => !keySet.has(k));
        const extra = keys.filter(k => !enKeySet.has(k));
        assert.deepStrictEqual(missing, [], `${lang} is missing keys: ${missing.join(', ')}`);
        assert.deepStrictEqual(extra, [], `${lang} has keys absent from en: ${extra.join(', ')}`);
    });
}

// ─── Every locale advertises the safe upgrade command ───

for (const lang of LANGS) {
    for (const key of COMMAND_KEYS) {
        test(`${lang}: ${key} advertises the safe upgrade command`, () => {
            const value = get(loadPack(lang), key);
            assert.strictEqual(typeof value, 'string', `${lang}.${key} must be a string`);
            assert.ok(value.includes(GOOD_COMMAND),
                `${lang}.${key} must contain "${GOOD_COMMAND}", got: ${value}`);
            assert.ok(!value.includes(BAD_COMMAND),
                `${lang}.${key} must not tell users to run "${BAD_COMMAND}" (fails with EACCES on Homebrew node / Windows Program Files), got: ${value}`);
        });
    }
}

// ─── No source file may print the unsafe command ───

/** Recursively list .js files plus the bin entry, skipping AppleDouble junk. */
function sourceFiles() {
    const files = [path.join(ROOT, 'claude-launcher')];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.name.startsWith('._')) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.js')) files.push(full);
        }
    };
    walk(path.join(ROOT, 'lib'));
    return files;
}

test('no shipped source file tells users to run "npm update -g"', () => {
    const offenders = sourceFiles()
        .filter(f => fs.readFileSync(f, 'utf8').includes(BAD_COMMAND))
        .map(f => path.relative(ROOT, f));
    assert.deepStrictEqual(offenders, [],
        `these files still advertise "${BAD_COMMAND}": ${offenders.join(', ')}`);
});

// ─── Documentation ───

for (const doc of ['README.md', 'docs/README-zh.md']) {
    test(`${doc}: documents the safe upgrade command`, () => {
        assert.ok(readRepoFile(doc).includes(GOOD_COMMAND),
            `${doc} must document "${GOOD_COMMAND}"`);
    });

    test(`${doc}: has a troubleshooting section for global-install failures`, () => {
        const text = readRepoFile(doc);
        assert.ok(/EACCES/.test(text),
            `${doc} must explain the EACCES global-install failure`);
        assert.ok(/EPERM/.test(text),
            `${doc} must cover the Windows EPERM variant`);
        assert.ok(/ExecutionPolicy/i.test(text),
            `${doc} must cover the Windows PowerShell execution-policy failure`);
    });
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
