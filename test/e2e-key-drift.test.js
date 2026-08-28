/**
 * E2E: macOS hostname key drift (fix/macos-hostname-key-drift)
 *
 * Reproduces the forensic scenario end to end and asserts on filesystem facts,
 * not on log strings:
 *
 *   E1  ciphertext written under hostname "fixedhost-2" must be readable, and
 *       re-encrypted under the stable key, by a launcher process whose
 *       os.hostname() reports "fixedhost-3".
 *   E2  the stable identity must actually come from the pinned sidecar (a
 *       positive assertion against an independent probe, plus a negative one:
 *       swap the pinned id and the same ciphertext must stop opening), and a
 *       config written under one hostname must load under a different one.
 *
 * What is real: a real child process running the real `claude-launcher` entry
 * point, a real hijacked $HOME, real files, real PBKDF2/AES-GCM, the real
 * load/heal path. The ONLY substitution is os.hostname() itself, injected via
 * `node --require` into the child. Changing the real hostname would require
 * sudo and would mutate the developer's machine; every less invasive
 * alternative (scutil, unshare, docker) is either privileged, Linux-only or a
 * heavy dependency. The stub file is written under os.tmpdir() so the
 * NODE_OPTIONS path stays ASCII and space-free.
 */

const { childEnv } = require('./helpers/isolate-key-material');

const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
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

// --- hand-written key oracle (never borrowed from production) --------------

function pbkdf2(identity, iterations) {
    return crypto.pbkdf2Sync(identity, 'claude-launcher-salt', iterations, 32, 'sha256');
}

function hostnameEraKey(hostname, iterations) {
    return pbkdf2(hostname + os.userInfo().username + os.platform(), iterations);
}

function stableKeyFromSidecar(sidecarPath) {
    const id = JSON.parse(fs.readFileSync(sidecarPath, 'utf8')).id;
    return pbkdf2(id + os.userInfo().username + os.platform(), 600000);
}

function gcmWithKey(plaintext, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

function gcmOpen(payload, key) {
    const parts = payload.split(':');
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'hex'));
    d.setAuthTag(Buffer.from(parts[2], 'hex'));
    let out = d.update(parts[1], 'hex', 'utf8');
    out += d.final('utf8');
    return out;
}

/**
 * Independent machine-id probe for the assertion in E2. Deliberately a second
 * implementation: reusing lib/machine-key.probe() would only prove the module
 * agrees with itself.
 */
function independentProbe() {
    if (process.platform === 'darwin') {
        const out = execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const m = /"IOPlatformUUID"\s*=\s*"([0-9A-Fa-f-]{36})"/.exec(out);
        return m ? m[1] : null;
    }
    if (process.platform === 'linux') {
        try {
            const v = fs.readFileSync('/etc/machine-id', 'utf8').trim();
            return /^[0-9a-f]{32}$/i.test(v) ? v.toLowerCase() : null;
        } catch (_) { return null; }
    }
    return null; // win32 not probed from here — see the stated blind spot
}

// --- child process harness -------------------------------------------------

/**
 * A `--require` preload that pins os.hostname() inside the child.
 * Written under os.tmpdir() (this repo's own path contains non-ASCII) and
 * memoized per name, so repeated launches do not leak a directory each.
 */
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl-hoststub-'));
const stubCache = new Map();
function hostnameStub(name) {
    let file = stubCache.get(name);
    if (file === undefined) {
        file = path.join(stubDir, `hostname-${name.replace(/[^A-Za-z0-9._-]/g, '_')}.js`);
        fs.writeFileSync(file, `const os = require('os'); os.hostname = () => ${JSON.stringify(name)};\n`);
        assert.ok(!/\s/.test(file), 'NODE_OPTIONS cannot carry a path with spaces');
        stubCache.set(name, file);
    }
    return file;
}

/** Run the real launcher entry point with a hijacked HOME and stubbed hostname. */
function runLauncher({ home, hostname, sidecar, timeoutMs = 20000 }) {
    return spawnSync(process.execPath, [path.join(REPO, 'claude-launcher')], {
        cwd: REPO,
        encoding: 'utf8',
        timeout: timeoutMs,
        input: '',
        // childEnv() is the single source of the isolation contract; the
        // per-test overrides are applied on top of it.
        env: childEnv({
            HOME: home,
            TERM: 'xterm-256color',
            CLAUDE_LAUNCHER_KEY_FILE: sidecar,
            NODE_OPTIONS: `--require ${hostnameStub(hostname)}`,
        }),
    });
}

function makeHome(label) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), `cl-drift-${label}-`));
    // Pin the language so any log assertion is deterministic.
    fs.writeFileSync(path.join(home, '.claude-launcher-config.json'), JSON.stringify({ language: 'en' }));
    return home;
}

