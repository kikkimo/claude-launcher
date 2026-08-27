/**
 * API Manager Module - Manages third-party API configurations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
    encrypt,
    decrypt,
    decryptWithCurrentKey,
    decryptWithRecovery,
    candidateFingerprint,
    keyMaterialHealth,
} = require('./crypto');
const { chmodOwnerOnly, createExclusive, moveNoClobber } = require('./fs-safe');
const machineKey = require('./machine-key');
const { validateBaseUrl, validateAuthToken, validateModel, validateApiName, isPlaceholderToken } = require('./validators');
const screen = require('./ui/screen');

class DuplicateApiError extends Error {
    constructor(existingApi) {
        super(`Duplicate API: ${existingApi.name}`);
        this.name = 'DuplicateApiError';
        this.code = 'DUPLICATE_API';
        this.existingApiId = existingApi.id;
        this.existingApiName = existingApi.name;
    }
}

/** Synchronously block for ms — used while waiting for the write lock. */
function _sleepSync(ms) {
    const sab = new SharedArrayBuffer(4);
    Atomics.wait(new Int32Array(sab), 0, 0, ms);
}

/**
 * Shape of a value this module produced with encrypt(): hex iv:ciphertext with
 * an optional hex auth tag. Anything else was never encrypted (plaintext
 * tokens exist in test and legacy configs) and must not be treated as a key
 * generation problem. Same guard as lib/launcher.js's ENCRYPTED_TOKEN_RE.
 */
const ENCRYPTED_PAYLOAD_RE = /^[0-9a-f]+:[0-9a-f]+(:[0-9a-f]+)?$/i;

const SNAPSHOT_SUFFIX = '.pre-key-migration';
const SNAPSHOT_VERSION = 1;
// Distinct candidate sets a single ciphertext may be remembered as missing
// under — enough for a machine that moves between a few networks.
const MAX_MEMO_FINGERPRINTS = 4;

const MODEL_CONFIG_LABELS = {
    ANTHROPIC_DEFAULT_SONNET_MODEL: 'Regular Model (Sonnet)',
    ANTHROPIC_DEFAULT_OPUS_MODEL: 'Heavy Model (Opus)',
    ANTHROPIC_DEFAULT_HAIKU_MODEL: 'Fast Model (Haiku)',
    ANTHROPIC_DEFAULT_FABLE_MODEL: 'Fable Model (Fable)',
    CLAUDE_CODE_SUBAGENT_MODEL: 'Subagent Model',
    ANTHROPIC_CUSTOM_MODEL_OPTION: 'Custom Model',
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'Custom Model Name',
};

const RUNTIME_CONFIG_LABELS = {
    API_TIMEOUT_MS: 'Request Timeout',
    CLAUDE_CODE_ATTRIBUTION_HEADER: 'Output Attribution',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Reduce Non-Essential Traffic',
    CLAUDE_CODE_EFFORT_LEVEL: 'Reasoning Effort',
    CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: 'Experimental Features',
    CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: 'Disable Non-Streaming Fallback',
};

class ApiManager {
    constructor(configFile) {
        this.configFile = configFile || path.join(os.homedir(), '.claude-launcher-apis.json');
        this._initializeFromDisk();
    }

    /**
     * Load, validate and (if needed) heal the config from disk, establishing
     * every piece of instance state that depends on it.
     *
     * Factored out of the constructor so restoreQuarantined() can re-establish
     * the same state after swapping the file underneath, instead of leaving the
     * caller with an in-memory config that no longer matches disk.
     */
    _initializeFromDisk() {
        // Checked before anything is read or written: a key material file that
        // exists but cannot be parsed must never be replaced, and nothing may
        // be persisted while the only key that can open the config is unknown.
        const health = keyMaterialHealth();
        this.keyMaterialError = health.ok ? null : health.error;
        // Set before loadConfig(), which populates them via _loadResult().
        this._healSourceBytes = null;
        this._healBlockedReason = null;
        this._keyMigrationBlocked = false;
        this.keyHealOutcome = 'idle';
        // Where a generation displaced by a backup promotion was kept.
        this.supersededGeneration = null;
        const {
            config, migrated, loadError, recoveredFromBackup, keyStale, keyRecoveryReport, pendingReencrypt,
        } = this.loadConfig();
        this.config = config;
        this.loadError = loadError || null;
        this.recoveredFromBackup = recoveredFromBackup || false;
        // Whether this load needed a historical key to read existing data.
        this.keyStale = keyStale || false;
        this.keyRecoveryReport = keyRecoveryReport || null;
        // CAS baseline: the exact on-disk bytes this instance's in-memory
        // config was derived from. saveConfig refuses to write when another
        // instance changed the file in between (last-writer-wins guard).
        this._diskState = this._readDiskState();
        this.saveConflict = false;
        this.saveOutcome = 'idle';
        this._indeterminateSnapshot = null;
        this._promoted = false;
        this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
        // Tighten permissions on load, independent of any content migration:
        // files written by pre-hardening versions are typically 0644 while
        // holding encrypted tokens (Codex review).
        this._enforceOwnerOnly([this.configFile, this.configFile + '.bak',
            this.configFile + '.bak2', ...this.listSnapshots().map(entry => entry.path)]);

        // A snapshot that outlived every generation is the last copy of the
        // user's APIs. Nothing consumes it automatically — promoting it would
        // break the "never rotates" property that makes it a safety net — but
        // presenting an empty config as a fresh install while it sits next to
        // the config is how that copy gets ignored until it is gone too.
        this.snapshotNotice = null;
        if (this.loadError || this.config.apis.length === 0) {
            const surviving = this.listSnapshots({ verify: true });
            if (surviving.length > 0) this.snapshotNotice = surviving[0];
        }
        if (this.keyStale) {
            // A stale key generation must be persisted on its own account, NOT
            // through the `migrated` channel: `migrated` only fires when a
            // model/env field changed shape, so an already-normalized config
            // would never be re-encrypted and would keep depending on a
            // hostname-derived key that is one network change away from being
            // unreadable. The heal saves, so no extra migration save is needed.
            this._healKeyGeneration(pendingReencrypt || []);
        } else if (migrated) {
            // Safe in every branch: loadError implies this.saveConfig() refuses to run,
            // and after .bak recovery the promoted file is valid again. A refused
            // migration save just re-migrates on the next load.
            this.saveConfig();
        }
    }

