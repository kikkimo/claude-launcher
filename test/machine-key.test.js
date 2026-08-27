/**
 * Tests for lib/machine-key.js — the stable machine identity that replaces
 * os.hostname() as the encryption key input.
 *
 * Background: os.hostname() is unstable on macOS when `scutil --get HostName`
 * is unset — gethostname() then falls back to the DHCP/mDNS name, which drifts
 * with network changes, DHCP renewals and Bonjour dedup suffixes (-2/-3/-4).
 * Key material derived from it silently rotates and locks the user out of
 * their own config.
 *
 * Design invariant under test: NO identity mode is unrecoverable. Every
 * `source` is either deterministically re-derivable (ioreg / machine-id /
 * MachineGuid) or inside the legacy hostname candidate set.
 *
 * Fixture honesty: the darwin ioreg fixture is real output captured from a
 * live machine (values sanitized — the UUID is synthetic and the serial
 * number is removed). The linux and win32 fixtures are format-accurate but
 * NOT captured from real hardware; this repo has no CI and those branches are
 * never executed on real Windows/Linux before merge. That is a stated blind
 * spot, not a claim of coverage.
 */

require('./helpers/isolate-key-material');

const assert = require('assert');
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

const machineKey = require('../lib/machine-key');

function freshSidecarDir(label) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-mk-${label}-`));
    process.env.CLAUDE_LAUNCHER_KEY_FILE = path.join(dir, 'machine.json');
    machineKey.resetForTests();
    return dir;
}

// ---------------------------------------------------------------------------
// Real captured ioreg output (sanitized). Shape is byte-for-byte what
// `ioreg -rd1 -c IOPlatformExpertDevice` prints on macOS 15.
// ---------------------------------------------------------------------------
const IOREG_REAL = [
    '+-o J716sAP  <class IOPlatformExpertDevice, id 0x100000376, registered, matched, active, busy 0 (540378 ms), retain 44>',
    '    {',
    '      "IOPolledInterface" = "AppleARMWatchdogTimerHibernateHandler is not serializable"',
    '      "#address-cells" = <02000000>',
    '      "AAPL,phandle" = <01000000>',
    '      "IOBusyInterest" = "IOCommand is not serializable"',
    '      "target-type" = <"J716s">',
    '      "country-of-origin" = <"VNM">',
    '      "IOPlatformUUID" = "A0C5A880-EE6D-582D-8836-9C77080D904A"',
    '      "IOPlatformSerialNumber" = "REDACTED"',
    '      "compatible" = <"J716sAP","Mac16,7","AppleARM">',
    '    }',
    '',
].join('\n');

const IOREG_NO_UUID = IOREG_REAL.split('\n').filter(l => !l.includes('IOPlatformUUID')).join('\n');

// Format-accurate `reg query` output (not captured from real hardware).
const REG_QUERY_REAL = [
    '',
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography',
    '    MachineGuid    REG_SZ    4c4c4544-0046-5710-8034-c4c04f4d3332',
    '',
].join('\r\n');

/** Minimal injectable io: execFileSync + readFileSync stubs. */
function io({ exec = {}, files = {} } = {}) {
    const calls = [];
    return {
        calls,
        execFileSync(cmd, args, opts) {
            calls.push({ cmd, args, opts });
            const entry = exec[cmd];
            if (entry === undefined) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
            if (entry instanceof Error) throw entry;
            return entry;
        },
        readFileSync(p) {
            if (!(p in files)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
            if (files[p] instanceof Error) throw files[p];
            return files[p];
        },
    };
}

console.log('\n=== machine-key: sidecar pin (R1, E4) ===\n');

test('R1: first call creates the sidecar at CLAUDE_LAUNCHER_KEY_FILE', () => {
    freshSidecarDir('r1');
    const identity = machineKey.getStableIdentity();
    assert.ok(identity && typeof identity.id === 'string' && identity.id.length > 0,
        'identity.id must be a non-empty string');
    assert.ok(fs.existsSync(process.env.CLAUDE_LAUNCHER_KEY_FILE),
        'sidecar file must exist after the first call');
});

test('R1: sidecar holds {v, source, id} and reports a known source', () => {
    freshSidecarDir('r1b');
    const identity = machineKey.getStableIdentity();
    const onDisk = JSON.parse(fs.readFileSync(process.env.CLAUDE_LAUNCHER_KEY_FILE, 'utf8'));
    assert.strictEqual(onDisk.v, 1);
    assert.strictEqual(onDisk.id, identity.id);
    assert.strictEqual(onDisk.source, identity.source);
    assert.ok(['ioreg', 'machine-id', 'dbus-machine-id', 'machine-guid', 'hostname'].includes(onDisk.source),
        `unexpected source: ${onDisk.source}`);
    assert.strictEqual(identity.pinned, true);
});

test('R1: the pin is honored — a second derivation reuses the sidecar id', () => {
    const dir = freshSidecarDir('r1c');
    const first = machineKey.getStableIdentity().id;
    // Rewrite the sidecar with a value that probing could never produce:
    // if the pin is honored this is what comes back.
    fs.writeFileSync(path.join(dir, 'machine.json'),
        JSON.stringify({ v: 1, source: 'ioreg', id: 'pinned-value-not-probeable' }));
    machineKey.resetForTests();
    const second = machineKey.getStableIdentity();
    assert.notStrictEqual(first, 'pinned-value-not-probeable');
    assert.strictEqual(second.id, 'pinned-value-not-probeable',
        'sidecar must win over probing');
    assert.strictEqual(second.pinned, true);
});

test('E4: sidecar is created owner-only (0600)', () => {
    if (process.platform === 'win32') return; // no POSIX modes
    freshSidecarDir('e4');
    machineKey.getStableIdentity();
    const mode = fs.statSync(process.env.CLAUDE_LAUNCHER_KEY_FILE).mode & 0o777;
    assert.strictEqual(mode, 0o600, `expected 0600, got 0${mode.toString(8)}`);
});

console.log('\n=== machine-key: fail closed on anomalies (R2, B5) ===\n');

test('R2: a corrupt sidecar throws KeyMaterialError', () => {
    const dir = freshSidecarDir('r2');
    fs.writeFileSync(path.join(dir, 'machine.json'), '{ this is not json');
    assert.throws(() => machineKey.getStableIdentity(), (e) => e.name === 'KeyMaterialError');
});

test('R2: a corrupt sidecar is NEVER overwritten', () => {
    const dir = freshSidecarDir('r2b');
    const sidecar = path.join(dir, 'machine.json');
    const corrupt = '{ this is not json';
    fs.writeFileSync(sidecar, corrupt);
    try { machineKey.getStableIdentity(); } catch (_) { /* expected */ }
    assert.strictEqual(fs.readFileSync(sidecar, 'utf8'), corrupt,
        'corrupt sidecar bytes must be preserved byte-for-byte');
});

test('R2: valid JSON with an empty id also fails closed', () => {
    const dir = freshSidecarDir('r2c');
    fs.writeFileSync(path.join(dir, 'machine.json'), JSON.stringify({ v: 1, source: 'ioreg', id: '' }));
    assert.throws(() => machineKey.getStableIdentity(), (e) => e.name === 'KeyMaterialError');
});

test('B5: an unwritable sidecar path degrades to a deterministic identity, never random', () => {
    freshSidecarDir('b5');
    // A path whose parent directory does not exist: creation must fail.
    process.env.CLAUDE_LAUNCHER_KEY_FILE = path.join(os.tmpdir(), 'cl-mk-no-such-dir-xyz', 'machine.json');
    machineKey.resetForTests();
    const first = machineKey.getStableIdentity();
    assert.ok(first.id.length > 0, 'must still yield an identity');
    assert.strictEqual(first.pinned, false, 'must report that it could not be pinned');
    assert.ok(machineKey.getWarnings().length > 0, 'must record a warning');
    machineKey.resetForTests();
    const second = machineKey.getStableIdentity();
    assert.strictEqual(second.id, first.id,
        'unpinned identity must be deterministic across processes (never a random key)');
});

test('B5: an existing sidecar written by a concurrent winner is adopted, not clobbered', () => {
    const dir = freshSidecarDir('b5b');
    const sidecar = path.join(dir, 'machine.json');
    const winner = JSON.stringify({ v: 1, source: 'ioreg', id: 'winner-id-from-other-process' });
    fs.writeFileSync(sidecar, winner);
    const identity = machineKey.getStableIdentity();
    assert.strictEqual(identity.id, 'winner-id-from-other-process');
    assert.strictEqual(JSON.parse(fs.readFileSync(sidecar, 'utf8')).id, 'winner-id-from-other-process');
});

test('S-4: a sidecar with an unknown version fails closed', () => {
    const dir = freshSidecarDir('s4');
    fs.writeFileSync(path.join(dir, 'machine.json'),
        JSON.stringify({ v: 9, source: 'ioreg', id: 'from-the-future' }));
    assert.throws(() => machineKey.getStableIdentity(), (e) => e.name === 'KeyMaterialError',
        'an unrecognised layout must not be trusted — we cannot know what its id means');
});

test('S-4: a sidecar with an unknown source fails closed', () => {
    const dir = freshSidecarDir('s4b');
    // `random` is exactly the mode this design forbids: an identity that cannot
    // be re-derived and is not covered by the candidate set. Accepting one
    // written by some other tool would break the recoverability invariant on
    // the READ side, where it matters most.
    fs.writeFileSync(path.join(dir, 'machine.json'),
        JSON.stringify({ v: 1, source: 'random', id: 'a9f3c1' }));
    assert.throws(() => machineKey.getStableIdentity(), (e) => e.name === 'KeyMaterialError');
});

test('S-4: every source this module can write is accepted on read', () => {
    for (const source of machineKey.KNOWN_SOURCES) {
        const dir = freshSidecarDir('s4c');
        fs.writeFileSync(path.join(dir, 'machine.json'),
            JSON.stringify({ v: 1, source, id: 'round-trip-' + source }));
        assert.strictEqual(machineKey.getStableIdentity().source, source);
    }
});

console.log('\n=== machine-key: pin decision (S-6) ===\n');

test('S-6: a successful probe pins the probed identity', () => {
    const decision = machineKey.pinDecision({ source: 'ioreg', id: 'UUID-1' }, 'anyhost');
    assert.strictEqual(decision.identity.source, 'ioreg');
    assert.strictEqual(decision.identity.id, 'UUID-1');
    assert.strictEqual(decision.pin, true);
});

test('S-6: a definite probe failure pins the hostname identity', () => {
    // Nothing to retry: this platform has no stable id to offer. Pinning still
    // helps — it stops the hostname from drifting from here on.
    const decision = machineKey.pinDecision(null, 'somehost-3');
    assert.strictEqual(decision.identity.source, 'hostname');
    assert.strictEqual(decision.identity.id, 'somehost-3');
    assert.strictEqual(decision.pin, true);
    assert.ok(decision.warning, 'the degraded identity must be reported');
});

test('S-6: a TIMED-OUT probe uses the hostname identity but does NOT pin it', () => {
    // A cold or loaded machine can blow the probe timeout once. Pinning then
    // would freeze the weaker identity forever, so the pin is deferred and the
    // next launch probes again. Data written meanwhile is still recoverable —
    // the hostname family is exactly what the candidate set covers.
    const attemptsPath = path.join(freshSidecarDir('s6timeout'), 'attempts.json');
    const decision = machineKey.pinDecision({ timedOut: true }, 'somehost-3', { attemptsPath });
    assert.strictEqual(decision.identity.source, 'hostname');
    assert.strictEqual(decision.identity.id, 'somehost-3');
    assert.strictEqual(decision.pin, false, 'a transient timeout must not become permanent');
    assert.ok(decision.warning);
});

test('S-6: probe reports a timeout distinguishably from a definite failure', () => {
    const timeout = Object.assign(new Error('spawnSync ioreg ETIMEDOUT'),
        { code: 'ETIMEDOUT', killed: true, signal: 'SIGTERM' });
    const result = machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': timeout } }));
    assert.ok(result && result.timedOut === true,
        `a timeout must be reported as such, got ${JSON.stringify(result)}`);
    // Output we could read but not use stays a definite failure.
    assert.strictEqual(machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': IOREG_NO_UUID } })), null);
});

test('M-2(a): probes use absolute paths, so a stripped PATH is not "no such machine id"', () => {
    const stub = io({ exec: { '/usr/sbin/ioreg': IOREG_REAL } });
    const result = machineKey.probe('darwin', stub);
    assert.ok(result && result.id, `ioreg must be invoked by absolute path, got ${JSON.stringify(result)}`);
    assert.strictEqual(stub.calls[0].cmd, '/usr/sbin/ioreg');
});

test('M-2(a): a spawn-layer failure is retryable, not a verdict', () => {
    // ENOENT/EACCES/EAGAIN mean "could not ask" — a stripped PATH, a sandbox, a
    // fork limit. Treating them as "this machine has no stable id" pins the
    // DRIFTING hostname permanently, and getStableIdentity never probes again.
    for (const code of ['ENOENT', 'EACCES', 'EAGAIN', 'EMFILE']) {
        const error = Object.assign(new Error(code), { code });
        const result = machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': error } }));
        assert.ok(result && result.timedOut === true,
            `${code} must be retryable, got ${JSON.stringify(result)}`);
        const attemptsPath = path.join(freshSidecarDir('m2a-' + code), 'attempts.json');
        assert.strictEqual(machineKey.pinDecision(result, 'FangYideMBP-3', { attemptsPath }).pin, false,
            `${code} must not pin a drifting hostname`);
    }
});

test('M-2(a): output we could read but not use IS a verdict', () => {
    // We asked and got an answer; asking again will not change it.
    assert.strictEqual(machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': IOREG_NO_UUID } })), null);
    assert.strictEqual(machineKey.pinDecision(null, 'somehost').pin, true);
});

test('M-2(a): the current probe result joins the candidate set', () => {
    // Direction that was unrecoverable: data written under an ioreg identity,
    // then the sidecar is lost AND probing later fails, so the runtime identity
    // falls back to the hostname. The candidate sweep only ever offered
    // hostname families, so that ciphertext could never be opened again.
    const candidates = machineKey.identityCandidates({
        probed: { source: 'ioreg', id: 'A0C5A880-EE6D-582D-8836-9C77080D904A' },
        hostname: 'FangYideMBP-3',
        localHostName: null,
    });
    assert.ok(candidates.includes('A0C5A880-EE6D-582D-8836-9C77080D904A'),
        'a probeable identity must be recoverable too, not just hostnames');
    assert.ok(candidates.includes('FangYideMBP-3'), 'and the hostname family stays');
    assert.ok(candidates.includes('FangYideMBP-2'));
    assert.strictEqual(new Set(candidates).size, candidates.length, 'no duplicates');
});

test('M3: retryable probe failures are bounded, not retried forever', () => {
    // On a machine where the probe reliably exceeds its budget — a restricted
    // sandbox, heavy I/O, a slow cold start — "retry next launch" means forking
    // and blocking for up to 1.5s on EVERY launch, indefinitely, with nothing
    // telling the user why startup is slow.
    const dir = freshSidecarDir('m3bound');
    const attemptsPath = path.join(dir, 'attempts.json');

    const decisions = [];
    for (let launch = 1; launch <= 5; launch++) {
        machineKey.resetForTests();
        decisions.push(machineKey.pinDecision({ timedOut: true }, 'somehost-3', {
            attemptsPath,
        }));
    }

    assert.deepStrictEqual(decisions.slice(0, 3).map(d => d.pin), [false, false, false],
        'the first few launches must keep hoping for a real identity');
    assert.strictEqual(decisions[3].pin, true,
        'but after enough consecutive timeouts, pin the deterministic fallback ' +
        'rather than pay the probe on every launch forever');
    assert.strictEqual(decisions[3].identity.source, 'hostname');
});

test('M3: a successful probe clears the timeout tally', () => {
    const dir = freshSidecarDir('m3clear');
    const attemptsPath = path.join(dir, 'attempts.json');
    machineKey.pinDecision({ timedOut: true }, 'somehost-3', { attemptsPath });
    machineKey.pinDecision({ timedOut: true }, 'somehost-3', { attemptsPath });
    const good = machineKey.pinDecision({ source: 'ioreg', id: 'UUID-1' }, 'somehost-3', { attemptsPath });
    assert.strictEqual(good.pin, true);
    // A transient patch of slowness must not carry over and cause a later
    // single timeout to pin the hostname.
    const next = machineKey.pinDecision({ timedOut: true }, 'somehost-3', { attemptsPath });
    assert.strictEqual(next.pin, false, 'the tally must have been reset by the success');
});

console.log('\n=== machine-key: probing stays lazy (S-5) ===\n');

test('S-5: inspecting key material health does not probe or create a sidecar', () => {
    freshSidecarDir('s5');
    const health = machineKey.inspectPinned();
    assert.strictEqual(health.ok, true, 'no sidecar is not an error');
    assert.strictEqual(health.identity, null);
    assert.strictEqual(fs.existsSync(process.env.CLAUDE_LAUNCHER_KEY_FILE), false,
        'merely asking about health must not fork a probe or pin an identity — ' +
        'the launcher constructs an ApiManager at module load, before the user does anything');
});

test('S-5: the health check used by crypto is the non-probing one', () => {
    // m1: the only test that could catch lib/crypto.js swapping inspectPinned()
    // back to getStableIdentity() lived in the e2e suite. Assert it here too,
    // where the failure is one line instead of a launcher run: asking crypto
    // about key material health must not bring a sidecar into existence.
    freshSidecarDir('s5c');
    const cryptoModule = require('../lib/crypto');
    cryptoModule.resetKeyCachesForTests();
    const health = cryptoModule.keyMaterialHealth();
    assert.strictEqual(health.ok, true);
    assert.strictEqual(fs.existsSync(process.env.CLAUDE_LAUNCHER_KEY_FILE), false,
        'a health check must not probe or pin — it runs before the user has asked for anything');
    // And the real derivation still does create it, so this is not just a
    // module that never works.
    cryptoModule.encrypt('now-a-key-is-needed');
    assert.strictEqual(fs.existsSync(process.env.CLAUDE_LAUNCHER_KEY_FILE), true);
});

test('S-5: inspecting still fails closed on a corrupt sidecar', () => {
    const dir = freshSidecarDir('s5b');
    fs.writeFileSync(path.join(dir, 'machine.json'), 'not json at all');
    const health = machineKey.inspectPinned();
    assert.strictEqual(health.ok, false);
    assert.ok(/key material/i.test(health.error));
});

console.log('\n=== machine-key: platform probing (R3, B12) ===\n');

test('R3 darwin: IOPlatformUUID is extracted from real ioreg output', () => {
    const result = machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': IOREG_REAL } }));
    assert.ok(result, 'probe must succeed');
    assert.strictEqual(result.source, 'ioreg');
    assert.strictEqual(result.id, 'A0C5A880-EE6D-582D-8836-9C77080D904A');
});

test('R3 darwin: ioreg output without a UUID probes as failure', () => {
    assert.strictEqual(machineKey.probe('darwin', io({ exec: { '/usr/sbin/ioreg': IOREG_NO_UUID } })), null);
});

test('R3 darwin: a missing ioreg is retryable, not a verdict (M-2(a))', () => {
    // The stub throws ENOENT, which is what a stripped PATH looks like. Since
    // M-2(a) that means "could not ask", so the identity must stay unpinned and
    // the next launch tries again.
    const result = machineKey.probe('darwin', io({}));
    assert.ok(result && result.timedOut === true, JSON.stringify(result));
});

test('R3 linux: /etc/machine-id is used when valid', () => {
    const result = machineKey.probe('linux', io({
        files: { '/etc/machine-id': 'd4f1a0b6c8e24d1fa9b7e3c5d6072a11\n' },
    }));
    assert.ok(result);
    assert.strictEqual(result.source, 'machine-id');
    assert.strictEqual(result.id, 'd4f1a0b6c8e24d1fa9b7e3c5d6072a11');
});

test('R3 linux: an EMPTY /etc/machine-id is a failure, and dbus is tried next', () => {
    const result = machineKey.probe('linux', io({
        files: {
            '/etc/machine-id': '   \n',
            '/var/lib/dbus/machine-id': 'aa11bb22cc33dd44ee55ff6677889900\n',
        },
    }));
    assert.ok(result, 'must fall through to the dbus path');
    assert.strictEqual(result.source, 'dbus-machine-id');
    assert.strictEqual(result.id, 'aa11bb22cc33dd44ee55ff6677889900');
});

test('R3 linux: an ALL-ZERO machine-id is a failure (would degrade the key input to a constant)', () => {
    const result = machineKey.probe('linux', io({
        files: {
            '/etc/machine-id': '00000000000000000000000000000000\n',
            '/var/lib/dbus/machine-id': '00000000000000000000000000000000\n',
        },
    }));
    assert.strictEqual(result, null);
});

test('R3 linux: both paths missing probes as failure', () => {
    assert.strictEqual(machineKey.probe('linux', io({})), null);
});

test('R3 win32: MachineGuid is extracted from reg query output', () => {
    const result = machineKey.probe('win32', io({ exec: { reg: REG_QUERY_REAL } }));
    assert.ok(result);
    assert.strictEqual(result.source, 'machine-guid');
    assert.strictEqual(result.id, '4c4c4544-0046-5710-8034-c4c04f4d3332');
});

test('R3 win32: unparseable reg output probes as failure', () => {
    assert.strictEqual(machineKey.probe('win32', io({ exec: { reg: 'ERROR: The system was unable to find' } })), null);
});

test('R3: an unknown platform probes as failure', () => {
    assert.strictEqual(machineKey.probe('aix', io({})), null);
});

test('B12: probes run with hardened exec options (stderr ignored, timeout, windowsHide, maxBuffer)', () => {
    const stub = io({ exec: { '/usr/sbin/ioreg': IOREG_REAL } });
    machineKey.probe('darwin', stub);
    assert.strictEqual(stub.calls.length, 1);
    const opts = stub.calls[0].opts || {};
    assert.deepStrictEqual(opts.stdio, ['ignore', 'pipe', 'ignore'],
        'stderr must never leak into the TUI render area');
    assert.ok(typeof opts.timeout === 'number' && opts.timeout > 0, 'a hung probe must not hang startup');
    assert.strictEqual(opts.windowsHide, true);
    assert.ok(typeof opts.maxBuffer === 'number' && opts.maxBuffer > 0);
    assert.strictEqual(opts.encoding, 'utf8');
});

console.log('\n=== machine-key: legacy hostname candidates (R4, B7) ===\n');

test('R4: the raw hostname is the first candidate (no-drift case stays fastest)', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP-3' });
    assert.strictEqual(list[0], 'FangYideMBP-3');
});

test('R4: a DHCP search-domain form keeps BOTH the dotted and the stripped name', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP.hsd1.ca.comcast.net' });
    assert.ok(list.includes('FangYideMBP.hsd1.ca.comcast.net'), 'dotted form must be kept');
    assert.ok(list.includes('FangYideMBP'), 'everything after the first dot must also be stripped');
});

test('R4: .local is stripped as well', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP-2.local' });
    assert.ok(list.includes('FangYideMBP-2'));
    assert.ok(list.includes('FangYideMBP'));
});

test('R4: Bonjour neighbours (-N-1 and -N+1) come before the wider sweep', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP-3' });
    // The forensic case: ciphertext was written under -2 while the runtime name is -3.
    assert.ok(list.includes('FangYideMBP-2'), 'the immediate predecessor must be a candidate');
    assert.ok(list.includes('FangYideMBP-4'));
    assert.ok(list.indexOf('FangYideMBP-2') <= 4,
        `predecessor must be tried early, got index ${list.indexOf('FangYideMBP-2')}`);
});

test('R4: the bare base and the -2..-8 sweep are covered', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP-3' });
    assert.ok(list.includes('FangYideMBP'), 'bare base');
    for (const n of [2, 3, 4, 5, 6, 7, 8]) {
        assert.ok(list.includes(`FangYideMBP-${n}`), `missing FangYideMBP-${n}`);
    }
});

test('R4: LocalHostName contributes its own base family (different base name entirely)', () => {
    const list = machineKey.legacyHostnameCandidates({
        hostname: 'FangYideMBP-3',
        localHostName: 'FangYideMacBook-Pro-3',
    });
    assert.ok(list.includes('FangYideMacBook-Pro-3'));
    assert.ok(list.includes('FangYideMacBook-Pro-2'));
});

test('R4: no duplicates, capped, and no whitespace-bearing ComputerName values', () => {
    const list = machineKey.legacyHostnameCandidates({
        hostname: 'FangYideMBP-3.lan',
        localHostName: 'FangYideMacBook-Pro-3',
    });
    assert.strictEqual(new Set(list).size, list.length, 'candidates must be deduplicated');
    // A real bound, not a tautology against the module's own constant: every
    // extra candidate is another ~45ms of PBKDF2 blocking the first render on
    // the miss path, so a change that widens the sweep has to be a deliberate
    // one. Measured worst cases today: 8 plain / 24 one domained / 32 both.
    assert.ok(list.length <= 32,
        `candidate list grew to ${list.length}; each entry costs ~45ms of PBKDF2 on a miss`);
    for (const c of list) {
        assert.ok(!/\s/.test(c), `candidate "${c}" contains whitespace — ComputerName was never a gethostname() value`);
        assert.ok(c.length > 0);
    }
});

test('BL-2: the NEIGHBOURS of a dotted name keep the domain form too', () => {
    // "HostName not set" is exactly when gethostname() returns a name carrying
    // .local or a DHCP search domain. Ciphertext written under `Foo-2.local`
    // while the runtime name is `Foo-3.local` is the most common shape of this
    // bug on macOS — keeping only the un-domained derivations makes it
    // permanently unrecoverable.
    const list = machineKey.legacyHostnameCandidates({ hostname: 'Foo-3.local', localHostName: null });
    assert.ok(list.includes('Foo-2'), 'un-domained predecessor');
    assert.ok(list.includes('Foo-2.local'), 'DOMAINED predecessor is the one that actually wrote the file');
    assert.ok(list.includes('Foo-4.local'));
    assert.ok(list.includes('Foo.local'), 'the bare base in domain form');
    assert.ok(list.includes('Foo-5.local'), 'the wider sweep in domain form');
});

test('BL-2: the same holds for a DHCP search domain, not just .local', () => {
    const list = machineKey.legacyHostnameCandidates({
        hostname: 'bar-3.hsd1.ca.comcast.net', localHostName: null,
    });
    assert.ok(list.includes('bar-2.hsd1.ca.comcast.net'),
        'the multi-label search domain must be preserved on derived candidates');
    assert.ok(list.includes('bar-2'));
});

test('BL-2: a name with no domain gains no domain variants (no wasted slots)', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'FangYideMBP-3', localHostName: null });
    for (const candidate of list) {
        assert.ok(!candidate.includes('.'), `unexpected dotted candidate: ${candidate}`);
    }
    assert.ok(list.includes('FangYideMBP-2'));
});

test('BL-2: the domained predecessor is still tried early', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'Foo-3.local', localHostName: null });
    assert.ok(list.indexOf('Foo-2.local') <= 5,
        `the most likely candidate must stay near the front, got index ${list.indexOf('Foo-2.local')}`);
});

test('R4: a name with no suffix still produces the -N family', () => {
    const list = machineKey.legacyHostnameCandidates({ hostname: 'runner' });
    assert.strictEqual(list[0], 'runner');
    assert.ok(list.includes('runner-2'), 'CI hosts have no suffix but their ciphertext may');
});

test('R4: defaults come from the real OS when nothing is injected', () => {
    const list = machineKey.legacyHostnameCandidates();
    assert.ok(Array.isArray(list) && list.length > 0);
    assert.strictEqual(list[0], os.hostname());
});

console.log('\n=== machine-key: reset contract (B10) ===\n');

test('B10: resetForTests clears the pinned identity cache and warnings', () => {
    const dir = freshSidecarDir('b10');
    machineKey.getStableIdentity();
    fs.writeFileSync(path.join(dir, 'machine.json'),
        JSON.stringify({ v: 1, source: 'ioreg', id: 'after-reset' }));
    machineKey.resetForTests();
    assert.strictEqual(machineKey.getWarnings().length, 0, 'warnings must be cleared');
    assert.strictEqual(machineKey.getStableIdentity().id, 'after-reset',
        'a stale in-module cache would return the previous id');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