const TOKEN_ALPHA = 'sk-drift-alpha-000000001';
const TOKEN_BETA = 'sk-drift-beta-000000002';

/**
 * A complete, already-normalized config as a pre-fix release would have left
 * it: blob AND both tokens encrypted with the hostname-era key of `hostname`.
 * Every generation (main/.bak/.bak2) is written the same way, matching the
 * real machine where all three opened only with the same drifted key.
 */
function writeDriftedConfig(home, hostname) {
    const key = hostnameEraKey(hostname, 600000);
    const config = {
        apis: [
            {
                id: 'drift-1', name: 'Alpha', provider: 'custom',
                baseUrl: 'https://a.example.com', authToken: gcmWithKey(TOKEN_ALPHA, key),
                model: 'claude-sonnet-4', smallFastModel: 'claude-sonnet-4',
                createdAt: '2026-01-01T00:00:00.000Z', lastUsed: null,
                usageCount: 0, successCount: 0, failCount: 0, lastError: null,
            },
            {
                id: 'drift-2', name: 'Beta', provider: 'custom',
                baseUrl: 'https://b.example.com', authToken: gcmWithKey(TOKEN_BETA, key),
                model: 'claude-sonnet-4', smallFastModel: 'claude-sonnet-4',
                createdAt: '2026-01-02T00:00:00.000Z', lastUsed: null,
                usageCount: 0, successCount: 0, failCount: 0, lastError: null,
            },
        ],
        activeIndex: 0, version: '2.0.0', createdAt: '2026-01-01T00:00:00.000Z',
        exportPassword: null, passwordSkipped: true,
    };
    const bytes = gcmWithKey(JSON.stringify(config, null, 2), key);
    const cfg = path.join(home, '.claude-launcher-apis.json');
    for (const p of [cfg, cfg + '.bak', cfg + '.bak2']) fs.writeFileSync(p, bytes);
    return { cfg, bytes };
}

console.log('\n=== E1: ciphertext from a drifted hostname is readable and healed ===\n');

test('E1: launcher under hostname -3 reads a config written under hostname -2', () => {
    const home = makeHome('e1');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg, bytes } = writeDriftedConfig(home, 'fixedhost-2');

    const run = runLauncher({ home, hostname: 'fixedhost-3', sidecar });
    assert.strictEqual(run.status, 0,
        `launcher must exit cleanly; status=${run.status} stderr=${(run.stderr || '').slice(0, 400)}`);
    assert.ok(!run.stdout.includes('API config file is unreadable'),
        `the forensic failure must be gone; stdout head:\n${run.stdout.slice(0, 500)}`);

    // Filesystem facts, not log strings.
    const onDisk = fs.readFileSync(cfg, 'utf8');
    assert.notStrictEqual(onDisk, bytes, 'the config must have been re-encrypted');
    const healed = JSON.parse(gcmOpen(onDisk, stableKeyFromSidecar(sidecar)));
    assert.deepStrictEqual(healed.apis.map(a => a.name), ['Alpha', 'Beta']);
    assert.strictEqual(gcmOpen(healed.apis[0].authToken, stableKeyFromSidecar(sidecar)), TOKEN_ALPHA,
        'inner tokens must be re-encrypted too, not just the outer blob');
    assert.strictEqual(gcmOpen(healed.apis[1].authToken, stableKeyFromSidecar(sidecar)), TOKEN_BETA);
});

test('E1: the pre-heal ciphertext survives in a non-rotating snapshot', () => {
    const home = makeHome('e1b');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg, bytes } = writeDriftedConfig(home, 'fixedhost-2');

    runLauncher({ home, hostname: 'fixedhost-3', sidecar });
    // Content-addressed slot: one per pre-state, so a later migration of a
    // different pre-state cannot quietly reuse this one's file.
    const digest = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const snapshot = `${cfg}.pre-key-migration.${digest}`;
    assert.ok(fs.existsSync(snapshot), 'snapshot must exist after a heal');
    const doc = JSON.parse(fs.readFileSync(snapshot, 'utf8'));
    assert.strictEqual(doc.ciphertext, bytes, 'snapshot must hold the exact pre-heal bytes');
    assert.ok(/^[0-9a-f]{12}$/.test(doc.idHint), 'and be self-describing without leaking the id');
    if (process.platform !== 'win32') {
        assert.strictEqual(fs.statSync(snapshot).mode & 0o777, 0o600);
    }
});

