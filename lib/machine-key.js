/**
 * Machine Key Module — the stable machine identity used as encryption key input.
 *
 * Why this exists: the key used to be derived from os.hostname(). On macOS,
 * when `scutil --get HostName` is unset, gethostname() falls back to the
 * DHCP/mDNS name, which drifts with network changes, DHCP renewals and Bonjour
 * dedup suffixes (-2/-3/-4). The derived key silently rotated and locked users
 * out of their own encrypted config. Windows returns a stable COMPUTERNAME,
 * which is why the bug looked macOS-only.
 *
 * Design invariant: NO identity mode is unrecoverable.
 *   - ioreg / machine-id / MachineGuid are deterministically re-derivable.
 *   - the `hostname` fallback is covered by legacyHostnameCandidates().
 * Losing the sidecar therefore costs at most one candidate sweep plus one
 * re-encryption — never unrecoverable data loss. Nothing here ever generates a
 * random key, because a random key that cannot be persisted (or that is later
 * deleted) is exactly the unrecoverable mode this invariant forbids.
 *
 * Fail-closed rule: a sidecar that EXISTS but cannot be read or parsed is a
 * hard error. Re-pinning over it would replace the only key that can decrypt
 * the user's tokens. A sidecar that cannot be CREATED is not an error — the
 * fallback identity is deterministic, so the next process derives the same key.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chmodOwnerOnly, createExclusive } = require('./fs-safe');

const SIDECAR_VERSION = 1;

/**
 * Hardened probe invocation (round 2 review B12): stderr must never leak into
 * the TUI's full-screen render area, a hung command must not hang startup
 * (every fs call on the startup path is synchronous), and Windows must not
 * flash a console window.
 */
const PROBE_EXEC_OPTS = {
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 1500,
    maxBuffer: 1 << 20,
    windowsHide: true,
    encoding: 'utf8',
};

const KNOWN_SOURCES = ['ioreg', 'machine-id', 'dbus-machine-id', 'machine-guid', 'hostname'];

/** Bonjour dedup suffixes reach at least -8 in practice; the list is capped anyway. */
const SUFFIX_SWEEP = [2, 3, 4, 5, 6, 7, 8];
// The generator is bounded by construction: two families (hostname +
// LocalHostName) x {exact, +/-1 neighbours, bare base, -2..-8 sweep} x
// {bare, domained}. After dedup the measured worst cases are 8 for a plain
// name, 24 with one domained family and 32 with two — so a full miss costs at
// most ~32 x 45ms of PBKDF2, once per process, and only on the path where the
// data is otherwise unreadable anyway.
//
// There is deliberately no slice() cap: at 44 it could never fire, which made
// it dead code pretending to be a safety net. The bound is asserted in
// test/machine-key.test.js instead, where a change to SUFFIX_SWEEP that blew up
// the startup cost would actually fail something.

class KeyMaterialError extends Error {
    constructor(message) {
        super(message);
        this.name = 'KeyMaterialError';
        this.code = 'KEY_MATERIAL_UNREADABLE';
    }
}

let cachedIdentity = null;
let warnings = [];

/**
 * Resolved lazily on EVERY call, never captured in a module constant: tests
 * point CLAUDE_LAUNCHER_KEY_FILE at a temp dir, and a constant would freeze
 * whatever the env happened to be at require time.
 */
function sidecarPath() {
    return process.env.CLAUDE_LAUNCHER_KEY_FILE ||
        path.join(os.homedir(), '.claude-launcher-machine.json');
}

/** An id made only of zeros/dashes carries no entropy — treat it as absent. */
function isUsableId(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    if (/^[0\-\s]+$/.test(trimmed)) return false;
    return true;
}

/**
 * Read one machine-id style file. Returns the trimmed id or null.
 * An empty or all-zero file is a FAILURE, not an id: containers ship both, and
 * accepting them would degrade the key input to a constant shared by every
 * container built from the same image.
 */
