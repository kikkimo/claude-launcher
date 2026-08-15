/**
 * Strict E2E tests — drive the real modules, real child processes, a real
 * local HTTPS server, and the real TUI entry point under a hijacked $HOME.
 * No external network, no real `claude` binary: everything that can be
 * simulated is simulated.
 *
 * Groups:
 *   A. API config full lifecycle (create → save → corrupt → recover → export → import)
 *   B. Legacy-era ciphertext (CBC whole file) upgrades through ApiManager
 *   C. Spawn E2E with a fake `claude` binary on PATH (exit codes, env handoff, masking)
 *   D. testApiConnection against a real local HTTPS server (token plaintext/encrypted)
 *   E. TUI smoke under hijacked $HOME (menu renders; corruption/recovery warnings show)
 */

const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
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
const { encrypt, decrypt } = require(path.join(REPO, 'lib', 'crypto'));

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function machineId() {
    return os.hostname() + os.userInfo().username + os.platform();
}

function deriveKey(iterations) {
    return crypto.pbkdf2Sync(machineId(), 'claude-launcher-salt', iterations, 32, 'sha256');
}

/** AES-256-GCM iv:ct:tag hex payload with an externally derived key. */
function gcmWithKey(plaintext, key, ivLen = 12) {
    const iv = crypto.randomBytes(ivLen);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct + ':' + cipher.getAuthTag().toString('hex');
}

function gcmUnpackWithKey(payload, key) {
    const parts = payload.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[2], 'hex'));
    let out = decipher.update(parts[1], 'hex', 'utf8');
    out += decipher.final('utf8');
    return out;
}

/** Legacy AES-256-CBC iv:ct (2-segment, 16-byte IV) — the pre-GCM era format. */
function cbcWithKey(plaintext, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let ct = cipher.update(plaintext, 'utf8', 'hex');
    ct += cipher.final('hex');
    return iv.toString('hex') + ':' + ct;
}

// ══════════════════════════════════════════════════════════════════════════
// Group A — API config full lifecycle, end to end through ApiManager
// ══════════════════════════════════════════════════════════════════════════

test('E2E A: create → save → rotate .bak → corrupt → auto-recover → edit → save → export → import', () => {
    const dir = tmpDir('e2e-a-');
    const cfg = path.join(dir, '.claude-launcher-apis.json');

    // 1. Create and persist generations so .bak holds a config that already
    //    contains the API (setExportPassword → addApi → one more save).
    const mgr = new ApiManager(cfg);
    mgr.setExportPassword('e2e-pass-123456');            // gen 1 (apis empty)
    mgr.addApi('https://api.example.com', 'sk-e2e-token-aaaaaaaaaa', 'kimi-k3', 'E2E API', 'moonshot'); // gen 2
    mgr.setActiveApi(0);                                  // gen 3 — .bak now = gen 2 (has the API)
    assert.ok(fs.existsSync(cfg + '.bak'), 'save rotated .bak');

    // 2. Corrupt the main file like an interrupted write, relaunch
    fs.writeFileSync(cfg, 'aabbcc:ddeeff0011');
    const relaunched = new ApiManager(cfg);
    assert.strictEqual(relaunched.loadError, null, 'recovery path must not set loadError');
    assert.strictEqual(relaunched.recoveredFromBackup, true, 'must auto-recover from .bak');
    assert.ok(relaunched.getApis().some(a => a.name === 'E2E API'), 'recovered config holds the API');

    // 3. Edit + save still works after recovery
    relaunched.setActiveApi(0);
    const saved = relaunched.saveConfig();
    assert.strictEqual(saved, true);

    // 4. Export (authenticated) yields plaintext tokens; import into a fresh manager roundtrips
    const exported = relaunched.exportConfigAuthenticated();
    const parsed = JSON.parse(exported);
    assert.strictEqual(parsed.apis[0].authToken, 'sk-e2e-token-aaaaaaaaaa', 'export decrypts token to plaintext');

    const dir2 = tmpDir('e2e-a2-');
    const mgr2 = new ApiManager(path.join(dir2, 'apis.json'));
    const result = mgr2.importConfigAuthenticated(exported);
    assert.strictEqual(result.imported, 1, `imported=1 (got ${JSON.stringify(result)})`);
    const token = decrypt(mgr2.getApis()[0].authToken);
    assert.ok(token.success && token.value === 'sk-e2e-token-aaaaaaaaaa', 'imported token re-encrypts with the new key and decrypts');
});