    /** Current on-disk ciphertext, or null when the file does not exist. */
    _readDiskState() {
        try {
            return fs.existsSync(this.configFile) ? fs.readFileSync(this.configFile, 'utf8') : null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Load configuration from encrypted file.
     *
     * Corruption handling (issue #11 + Codex review): if the main file is
     * missing (crash window between the save's rotation renames, when only
     * .bak exists) or fails to decrypt/parse/validate, promote the newest
     * usable backup (.bak, then .bak2) over it. Only when main AND all
     * backups are absent is this treated as first-time usage; unreadable
     * leftovers surface as loadError so the first-run wizard can never
     * overwrite them.
     */
    loadConfig() {
        let mainError = null;
        if (fs.existsSync(this.configFile)) {
            const main = this._tryLoadFile(this.configFile);
            if (main.config) {
                return this._loadResult(main, false);
            }
            mainError = main.error;
            screen.debug(`[!] API config unreadable (${main.error})`);
        }

        const bakPath = this.configFile + '.bak';
        const bak2Path = this.configFile + '.bak2';
        const hasAnyBackup = fs.existsSync(bakPath) || fs.existsSync(bak2Path);

        // Backup promotion rests on "main did not decrypt" meaning "main is
        // damaged". That stopped being true once a key could be globally
        // unavailable: main and .bak can be perfectly good ciphertext on the
        // current key while an OLDER generation still on a reachable hostname
        // key opens fine — and promoting that one destroys every change made
        // since, without ever setting loadError, while the UI reassures the
        // user that everything was recovered from backup. When the reason
        // nothing decrypts is global, no backup can do better than main.
        if (this.keyMaterialError) {
            screen.debug('[!] Not promoting any backup: the failure is key material, not this file');
            return {
                config: this._emptyConfig(),
                migrated: false,
                loadError: {
                    message: mainError || this.keyMaterialError,
                    file: this.configFile,
                    hasBackup: hasAnyBackup,
                    kind: 'key-material',
                },
                recoveredFromBackup: false,
                keyStale: false,
                keyRecoveryReport: null,
                pendingReencrypt: [],
            };
        }

        for (const candidate of [bakPath, bak2Path]) {
            if (!fs.existsSync(candidate)) continue;
            const backup = this._tryLoadFile(candidate);
            if (backup.config) {
                // Repairing main overwrites it, and those bytes may be the only
                // copy some future key can still open — so move them aside
                // first, and if they cannot be preserved, load from the backup
                // WITHOUT repairing rather than destroy them.
                const preserved = this._preserveSupersededGeneration();
                let promoted = false;
                if (!preserved.failed) {
                    try {
                        fs.renameSync(candidate, this.configFile);
                        promoted = true;
                    } catch (error) {
                        screen.debug(`[!] Could not promote backup over corrupt file: ${error.message}`);
                        if (preserved.path) {
                            // Undo the preservation so main is not left missing.
                            const back = moveNoClobber(preserved.path, this.configFile);
                            if (back.moved) preserved.path = null;
                        }
                    }
                } else {
                    screen.debug(`[!] Not promoting backup: could not preserve the current file (${preserved.reason})`);
                }
                this.supersededGeneration = preserved.path || null;
                // A failed promotion leaves main unrepaired. Migrating the key
                // generation from there would rotate away the one generation
                // that is still readable, so the heal must not run.
                return this._loadResult(backup, true, promoted ? null : 'promote-failed');
            }
            screen.debug(`[!] API config backup ${candidate} unreadable (${backup.error})`);
        }

        const hasBackup = fs.existsSync(bakPath) || fs.existsSync(bak2Path);
        if (!fs.existsSync(this.configFile) && !hasBackup) {
            // Nothing on disk at all — genuinely first-time usage.
            return {
                config: this._emptyConfig(), migrated: false, loadError: null,
                recoveredFromBackup: false, keyStale: false, keyRecoveryReport: null, pendingReencrypt: [],
            };
        }

        return {
            config: this._emptyConfig(),
            migrated: false,
            loadError: {
                message: mainError || 'config file missing but no usable backup',
                file: this.configFile,
                hasBackup,
            },
            recoveredFromBackup: false,
            keyStale: false,
            keyRecoveryReport: null,
            pendingReencrypt: [],
        };
    }

    /**
     * Finish a successful load: recover any inner field still encrypted under
     * an older key generation, then run the ordinary field migrations.
     */
    _loadResult(loaded, recoveredFromBackup, healBlockedReason) {
        // Never let a recovery problem take down startup: os.userInfo() throws
        // in containers without a passwd entry, and that is the one crypto
        // exception that can escape into the constructor.
        let inner;
        try {
            inner = this._recoverInnerFields(loaded.config);
        } catch (error) {
            screen.debug(`[!] Inner field recovery failed (${error.message}) — skipping the heal this run`);
            inner = { pending: [], unrecoverable: [], notEncrypted: 0, scanFailed: error.message };
        }
        const migrated = this._finalizeLoadedConfig(loaded.config);
        // The bytes that ACTUALLY decrypted — which is .bak when main was
        // corrupt. The pre-heal snapshot must preserve these, not main's.
        this._healSourceBytes = typeof loaded.bytes === 'string' ? loaded.bytes : null;
        this._healBlockedReason = healBlockedReason || (inner.scanFailed ? 'recovery-scan-failed' : null);

        return {
            config: loaded.config,
            migrated,
            loadError: null,
            recoveredFromBackup,
            keyStale: Boolean(loaded.keyStale) || inner.pending.length > 0,
            keyRecoveryReport: {
                outerKeyStale: Boolean(loaded.keyStale),
                recoveredFields: inner.pending.length,
                unrecoverable: inner.unrecoverable,
                notEncrypted: inner.notEncrypted,
            },
            pendingReencrypt: inner.pending,
        };
    }

    /**
     * Find encrypted fields inside the config that the CURRENT key cannot open.
     *
     * Each field is scanned independently: the config blob and every authToken
     * were encrypted at different times, so one config can legitimately span
     * several key generations (blob rewritten on every save, tokens written
     * once when the API was added and never rewritten). Sharing one
     * "recovered key" verdict across fields would silently miss tokens.
     *
     * This is also what makes the auto-recovery promise real without any
     * persisted flag: the fact that a field is stale is re-derived from the
     * data on every load. When nothing is stale the scan costs a handful of
     * AES operations; only an actual miss pays for a candidate sweep.
     *
     * @returns {{pending: Array<{api: object, field: string, plaintext: string}>,
     *            unrecoverable: Array<{apiName: string, apiId: string, field: string}>}}
     */
    _recoverInnerFields(config) {
        const pending = [];
        const unrecoverable = [];
        let notEncrypted = 0;
        // Negative cache: a field whose key is simply gone would otherwise make
        // every single startup derive the whole candidate set — up to ~1.4s of
        // PBKDF2 blocking the first render, forever, with no way for the user
        // to clear it. Keyed on (ciphertext, candidate set) so it expires by
        // itself: the ciphertext changing means different data, and the
        // candidate set changing means the key may now be reachable.
        const misses = this._readScanMisses();
        const fresh = {};
        let fingerprint = null;
        for (const api of (config && config.apis) || []) {
            const payload = api.authToken;
            if (typeof payload !== 'string' || payload.length === 0) continue;
            if (!ENCRYPTED_PAYLOAD_RE.test(payload)) {
                // Never encrypted at all (plaintext tokens exist in test and
                // legacy configs — lib/launcher.js has the same shape guard).
                // Not a key generation problem, and re-encrypting a value we
                // cannot verify is not this code's call to make.
                notEncrypted++;
                continue;
            }
            if (decryptWithCurrentKey(payload).success) continue;

            if (fingerprint === null) fingerprint = candidateFingerprint();
            const digest = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
            const known = Array.isArray(misses[digest]) ? misses[digest] : [];
            if (known.includes(fingerprint)) {
                fresh[digest] = known;
                unrecoverable.push({
                    apiName: api.name || 'Unknown',
                    apiId: api.id || null,
                    field: 'authToken',
                    fromMemo: true,
                });
                continue;
            }

            const recovered = decryptWithRecovery(payload, {
                trust: (value) => this._isTrustworthyRecovery(payload, value),
            });
            if (recovered.success) {
                pending.push({ api, field: 'authToken', plaintext: recovered.value });
            } else {
                // A bounded SET, not one entry: a laptop that alternates between
                // two networks has two candidate sets, and remembering only the
                // latest means never caching either.
                fresh[digest] = [fingerprint, ...known.filter(f => f !== fingerprint)]
                    .slice(0, MAX_MEMO_FINGERPRINTS);
                unrecoverable.push({
                    apiName: api.name || 'Unknown',
                    apiId: api.id || null,
                    field: 'authToken',
                });
            }
        }
        // Rebuilt from scratch each load, so entries for fields that were
        // recovered, replaced or removed disappear instead of accumulating.
        if (JSON.stringify(fresh) !== JSON.stringify(misses)) this._writeScanMisses(fresh);
        // Left over from an earlier build that kept this inside the blob.
        if (config && config._keyScanMisses) delete config._keyScanMisses;
        return { pending, unrecoverable, notEncrypted };
    }

    /**
     * Whether a recovered plaintext may be trusted enough to re-encrypt over.
     *
     * 3-segment GCM needs no check: authenticated encryption already proves the
     * key was right, so a wrong key cannot produce a "successful" result.
     *
     * 2-segment CBC has no such proof. A wrong key passes the PKCS#7 padding
     * check for roughly 1 in 255 payloads and returns garbage with
     * success:true — and unlike the outer config blob, an authToken has no
     * structure (no JSON parse, no `apis` array) to catch it. Re-encrypting
     * that garbage would destroy the only copy of the real token, so a CBC
     * result must look like a credential before it is trusted: lossy UTF-8
     * decoding of random bytes is riddled with U+FFFD replacement characters
     * and control bytes, which real tokens never contain.
     *
     * Deliberately conservative: a rejected result is reported as
     * unrecoverable and its ciphertext is preserved byte-for-byte, so nothing
     * is lost that was not already unreadable.
     */
    _isTrustworthyRecovery(payload, plaintext) {
        if (payload.split(':').length === 3) return true;
        if (typeof plaintext !== 'string') return false;
        if (plaintext.includes('�')) return false;
        // Control characters (C0/C1) never appear in an API token but are
        // everywhere in decrypted garbage.
        if (/[\u0000-\u001F\u007F-\u009F]/.test(plaintext)) return false;
        return validateAuthToken(plaintext).valid;
    }

    /**
     * Re-encrypt everything readable under the current key and persist it.
     *
     * NOT all-or-nothing across fields, deliberately: a field whose key is
     * gone was already unreadable before the heal — refusing to heal cannot
     * bring that key back, it only leaves the recoverable fields depending on
     * a hostname-derived key that will drift out of reach too, turning one
     * lost token into all of them. Unrecoverable fields are therefore left
     * byte-identical (so they still recover by themselves if their key ever
     * becomes reachable again) and reported to the caller.
     *
     * All-or-nothing IS enforced where it is meaningful:
     *   - the pre-heal ciphertext is snapshotted to a non-rotating file first;
     *   - every re-encrypted field must decrypt back to the exact plaintext
     *     before anything is assigned;
     *   - the write itself is the existing atomic, verified save.
     *
     * @returns {boolean} true when the healed config was persisted
     */
    _healKeyGeneration(pending) {
        if (this.keyMaterialError) {
            this.keyHealOutcome = 'skipped:key-material';
            screen.debug('[!] Skipping key-generation heal: key material is unusable');
            return false;
        }
        if (this.loadError) {
            this.keyHealOutcome = 'skipped:load-error';
            return false;
        }
        if (this.saveOutcome === 'indeterminate') {
            // NOT a CAS conflict, even though _saveConfigInner raises
            // saveConflict alongside it. The latch exists to stop every further
            // blind write while the on-disk state is unknown; the heal must not
            // clear it and must not write.
            this.keyHealOutcome = 'skipped:indeterminate';
            screen.debug('[!] Skipping key-generation heal: previous save outcome is indeterminate');
            return false;
        }
        // The snapshot comes BEFORE every remaining check, because it needs
        // bytes, not a trustworthy identity — and because the checks below only
        // stop the HEAL. An ordinary save re-encrypts the whole blob with the
        // current key, i.e. performs exactly the migration these branches
        // refuse, so leaving without a snapshot means the invariant
        // "no key-generation migration without a pre-state copy" holds on one
        // path and not the other. That gap cost every token in the report.
        if (!this._snapshotPreHealCiphertext()) {
            this._keyMigrationBlocked = true;
            this.keyHealOutcome = 'blocked:no-snapshot';
            return false;
        }

        if (this._healBlockedReason) {
            this.keyHealOutcome = `skipped:${this._healBlockedReason}`;
            screen.debug(`[!] Skipping key-generation heal: ${this._healBlockedReason}`);
            return false;
        }
        // A migration is only worth anything if the key it migrates TO is
        // stable. When the identity could not be pinned it is either the
        // current hostname — the very thing that drifts, so re-encrypting under
        // it would quietly reinstall this bug — or a probe result that was
        // never recorded and is not in the candidate set, so the new ciphertext
        // would be readable only while probing keeps working. Read on, write
        // nothing.
        let identity = null;
        try {
            identity = machineKey.getStableIdentity();
        } catch (error) {
            this.keyHealOutcome = 'skipped:key-material';
            screen.debug(`[!] Skipping key-generation heal: ${error.message}`);
            return false;
        }
        if (!identity.pinned) {
            this.keyHealOutcome = 'skipped:identity-unpinned';
            screen.debug('[!] Skipping key-generation heal: the machine identity could not be pinned, ' +
                'so we cannot stand behind the key it would migrate to');
            return false;
        }

        // Compute every replacement BEFORE mutating anything, and verify each
        // one round-trips. A field we cannot read back must never be written.
        const replacements = [];
        for (const item of pending) {
            const enc = encrypt(item.plaintext);
            if (!enc.success) {
                this.keyHealOutcome = 'abandoned:reencrypt-failed';
                screen.debug(`[!] Key heal aborted: re-encryption failed (${enc.error})`);
                return false;
            }
            if (!this._verifyRoundTrip(enc.value, item.plaintext)) {
                this.keyHealOutcome = 'abandoned:verify-failed';
                screen.debug('[!] Key heal aborted: re-encrypted field failed its read-back check');
                return false;
            }
            replacements.push({ api: item.api, field: item.field, value: enc.value });
        }
        for (const replacement of replacements) {
            replacement.api[replacement.field] = replacement.value;
        }

        const healed = JSON.parse(JSON.stringify(this.config));
        if (this.saveConfig()) {
            this.keyHealOutcome = 'saved';
            return true;
        }
        if (this.saveOutcome === 'indeterminate') {
            // The save itself ended in the unknown state — leave the latch
            // alone and do not try again.
            this.keyHealOutcome = 'abandoned:indeterminate';
            return false;
        }
        if (!this.saveConflict) {
            this.keyHealOutcome = 'abandoned:save-failed';
            return false;
        }
        return this._reconcileHealConflict(healed);
    }

    /**
     * Read back a freshly encrypted field and confirm it yields exactly the
     * plaintext it was made from.
     *
     * With correct crypto this cannot fail — string -> utf8 -> string is
     * idempotent, so it is defence in depth against a future encrypt/decrypt
     * change rather than a condition reachable today. It is a named method so
     * the CONSEQUENCE of it failing (abandon the heal, write nothing) can be
     * tested without faking the cipher itself.
     */
    _verifyRoundTrip(ciphertext, plaintext) {
        const verify = decrypt(ciphertext);
        return verify.success && verify.value === plaintext;
    }

    /**
     * Copy the pre-heal ciphertext aside, once, into a file that never takes
     * part in backup rotation. Without it the only keys able to open the old
     * ciphertext could age out of .bak/.bak2 after two ordinary saves.
     * @returns {boolean} true when a usable snapshot exists (or none is needed)
     */
    _snapshotPreHealCiphertext() {
        // The bytes that actually decrypted, captured by _loadResult.
        //
        // In practice this is always equal to this._diskState — measured, not
        // assumed: promotion either succeeds, in which case main becomes the
        // bytes we loaded, or fails, in which case the heal is skipped with
        // 'promote-failed' long before this runs; and the reconcile retry sets
        // both from the same read. The distinction is kept because it encodes
        // the right INTENT — snapshot what you decrypted, not whatever happens
        // to be at the main path — and because a future change to the promotion
        // order would make the difference real. It carries no test, on purpose:
        // no fixture can make the two diverge today, and a test that cannot
        // fail would be claiming a guarantee it does not check.
        const source = this._healSourceBytes;
        if (typeof source !== 'string' || source.length === 0) {
            // We only heal after a successful load, so there is always source
            // ciphertext. Anything else means we do not know what we would be
            // preserving: refuse rather than migrate unprotected.
            screen.debug('[!] Key heal aborted: no source ciphertext to snapshot');
            return false;
        }

        // One slot per pre-state, named by its content hash. A single fixed
        // slot cannot carry the invariant "every migration has a copy of what
        // it replaced": the second migration would find the first one's file,
        // see a non-empty snapshot, and proceed unprotected — which matters
        // because two ordinary saves later that ciphertext exists nowhere else.
        const slot = this._snapshotPathFor(source);

        // An older build wrote the ciphertext raw to the unsuffixed path. If it
        // already holds THIS pre-state the invariant is satisfied; either way it
        // is never rewritten or judged invalid.
        const legacyPath = this.configFile + SNAPSHOT_SUFFIX;
        if (fs.existsSync(legacyPath) && this._readSnapshot(legacyPath).ciphertext === source) {
            chmodOwnerOnly([legacyPath]);
            return true;
        }

        if (!fs.existsSync(slot)) {
            let identity = { source: 'unknown', id: '' };
            try {
                identity = machineKey.getStableIdentity();
            } catch (_) { /* the caller already refuses in this state */ }
            const document = JSON.stringify({
                v: SNAPSHOT_VERSION,
                source: identity.source,
                // A HINT, never the id: this file sits next to the config and
                // travels with it, and the id is the key input for the
                // ciphertext that config now holds. Writing it plainly would
                // undo the one guarantee the encryption provides — that a
                // copied config is useless elsewhere. The hint still lets a
                // human re-probe this machine and confirm they have the right
                // identity before rebuilding the key material file.
                idHint: crypto.createHash('sha256').update(identity.id).digest('hex').slice(0, 12),
                savedAt: new Date().toISOString(),
                ciphertext: source,
            }, null, 2);
            const result = createExclusive(slot, document);
            if (!result.created && !fs.existsSync(slot)) {
                screen.debug(`[!] Key heal aborted: could not snapshot the pre-heal config (${result.reason})`);
                return false;
            }
        }

        // Verify what is actually in the slot, rather than trusting that a
        // non-empty file is the right file.
        const stored = this._readSnapshot(slot);
        if (stored.ciphertext !== source) {
            screen.debug('[!] Key heal aborted: the snapshot does not hold this migration\'s ciphertext');
            return false;
        }
        chmodOwnerOnly([slot]);
        return true;
    }

    /**
     * Negative scan cache. Deliberately NOT inside the config blob: writing it
     * there means a full re-encryption plus a .bak/.bak2 rotation on a launch
     * where the user did nothing, which quietly spends both backup generations,
     * and it would ride along into exports and into CAS conflicts between
     * instances. It is bookkeeping, so it lives beside the config like
     * .probe-attempts does, and every failure to read or write it is harmless.
     */
    _scanMissesPath() {
        return this.configFile + '.key-scan-misses';
    }

    _readScanMisses() {
        try {
            const parsed = JSON.parse(fs.readFileSync(this._scanMissesPath(), 'utf8'));
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    _writeScanMisses(misses) {
        try {
            if (Object.keys(misses).length === 0) {
                fs.rmSync(this._scanMissesPath(), { force: true });
                return;
            }
            fs.writeFileSync(this._scanMissesPath(), JSON.stringify(misses), { mode: 0o600 });
            chmodOwnerOnly([this._scanMissesPath()]);
        } catch (_) { /* best effort: the cost of losing it is a slower start */ }
    }

    /** Content-addressed snapshot path for one pre-state. */
    _snapshotPathFor(ciphertext) {
        const digest = crypto.createHash('sha256').update(ciphertext).digest('hex').slice(0, 12);
        return `${this.configFile}${SNAPSHOT_SUFFIX}.${digest}`;
    }

    /**
     * Read a snapshot in either shape: the header document written now, or the
     * raw ciphertext an older build wrote to the unsuffixed path.
     * @returns {{ciphertext: string|null, header: object|null}}
     */
    _readSnapshot(filePath) {
        let raw;
        try {
            raw = fs.readFileSync(filePath, 'utf8');
        } catch (_) {
            return { ciphertext: null, header: null };
        }
        if (raw.startsWith('{')) {
            try {
                const doc = JSON.parse(raw);
                if (typeof doc.ciphertext === 'string') return { ciphertext: doc.ciphertext, header: doc };
            } catch (_) { /* fall through: treat as opaque */ }
            return { ciphertext: null, header: null };
        }
        return { ciphertext: raw.length > 0 ? raw : null, header: null };
    }

    /**
     * Pre-migration snapshots on disk, readable ones first.
     *
     * Nothing consumes these automatically — promoting one would break the
     * "never rotates, never changes" property that makes it a safety net. It
     * exists so the UI can say "your data is still here" instead of presenting
     * an empty config as a fresh install.
     */
    listSnapshots(options) {
        // Verification costs a full candidate sweep per snapshot — a snapshot is
        // by definition on an older key — so it is opt-in. The permission pass
        // on every startup only needs the paths.
        const verify = Boolean(options && options.verify);
        const directory = path.dirname(this.configFile);
        const base = path.basename(this.configFile) + SNAPSHOT_SUFFIX;
        let names;
        try {
            names = fs.readdirSync(directory);
        } catch (_) {
            return [];
        }
        return names
            .filter(name => name === base || name.startsWith(base + '.'))
            .map(name => {
                const filePath = path.join(directory, name);
                const { ciphertext, header } = this._readSnapshot(filePath);
                let readable = false;
                let apiNames = [];
                if (verify && ciphertext) {
                    const attempt = decryptWithRecovery(ciphertext);
                    if (attempt.success) {
                        try {
                            const parsed = JSON.parse(attempt.value);
                            if (parsed && Array.isArray(parsed.apis)) {
                                readable = true;
                                apiNames = parsed.apis.map(a => a.name || 'Unknown');
                            }
                        } catch (_) { /* not a config document */ }
                    }
                }
                return {
                    path: filePath,
                    readable,
                    apiNames,
                    source: header ? header.source : null,
                    idHint: header ? header.idHint : null,
                    savedAt: header ? header.savedAt : null,
                };
            })
            .sort((a, b) => Number(b.readable) - Number(a.readable));
    }

    /**
     * The heal write is not user-initiated and happens on EVERY startup while
     * the config is still on an old key, so two instances starting together
     * collide by construction. Latching saveConflict there would leave the
     * second instance unable to persist anything for its whole lifetime.
     *
     * Three outcomes, in order:
     *   adopted   — the disk is already on the current key generation, so
     *               another instance finished the migration; take its state.
     *   retried   — the disk is still OUR data in an older generation (both
     *               instances started stale); rebase onto it and migrate once.
     *   abandoned — the disk cannot be decrypted at all, so it belongs to a
     *               key generation we do not have (an older release still
     *               installed, an unpinned-hostname instance, ...). Writing
     *               would silently discard someone else's data, so leave it
     *               and let the next startup deal with it.
     *
     * The guard for user-initiated saves is untouched in every branch.
     *
     * The healed config computed by the caller is deliberately NOT used: the
     * retry rebases onto whatever is actually on disk and recomputes from
     * there, because the other writer's content is newer than ours. The
     * parameter is kept only so the call site reads as "here is what I was
     * trying to write".
     */
    _reconcileHealConflict(healedIgnored) { // eslint-disable-line no-unused-vars
        const diskNow = this._readDiskState();
        if (diskNow === null) {
            this.keyHealOutcome = 'abandoned:disk-unreadable';
            return false;
        }

        const fresh = this._tryLoadFile(this.configFile, { currentKeyOnly: true });
        if (fresh.config) {
            // Another instance already healed it — that state is at least
            // as new as ours, so adopt it rather than fighting over it.
            this.config = fresh.config;
            this._finalizeLoadedConfig(this.config);
            this._diskState = diskNow;
            this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
            this.saveConflict = false;
            this.saveOutcome = 'idle';
            this.keyHealOutcome = 'adopted';
            screen.debug('[!] Key heal: another instance already re-encrypted the config — adopted it');
            return true;
        }

        // Only retry when the concurrent write is recoverable, i.e. it really
        // is our own data one generation behind. Retrying on anything we cannot
        // read would overwrite a writer we do not understand.
        const ours = this._tryLoadFile(this.configFile);
        if (!ours.config) {
            screen.debug('[!] Key heal abandoned: the concurrent write is not readable by any of our keys');
            this.keyHealOutcome = 'abandoned:foreign-write';
            return false;
        }

        // Rebase onto what is actually on disk — baseline, memory and
        // last-persisted all together, so a failed retry cannot leave a state
        // where a later user save passes CAS and clobbers the other writer.
        this.config = ours.config;
        this._finalizeLoadedConfig(this.config);
        this._diskState = diskNow;
        this._healSourceBytes = diskNow;
        this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
        this.saveConflict = false;
        this.saveOutcome = 'idle';

        const inner = this._recoverInnerFields(this.config);
        const replacements = [];
        for (const item of inner.pending) {
            const enc = encrypt(item.plaintext);
            if (!enc.success) {
                this.keyHealOutcome = 'abandoned:reencrypt-failed';
                return false;
            }
            if (!this._verifyRoundTrip(enc.value, item.plaintext)) {
                this.keyHealOutcome = 'abandoned:verify-failed';
                return false;
            }
            replacements.push({ api: item.api, field: item.field, value: enc.value });
        }
        for (const replacement of replacements) {
            replacement.api[replacement.field] = replacement.value;
        }

        if (this.saveConfig()) {
            this.keyHealOutcome = 'retried';
            return true;
        }
        this.keyHealOutcome = 'abandoned:retry-failed';
        return false;
    }

    /**
     * Move the current (unreadable) main file into a preserved slot before a
     * backup is promoted over it. The slot never takes part in rotation, and
     * listQuarantined() surfaces it, so a generation that only a future key can
     * open is still reachable instead of being overwritten.
     * @returns {{path: string|null, failed?: boolean, reason?: string}}
     */
    _preserveSupersededGeneration() {
        if (!fs.existsSync(this.configFile)) return { path: null };
        try {
            // Only a regular file can be a ciphertext generation worth keeping.
            // Anything else (a directory left where the config should be, say)
            // has nothing to preserve, and moving it would both pollute the
            // quarantine listing and turn a blocked promotion into a silent
            // success.
            if (!fs.statSync(this.configFile).isFile()) return { path: null };
        } catch (error) {
            return { path: null, failed: true, reason: error.message };
        }
        const index = this._nextQuarantineIndex();
        if (index === null) return { path: null, failed: true, reason: 'too-many-quarantines' };
        const target = `${this.configFile}.unreadable.${index}`;
        const moved = moveNoClobber(this.configFile, target);
        if (!moved.moved) return { path: null, failed: true, reason: moved.reason };
        chmodOwnerOnly([target]);
        return { path: target };
    }

    /** The three generation suffixes, newest first. */
    static get GENERATION_SUFFIXES() {
        return ['', '.bak', '.bak2'];
    }

    /** Lowest index at which no quarantined generation exists yet. */
    _nextQuarantineIndex() {
        for (let index = 1; index < 1000; index++) {
            const taken = ApiManager.GENERATION_SUFFIXES.some(
                suffix => fs.existsSync(`${this.configFile}${suffix}.unreadable.${index}`));
            if (!taken) return index;
        }
        return null;
    }

    /**
     * Move every unreadable generation aside so the launcher becomes usable
     * again, WITHOUT destroying anything.
     *
     * This is the way out of the dead end: an unreadable config blocks every
     * save and blocks API management, and the state is often transient (a
     * hostname that drifted outside the candidate window comes back when the
     * machine returns to its usual network). So the files are renamed, never
     * deleted, and restoreQuarantined() can bring them back.
     *
     * All-or-nothing: a partial move would leave a half-quarantined state that
     * clearLoadError() would then make writable, and three ordinary saves would
     * rotate the surviving ciphertext into oblivion.
     *
     * @returns {{ok: boolean, reason?: string, index?: number, moved?: string[], error?: string}}
     */
    quarantineUnreadableConfig() {
        if (this.keyMaterialError) {
            // Without a key we cannot tell "unreadable" from "readable", so
            // moving files aside could quarantine a perfectly good config.
            return { ok: false, reason: 'key-material', error: this.keyMaterialError };
        }
        if (!this.loadError) {
            return { ok: false, reason: 'nothing-to-quarantine' };
        }

        const lockPath = this.configFile + '.lock';
        if (!this._acquireWriteLock(lockPath)) {
            // Another instance may be mid-write; interleaved renames could make
            // one generation vanish entirely.
            return { ok: false, reason: 'locked' };
        }
        try {
            const index = this._nextQuarantineIndex();
            if (index === null) return { ok: false, reason: 'too-many-quarantines' };

            const planned = ApiManager.GENERATION_SUFFIXES
                .map(suffix => ({
                    from: this.configFile + suffix,
                    to: `${this.configFile}${suffix}.unreadable.${index}`,
                }))
                .filter(move => fs.existsSync(move.from));
            if (planned.length === 0) return { ok: false, reason: 'nothing-to-quarantine' };

            const done = [];
            for (const move of planned) {
                const result = moveNoClobber(move.from, move.to);
                if (!result.moved) {
                    for (const undo of done.reverse()) {
                        const back = moveNoClobber(undo.to, undo.from);
                        if (!back.moved) {
                            screen.debug(`[!] Quarantine rollback failed for ${undo.to}: ${back.reason}`);
                        }
                    }
                    return { ok: false, reason: 'partial', error: result.reason };
                }
                done.push(move);
            }

            this._fsyncDir(path.dirname(this.configFile));
            this._enforceOwnerOnly(planned.map(m => m.to));

            // Only now — with every generation confirmed out of the way — may
            // the write block be lifted.
            this.clearLoadError();
            this.config = this._emptyConfig();
            this._diskState = null;
            this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
            this._healSourceBytes = null;
            this._healBlockedReason = null;
            this._keyMigrationBlocked = false;
            this.keyRecoveryReport = null;
            this.keyStale = false;
            this.saveConflict = false;
            this.saveOutcome = 'idle';
            return { ok: true, index, moved: planned.map(m => m.to) };
        } finally {
            this._releaseWriteLock(lockPath);
        }
    }

    /**
     * Quarantined generations on disk, newest first, each reporting whether it
     * can be opened right now. Cheap to call: the existence check costs nothing
     * and the decryption only runs for sets that are actually there.
     * @returns {Array<{index: number, readable: boolean, apiNames: string[], files: string[]}>}
     */
    listQuarantined() {
        const found = [];
        let directory;
        try {
            directory = fs.readdirSync(path.dirname(this.configFile));
        } catch (_) {
            return found;
        }
        const base = path.basename(this.configFile);
        const indices = new Set();
        for (const name of directory) {
            const match = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.bak2?)?\\.unreadable\\.(\\d+)$`).exec(name);
            if (match) indices.add(parseInt(match[2], 10));
        }
        for (const index of [...indices].sort((a, b) => b - a)) {
            const files = ApiManager.GENERATION_SUFFIXES
                .map(suffix => `${this.configFile}${suffix}.unreadable.${index}`)
                .filter(p => fs.existsSync(p));
            let readable = false;
            let apiNames = [];
            for (const file of files) {
                const attempt = this._tryLoadFile(file);
                if (attempt.config) {
                    readable = true;
                    apiNames = (attempt.config.apis || []).map(a => a.name || 'Unknown');
                    break;
                }
            }
            found.push({ index, readable, apiNames, files });
        }
        return found;
    }

    /**
     * Bring a quarantined generation back into service.
     *
     * The config that is live right now is rotated to .bak rather than
     * overwritten, and the quarantine record itself is left on disk — restoring
     * must not be another way to lose data.
     *
     * @param {number} index
     * @returns {{ok: boolean, reason?: string, error?: string, restoredFrom?: string}}
     */
    restoreQuarantined(index) {
        if (this.keyMaterialError) return { ok: false, reason: 'key-material', error: this.keyMaterialError };

        const candidate = this.listQuarantined().find(entry => entry.index === index);
        if (!candidate) return { ok: false, reason: 'not-found' };
        const source = candidate.files.find(file => this._tryLoadFile(file).config);
        if (!source) return { ok: false, reason: 'unreadable' };

        const lockPath = this.configFile + '.lock';
        if (!this._acquireWriteLock(lockPath)) return { ok: false, reason: 'locked' };
        try {
            const bakPath = this.configFile + '.bak';
            const bak2Path = this.configFile + '.bak2';
            // Rotate the live generations down, exactly as a save would, so the
            // config being displaced survives as a backup.
            try {
                if (fs.existsSync(bakPath)) {
                    try { fs.unlinkSync(bak2Path); } catch (_) { /* may not exist */ }
                    fs.renameSync(bakPath, bak2Path);
                }
                if (fs.existsSync(this.configFile)) {
                    fs.renameSync(this.configFile, bakPath);
                }
            } catch (error) {
                return { ok: false, reason: 'rotate-failed', error: error.message };
            }

            // Copy, not move: the quarantine record stays put, so a restore that
            // turns out to be the wrong choice can be undone.
            try {
                fs.copyFileSync(source, this.configFile);
            } catch (error) {
                try { if (fs.existsSync(bakPath)) fs.renameSync(bakPath, this.configFile); } catch (_) { /* best effort */ }
                return { ok: false, reason: 'copy-failed', error: error.message };
            }
            this._enforceOwnerOnly([this.configFile, bakPath, bak2Path]);
            this._fsyncDir(path.dirname(this.configFile));
        } finally {
            this._releaseWriteLock(lockPath);
        }

        // Re-establish every piece of state from the file we just installed —
        // including the key-generation heal, which is usually exactly what this
        // config needs.
        this._initializeFromDisk();
        return { ok: true, restoredFrom: source };
    }

    /**
     * Read + decrypt + parse + structurally validate one config file.
     *
     * The load path is the ONLY place allowed to sweep historical keys: it runs
     * once per process, unlike the per-keystroke redraw and launch paths, which
     * use plain decrypt(). `currentKeyOnly` asks the narrower question "is this
     * file already on the current key generation?" and is used when reconciling
     * a concurrent heal.
     *
     * @returns {{config?: object, keyStale?: boolean, bytes?: string, error?: string}}
     */
    _tryLoadFile(filePath, options) {
        const currentKeyOnly = Boolean(options && options.currentKeyOnly);
        try {
            const encryptedData = fs.readFileSync(filePath, 'utf8');
            const decrypted = currentKeyOnly
                ? decryptWithCurrentKey(encryptedData)
                : decryptWithRecovery(encryptedData, {
                    // For the config blob the structural check IS the gate, and
                    // a far stronger one than any token heuristic: random bytes
                    // do not parse as JSON with an apis array.
                    trust: (value) => {
                        try {
                            const parsed = JSON.parse(value);
                            return Boolean(parsed) && typeof parsed === 'object' && Array.isArray(parsed.apis);
                        } catch (_) {
                            return false;
                        }
                    },
                });
            if (!decrypted.success) {
                return { error: `decryption failed (${decrypted.error})` };
            }
            // A payload that only opened with a recovered key still lives on an
            // older key generation and must be rewritten.
            const keyStale = !currentKeyOnly && !decryptWithCurrentKey(encryptedData).success;
            let config;
            try {
                config = JSON.parse(decrypted.value);
            } catch (e) {
                return { error: `invalid JSON (${e.message})` };
            }
            if (!config || typeof config !== 'object' || !Array.isArray(config.apis)) {
                return { error: 'not a valid config document (apis array missing)' };
            }
            return { config, keyStale, bytes: encryptedData };
        } catch (e) {
            return { error: e.message };
        }
    }

    /** Fill in defaults and run per-API migrations on a loaded config. */
    _finalizeLoadedConfig(config) {
        if (!config.hasOwnProperty('exportPassword')) config.exportPassword = null;
        if (!config.hasOwnProperty('passwordSkipped')) config.passwordSkipped = false;

        let migrated = false;
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        for (const api of config.apis || []) {
            migrated = this._migrateApiEntry(api, PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS) || migrated;
        }
        return migrated;
    }

    _emptyConfig() {
        return {
            apis: [],
            activeIndex: -1,
            version: '2.0.0',
            createdAt: new Date().toISOString(),
            exportPassword: null,
            passwordSkipped: false,
        };
    }

    _migrateApiEntry(api, MODEL_KEYS, RUNTIME_KEYS) {
        const before = JSON.stringify({
            modelEnvVars: api.modelEnvVars,
            _autoModelEnvVars: api._autoModelEnvVars,
            runtimeEnvVars: api.runtimeEnvVars,
            _runtimeEnvSources: api._runtimeEnvSources,
            customEnvVars: api.customEnvVars,
            smallFastModel: api.smallFastModel,
            _autoFilledModel: api._autoFilledModel,
        });
        this._normalizeApiFields(api);
        const after = JSON.stringify({
            modelEnvVars: api.modelEnvVars,
            _autoModelEnvVars: api._autoModelEnvVars,
            runtimeEnvVars: api.runtimeEnvVars,
            _runtimeEnvSources: api._runtimeEnvSources,
            customEnvVars: api.customEnvVars,
            smallFastModel: api.smallFastModel,
            _autoFilledModel: api._autoFilledModel,
        });
        return before !== after;
    }

    _normalizeApiFields(api) {
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const { getProvider } = require('./presets/providers');

        const effectiveModel = api._autoFilledModel || api.model;
        const hadAutoModelEnvVars = !!api._autoModelEnvVars;

        const providerConfig = getProvider(api.provider);
        let template;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            template = providerConfig.modelEnvTemplate.getValues(effectiveModel);
        } else {
            template = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) template[k] = effectiveModel;
            template.smallFastModel = effectiveModel;
        }

        let smallFastWasFixed = false;

        // _autoModelEnvVars — full rebuild via template
        if (!api._autoModelEnvVars) {
            api._autoModelEnvVars = { ...template };
        } else {
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (!(k in api._autoModelEnvVars) || typeof api._autoModelEnvVars[k] !== 'string') {
                    api._autoModelEnvVars[k] = template[k] || '';
                }
            }
            for (const k of Object.keys(api._autoModelEnvVars)) {
                if (!PREDEFINED_MODEL_ENV_KEYS.includes(k) && k !== 'smallFastModel') {
                    delete api._autoModelEnvVars[k];
                }
            }
            if (!('smallFastModel' in api._autoModelEnvVars) || typeof api._autoModelEnvVars.smallFastModel !== 'string') {
                api._autoModelEnvVars.smallFastModel = template.smallFastModel;
                smallFastWasFixed = true;
            }
        }

        // modelEnvVars — fill with template actual values (NOT "")
        if (!api.modelEnvVars) {
            api.modelEnvVars = {};
        }
        for (const k of PREDEFINED_MODEL_ENV_KEYS) {
            if (!(k in api.modelEnvVars) || typeof api.modelEnvVars[k] !== 'string') {
                api.modelEnvVars[k] = template[k] || '';
            }
        }
        for (const k of Object.keys(api.modelEnvVars)) {
            if (!PREDEFINED_MODEL_ENV_KEYS.includes(k)) {
                delete api.modelEnvVars[k];
            }
        }

        // smallFastModel — sync with template
        if (!api.smallFastModel || typeof api.smallFastModel !== 'string'
            || !hadAutoModelEnvVars || smallFastWasFixed) {
            api.smallFastModel = template.smallFastModel;
        }

        // template 漂移检测：provider template 升级后首次加载旧配置时，_autoModelEnvVars
        // 仍是旧快照。检测到漂移则刷新仍等于旧快照的 tier 字段（保留用户手动覆盖），
        // 复用 updateApiField() 的保留覆盖模式。_migrateApiEntry 的 before/after 比较
        // 已覆盖 modelEnvVars/_autoModelEnvVars/smallFastModel，会据此返回 migrated=true
        // 并由构造函数统一 saveConfig()。
        if (hadAutoModelEnvVars) {
            let drifted = false;
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (api._autoModelEnvVars[k] !== template[k]) { drifted = true; break; }
            }
            if (!drifted && api._autoModelEnvVars.smallFastModel !== template.smallFastModel) {
                drifted = true;
            }
            if (drifted) {
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) {
                        api.modelEnvVars[k] = template[k] || '';
                    }
                }
                if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) {
                    api.smallFastModel = template.smallFastModel;
                }
                api._autoModelEnvVars = { ...template };
            }
        }

        // runtimeEnvVars — fill "" not provider values
        if (!api.runtimeEnvVars) {
            api.runtimeEnvVars = {};
        }
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (!(k in api.runtimeEnvVars) || typeof api.runtimeEnvVars[k] !== 'string') {
                api.runtimeEnvVars[k] = '';
            }
        }

        // _runtimeEnvSources — missing → "auto"
        if (!api._runtimeEnvSources) {
            api._runtimeEnvSources = {};
        }
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (!(k in api._runtimeEnvSources)) {
                api._runtimeEnvSources[k] = 'auto';
            }
            if (api._runtimeEnvSources[k] !== 'auto' && api._runtimeEnvSources[k] !== 'manual') {
                api._runtimeEnvSources[k] = 'auto';
            }
        }

        // runtime/source conflict resolution
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            if (api.runtimeEnvVars[k] !== '' && api._runtimeEnvSources[k] === 'auto') {
                api.runtimeEnvVars[k] = '';
            }
        }

        // customEnvVars
        if (!api.customEnvVars) {
            api.customEnvVars = {};
        }

        if (api._autoFilledModel) {
            delete api._autoFilledModel;
        }

        return api;
    }

    /**
     * Save configuration to encrypted file (public entry).
     * Outcome is tracked three ways in `saveOutcome`:
     *   'saved'         — persisted and verified
     *   'not-saved'     — nothing landed; in-memory config is rolled back
     *                     to the last persisted state
     *   'indeterminate' — the disk could not be reconciled (verify read,
     *                     undo AND re-read all failed). Memory is kept,
     *                     further blind saves are blocked, and the error
     *                     surfaced to the user must NOT claim the change
     *                     was lost (round 5).
     * @returns {boolean} true when persisted
     */
    saveConfig() {
        if (this.saveOutcome === 'indeterminate') {
            // Block the write AND restore memory to the indeterminate point:
            // mutators modify this.config before saving, and those blocked
            // changes must not linger as ghost state (round 6).
            if (this._indeterminateSnapshot) {
                this.config = JSON.parse(JSON.stringify(this._indeterminateSnapshot));
            }
            screen.debug('[!] Refusing further saves: previous save outcome is indeterminate — reload to reconcile');
            return false;
        }
        this.saveOutcome = 'not-saved';
        const ok = this._saveConfigInner();
        if (ok) {
            this.saveOutcome = 'saved';
            return ok;
        }
        if (this.saveOutcome !== 'indeterminate') this._restoreLastPersisted();
        return ok;
    }

    /** Restore in-memory config to the last successfully persisted state. */
    _restoreLastPersisted() {
        if (this._lastPersistedConfig) {
            this.config = JSON.parse(JSON.stringify(this._lastPersistedConfig));
        }
    }

    /**
     * Undo a promote that was never verified: restore .bak over the
     * unverified main file, or remove main entirely when there is no backup
     * (first save). Leaves disk consistent with the pre-save state.
     * @returns {boolean} true when the undo succeeded
     */
    _undoPromote(bakPath) {
        try {
            if (fs.existsSync(bakPath)) {
                fs.renameSync(bakPath, this.configFile);
            } else if (fs.existsSync(this.configFile)) {
                fs.unlinkSync(this.configFile);
            }
            this._fsyncDir(path.dirname(this.configFile));
            this._promoted = false;
            return true;
        } catch (error) {
            screen.debug(`[!] Could not undo unverified promote: ${error.message}`);
            return false;
        }
    }

    /**
     * Round 7 preflight: mutators modify this.config BEFORE saving, and the
     * UI holds aliased references into it — an indeterminate-blocked save
     * would roll the manager view back but leave the blocked mutation alive
     * in those aliases. Refusing up front means the mutation never happens.
     */
    _assertNotIndeterminate() {
        if (this.saveOutcome === 'indeterminate') {
            throw new Error('Save outcome could not be verified — restart the launcher to reconcile; do not assume the change was lost.');
        }
    }

    /**
     * Persist for user-facing mutations: surfaces a refused/failed save as
     * an error instead of a silent false (memory is already rolled back).
     */
    _saveOrThrow() {
        if (!this.saveConfig()) {
            if (this.keyMaterialError) {
                // Do not let a fail-closed key material state look like a
                // generic save failure: that is indistinguishable from the UI
                // lockup this release exists to remove, and the user cannot act
                // on it without knowing which file is broken.
                throw new Error(
                    `The key material file is unreadable, so nothing can be saved without risking your ` +
                    `stored tokens. Back up your config file first, then repair or remove ` +
                    `${machineKey.sidecarPath()}. Details: ${this.keyMaterialError}`);
            }
            if (this._keyMigrationBlocked) {
                throw new Error(
                    `Cannot save: the pre-migration snapshot ${this.configFile}.pre-key-migration ` +
                    `could not be written, and re-encrypting your config without that safety copy ` +
                    `could make existing tokens unreadable. Free that path, then retry.`);
            }
            if (this.saveOutcome === 'indeterminate') {
                throw new Error('Save outcome could not be verified — the change may or may not be on disk. Restart the launcher to reconcile; do not assume it was lost.');
            }
            throw new Error(this.saveConflict
                ? 'Config was changed on disk by another instance — restart the launcher to reload; this change was NOT saved'
                : 'Failed to persist the config change — it was NOT saved');
        }
    }

    /**
     * Save configuration to encrypted file (internal).
     *
     * Crash-safe sequence (issue #11): the file is never truncated in place.
     * The payload goes to a temp file first (fsynced), the current file is
     * rotated to .bak, the temp file is atomically renamed into place, and
     * the result is verified by reading it back. A lockfile keeps concurrent
     * instances from interleaving writes.
     */
    _saveConfigInner() {
        if (this.keyMaterialError) {
            // Fail closed: the key material file exists but is unreadable, so
            // we cannot know which key opens the data already on disk. Writing
            // under a freshly derived key would make it permanently unreadable.
            screen.debug(`[!] Refusing to save: key material is unusable (${this.keyMaterialError})`);
            return false;
        }
        if (this._keyMigrationBlocked) {
            // The heal refused because the pre-migration snapshot could not be
            // written. An ordinary save re-encrypts the whole blob with the
            // current key, i.e. performs the very migration that was refused,
            // so the invariant "no key-generation migration without a
            // snapshot" has to hold here too. Retry the snapshot first: the
            // obstacle may be gone by now.
            if (this._snapshotPreHealCiphertext()) {
                this._keyMigrationBlocked = false;
            } else {
                screen.debug('[!] Refusing to save: cannot migrate the key generation without a pre-migration snapshot');
                return false;
            }
        }
        if (this.loadError) {
            // Never let a fallback empty config overwrite a (corrupt but
            // potentially recoverable) real file — requires clearLoadError().
            screen.debug('[!] Refusing to save: config failed to load (call clearLoadError() to force overwrite)');
            return false;
        }

        const tmpPath = this.configFile + '.tmp';
        const bakPath = this.configFile + '.bak';
        const bak2Path = this.configFile + '.bak2';
        const lockPath = this.configFile + '.lock';

        if (!this._acquireWriteLock(lockPath)) {
            screen.debug('[!] Could not acquire config write lock — another instance is writing');
            return false;
        }
        try {
            // CAS check (under the lock): refuse to overwrite when the disk
            // no longer matches the state this instance loaded from —
            // another instance wrote in between, and persisting our stale
            // snapshot would silently discard its changes.
            const diskNow = this._readDiskState();
            if (diskNow !== this._diskState) {
                this.saveConflict = true;
                screen.debug('[!] Config changed on disk by another instance — refusing stale overwrite (restart to reload)');
                return false;
            }

            const configJson = JSON.stringify(this.config, null, 2);
            const encrypted = encrypt(configJson);
            if (!encrypted.success) {
                screen.debug(`[!] Failed to save API config: ${encrypted.error}`);
                return false;
            }

            // Write to temp file and flush to disk before touching the real
            // file. Owner-only from creation: the payload holds API tokens.
            const fd = fs.openSync(tmpPath, 'w', 0o600);
            try {
                fs.writeFileSync(fd, encrypted.value);
                fs.fsyncSync(fd);
            } finally {
                fs.closeSync(fd);
            }
            // The mode above only applies when open() CREATES the file. Debris
            // left by a crashed writer keeps whatever mode it had, so this
            // otherwise writes a complete, current ciphertext into a 0644 file
            // and then publishes it. Tighten before the rotation, not after.
            this._enforceOwnerOnly([tmpPath]);

            // Ownership re-check right before the rotation renames: a writer
            // suspended past the stale threshold (its lock taken over) must
            // abort HERE, before touching main/.bak — CAS alone would not
            // catch a takeover that happened mid-save (round 7 high finding).
            if (!this._ownsWriteLock(lockPath)) {
                screen.debug('[!] Write lock was taken over mid-save — aborting before rotation');
                try { fs.unlinkSync(tmpPath); } catch (_) { /* already gone */ }
                return false;
            }

            // Rotate two backup generations (.bak -> .bak2, main -> .bak),
            // then atomically promote the temp file.
            if (fs.existsSync(this.configFile)) {
                if (fs.existsSync(bakPath)) {
                    fs.renameSync(bakPath, bak2Path);
                }
                fs.renameSync(this.configFile, bakPath);
            }
            fs.renameSync(tmpPath, this.configFile);
            this._promoted = true; // main now holds UNVERIFIED content
            this._fsyncDir(path.dirname(this.configFile));
            // Backups inherit whatever mode the main file had when it was
            // written; enforce owner-only on all three generations.
            this._enforceOwnerOnly([this.configFile, bakPath, bak2Path]);

            // Write-back verification: the file on disk must decrypt back to
            // exactly what we intended to store, otherwise undo the promote —
            // restore .bak, or remove the file entirely on a first save (an
            // unverified file on disk while memory reports "not saved" is a
            // fork: the change reappears after restart and trips CAS).
            let written, verified;
            try {
                written = fs.readFileSync(this.configFile, 'utf8');
                verified = decrypt(written);
            } catch (verifyError) {
                verified = { success: false, value: null };
                screen.debug(`[!] Config write verification could not run: ${verifyError.message}`);
            }
            if (!verified.success || verified.value !== configJson) {
                screen.debug('[!] Config write verification failed — undoing the promote');
                if (this._undoPromote(bakPath)) {
                    return false;
                }
                // The undo itself failed — reconcile against the disk instead
                // of blindly reporting "not saved": if the bytes on disk match
                // what we intended to write (the verify failure was a
                // transient read error), the save DID land and must be
                // reported as saved. Anything else — different bytes, or a
                // disk we cannot read at all — is INDETERMINATE: memory is
                // kept, further saves blocked, and the surfaced error must
                // not claim the change was lost (round 5).
                let actualContent = null, actualReadable = false;
                try {
                    if (fs.existsSync(this.configFile)) {
                        actualContent = fs.readFileSync(this.configFile, 'utf8');
                        actualReadable = true;
                    }
                } catch (_) { /* unreadable — stays indeterminate */ }
                if (actualReadable && actualContent === encrypted.value) {
                    screen.debug('[!] Promote undo failed but disk content matches — treating the save as successful');
                    this._promoted = false;
                    this._diskState = encrypted.value;
                    this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
                    this.saveConflict = false;
                    return true;
                }
                this.saveOutcome = 'indeterminate';
                this._indeterminateSnapshot = JSON.parse(JSON.stringify(this.config));
                this.saveConflict = true;
                screen.debug('[!] Persist outcome INDETERMINATE — disk could not be reconciled with the intended write');
                return false;
            }

            this._promoted = false;
            this._diskState = encrypted.value; // disk now matches what we just wrote
            this._lastPersistedConfig = JSON.parse(JSON.stringify(this.config));
            this.saveConflict = false;
            return true;
        } catch (error) {
            screen.debug(`[!] Error saving API config: ${error.message}`);
            try { fs.unlinkSync(tmpPath); } catch (_) { /* already gone */ }
            if (this._promoted) {
                // Failure AFTER the promote: main holds unverified content —
                // undo it so disk matches the reported "not saved" (round 3).
                this._undoPromote(bakPath);
            } else if (!fs.existsSync(this.configFile) && fs.existsSync(bakPath)) {
                // Failure in the rotation window: main was moved to .bak and
                // never replaced — restore it (crash-window self-heal).
                try {
                    fs.renameSync(bakPath, this.configFile);
                    screen.debug('[!] Restored main config from .bak after failed save');
                } catch (_) { /* best effort — loader's backup recovery is the net */ }
            }
            return false;
        } finally {
            this._releaseWriteLock(lockPath);
        }
    }

    /**
     * Acquire the config write lock (O_EXCL lockfile). A lock older than
     * 30s is treated as debris from a crashed writer and taken over.
     */
    _acquireWriteLock(lockPath) {
        // Unique owner token: a writer suspended past the stale threshold
        // must never be able to delete or clobber the successor's lock on
        // release, and must abort before touching main/.bak on resume
        // (round 7 high finding).
        this._lockToken = `${process.pid}-${process.hrtime.bigint()}-${Math.random().toString(36).slice(2, 10)}`;
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                try {
                    const stat = fs.statSync(lockPath);
                    if (Date.now() - stat.mtimeMs > 30000) {
                        fs.unlinkSync(lockPath);
                    }
                } catch (_) { /* no lock yet — fine */ }
                const fd = fs.openSync(lockPath, 'wx');
                fs.writeSync(fd, this._lockToken);
                fs.closeSync(fd);
                return true;
            } catch (_) {
                _sleepSync(25);
            }
        }
        this._lockToken = null;
        return false;
    }

    /** True when the lockfile on disk still carries THIS manager's token. */
    _ownsWriteLock(lockPath) {
        try {
            return this._lockToken !== null &&
                fs.readFileSync(lockPath, 'utf8') === this._lockToken;
        } catch (_) {
            return false;
        }
    }

    _releaseWriteLock(lockPath) {
        // Only delete a lock we still own — a writer that was suspended,
        // had its stale lock taken over, and then resumed must NOT unlink
        // the successor's lock (round 7 high finding).
        if (this._ownsWriteLock(lockPath)) {
            try { fs.unlinkSync(lockPath); } catch (_) { /* already gone */ }
        }
        this._lockToken = null;
    }

    _fsyncDir(dir) {
        try {
            const fd = fs.openSync(dir, 'r');
            fs.fsyncSync(fd);
            fs.closeSync(fd);
        } catch (_) { /* best effort — not all filesystems support dir fsync */ }
    }

    /** Best-effort chmod 0600 on credential files (no-op on platforms without POSIX modes). */
    _enforceOwnerOnly(filePaths) {
        chmodOwnerOnly(filePaths);
    }

    /**
     * Check for duplicate API configurations - URL + authToken + model must be unique
     */
    checkDuplicate(baseUrl, authToken, model) {
        const existing = this.config.apis.find(api => {
            const decryptedToken = decrypt(api.authToken);
            const existingToken = decryptedToken.success ? decryptedToken.value : '';
            return api.baseUrl === baseUrl &&
                   existingToken === authToken &&
                   api.model === model;
        });

        if (existing) {
            return {
                isDuplicate: true,
                type: 'Complete Configuration (URL + Token + Model)',
                existing
            };
        }

        return { isDuplicate: false };
    }

    /**
     * Add a new API configuration
     */
    addApi(baseUrl, authToken, model, name, provider = 'custom') {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        if (this.config.apis.length >= 99) {
            throw new Error('Maximum 99 APIs supported. Remove unused APIs before adding new ones.');
        }

        // Validate inputs
        const urlValidation = validateBaseUrl(baseUrl);
        if (!urlValidation.valid) {
            throw new Error(`Invalid Base URL: ${urlValidation.error}`);
        }

        const tokenValidation = validateAuthToken(authToken);
        if (!tokenValidation.valid) {
            throw new Error(`Invalid Auth Token: ${tokenValidation.error}`);
        }

        const modelValidation = validateModel(model);
        if (!modelValidation.valid) {
            throw new Error(`Invalid Model: ${modelValidation.error}`);
        }

        // Check for duplicates
        const duplicate = this.checkDuplicate(baseUrl, authToken, model);
        if (duplicate.isDuplicate) {
            throw new DuplicateApiError(duplicate.existing);
        }

        // Encrypt the auth token before storing
        const encryptedToken = encrypt(tokenValidation.value);
        if (!encryptedToken.success) {
            throw new Error(`Failed to encrypt auth token: ${encryptedToken.error}`);
        }

        // Compute model env template values
        const { getProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const providerConfig = getProvider(provider);
        let templateValues;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            templateValues = providerConfig.modelEnvTemplate.getValues(modelValidation.value);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = modelValidation.value;
            templateValues.smallFastModel = modelValidation.value;
        }

        const modelEnvVars = {};
        for (const k of PREDEFINED_MODEL_ENV_KEYS) {
            modelEnvVars[k] = templateValues[k] || '';
        }
        const _autoModelEnvVars = { ...templateValues };

        const runtimeEnvVars = {};
        const _runtimeEnvSources = {};
        for (const k of PREDEFINED_RUNTIME_KEYS) {
            runtimeEnvVars[k] = '';
            _runtimeEnvSources[k] = 'auto';
        }

        const newApi = {
            id: Date.now().toString(),
            name: name || `API-${this.config.apis.length + 1}`,
            provider: provider,
            baseUrl: urlValidation.value,
            authToken: encryptedToken.value,
            model: modelValidation.value,
            smallFastModel: templateValues.smallFastModel,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0,
            successCount: 0,
            failCount: 0,
            lastError: null,
            modelEnvVars,
            _autoModelEnvVars,
            runtimeEnvVars,
            _runtimeEnvSources,
            customEnvVars: {},
        };

        this.config.apis.push(newApi);

        // Set as active if it's the first API
        if (this.config.apis.length === 1) {
            this.config.activeIndex = 0;
        }

        this._saveOrThrow();
        return newApi;
    }

    /**
     * Remove an API configuration
     */
    removeApi(index) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        if (index < 0 || index >= this.config.apis.length) {
            throw new Error('Invalid API index');
        }

        const removedApi = this.config.apis[index];
        this.config.apis.splice(index, 1);

        // Adjust active index
        if (this.config.activeIndex >= index) {
            this.config.activeIndex = this.config.activeIndex > 0 ? this.config.activeIndex - 1 : -1;
        }

        if (this.config.apis.length === 0) {
            this.config.activeIndex = -1;
        }

        this._saveOrThrow();
        return removedApi;
    }

    /**
     * Clear all API configurations
     * @returns {number} Number of APIs cleared
     */
    clearAllApis() {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const count = this.config.apis.length;
        this.config.apis = [];
        this.config.activeIndex = -1;
        this._saveOrThrow();
        return count;
    }

    /**
     * Get all API configurations
     */
    getApis() {
        return this.config.apis;
    }

    /**
     * Set the active API
     */
    setActiveApi(index) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        if (index < 0 || index >= this.config.apis.length) {
            throw new Error('Invalid API index');
        }

        this.config.activeIndex = index;
        this._saveOrThrow();
        return this.config.apis[index];
    }

    /**
     * Get the currently active API
     */
    getActiveApi() {
        if (this.config.activeIndex >= 0 && this.config.activeIndex < this.config.apis.length) {
            return this.config.apis[this.config.activeIndex];
        }
        return null;
    }

    /**
     * Increment usage count for the active API when actually used
     */
    incrementActiveApiUsage() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Update the model for a specific API
     * @param {string} apiId - The API ID
     * @param {string} newModel - The new model name
     * @returns {Object} The updated API object
     */
    updateApiModel(apiId, newModel) {
        return this.updateApiField(apiId, 'model', newModel);
    }

    /**
     * Update a single field of an API configuration with validation
     * @param {string} apiId - The API id
     * @param {string} field - Field name: 'name', 'provider', 'baseUrl', 'model'
     * @param {string} value - New value
     * @returns {Object} The updated API object
     */
    updateApiField(apiId, field, value) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const allowedFields = ['name', 'provider', 'baseUrl', 'model'];
        if (!allowedFields.includes(field)) {
            throw new Error(`Field '${field}' is not allowed. Allowed: ${allowedFields.join(', ')}`);
        }

        const index = this.config.apis.findIndex(api => api.id === apiId);
        if (index === -1) {
            throw new Error(`API not found: ${apiId}`);
        }

        const api = this.config.apis[index];

        // Manager-level validation
        switch (field) {
            case 'name': {
                if (!value || value.trim() === '') {
                    throw new Error('Name cannot be empty when editing');
                }
                const nameValidation = validateApiName(value);
                if (!nameValidation.valid) {
                    throw new Error(`Invalid name: ${nameValidation.error}`);
                }
                break;
            }
            case 'provider': {
                const { getAllProviders } = require('./presets/providers');
                const validIds = getAllProviders().map(p => p.id);
                if (!validIds.includes(value)) {
                    throw new Error(`Unknown provider: ${value}. Valid: ${validIds.join(', ')}`);
                }
                return this.updateApiProvider(apiId, value).api;
            }
            case 'baseUrl': {
                const urlValidation = validateBaseUrl(value);
                if (!urlValidation.valid) {
                    throw new Error(`Invalid URL: ${urlValidation.error}`);
                }
                break;
            }
            case 'model': {
                const modelValidation = validateModel(value);
                if (!modelValidation.valid) {
                    throw new Error(`Invalid model: ${modelValidation.error}`);
                }
                break;
            }
        }

        // Duplicate check for uniqueness-affecting fields
        if (field === 'baseUrl' || field === 'model') {
            const checkUrl = field === 'baseUrl' ? value : api.baseUrl;
            const checkModel = field === 'model' ? value : api.model;
            const decryptedToken = decrypt(api.authToken);
            const tokenValue = decryptedToken.success ? decryptedToken.value : '';

            // Check against all OTHER apis (exclude self)
            const duplicate = this.config.apis.find((other, idx) => {
                if (idx === index) return false;
                const otherToken = decrypt(other.authToken);
                const otherTokenValue = otherToken.success ? otherToken.value : '';
                return other.baseUrl === checkUrl &&
                       otherTokenValue === tokenValue &&
                       other.model === checkModel;
            });

            if (duplicate) {
                throw new Error(`Duplicate configuration: URL + Token + Model already exists for API '${duplicate.name}'`);
            }
        }

        // Apply update
        api[field] = value.trim();
        if (field === 'model') {
            const { getProvider } = require('./presets/providers');
            const { PREDEFINED_MODEL_ENV_KEYS } = require('./validators');
            const providerConfig = getProvider(api.provider);
            let templateVals;
            if (providerConfig && providerConfig.modelEnvTemplate) {
                templateVals = providerConfig.modelEnvTemplate.getValues(value.trim());
            } else {
                templateVals = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) templateVals[k] = value.trim();
                templateVals.smallFastModel = value.trim();
            }
            if (api._autoModelEnvVars) {
                if (!api.modelEnvVars) api.modelEnvVars = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) {
                        api.modelEnvVars[k] = templateVals[k] || '';
                    }
                }
                if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) {
                    api.smallFastModel = templateVals.smallFastModel;
                }
            } else {
                // No snapshot means all fields are auto — overwrite all
                if (!api.modelEnvVars) api.modelEnvVars = {};
                for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                    api.modelEnvVars[k] = templateVals[k] || '';
                }
                api.smallFastModel = templateVals.smallFastModel;
            }
            api._autoModelEnvVars = { ...templateVals };
        }

        this._saveOrThrow();
        return api;
    }

    updateModelEnvVar(apiId, key, value) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const { PREDEFINED_MODEL_ENV_KEYS } = require('./validators');
        if (!PREDEFINED_MODEL_ENV_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined model env key`);
        if (typeof value !== 'string') throw new Error('model env value must be a string');
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        const api = this.config.apis[index];
        const autoValue = api._autoModelEnvVars && typeof api._autoModelEnvVars[key] === 'string'
            ? api._autoModelEnvVars[key]
            : '';
        api.modelEnvVars[key] = value === '' ? autoValue : value;
        this._saveOrThrow();
        return api;
    }

    updateRuntimeEnvVar(apiId, key, value, options = {}) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const { PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue } = require('./validators');
        if (!PREDEFINED_RUNTIME_KEYS.includes(key)) throw new Error(`"${key}" is not a predefined runtime env key`);
        const validation = validateRuntimeEnvValue(key, value);
        if (!validation.valid) throw new Error(`Invalid value for ${key}: ${validation.error}`);
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        if (options.source === 'auto') {
            this.config.apis[index].runtimeEnvVars[key] = '';
            this.config.apis[index]._runtimeEnvSources[key] = 'auto';
        } else if (options.source === 'manual') {
            this.config.apis[index].runtimeEnvVars[key] = value;
            this.config.apis[index]._runtimeEnvSources[key] = 'manual';
        } else {
            this.config.apis[index].runtimeEnvVars[key] = value;
            this.config.apis[index]._runtimeEnvSources[key] = (value === '') ? 'auto' : 'manual';
        }
        this._saveOrThrow();
        return this.config.apis[index];
    }

    setCustomEnvVar(apiId, key, value) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const { validateEnvKey } = require('./validators');
        const kv = validateEnvKey(key);
        if (!kv.valid) throw new Error(`Custom env key "${key}" is reserved or invalid`);
        if (typeof value !== 'string') throw new Error('Custom env value must be a string');
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        this.config.apis[index].customEnvVars[key] = value;
        this._saveOrThrow();
        return this.config.apis[index];
    }

    deleteCustomEnvVar(apiId, key) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        delete this.config.apis[index].customEnvVars[key];
        this._saveOrThrow();
        return this.config.apis[index];
    }

    updateApiProvider(apiId, newProviderId) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const { getProvider, getAllProviders, detectProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const validIds = getAllProviders().map(p => p.id);
        if (!validIds.includes(newProviderId)) throw new Error(`Unknown provider: ${newProviderId}`);
        const index = this.config.apis.findIndex(a => a.id === apiId);
        if (index === -1) throw new Error(`API not found: ${apiId}`);
        const api = this.config.apis[index];
        const newProvider = getProvider(newProviderId);
        const warnings = [];
        if (!newProvider.models.includes(api.model)) {
            warnings.push({ code: 'MODEL_NOT_IN_PROVIDER', messageArgs: { model: api.model, providerName: newProvider.name } });
        }
        if (detectProvider(api.baseUrl) !== newProviderId) {
            warnings.push({ code: 'BASE_URL_NOT_UPDATED', messageArgs: { baseUrl: api.baseUrl } });
        }
        if (api._runtimeEnvSources) {
            for (const [key, source] of Object.entries(api._runtimeEnvSources)) {
                if (source === 'auto' && PREDEFINED_RUNTIME_KEYS.includes(key)) api.runtimeEnvVars[key] = '';
            }
        }
        let templateValues;
        if (newProvider.modelEnvTemplate) {
            templateValues = newProvider.modelEnvTemplate.getValues(api.model);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = api.model;
            templateValues.smallFastModel = api.model;
        }
        if (api._autoModelEnvVars) {
            if (!api.modelEnvVars) api.modelEnvVars = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                if (api.modelEnvVars[k] === api._autoModelEnvVars[k]) api.modelEnvVars[k] = templateValues[k] || '';
            }
            if (api.smallFastModel === api._autoModelEnvVars.smallFastModel) api.smallFastModel = templateValues.smallFastModel;
        }
        api._autoModelEnvVars = { ...templateValues };
        if (detectProvider(api.baseUrl) !== newProviderId && warnings.some(w => w.code === 'MODEL_NOT_IN_PROVIDER')) {
            warnings.push({ code: 'MIXED_PROVIDER_CONFIG', messageArgs: { providerId: newProviderId, baseUrl: api.baseUrl, model: api.model } });
        }
        api.provider = newProviderId;
        this._saveOrThrow();
        return { api, warnings };
    }

