/**
 * R14 / C7: an undecryptable token must never travel as if it were a token.
 *
 * exportConfigAuthenticated() substitutes the literal '***DECRYPTION_FAILED***'
 * for any field it cannot decrypt. That string is 24 characters of non-empty
 * text, so validateAuthToken() — which only checks "non-empty and >= 10 chars" —
 * accepts it, and the import path stores it as the API's auth token. The user
 * ends up with an API entry that looks configured and fails at request time with
 * an authentication error that says nothing about the real cause.
 *
 * The same applies to '***REQUIRES_MANUAL_INPUT***', which the export path
 * writes deliberately: the import path already special-cases it in some places
 * but not in the validation gate.
 *
 * This became reachable through ordinary use once key-generation drift could
 * leave a single token unreadable while the rest of the config is fine.
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
const fs = require('fs');
const nodeCrypto = require('crypto');
const os = require('os');
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

const REPO = path.join(__dirname, '..');
const ApiManager = require(path.join(REPO, 'lib', 'api-manager'));
const { resetKeyCachesForTests } = require(path.join(REPO, 'lib', 'crypto'));

function workspace(label) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-export-${label}-`));
    process.env.CLAUDE_LAUNCHER_KEY_FILE = path.join(dir, 'machine.json');
    resetKeyCachesForTests();
    return { dir, configFile: path.join(dir, 'apis.json') };
}

/** A manager holding one good API and one whose token cannot be decrypted. */
function withBrokenToken(label) {
    const ws = workspace(label);
    const mgr = new ApiManager(ws.configFile);
    mgr.addApi('https://good.example.com', 'sk-good-token-000001', 'claude-sonnet-4', 'Good');
    mgr.addApi('https://broken.example.com', 'sk-doomed-token-0002', 'claude-sonnet-4', 'Broken');
    // Encrypted under a key nothing can reach — the shape a lost key generation
    // leaves behind.
    const lost = nodeCrypto.randomBytes(32);
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', lost, iv);
    let ct = cipher.update('sk-doomed-token-0002', 'utf8', 'hex');
    ct += cipher.final('hex');
    mgr.config.apis[1].authToken = iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
    mgr.saveConfig();
    return { ws, mgr };
}

console.log('\n=== R14: export refuses to emit a placeholder as a token ===\n');

test('R14: exporting a config with an undecryptable token is refused, not faked', () => {
    const { mgr } = withBrokenToken('refuse');
    assert.throws(() => mgr.exportConfigAuthenticated(),
        (e) => /decrypt/i.test(e.message) && e.message.includes('Broken'),
        'the export must name the API it cannot export rather than substituting a placeholder');
});

test('R14: a healthy config still exports normally', () => {
    const ws = workspace('healthy');
    const mgr = new ApiManager(ws.configFile);
    mgr.addApi('https://good.example.com', 'sk-good-token-000001', 'claude-sonnet-4', 'Good');
    const parsed = JSON.parse(mgr.exportConfigAuthenticated());
    assert.strictEqual(parsed.apis.length, 1);
    assert.strictEqual(parsed.apis[0].authToken, 'sk-good-token-000001');
});

console.log('\n=== R14: import refuses placeholder values as tokens ===\n');

const PLACEHOLDERS = ['***DECRYPTION_FAILED***', '***REQUIRES_MANUAL_INPUT***'];

for (const placeholder of PLACEHOLDERS) {
    test(`R14: importing ${placeholder} does not create a usable-looking API`, () => {
        const ws = workspace('import-' + placeholder.replace(/\W/g, ''));
        const mgr = new ApiManager(ws.configFile);
        const payload = JSON.stringify({
            configVersion: 2,
            apis: [{
                name: 'Imported', provider: 'custom', baseUrl: 'https://x.example.com',
                authToken: placeholder, model: 'claude-sonnet-4',
            }],
            activeIndex: 0,
        });

        const result = mgr.importConfigAuthenticated(payload);
        const stored = mgr.getApis().find(a => a.name === 'Imported');
        if (stored) {
            const { decrypt } = require(path.join(REPO, 'lib', 'crypto'));
            const token = decrypt(stored.authToken);
            assert.notStrictEqual(token.value, placeholder,
                `${placeholder} was stored as if it were a real auth token`);
            assert.strictEqual(token.value, '',
                'an entry that needs a token must be stored empty, so the UI can ask for one');
        } else {
            assert.ok(result.skipped >= 1,
                `the entry must be either skipped or stored token-less, got ${JSON.stringify(result)}`);
        }
    });
}

test('R14: the placeholders are rejected by token validation itself', () => {
    const { validateAuthToken } = require(path.join(REPO, 'lib', 'validators'));
    for (const placeholder of PLACEHOLDERS) {
        const result = validateAuthToken(placeholder);
        assert.strictEqual(result.valid, false,
            `${placeholder} passes validation (${placeholder.length} chars, non-empty) — ` +
            'the length check alone cannot tell it from a real token');
    }
    // And a real token must still validate.
    assert.strictEqual(validateAuthToken('sk-real-token-000001').valid, true);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