test('E2E A2: unreadable config without .bak → loadError blocks saving and the first-run wizard', () => {
    const dir = tmpDir('e2e-a2-');
    const cfg = path.join(dir, '.claude-launcher-apis.json');
    fs.writeFileSync(cfg, 'deadbeef:cafebabe');
    const before = fs.readFileSync(cfg, 'utf8');

    const mgr = new ApiManager(cfg);
    assert.ok(mgr.loadError, 'loadError set');
    assert.strictEqual(mgr.isFirstTimeUsage(), false, 'wizard suppressed');
    mgr.config = { apis: [], activeIndex: -1, version: '2.0.0', createdAt: '', exportPassword: null, passwordSkipped: false };
    assert.strictEqual(mgr.saveConfig(), false, 'save refused');
    assert.strictEqual(fs.readFileSync(cfg, 'utf8'), before, 'corrupt file untouched');

    mgr.clearLoadError();
    assert.strictEqual(mgr.saveConfig(), true, 'explicit clear re-enables saving');
    assert.ok(decrypt(fs.readFileSync(cfg, 'utf8')).success, 'file now holds a valid fresh config');
});

// ══════════════════════════════════════════════════════════════════════════
// Group B — legacy-era ciphertext upgrades through the full stack
// ══════════════════════════════════════════════════════════════════════════

test('E2E B: legacy 10000-iteration CBC whole-file payload loads via fallback and upgrades on save', () => {
    const dir = tmpDir('e2e-b-');
    const cfg = path.join(dir, '.claude-launcher-apis.json');

    // Build a complete config exactly as saveConfig serializes it, CBC-encrypt
    // with the 10000-iteration-era key (pre-GCM era).
    const legacyConfig = {
        apis: [{
            id: 'legacy-1', name: 'Legacy CBC API', provider: 'custom',
            baseUrl: 'https://old.example.com', authToken: 'fake', model: 'old-model',
            createdAt: '2025-01-01T00:00:00.000Z',
        }],
        activeIndex: 0, version: '2.0.0', createdAt: '2025-01-01T00:00:00.000Z',
        exportPassword: null, passwordSkipped: false,
    };
    const json = JSON.stringify(legacyConfig, null, 2);
    fs.writeFileSync(cfg, cbcWithKey(json, deriveKey(10000)));

    const mgr = new ApiManager(cfg);
    assert.strictEqual(mgr.loadError, null, 'legacy CBC file must load through the fallback');
    assert.strictEqual(mgr.getApis()[0].name, 'Legacy CBC API');

    assert.strictEqual(mgr.saveConfig(), true);
    const onDisk = fs.readFileSync(cfg, 'utf8');
    assert.strictEqual(onDisk.split(':').length, 3, 'upgraded file is GCM (3 segments)');
    const upgraded = gcmUnpackWithKey(onDisk, deriveKey(600000));
    assert.ok(upgraded.includes('Legacy CBC API'), 'upgraded payload decrypts with the 600000-iteration key alone');
});

// ══════════════════════════════════════════════════════════════════════════
// Group C — spawn E2E with a fake `claude` binary injected on PATH
// ══════════════════════════════════════════════════════════════════════════

