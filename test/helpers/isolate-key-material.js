/**
 * Test isolation for credential state.
 *
 * Requiring this module FIRST — before lib/crypto, lib/machine-key or
 * lib/api-manager — redirects BOTH pieces of per-machine state away from the
 * developer's real home directory:
 *
 *   CLAUDE_LAUNCHER_KEY_FILE  the pinned machine identity sidecar
 *   HOME / USERPROFILE        the default config path, i.e. the path
 *                             `new ApiManager()` uses when called with no
 *                             argument — which many existing tests do
 *
 * Why HOME matters now: those no-argument constructions have always read the
 * real `~/.claude-launcher-apis.json`. That used to be harmless because a
 * config the current key could not open produced loadError, which refuses
 * every save. With key-generation self-heal, the same load now RE-ENCRYPTS
 * and rewrites the file — so a plain `npm test` would rewrite the developer's
 * real credentials. Isolating HOME closes the whole class.
 *
 * Two exit-time assertions act as hard locks on "tests never touch the user's
 * real credential files": the real sidecar must not appear, and the real
 * config generations must be byte-identical to what they were at startup.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Captured BEFORE any redirection, so these always point at the real home.
const REAL_HOME = os.homedir();
const REAL_SIDECAR = path.join(REAL_HOME, '.claude-launcher-machine.json');
const REAL_CONFIG = path.join(REAL_HOME, '.claude-launcher-apis.json');
// The sidecar is fingerprinted alongside the config generations: checking only
// for its CREATION would miss a run that rewrote an existing one, which is the
// more damaging case — it changes the key that opens the user's real tokens.
// Every real file a test could plausibly touch. `.claude-launcher-config.json`
// earns its place the hard way: env-vars-config.test.js creates it in the real
// HOME through version-checker's loadConfigSync(), and the guard could not see
// it because it was not on this list.
const REAL_LAUNCHER_CONFIG = path.join(REAL_HOME, '.claude-launcher-config.json');
const REAL_FIXED = [REAL_CONFIG, REAL_CONFIG + '.bak', REAL_CONFIG + '.bak2',
    REAL_SIDECAR, REAL_LAUNCHER_CONFIG];

/**
 * Everything this release can create beside the config, matched by prefix
 * rather than by name: snapshots are content-addressed, quarantines are
 * numbered, and a fixed list silently stopped covering them. The one that
 * matters most is a snapshot slot — a permanent copy of the developer's own
 * tokens landing in their real home.
 */
function realVariants() {
    const base = path.basename(REAL_CONFIG);
    const found = [];
    try {
        for (const name of fs.readdirSync(REAL_HOME)) {
            if (!name.startsWith(base)) continue;
            if (/\.pre-key-migration|\.unreadable\.|\.probe-attempts$|\.key-scan-misses$|\.lock$|\.tmp$/.test(name)) {
                found.push(path.join(REAL_HOME, name));
            }
        }
    } catch (_) { /* unreadable home: nothing to compare */ }
    try {
        const sidecarBase = path.basename(REAL_SIDECAR);
        for (const name of fs.readdirSync(REAL_HOME)) {
            if (name.startsWith(sidecarBase) && name !== sidecarBase) found.push(path.join(REAL_HOME, name));
        }
    } catch (_) { /* ignore */ }
    return found;
}

const REAL_GENERATIONS = REAL_FIXED;

/** sha256 of a file's bytes, or null when absent/unreadable. */
function fingerprint(filePath) {
    try {
        return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    } catch (_) {
        return null;
    }
}

const sidecarExistedAtStart = fs.existsSync(REAL_SIDECAR);
const generationsAtStart = REAL_GENERATIONS.map(fingerprint);
const variantsAtStart = new Map(realVariants().map(p => [p, fingerprint(p)]));

/**
 * Point every piece of per-machine state at a fresh temp directory.
 * @returns {string} the temp directory now standing in for $HOME
 */
function isolate(label) {
    const safe = String(label || 'test').replace(/[^A-Za-z0-9._-]/g, '_');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cl-isolated-${safe}-`));
    process.env.CLAUDE_LAUNCHER_KEY_FILE = path.join(dir, 'machine.json');
    process.env.HOME = dir;
    if (process.platform === 'win32') process.env.USERPROFILE = dir;
    return dir;
}

/** Env for a child process: inherits the isolated paths. */
function childEnv(extra) {
    return Object.assign({}, process.env, {
        CLAUDE_LAUNCHER_KEY_FILE: process.env.CLAUDE_LAUNCHER_KEY_FILE,
        HOME: process.env.HOME,
    }, extra || {});
}

// Auto-isolate on require: no test file may forget to call isolate().
const initialDir = isolate(path.basename(process.argv[1] || 'test', '.js'));

function checkRealFiles() {
    const problems = [];
    if (!sidecarExistedAtStart && fs.existsSync(REAL_SIDECAR)) {
        problems.push(`created ${REAL_SIDECAR}`);
    }
    REAL_GENERATIONS.forEach((filePath, i) => {
        if (fingerprint(filePath) !== generationsAtStart[i]) {
            problems.push(`modified ${filePath}`);
        }
    });
    for (const filePath of realVariants()) {
        if (!variantsAtStart.has(filePath)) problems.push(`created ${filePath}`);
        else if (variantsAtStart.get(filePath) !== fingerprint(filePath)) problems.push(`modified ${filePath}`);
    }
    if (problems.length > 0) {
        console.error(`\n  ✗ FATAL: this test run touched real credential files:\n    - ${problems.join('\n    - ')}`);
        process.exitCode = 1;
    }
    return problems;
}

process.on('exit', checkRealFiles);

// A test killed with Ctrl-C — the usual response to one that hangs — would
// otherwise skip the check entirely. Re-raise after checking so the exit status
// still looks like a signal death.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        const problems = checkRealFiles();
        process.exit(problems.length > 0 ? 1 : 130);
    });
}

module.exports = { isolate, childEnv, initialDir, REAL_HOME, REAL_SIDECAR, REAL_CONFIG };