test('E1: a second launch is a no-op — no repeated rewriting', () => {
    const home = makeHome('e1c');
    const sidecar = path.join(home, 'machine-key.json');
    const { cfg } = writeDriftedConfig(home, 'fixedhost-2');

    runLauncher({ home, hostname: 'fixedhost-3', sidecar });
    const afterHeal = fs.readFileSync(cfg, 'utf8');
    const run2 = runLauncher({ home, hostname: 'fixedhost-4', sidecar });
    assert.strictEqual(run2.status, 0);
    // Both halves matter: still readable (otherwise "unchanged" would also be
    // satisfied by a config nobody can open and every save being refused),
    // and unchanged (otherwise every launch would pay for a rewrite).
    assert.ok(!run2.stdout.includes('API config file is unreadable'),
        `the healed config must still open on the next launch; stdout head:\n${run2.stdout.slice(0, 400)}`);
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), afterHeal,
        'a healed config must not be rewritten on every launch');
});

console.log('\n=== E2: the key really comes from the pinned sidecar ===\n');

test('E2 (positive): the sidecar is created and pins an independently probed machine id', () => {
    const home = makeHome('e2');
    const sidecar = path.join(home, 'machine-key.json');
    writeDriftedConfig(home, 'fixedhost-2');
    runLauncher({ home, hostname: 'fixedhost-3', sidecar });

    assert.ok(fs.existsSync(sidecar), 'the launcher must pin its machine identity');
    const doc = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    const probed = independentProbe();
    if (probed === null) {
        // Stated blind spot: no independent probe implemented for this platform.
        assert.strictEqual(doc.source, 'hostname',
            `without a probe the only acceptable source is the hostname fallback, got ${doc.source}`);
        return;
    }
    assert.strictEqual(doc.id, probed,
        'the pinned id must be the real platform machine id, not a placeholder or constant');
    assert.notStrictEqual(doc.id, 'fixedhost-3', 'the identity must not be the hostname');
    assert.notStrictEqual(doc.id, os.hostname());
});

test('S-5: a launcher run with nothing to decrypt pins nothing and probes nothing', () => {
    // The launcher builds an ApiManager at module load, so a health check that
    // probed would fork ioreg on every start — including for a brand-new user
    // who only wanted to see the menu — and would pin an identity before there
    // is anything to protect.
    const home = makeHome('s5');
    const sidecar = path.join(home, 'machine-key.json');
    const run = runLauncher({ home, hostname: 'fixedhost-3', sidecar });
    assert.strictEqual(run.status, 0, `stderr: ${(run.stderr || '').slice(0, 300)}`);
    assert.strictEqual(fs.existsSync(sidecar), false,
        'no config means no key is needed, so nothing may be pinned yet');
    assert.strictEqual(fs.existsSync(path.join(home, '.claude-launcher-apis.json')), false,
        'and no config may be created either');
});

test('E2 (negative): swapping the pinned id makes the same ciphertext unreadable', () => {
    const home = makeHome('e2b');
    const sidecar = path.join(home, 'machine-key.json');
    writeDriftedConfig(home, 'fixedhost-2');
    runLauncher({ home, hostname: 'fixedhost-3', sidecar });

    const cfg = path.join(home, '.claude-launcher-apis.json');
    const healedBytes = fs.readFileSync(cfg, 'utf8');
    assert.ok(gcmOpen(healedBytes, stableKeyFromSidecar(sidecar)).includes('Alpha'),
        'precondition: the healed file opens with the pinned key');

    const doc = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    fs.writeFileSync(sidecar, JSON.stringify({ v: 1, source: doc.source, id: 'a-different-machine-id' }));
    assert.throws(() => gcmOpen(healedBytes, stableKeyFromSidecar(sidecar)),
        'if the pinned id were not actually part of the key, this would still decrypt');
});

test('E2: a config written under one hostname loads under a completely different one', () => {
    // Forward stability: this is the property that makes network changes, DHCP
    // renewals and Bonjour suffix churn stop mattering.
    const home = makeHome('e2c');
    const sidecar = path.join(home, 'machine-key.json');
    const cfg = path.join(home, '.claude-launcher-apis.json');
    writeDriftedConfig(home, 'fixedhost-2');

    assert.strictEqual(runLauncher({ home, hostname: 'fixedhost-3', sidecar }).status, 0);
    const healed = fs.readFileSync(cfg, 'utf8');

    for (const hostname of ['SomethingEntirelyDifferent', 'FangYideMBP-7.hsd1.ca.comcast.net', 'runner']) {
        const run = runLauncher({ home, hostname, sidecar });
        assert.strictEqual(run.status, 0, `launcher failed under hostname ${hostname}`);
        assert.ok(!run.stdout.includes('API config file is unreadable'),
            `hostname ${hostname} broke the config`);
        assert.strictEqual(fs.readFileSync(cfg, 'utf8'), healed,
            `hostname ${hostname} triggered a needless rewrite`);
    }
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
