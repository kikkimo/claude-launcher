/**
 * Small filesystem helpers shared by the credential-bearing writers.
 *
 * Extracted so lib/machine-key.js can enforce owner-only permissions without
 * reaching into ApiManager's private methods (which would also create a
 * machine-key -> api-manager -> crypto -> machine-key require cycle).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Best-effort chmod 0600 on credential files (no-op where POSIX modes don't apply). */
function chmodOwnerOnly(filePaths) {
    for (const p of [].concat(filePaths)) {
        try {
            if (fs.existsSync(p) && process.platform !== 'win32') {
                fs.chmodSync(p, 0o600);
            }
        } catch (_) { /* best effort */ }
    }
}

/** fsync a directory so a rename/link is durable. Not supported everywhere. */
function fsyncDir(dir) {
    try {
        const fd = fs.openSync(dir, 'r');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
    } catch (_) { /* best effort — not all filesystems support dir fsync */ }
}

/**
 * Create `filePath` with `content` if and only if it does not already exist.
 *
 * Never clobbers an existing file: fs.renameSync REPLACES its target, so a
 * process that loses the creation race would overwrite the winner. linkSync
 * fails with EEXIST instead, which is exactly the semantics we need; where
 * hard links are unavailable we fall back to an O_EXCL open on the target
 * itself.
 *
 * The temp file carries a unique suffix (never a fixed name): one crashed
 * writer leaving debris behind must not make creation impossible forever.
 *
 * @returns {{created: boolean, reason?: string}} created:false means the file
 *          already existed (someone else won) or could not be created.
 */
function createExclusive(filePath, content) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);

    let tmpPath = null;
    for (let attempt = 0; attempt < 5 && tmpPath === null; attempt++) {
        const candidate = path.join(dir,
            `.${base}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
        try {
            const fd = fs.openSync(candidate, 'wx', 0o600);
            try {
                fs.writeFileSync(fd, content);
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }
            tmpPath = candidate;
        } catch (error) {
            if (error.code === 'EEXIST') continue; // debris — try another name
            return { created: false, reason: error.message };
        }
    }
    if (tmpPath === null) return { created: false, reason: 'could not create a temp file' };

    try {
        try {
            fs.linkSync(tmpPath, filePath);
        } catch (error) {
            if (error.code === 'EEXIST') return { created: false, reason: 'already exists' };
            if (error.code !== 'ENOSYS' && error.code !== 'EPERM' &&
                error.code !== 'EXDEV' && error.code !== 'EOPNOTSUPP') {
                return { created: false, reason: error.message };
            }
            // Hard links unavailable (some Windows/network filesystems):
            // O_EXCL straight onto the target still refuses to clobber.
            const fd = fs.openSync(filePath, 'wx', 0o600);
            try {
                fs.writeFileSync(fd, content);
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }
        }
        chmodOwnerOnly(filePath);
        fsyncDir(dir);
        return { created: true };
    } catch (error) {
        if (error.code === 'EEXIST') return { created: false, reason: 'already exists' };
        return { created: false, reason: error.message };
    } finally {
        try { fs.unlinkSync(tmpPath); } catch (_) { /* already gone */ }
    }
}

module.exports = { chmodOwnerOnly, fsyncDir, createExclusive };