function makeFakeClaude(dir, body) {
    fs.mkdirSync(path.join(dir, 'bin'), { recursive: true });
    const p = path.join(dir, 'bin', 'claude');
    fs.writeFileSync(p, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    return { PATH: path.join(dir, 'bin') + path.delimiter + process.env.PATH };
}

function runLauncherChild(script, dir, timeoutMs = 15000) {
    const r = spawnSync(process.execPath, ['-e', script], {
        cwd: REPO,
        encoding: 'utf8',
        timeout: timeoutMs,
        env: { ...process.env, PATH: path.join(dir, 'bin') + path.delimiter + process.env.PATH },
    });
    return r;
}

function childScriptFor(code) {
    return `
        const { launchClaudeWithApi } = require(${JSON.stringify(path.join(REPO, 'lib', 'launcher'))});
        const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
        const mgr = new ApiManager(${JSON.stringify(path.join('$DIR', 'apis.json'))});
        launchClaudeWithApi(mgr.getActiveApi());
        void code;
    `;
}

test('E2E C1: fake claude exit 0 → launcher exits 0; auth token handed off via env; stdout masks it', () => {
    const dir = tmpDir('e2e-c1-');
    makeFakeClaude(dir, 'env > "$CAPTURE"; exit 0');

    // Seed a config, then run a child that launches the fake claude with it
    const cfg = path.join(dir, 'apis.json');
    const seeder = new ApiManager(cfg);
    seeder.addApi('https://api.example.com', 'sk-c1-secret-token-000', 'kimi-k3', 'C1', 'moonshot');

    const capture = path.join(dir, 'child-env.txt');
    const script = `
        const { launchClaudeWithApi } = require(${JSON.stringify(path.join(REPO, 'lib', 'launcher'))});
        const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
        const mgr = new ApiManager(${JSON.stringify(cfg)});
        process.env.CAPTURE = ${JSON.stringify(capture)};
        launchClaudeWithApi(mgr.getActiveApi());
    `;
    const r = runLauncherChild(script, dir);
    assert.strictEqual(r.status, 0, `child status=${r.status} stderr=${r.stderr}`);

    const childEnv = fs.readFileSync(capture, 'utf8');
    assert.ok(childEnv.includes('ANTHROPIC_AUTH_TOKEN=sk-c1-secret-token-000'), 'real token reaches the child process env');
    assert.ok(childEnv.includes('ANTHROPIC_BASE_URL=https://api.example.com'));
    assert.ok(childEnv.includes('ANTHROPIC_MODEL=kimi-k3'));
    assert.ok(!r.stdout.includes('sk-c1-secret-token-000'), 'launcher stdout must mask the token');
    assert.ok(r.stdout.includes('***'), 'masked placeholder shown for token env var');
});

test('E2E C2: fake claude exit 42 → launcher exits 42 (non-zero preserved)', () => {
    const dir = tmpDir('e2e-c2-');
    makeFakeClaude(dir, 'exit 42');
    const r = runLauncherChild(childScript(dir), dir);
    assert.strictEqual(r.status, 42, `expected 42, got ${r.status}`);
});

test('E2E C3: fake claude killed by signal (code null) → launcher exits 1, not 0', () => {
    const dir = tmpDir('e2e-c3-');
    makeFakeClaude(dir, 'kill -9 $$');
    const r = runLauncherChild(childScript(dir), dir);
    assert.strictEqual(r.status, 1, `signal-killed child must surface as exit 1, got ${r.status}`);
});

// ══════════════════════════════════════════════════════════════════════════
// Group D — testApiConnection against a real local HTTPS server
// ══════════════════════════════════════════════════════════════════════════

function selfSignedCert(dir) {
    const keyPath = path.join(dir, 'key.pem');
    const certPath = path.join(dir, 'cert.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', keyPath, '-out', certPath, '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

async function withLocalHttpsServer(fn) {
    const dir = tmpDir('e2e-d-');
    const { key, cert } = selfSignedCert(dir);
    const received = [];
    const server = https.createServer({ key, cert }, (req, res) => {
        received.push(req.headers.authorization || '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    try {
        await fn(`https://127.0.0.1:${port}`, received);
    } finally {
        server.close();
    }
}

async function runAsync(name, fn) {
    // tiny async wrapper so the sync test() harness can host async bodies
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

// Async E2E cases are queued and awaited at the bottom of the file.
const asyncCases = [];

/** Scope NODE_TLS_REJECT_UNAUTHORIZED=0 so the self-signed local server is trusted (restored after). */
async function allowSelfSigned(fn) {
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    const swallow = () => {}; // Node prints a deprecation-style warning for this env var; keep output pristine
    process.on('warning', swallow);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
        await fn();
    } finally {
        process.off('warning', swallow);
        if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
}

asyncCases.push(['E2E D1: plaintext token containing colons is sent verbatim (no bogus decrypt failure)', async () => {
    await allowSelfSigned(() => withLocalHttpsServer(async (baseUrl, received) => {
        const { testApiConnection } = require(path.join(REPO, 'lib', 'launcher'));
        const weirdPlaintext = 'sk-live-abc:def:ghi';
        const result = await testApiConnection({ baseUrl, authToken: weirdPlaintext });
        assert.strictEqual(result.success, true, `expected reachable, got ${JSON.stringify(result)}`);
        assert.strictEqual(received[0], `Bearer ${weirdPlaintext}`, 'plaintext with colons must be sent as-is');
    }));
}]);

asyncCases.push(['E2E D2: encrypted token is decrypted before the request', async () => {
    await allowSelfSigned(() => withLocalHttpsServer(async (baseUrl, received) => {
        const { testApiConnection } = require(path.join(REPO, 'lib', 'launcher'));
        const secret = 'sk-e2e-encrypted-token-9999';
        const result = await testApiConnection({ baseUrl, authToken: encrypt(secret).value });
        assert.strictEqual(result.success, true, `expected reachable, got ${JSON.stringify(result)}`);
        assert.strictEqual(received[0], `Bearer ${secret}`, 'encrypted token must decrypt to the plaintext secret');
    }));
}]);

// ══════════════════════════════════════════════════════════════════════════
// Group E — TUI smoke under a hijacked $HOME (real entry point, real process)
// ══════════════════════════════════════════════════════════════════════════

function runTui(home, timeoutMs = 10000) {
    return spawnSync(process.execPath, [path.join(REPO, 'claude-launcher')], {
        cwd: REPO,
        encoding: 'utf8',
        timeout: timeoutMs,
        input: '',
        env: { ...process.env, HOME: home, TERM: 'xterm-256color' },
    });
}

function tuiHome() {
    const home = tmpDir('e2e-home-');
    // pin the language so warning assertions are deterministic
    fs.writeFileSync(path.join(home, '.claude-launcher-config.json'), JSON.stringify({ language: 'en' }));
    return home;
}

test('E2E E1: fresh HOME → TUI renders the main menu and exits cleanly', () => {
    const r = runTui(tuiHome());
    assert.ok(r.stdout.includes('Claude Code Launcher'), 'banner must render');
    assert.ok(r.stdout.includes('Launch Claude Code'), 'menu option must render');
    assert.strictEqual(r.status, 0, `expected clean exit 0, got ${r.status} stderr=${(r.stderr || '').slice(0, 200)}`);
});

test('E2E E2: corrupt config under HOME → TUI shows the unreadable-config warning', () => {
    const home = tuiHome();
    fs.writeFileSync(path.join(home, '.claude-launcher-apis.json'), 'deadbeef:cafebabe');
    const r = runTui(home);
    assert.ok(r.stdout.includes('API config file is unreadable'),
        `warning must appear on the main menu; stdout head: ${r.stdout.slice(0, 300)}`);
    assert.strictEqual(r.status, 0);
});

test('E2E E3: corrupt main + valid .bak → TUI shows the recovered-from-backup warning', () => {
    const home = tuiHome();
    const cfg = path.join(home, '.claude-launcher-apis.json');
    // Two saves through the real manager so .bak holds generation 1, then corrupt the main file.
    const mgr = new ApiManager(cfg);
    mgr.addApi('https://api.example.com', 'sk-e3-token-bbbbbbbbbb', 'glm-5.3', 'E3', 'zhipu');
    mgr.config.apis[0].name = 'E3b';
    mgr.saveConfig();
    fs.writeFileSync(cfg, 'aabbcc:ddeeff0011');

    const r = runTui(home);
    assert.ok(r.stdout.includes('recovered automatically from backup'),
        `recovery warning must appear; stdout head: ${r.stdout.slice(0, 300)}`);
    assert.strictEqual(r.status, 0);
    // The TUI launch itself must have persisted the recovered state: the main
    // file was rebuilt from .bak, which holds the previous generation ('E3'
    // with the original name — the 'E3b' rename lived only in the corrupt gen).
    const dec = decrypt(fs.readFileSync(cfg, 'utf8'));
    assert.ok(dec.success, 'main file rebuilt and valid');
    assert.strictEqual(JSON.parse(dec.value).apis[0].name, 'E3', 'recovered generation comes from .bak');
});

test('E2E E4: corrupt main + corrupt .bak + valid .bak2 → TUI recovers from .bak2', () => {
    const home = tuiHome();
    const cfg = path.join(home, '.claude-launcher-apis.json');
    // Three generations through the real manager: main=Gen3, .bak=Gen2, .bak2=Gen1.
    const mgr = new ApiManager(cfg);
    mgr.addApi('https://api.example.com', 'sk-e4-token-cccccccccc', 'glm-5.3', 'Gen1', 'zhipu');
    mgr.config.apis[0].name = 'Gen2';
    mgr.saveConfig();
    mgr.config.apis[0].name = 'Gen3';
    mgr.saveConfig();
    // Corrupt the two newest generations; only .bak2 (Gen1) survives.
    fs.writeFileSync(cfg, 'aabbcc:ddeeff0011');
    fs.writeFileSync(cfg + '.bak', 'deadbeef:cafebabe');

    const r = runTui(home);
    assert.ok(r.stdout.includes('recovered automatically from backup'),
        `recovery warning must appear; stdout head: ${r.stdout.slice(0, 300)}`);
    assert.strictEqual(r.status, 0);
    const dec = decrypt(fs.readFileSync(cfg, 'utf8'));
    assert.ok(dec.success, 'main file rebuilt and valid');
    assert.strictEqual(JSON.parse(dec.value).apis[0].name, 'Gen1', 'recovered from the .bak2 generation');
});

// helper for Group C children without a pre-seeded config
function childScript(dir) {
    const cfg = path.join(dir, 'apis.json');
    if (!fs.existsSync(cfg)) {
        const seeder = new ApiManager(cfg);
        seeder.addApi('https://api.example.com', 'sk-generic-token-000000', 'kimi-k3', 'Generic', 'moonshot');
    }
    return `
        const { launchClaudeWithApi } = require(${JSON.stringify(path.join(REPO, 'lib', 'launcher'))});
        const ApiManager = require(${JSON.stringify(path.join(REPO, 'lib', 'api-manager'))});
        const mgr = new ApiManager(${JSON.stringify(cfg)});
        launchClaudeWithApi(mgr.getActiveApi());
    `;
}

// ─── run async cases, then summarize ───
(async () => {
    for (const [name, fn] of asyncCases) {
        await runAsync(name, fn);
    }
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
})();