function readMachineIdFile(filePath, readFileSync) {
    try {
        const raw = readFileSync(filePath, 'utf8');
        const value = String(raw).trim();
        if (!isUsableId(value)) return null;
        if (!/^[0-9a-fA-F]{32}$/.test(value)) return null;
        return value.toLowerCase();
    } catch (_) {
        return null;
    }
}

/**
 * Probe the platform for a stable machine identity.
 * Pure apart from the injected io, so the win32/linux branches can be
 * exercised from macOS. @returns {{source: string, id: string}|null}
 */
function isTimeout(error) {
    return Boolean(error) && (error.code === 'ETIMEDOUT' ||
        error.killed === true || error.signal === 'SIGTERM');
}

function probe(platform, injected) {
    const io = injected || { execFileSync, readFileSync: fs.readFileSync };

    if (platform === 'darwin') {
        try {
            const out = io.execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], PROBE_EXEC_OPTS);
            const match = /"IOPlatformUUID"\s*=\s*"([0-9A-Fa-f-]{36})"/.exec(String(out));
            if (match && isUsableId(match[1])) return { source: 'ioreg', id: match[1] };
        } catch (error) {
            // A timeout says "ask again later", a missing binary says "never".
            // Conflating them would pin the weaker identity for good.
            if (isTimeout(error)) return { timedOut: true };
        }
        return null;
    }

    if (platform === 'linux' || platform === 'android') {
        const etc = readMachineIdFile('/etc/machine-id', io.readFileSync);
        if (etc) return { source: 'machine-id', id: etc };
        const dbus = readMachineIdFile('/var/lib/dbus/machine-id', io.readFileSync);
        if (dbus) return { source: 'dbus-machine-id', id: dbus };
        return null;
    }

    if (platform === 'win32') {
        const attempts = [
            ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'],
            ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid', '/reg:64'],
        ];
        let timedOut = false;
        for (const args of attempts) {
            try {
                const out = io.execFileSync('reg', args, PROBE_EXEC_OPTS);
                // Match on hex/dash only: a localized console code page can
                // mangle the surrounding text but never the GUID itself.
                const match = /([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/.exec(String(out));
                if (match && isUsableId(match[1])) return { source: 'machine-guid', id: match[1] };
            } catch (error) {
                if (isTimeout(error)) timedOut = true;
            }
        }
        return timedOut ? { timedOut: true } : null;
    }

    return null;
}

/** Parse + structurally validate a sidecar document. Throws when unusable. */
function parseSidecar(raw, filePath) {
    let doc;
    try {
        doc = JSON.parse(raw);
    } catch (e) {
        throw new KeyMaterialError(
            `key material file ${filePath} is not readable JSON (${e.message}) — do NOT continue, back up your config file first`);
    }
    if (!doc || typeof doc !== 'object' || !isUsableId(doc.id) || typeof doc.source !== 'string') {
        throw new KeyMaterialError(
            `key material file ${filePath} is structurally invalid — do NOT continue, back up your config file first`);
    }
    if (doc.v !== SIDECAR_VERSION) {
        throw new KeyMaterialError(
            `key material file ${filePath} has version ${JSON.stringify(doc.v)}, expected ${SIDECAR_VERSION} — ` +
            `do NOT continue, back up your config file first`);
    }
    if (!KNOWN_SOURCES.includes(doc.source)) {
        // The read side has to enforce the invariant too: an identity from an
        // unknown source may be neither re-derivable nor inside the candidate
        // set, so trusting it could make the data permanently unreadable.
        throw new KeyMaterialError(
            `key material file ${filePath} names an unknown identity source ${JSON.stringify(doc.source)} — ` +
            `do NOT continue, back up your config file first`);
    }
    return { source: doc.source, id: String(doc.id).trim() };
}

/**
 * Read-only health check: is the key material usable?
 *
 * Never probes and never creates anything — callers use it on the startup path,
 * before the user has asked for anything, and a brand-new user with no config
 * must not get an identity pinned (or an ioreg forked) just for launching.
 * @returns {{ok: boolean, error: string|null, identity: object|null}}
 */
function inspectPinned() {
    const filePath = sidecarPath();
    if (!fs.existsSync(filePath)) return { ok: true, error: null, identity: null };
    try {
        const pinned = parseSidecar(fs.readFileSync(filePath, 'utf8'), filePath);
        return { ok: true, error: null, identity: pinned };
    } catch (error) {
        return { ok: false, error: error.message, identity: null };
    }
}

/**
 * What to use, and whether to write it down.
 *
 * Pure so the decision can be tested without a probe seam. The distinction that
 * matters: a probe that TIMED OUT may well succeed next launch, and pinning the
 * weaker hostname identity because a cold machine was slow once would make that
 * downgrade permanent. Deferring the pin is safe precisely because the hostname
 * family is what legacyHostnameCandidates() covers, so anything written in the
 * meantime stays recoverable.
 *
 * @returns {{identity: {source: string, id: string}, pin: boolean, warning: string|null}}
 */
function pinDecision(probeResult, hostname) {
    if (probeResult && probeResult.id) {
        return { identity: { source: probeResult.source, id: probeResult.id }, pin: true, warning: null };
    }
    const identity = { source: 'hostname', id: hostname };
    if (probeResult && probeResult.timedOut) {
        return {
            identity,
            pin: false,
            warning: 'reading this machine\'s stable id timed out; using the hostname for now and retrying next launch',
        };
    }
    return {
        identity,
        pin: true,
        warning: 'could not read a stable machine id from this platform; falling back to the hostname',
    };
}

/**
 * The pinned machine identity. Probed once, then read from the sidecar forever
 * — so even if ioreg/reg later breaks or is sandboxed away, the key does not
 * move a second time.
 * @returns {{source: string, id: string, pinned: boolean, path: string}}
 */
function getStableIdentity() {
    if (cachedIdentity) return cachedIdentity;

    const filePath = sidecarPath();

    if (fs.existsSync(filePath)) {
        let raw;
        try {
            raw = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            throw new KeyMaterialError(
                `key material file ${filePath} exists but cannot be read (${e.message}) — do NOT continue, back up your config file first`);
        }
        const pinned = parseSidecar(raw, filePath);
        chmodOwnerOnly(filePath);
        cachedIdentity = { source: pinned.source, id: pinned.id, pinned: true, path: filePath };
        return cachedIdentity;
    }

    const decision = pinDecision(probe(process.platform), os.hostname());
    const probed = decision.identity;
    if (decision.warning) warnings.push(decision.warning);

    if (!decision.pin) {
        // Transient probe failure: use the deterministic hostname identity for
        // this run and try again next launch instead of freezing the downgrade.
        cachedIdentity = { source: probed.source, id: probed.id, pinned: false, path: filePath };
        return cachedIdentity;
    }

    const doc = JSON.stringify({ v: SIDECAR_VERSION, source: probed.source, id: probed.id });
    const result = createExclusive(filePath, doc);

    if (!result.created) {
        // Either a concurrent process won the race — adopt ITS id, never
        // overwrite — or the location is not writable, in which case the
        // identity above is still deterministic and re-derivable.
        if (fs.existsSync(filePath)) {
            const winner = parseSidecar(fs.readFileSync(filePath, 'utf8'), filePath);
            cachedIdentity = { source: winner.source, id: winner.id, pinned: true, path: filePath };
            return cachedIdentity;
        }
        warnings.push(`could not persist key material to ${filePath} (${result.reason})`);
        cachedIdentity = { source: probed.source, id: probed.id, pinned: false, path: filePath };
        return cachedIdentity;
    }

    cachedIdentity = { source: probed.source, id: probed.id, pinned: true, path: filePath };
    return cachedIdentity;
}

/**
 * Historical hostnames whose derived keys may have encrypted existing data.
 *
 * Ordered by likelihood so the common cases exit after a handful of PBKDF2
 * derivations: the current name first (no drift), then the Bonjour neighbours
 * (the observed drift is exactly ±1 on the dedup counter), then the wider
 * sweep, then the LocalHostName family — whose base name can differ entirely
 * from the DHCP one.
 *
 * Known one-way blind spot: when the ciphertext was written under a DHCP name
 * whose base is not derivable from any readable source (e.g. an abbreviation
 * like "MBP" that appears in neither LocalHostName nor ComputerName), no
 * enumeration can recover it. That is why the degradation path must never
 * destroy data.
 */
function legacyHostnameCandidates(injected) {
    const opts = injected || {};
    const hostname = typeof opts.hostname === 'string' ? opts.hostname : os.hostname();
    const localHostName = Object.prototype.hasOwnProperty.call(opts, 'localHostName')
        ? opts.localHostName
        : probeLocalHostName();

    const out = [];
    const push = (value) => {
        if (typeof value !== 'string') return;
        const v = value.trim();
        // ComputerName ("FangYi's MacBook Pro") is never a gethostname()
        // value; whitespace-bearing names would only waste candidate slots.
        if (v.length === 0 || /\s/.test(v)) return;
        if (!out.includes(v)) out.push(v);
    };

    push(hostname);

    const families = [];
    const addFamily = (name) => {
        if (typeof name !== 'string' || name.trim().length === 0) return;
        const trimmed = name.trim();
        const undotted = trimmed.split('.')[0];
        if (undotted.length === 0) return;
        const suffixMatch = /^(.*?)-(\d+)$/.exec(undotted);
        families.push({
            undotted,
            // The search domain (".local", ".hsd1.ca.comcast.net", ...) carried
            // by the runtime name. Derived candidates must be offered in BOTH
            // forms: when `scutil --get HostName` is unset — the very condition
            // that causes the drift — gethostname() returns the domained form,
            // so `Foo-2.local` is what actually encrypted the file, not `Foo-2`.
            domain: trimmed.slice(undotted.length),
            base: suffixMatch ? suffixMatch[1] : undotted,
            index: suffixMatch ? parseInt(suffixMatch[2], 10) : null,
        });
    };
    addFamily(hostname);
    addFamily(localHostName);

    /** Offer a derived name in both the bare and the domained form. */
    const pushBothForms = (family, name) => {
        push(name);
        if (family.domain) push(name + family.domain);
    };

    // Pass 1: the exact name minus any search domain, then the ±1 neighbours.
    for (const family of families) {
        pushBothForms(family, family.undotted);
        if (family.index !== null) {
            if (family.index - 1 >= 2) pushBothForms(family, `${family.base}-${family.index - 1}`);
            pushBothForms(family, `${family.base}-${family.index + 1}`);
        }
    }
    // Pass 2: bare base, then the full suffix sweep.
    for (const family of families) {
        pushBothForms(family, family.base);
        for (const n of SUFFIX_SWEEP) pushBothForms(family, `${family.base}-${n}`);
    }

    return out;
}

/** macOS LocalHostName — a second, sometimes completely different, base name. */
function probeLocalHostName() {
    if (process.platform !== 'darwin') return null;
    try {
        return String(execFileSync('scutil', ['--get', 'LocalHostName'], PROBE_EXEC_OPTS)).trim() || null;
    } catch (_) {
        return null;
    }
}

/** Non-fatal conditions worth surfacing to the user (degraded identity, no pin). */
function getWarnings() {
    return warnings.slice();
}

/** Clear every piece of module-level state. Part of the reset contract (B10). */
function resetForTests() {
    cachedIdentity = null;
    warnings = [];
}

module.exports = {
    KeyMaterialError,
    KNOWN_SOURCES,
    getStableIdentity,
    getWarnings,
    inspectPinned,
    pinDecision,
    legacyHostnameCandidates,
    probe,
    resetForTests,
    sidecarPath,
};
