/**
 * Test runner: executes EVERY test file and reports a summary.
 *
 * Why not `&&` in package.json: a chain of 20+ `&&` stops at the first failing
 * file, so the remaining files never run and a human reading the tail of the
 * output sees a reassuring "0 failed" that only describes the files that did
 * run. This runner always runs everything and prints one verdict at the end.
 *
 * Each file still runs in its own process — several of them monkeypatch
 * os.hostname or hijack $HOME, and sharing a process would let that leak.
 *
 * edit-api / password-guard / screen were on disk but absent from the old
 * chain; all three pass, so they are included rather than left to rot.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Order matters: the fastest, most diagnostic units first, then the modules
// that build on them, then the end-to-end suites.
const FILES = [
    'providers.test.js',
    'menu-hints.test.js',
    'version-checker.test.js',
    'i18n-consistency.test.js',
    'fs-safe.test.js',
    'machine-key.test.js',
    'crypto.test.js',
    'key-heal.test.js',
    'quarantine.test.js',
    'api-manager.test.js',
    'edit-api.test.js',
    'password-guard.test.js',
    'config-persistence.test.js',
    'launcher.test.js',
    'launcher-chain.test.js',
    'model-validation.test.js',
    'config-management.test.js',
    'config-safety.test.js',
    'screen.test.js',
    'api-select.test.js',
    'env-vars-validators.test.js',
    'env-vars-providers.test.js',
    'env-vars-config.test.js',
    'env-vars-migration.test.js',
    'env-vars-add-api.test.js',
    'env-vars-write-interfaces.test.js',
    'env-vars-import-export.test.js',
    'env-vars-ui.test.js',
    'e2e.test.js',
    'e2e-key-drift.test.js',
];

const results = [];
for (const file of FILES) {
    const run = spawnSync(process.execPath, ['--no-warnings', path.join(__dirname, file)], {
        stdio: 'inherit',
    });
    results.push({ file, status: run.status, signal: run.signal });
}

const failed = results.filter(r => r.status !== 0);
console.log(`\n${'='.repeat(72)}`);
if (failed.length === 0) {
    console.log(`  ALL ${results.length} test files passed`);
} else {
    console.log(`  ${failed.length} of ${results.length} test files FAILED:`);
    for (const r of failed) {
        console.log(`    - ${r.file} (exit ${r.status}${r.signal ? `, signal ${r.signal}` : ''})`);
    }
}
console.log(`${'='.repeat(72)}\n`);
process.exit(failed.length === 0 ? 0 : 1);