    /**
     * Record a successful API launch
     * @returns {Object|null} The updated API object or null
     */
    recordSuccessfulLaunch() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].successCount = (this.config.apis[index].successCount || 0) + 1;
            this.config.apis[index].lastError = null;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Record a failed API launch
     * @param {string} errorMessage - The error message
     * @returns {Object|null} The updated API object or null
     */
    recordFailedLaunch(errorMessage) {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].failCount = (this.config.apis[index].failCount || 0) + 1;
            this.config.apis[index].lastError = errorMessage;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Record a launch attempt (optimistic success)
     * Call rollbackLaunchAttempt() if a pre-launch sync error occurs
     * @returns {Object|null} The updated API object or null
     */
    recordLaunchAttempt() {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].lastUsed = new Date().toISOString();
            this.config.apis[index].usageCount = (this.config.apis[index].usageCount || 0) + 1;
            this.config.apis[index].successCount = (this.config.apis[index].successCount || 0) + 1;
            this.config.apis[index].lastError = null;
            if (!this.saveConfig()) return null; // refused: memory rolled back, stats NOT persisted
            return this.config.apis[index];
        }
        return null;
    }

    /**
     * Rollback an optimistic launch attempt on pre-launch sync error
     * @param {string} errorMessage - The error message
     */
    rollbackLaunchAttempt(errorMessage) {
        const activeApi = this.getActiveApi();
        if (activeApi) {
            const index = this.config.activeIndex;
            this.config.apis[index].successCount = Math.max(0, (this.config.apis[index].successCount || 0) - 1);
            this.config.apis[index].failCount = (this.config.apis[index].failCount || 0) + 1;
            this.config.apis[index].lastError = errorMessage;
            this.saveConfig();
        }
    }

    /**
     * Get statistics about API usage
     */
    getStatistics() {
        const totalApis = this.config.apis.length;
        const activeApi = this.getActiveApi();
        const mostUsed = this.config.apis.reduce((prev, current) =>
            (current.usageCount > (prev?.usageCount || 0)) ? current : prev, null);

        return {
            totalApis,
            activeApiName: activeApi?.name || 'None',
            mostUsedApi: mostUsed?.name || 'None',
            totalUsage: this.config.apis.reduce((sum, api) => sum + api.usageCount, 0)
        };
    }

    /**
     * Get enhanced statistics with success/fail tracking
     * @returns {Object} Enhanced statistics object
     */
    getEnhancedStatistics() {
        const apis = this.config.apis;
        const activeApi = this.getActiveApi();

        const totalUsage = apis.reduce((sum, api) => sum + (api.usageCount || 0), 0);
        const totalSuccess = apis.reduce((sum, api) => sum + (api.successCount || 0), 0);
        const totalFail = apis.reduce((sum, api) => sum + (api.failCount || 0), 0);

        const mostUsed = apis.reduce((prev, current) =>
            (current.usageCount > (prev?.usageCount || 0)) ? current : prev, null);

        return {
            totalApis: apis.length,
            activeApiName: activeApi?.name || 'None',
            mostUsedApi: mostUsed?.name || 'None',
            totalUsage,
            totalSuccess,
            totalFail,
            successRate: totalUsage > 0 ? ((totalSuccess / totalUsage) * 100).toFixed(1) + '%' : 'N/A',
            apiStats: apis.map(api => ({
                name: api.name,
                model: api.model,
                provider: api.provider,
                usageCount: api.usageCount || 0,
                successCount: api.successCount || 0,
                failCount: api.failCount || 0,
                successRate: (api.usageCount || 0) > 0
                    ? (((api.successCount || 0) / api.usageCount) * 100).toFixed(1) + '%'
                    : 'N/A',
                lastUsed: api.lastUsed,
                lastError: api.lastError
            }))
        };
    }

    /**
     * Reset statistics for all APIs or a specific API
     * @param {string|null} apiId - API ID to reset, or null for all
     */
    resetStatistics(apiId = null) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const resetFields = (api) => {
            api.usageCount = 0;
            api.successCount = 0;
            api.failCount = 0;
            api.lastUsed = null;
            api.lastError = null;
        };

        if (apiId) {
            const index = this.config.apis.findIndex(a => a.id === apiId);
            if (index !== -1) {
                resetFields(this.config.apis[index]);
            }
        } else {
            this.config.apis.forEach(resetFields);
        }

        // Interactive menu operation — surface a refused save instead of
        // reporting success (round 3 review).
        this._saveOrThrow();
    }

    /**
     * Check if this is first time usage (no password set AND no APIs configured).
     * A config that exists on disk but failed to load is NEVER treated as
     * first-time usage — the setup wizard's save would destroy the file.
     */
    isFirstTimeUsage() {
        if (this.loadError) return false;
        // A surviving snapshot means there WAS a config here; treating this as
        // a first run would hide it behind a setup wizard.
        if (this.snapshotNotice) return false;
        return this.config.exportPassword === null &&
               this.config.apis.length === 0 &&
               !this.config.passwordSkipped;
    }

    /**
     * Explicitly clear the load-error state so saving is allowed again.
     * Only call this after the user has confirmed the unreadable file may
     * be overwritten (or has recovered it manually).
     */
    clearLoadError() {
        this.loadError = null;
    }

    /**
     * Check if export password is set
     */
    hasExportPassword() {
        return this.config.exportPassword !== null;
    }

    /**
     * Check if password was permanently skipped
     */
    isPasswordSkipped() {
        return this.config.passwordSkipped === true;
    }

    /**
     * Check if import/export features should be available
     */
    canUseImportExport() {
        return this.hasExportPassword();
    }

    /**
     * Set export password (hashed)
     */
    setExportPassword(password) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        const crypto = require('crypto');
        this.config.exportPassword = crypto.createHash('sha256').update(password).digest('hex');
        this._saveOrThrow();
    }

    /**
     * Permanently skip password setup (one-time only, can't be undone)
     */
    skipPasswordSetup() {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        if (!this.isFirstTimeUsage()) {
            throw new Error('Password setup can only be skipped during first time usage');
        }
        this.config.passwordSkipped = true;
        this._saveOrThrow();
    }

    /**
     * Verify export password
     */
    verifyExportPassword(password) {
        if (!this.hasExportPassword()) {
            return false;
        }
        const crypto = require('crypto');
        const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
        return hashedInput === this.config.exportPassword;
    }

    /**
     * Remove export password
     */
    removeExportPassword() {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        this.config.exportPassword = null;
        this._saveOrThrow();
    }

    /**
     * Export configuration as plaintext JSON (password verification required)
     */
    exportConfig(password) {
        // Verify password before export
        if (!this.verifyExportPassword(password)) {
            throw new Error('Invalid password for export operation');
        }

        return this.exportConfigAuthenticated();
    }

    /**
     * Export configuration as plaintext JSON (already authenticated)
     */
    exportConfigAuthenticated() {
        const exportData = {
            configVersion: 2,
            version: this.config.version,
            warning: 'This file contains plaintext API keys and custom environment variables. Handle with care.',
            exportedAt: new Date().toISOString(),
            apis: this.config.apis.map(api => {
                const decrypted = decrypt(api.authToken);
                if (!decrypted.success) {
                    // Refusing beats emitting a placeholder that reads like a
                    // token: the export would look complete, import cleanly on
                    // another machine, and only fail at request time. Naming the
                    // entry lets the user paste the token back in first.
                    throw new Error(
                        `Cannot export "${api.name || 'Unknown'}": its auth token could not be decrypted ` +
                        `(${decrypted.error}). Re-enter the token for that API, then export again. ` +
                        `The original ciphertext is preserved in ${this.configFile} and, if a key ` +
                        `migration ran, in ${this.configFile}.pre-key-migration.`);
                }
                const { _autoFilledModel, ...safe } = api;
                return { ...safe, authToken: decrypted.value };
            }),
            activeIndex: this.config.activeIndex
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import configuration from plaintext JSON (password verification required)
     */
    importConfig(plaintextData, password) {
        // Verify password before import
        if (!this.verifyExportPassword(password)) {
            throw new Error('Invalid password for import operation');
        }

        return this.importConfigAuthenticated(plaintextData);
    }

    /**
     * Import configuration from plaintext JSON (already authenticated)
     */
    importConfigAuthenticated(plaintextData) {
        const configData = JSON.parse(plaintextData);
        return this.processImportData(configData);
    }


    /**
     * Process import data (merge with existing)
     */
    processImportData(configData) {
        this._assertNotIndeterminate(); // round 7: refuse BEFORE any memory mutation
        let imported = 0;
        let skipped = 0;
        const warnings = [];
        const skippedItems = [];

        if (!configData.apis || !Array.isArray(configData.apis)) {
            throw new Error('Invalid configuration format - no APIs found');
        }

        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue, RESERVED_ENV_KEYS } = require('./validators');

        configData.apis.forEach(importApi => {
            if (this.config.apis.length >= 99) {
                skipped++;
                skippedItems.push({ apiName: importApi.name || 'Unknown', reason: 'Maximum 99 APIs reached' });
                return;
            }

            try {
                const urlValidation = validateBaseUrl(importApi.baseUrl);
                if (!urlValidation.valid) {
                    skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: urlValidation.error }); return;
                }

                if (!isPlaceholderToken(importApi.authToken)) {
                    const tokenValidation = validateAuthToken(importApi.authToken);
                    if (!tokenValidation.valid) {
                        skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: tokenValidation.error }); return;
                    }
                }

                const modelValidation = validateModel(importApi.model);
                if (!modelValidation.valid) {
                    skipped++; skippedItems.push({ apiName: importApi.name || 'Unknown', reason: modelValidation.error }); return;
                }

                const importToken = isPlaceholderToken(importApi.authToken) ? '' : importApi.authToken;
                const duplicate = this.checkDuplicate(importApi.baseUrl, importToken, importApi.model);

                if (duplicate.isDuplicate) {
                    skipped++;
                    skippedItems.push({ apiName: importApi.name || 'Unknown', reason: 'Duplicate configuration' });
                    return;
                }

                // Clean modelEnvVars: whitelist only
                const cleanedModelEnvVars = {};
                if (importApi.modelEnvVars) {
                    for (const k of PREDEFINED_MODEL_ENV_KEYS) {
                        const v = importApi.modelEnvVars[k];
                        cleanedModelEnvVars[k] = (typeof v === 'string') ? v : '';
                    }
                    for (const k of Object.keys(importApi.modelEnvVars)) {
                        if (!PREDEFINED_MODEL_ENV_KEYS.includes(k)) {
                            warnings.push({ code: 'UNKNOWN_MODEL_ENV_KEY', apiName: importApi.name || 'Unknown', key: k });
                        }
                    }
                }

                // Clean runtimeEnvVars: whitelist + validate
                const cleanedRuntimeEnvVars = {};
                const cleanedRuntimeEnvSources = {};
                if (importApi.runtimeEnvVars) {
                    for (const k of PREDEFINED_RUNTIME_KEYS) {
                        let v = importApi.runtimeEnvVars[k];
                        if (typeof v !== 'string') v = '';
                        if (v !== '' && !validateRuntimeEnvValue(k, v).valid) {
                            warnings.push({ code: 'INVALID_RUNTIME_ENV_VALUE', apiName: importApi.name || 'Unknown', key: k });
                            v = '';
                        }
                        cleanedRuntimeEnvVars[k] = v;
                        const src = (importApi._runtimeEnvSources || {})[k];
                        cleanedRuntimeEnvSources[k] = (src === 'manual' && v !== '') ? 'manual' : 'auto';
                    }
                    for (const k of Object.keys(importApi.runtimeEnvVars)) {
                        if (!PREDEFINED_RUNTIME_KEYS.includes(k)) {
                            warnings.push({ code: 'UNKNOWN_RUNTIME_ENV_KEY', apiName: importApi.name || 'Unknown', key: k });
                        }
                    }
                }

                // Clean customEnvVars: skip reserved/predefined
                const cleanedCustomEnvVars = {};
                if (importApi.customEnvVars) {
                    const allP = new Set([...RESERVED_ENV_KEYS, ...PREDEFINED_RUNTIME_KEYS, ...PREDEFINED_MODEL_ENV_KEYS]);
                    for (const [k, v] of Object.entries(importApi.customEnvVars)) {
                        if (allP.has(k)) {
                            warnings.push({ code: 'CUSTOM_ENV_KEY_RESERVED', apiName: importApi.name || 'Unknown', key: k });
                            continue;
                        }
                        if (typeof v === 'string') cleanedCustomEnvVars[k] = v;
                    }
                }

                // Any placeholder imports as "no token yet" so the rest of the
                // entry (url, model, env vars) survives and the UI can ask for
                // the token, instead of storing a string that only looks like one.
                const tokenToEncrypt = isPlaceholderToken(importApi.authToken) ? '' : importApi.authToken;
                const encryptedResult = encrypt(tokenToEncrypt);
                if (!encryptedResult.success) {
                    skipped++;
                    skippedItems.push({
                        apiName: importApi.name || 'Unknown',
                        reason: `Failed to encrypt auth token: ${encryptedResult.error}`
                    });
                    return;
                }
                const encryptedToken = encryptedResult.value;

                const newApi = {
                    id: Date.now() + Math.random(),
                    name: importApi.name || `Imported API ${this.config.apis.length + 1}`,
                    baseUrl: urlValidation.value,
                    authToken: encryptedToken,
                    model: modelValidation.value,
                    provider: importApi.provider || 'custom',
                    smallFastModel: importApi.smallFastModel || importApi.model,
                    createdAt: new Date().toISOString(),
                    lastUsed: null,
                    usageCount: 0,
                    modelEnvVars: cleanedModelEnvVars,
                    runtimeEnvVars: cleanedRuntimeEnvVars,
                    _runtimeEnvSources: cleanedRuntimeEnvSources,
                    customEnvVars: cleanedCustomEnvVars,
                    _autoFilledModel: importApi._autoFilledModel,
                };
                if (importApi._autoModelEnvVars) {
                    newApi._autoModelEnvVars = importApi._autoModelEnvVars;
                }
                if (importApi.successCount !== undefined) newApi.successCount = importApi.successCount;
                if (importApi.failCount !== undefined) newApi.failCount = importApi.failCount;
                if (importApi.lastError !== undefined) newApi.lastError = importApi.lastError;

                this._normalizeApiFields(newApi);
                this.config.apis.push(newApi);
                imported++;
                if (this.config.apis.length === 1) this.config.activeIndex = 0;
            } catch (error) {
                skipped++;
                skippedItems.push({ apiName: importApi.name || 'Unknown', reason: error.message });
            }
        });

        this._saveOrThrow();
        return { imported, skipped, warnings, skippedItems };
    }

    // --- Draft methods (no persistence, for pre-create config editing) ---

    static buildApiDraft(provider, baseUrl, authToken, model, name) {
        const { getProvider } = require('./presets/providers');
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS } = require('./validators');
        const providerConfig = getProvider(provider);
        let templateValues;
        if (providerConfig && providerConfig.modelEnvTemplate) {
            templateValues = providerConfig.modelEnvTemplate.getValues(model);
        } else {
            templateValues = {};
            for (const k of PREDEFINED_MODEL_ENV_KEYS) templateValues[k] = model;
            templateValues.smallFastModel = model;
        }
        const modelEnvVars = {};
        for (const k of PREDEFINED_MODEL_ENV_KEYS) modelEnvVars[k] = templateValues[k] || '';
        const _autoModelEnvVars = { ...templateValues };
        const runtimeEnvVars = {};
        const _runtimeEnvSources = {};
        for (const k of PREDEFINED_RUNTIME_KEYS) { runtimeEnvVars[k] = ''; _runtimeEnvSources[k] = 'auto'; }
        return { provider, baseUrl, authToken, model, name,
            smallFastModel: templateValues.smallFastModel,
            modelEnvVars, _autoModelEnvVars,
            runtimeEnvVars, _runtimeEnvSources, customEnvVars: {} };
    }

    static applyDraftEnvChange(draft, section, key, value) {
        const { PREDEFINED_MODEL_ENV_KEYS, PREDEFINED_RUNTIME_KEYS, validateRuntimeEnvValue, validateEnvKey } = require('./validators');
        if (section === 'model') {
            if (!PREDEFINED_MODEL_ENV_KEYS.includes(key)) throw new Error(`Unknown model env key: ${key}`);
            if (typeof value !== 'string') throw new Error('model env value must be string');
            draft.modelEnvVars[key] = (value === '') ? (draft._autoModelEnvVars[key] || '') : value;
        } else if (section === 'runtime') {
            if (!PREDEFINED_RUNTIME_KEYS.includes(key)) throw new Error(`Unknown runtime env key: ${key}`);
            const v = validateRuntimeEnvValue(key, value);
            if (!v.valid) throw new Error(`Invalid: ${v.error}`);
            draft.runtimeEnvVars[key] = value;
            draft._runtimeEnvSources[key] = (value === '') ? 'auto' : 'manual';
        } else if (section === 'custom') {
            const kv = validateEnvKey(key);
            if (!kv.valid) throw new Error(`Invalid custom key: ${kv.error}`);
            if (typeof value !== 'string') throw new Error('custom env value must be string');
            draft.customEnvVars[key] = value;
        }
        return draft;
    }

    static deleteDraftCustomEnvVar(draft, key) {
        delete draft.customEnvVars[key];
        return draft;
    }
}

module.exports = ApiManager;
module.exports.DuplicateApiError = DuplicateApiError;
module.exports.MODEL_CONFIG_LABELS = MODEL_CONFIG_LABELS;
module.exports.RUNTIME_CONFIG_LABELS = RUNTIME_CONFIG_LABELS;
