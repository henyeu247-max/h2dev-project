'use strict';

/**
 * Offline append-only registry store primitives for A3.
 *
 * The store is deliberately file based and small.  A transaction prepares an
 * immutable full-history generation, then appends one commit marker to the
 * ledger journal.  The journal marker is the commit point; a generation that
 * has no marker is an uncommitted staging/orphan artifact and is never used
 * for replay.  No historical generation is rewritten or deleted.
 *
 * This module is intentionally not a public HTTP/server adapter.  Every file
 * operation below is first classified by the A2 private-boundary helper.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const boundaryApi = require('../security/private-boundary.cjs');
const schemaApi = require('./schema-validate.js');

const {
  DEFAULT_PROJECT_ROOT,
  createPrivateBoundary,
  assertPrivateWritePath,
  assertPrivateReadPath,
  assertFilesystemRelativePath,
  assertDescendantPath,
} = boundaryApi;

const {
  loadContracts,
  validateRecord,
  validateRegistry,
  ENTITY_TYPES,
  stableJson: schemaStableJson,
} = schemaApi;

const STORE_FORMAT = 'h2dev.registry-store.v1';
const GENERATION_FORMAT = 'h2dev.registry-generation.v1';
const COMMIT_FORMAT = 'h2dev.registry-commit.v1';
const GENESIS = 'GENESIS';
const HASH_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/;
const SAFE_FILE_TOKEN_RE = /^[A-Za-z0-9_-]{1,160}$/;
const DANGEROUS_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
  'hasownproperty',
  'isprototypeof',
  'propertyisenumerable',
  'tostring',
  'valueof',
  'tojson',
]);

const LAYOUT = Object.freeze({
  registry: '_private/registry',
  generations: '_private/registry/generations',
  staging: '_private/registry/staging',
  ledger: '_private/ledger',
  journal: '_private/ledger/commits.ndjson',
  lock: '_private/ledger/registry.lock',
});

// Namespace directories are deliberately created only by initializeStore.
// Keeping the complete directory list here makes the bootstrap preflight and
// the post-create verification use the same confined targets.
const INITIALIZATION_DIRECTORIES = Object.freeze([
  '_private',
  '_private/registry',
  '_private/registry/generations',
  '_private/registry/staging',
  '_private/ledger',
]);

const LAYOUT_GUARDS = Object.freeze([
  '_private/registry/layout.guard',
  '_private/registry/generations/layout.guard',
  '_private/registry/staging/layout.guard',
  '_private/ledger/layout.guard',
]);

class RegistryStoreError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RegistryStoreError';
    this.code = code;
    for (const [key, value] of Object.entries(details || {})) {
      if (value !== undefined) this[key] = value;
    }
  }
}

function fail(code, message, details) {
  throw new RegistryStoreError(code, message, details);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Stable JSON used for all hashes.  It intentionally does not use a third
 * party canonicalisation dependency and rejects values JSON cannot represent
 * deterministically.
 */
function stableJson(value, location = '$') {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('NON_DETERMINISTIC_VALUE', `Non-finite number at ${location}`);
    return JSON.stringify(value);
  }
  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
    fail('NON_DETERMINISTIC_VALUE', `Unsupported value at ${location}`);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item, index) => stableJson(item, `${location}[${index}]`)).join(',')}]`;
  }
  if (!isPlainObject(value)) fail('NON_DETERMINISTIC_VALUE', `Non-plain object at ${location}`);
  const keys = Object.keys(value);
  return `{${keys.sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key], `${location}.${key}`)}`).join(',')}}`;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value) {
  const input = typeof value === 'string' || Buffer.isBuffer(value)
    ? value
    : stableJson(value);
  return crypto.createHash('sha256').update(input).digest('hex');
}

function hashRef(value, field = 'hash') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.algorithm === 'sha256' && typeof value.value === 'string') value = value.value;
  }
  if (typeof value !== 'string') fail(`${field.toUpperCase()}_TYPE`, `${field} must be a sha256 hex string`);
  const normal = value.startsWith('sha256:') ? value.slice(7) : value;
  if (!HASH_RE.test(normal)) fail(`${field.toUpperCase()}_FORMAT`, `${field} must be a 64-character lowercase sha256 hash`);
  return normal;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeKey(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 512) {
    fail('IDEMPOTENCY_KEY_REQUIRED', 'A non-empty idempotencyKey is required');
  }
  if (/^[\u0000-\u001f\u007f]/.test(value) || value.includes('\u0000')) {
    fail('IDEMPOTENCY_KEY_INVALID', 'idempotencyKey contains a control character');
  }
  return value;
}

function normalizeExpectedHead(value) {
  if (value === undefined) fail('EXPECTED_HEAD_REQUIRED', 'expectedHead is required for every append');
  if (value === null || value === GENESIS) return GENESIS;
  return hashRef(value, 'expectedHead');
}

function canonicalRecordSort(left, right) {
  const lid = typeof left?.entity_id === 'string' ? left.entity_id : '';
  const rid = typeof right?.entity_id === 'string' ? right.entity_id : '';
  if (lid !== rid) return lid < rid ? -1 : 1;
  const lr = Number.isInteger(left?.revision) ? left.revision : Number.MAX_SAFE_INTEGER;
  const rr = Number.isInteger(right?.revision) ? right.revision : Number.MAX_SAFE_INTEGER;
  if (lr !== rr) return lr - rr;
  const ls = stableJson(left);
  const rs = stableJson(right);
  return ls < rs ? -1 : ls > rs ? 1 : 0;
}

function rejectPrototypeKeys(value, location = '$', seen = new Set()) {
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) fail('NON_DETERMINISTIC_VALUE', `Cyclic value at ${location}`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectPrototypeKeys(item, `${location}[${index}]`, seen));
  } else {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key.toLowerCase())) {
        fail('PROTOTYPE_PATH_REJECTED', `Reserved prototype key at ${location}.${key}`);
      }
      rejectPrototypeKeys(value[key], `${location}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function normalizeRecords(input) {
  const raw = Array.isArray(input)
    ? input
    : input && Array.isArray(input.records)
      ? input.records
      : null;
  if (!raw) fail('BATCH_TYPE', 'Transaction batch must be an array or an object with records[]');
  if (raw.length === 0) fail('EMPTY_BATCH', 'An append transaction must contain at least one record');
  let records;
  try {
    records = cloneJson(raw);
  } catch (error) {
    fail('BATCH_NOT_JSON', `Transaction batch is not JSON serialisable: ${error.message}`);
  }
  rejectPrototypeKeys(records);
  records.sort(canonicalRecordSort);
  return records;
}

function computeBatchHash(records) {
  const canonical = normalizeRecords(records);
  return sha256(canonical);
}

function getPath(value, dottedPath) {
  let current = value;
  for (const segment of String(dottedPath).split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function schemaFingerprint(contracts) {
  const schemas = [...contracts.schemas.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([entityType, schema]) => ({ entityType, schema }));
  return sha256({ index: contracts.index, common: contracts.common, schemas });
}

function makeContext(options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    fail('OPTIONS_TYPE', 'Store options must be an object');
  }
  const suppliedRoot = options.projectRoot ?? options.root ?? DEFAULT_PROJECT_ROOT;
  if (typeof suppliedRoot !== 'string' || suppliedRoot.length === 0) fail('ROOT_TYPE', 'projectRoot must be a non-empty absolute path');
  const root = path.resolve(suppliedRoot);
  let boundary;
  try {
    boundary = createPrivateBoundary({
      projectRoot: root,
      allowSyntheticRoot: options.allowSyntheticRoot === true || options.syntheticFixtureRoot === true,
    });
  } catch (error) {
    if (error && error.code) fail(error.code, error.message, { boundaryCode: error.code });
    throw error;
  }
  const contracts = options.contracts || loadContracts(options.schemaDir);
  return Object.freeze({
    root,
    boundary,
    contracts,
    schemaFingerprint: schemaFingerprint(contracts),
    allowSyntheticRoot: boundary.allowSyntheticRoot,
    schemaDir: options.schemaDir,
  });
}

function safePrivatePath(context, relativePath, operation = 'write') {
  if (typeof relativePath !== 'string') fail('PATH_TYPE', 'Private store path must be a string');
  try {
    // The A2 helper is the sole path policy.  Do not duplicate its traversal,
    // link, junction, NUL, ADS, URL, or prototype-segment checks here.
    return operation === 'read'
      ? assertPrivateReadPath(context.boundary, relativePath)
      : assertPrivateWritePath(context.boundary, relativePath);
  } catch (error) {
    if (error && error.code) fail(error.code, error.message, { boundaryCode: error.code });
    throw error;
  }
}

function pathIdentity(value) {
  const normalized = path.normalize(value);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function isDefaultProjectRoot(context) {
  // `projectRoot` is caller input and may differ from the configured root by
  // Windows casing.  Compare canonical identities so an alias cannot bypass
  // the real-root write authority check. `createPrivateBoundary` has already
  // rejected a root that resolves through a junction/symlink.
  let defaultCanonical = path.resolve(DEFAULT_PROJECT_ROOT);
  try { defaultCanonical = fs.realpathSync.native(defaultCanonical); } catch (_) { /* boundary creation reports missing roots */ }
  return pathIdentity(context.boundary.canonicalProjectRoot) === pathIdentity(defaultCanonical);
}

function assertWriteAuthority(context, options = {}) {
  if (isDefaultProjectRoot(context) && options.allowStoreWrite !== true) {
    fail('STORE_PERMISSION_REQUIRED', 'Real project-root writes require allowStoreWrite=true');
  }
}

function initializationPath(context, relativePath) {
  let parsed;
  try {
    parsed = assertFilesystemRelativePath(relativePath);
    const candidate = path.resolve(context.boundary.canonicalProjectRoot, ...parsed.segments);
    // This is the A2 lexical confinement predicate.  It runs before any
    // directory is created, including when the private namespace is absent.
    assertFilesystemRelativePath(parsed.normalized);
    assertDescendantPath(context.boundary.canonicalProjectRoot, candidate);
    return { candidate, segments: parsed.segments };
  } catch (error) {
    if (error && error.code) fail(error.code, error.message, { boundaryCode: error.code });
    throw error;
  }
}

function inspectInitializationPath(context, relativePath) {
  const { candidate, segments } = initializationPath(context, relativePath);
  let current = context.boundary.canonicalProjectRoot;
  let exists = true;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let stats;
    try { stats = fs.lstatSync(current); } catch (error) {
      if (error && error.code === 'ENOENT') { exists = false; break; }
      fail('FILESYSTEM_INSPECTION_FAILED', 'Unable to inspect an initialization path', { cause: error.code || error.message });
    }
    if (stats.isSymbolicLink()) fail('LINK_ANCESTOR', 'Initialization path contains a symbolic-link/junction ancestor');
    let real;
    try { real = fs.realpathSync.native(current); } catch (error) {
      fail('FILESYSTEM_INSPECTION_FAILED', 'Unable to canonicalize an initialization path', { cause: error.code || error.message });
    }
    if (pathIdentity(real) !== pathIdentity(current)) fail('LINK_ANCESTOR', 'Initialization path contains a junction/reparse-point ancestor');
    if (index < segments.length - 1 && !stats.isDirectory()) fail('ANCESTOR_NOT_DIRECTORY', 'Initialization path has a non-directory ancestor');
    if (index === segments.length - 1 && !stats.isDirectory()) fail('INITIALIZATION_PATH_NOT_DIRECTORY', 'Initialization target must be a directory');
  }
  return { candidate, exists };
}

function inspectInitializationLayout(context) {
  const statuses = INITIALIZATION_DIRECTORIES.map(relative => ({
    relative,
    ...inspectInitializationPath(context, relative),
  }));
  const registry = statuses.find(item => item.relative === LAYOUT.registry);
  const ledger = statuses.find(item => item.relative === LAYOUT.ledger);
  if (!registry.exists && !ledger.exists) return { status: 'UNINITIALIZED', directories: statuses };
  if (!registry.exists || !ledger.exists) fail('STORE_LAYOUT_INCOMPLETE', 'Private registry and ledger namespaces must be initialized together');
  return { status: 'INITIALIZED', directories: statuses };
}

/**
 * Explicitly provision the two private store namespaces for a trusted writer.
 * This function is the only A3 bootstrap path. It performs an A2 boundary /
 * confinement and ancestor-link preflight before mkdir, and repeats the full
 * inspection afterwards. It never creates a journal, generation, or public
 * projection and is never called by read-only APIs.
 */
function initializeStore(options = {}) {
  const context = makeContext(options);
  assertWriteAuthority(context, options);
  const before = inspectInitializationLayout(context);
  if (before.status === 'INITIALIZED') {
    return {
      initialized: true,
      idempotent: true,
      status: 'INITIALIZED',
      projectRoot: context.root,
      directories: before.directories.map(item => item.relative),
      schemaFingerprint: context.schemaFingerprint,
    };
  }
  for (const relative of INITIALIZATION_DIRECTORIES) {
    const inspected = inspectInitializationPath(context, relative);
    if (!inspected.exists) {
      try {
        fs.mkdirSync(inspected.candidate);
      } catch (error) {
        if (!error || error.code !== 'EEXIST') {
          fail('STORE_INITIALIZATION_FAILED', `Unable to create private store directory: ${relative}`, { cause: error.code || error.message });
        }
      }
    }
    // Re-check each target immediately after creation/race handling, then the
    // complete layout is inspected once more below.
    inspectInitializationPath(context, relative);
  }
  const after = inspectInitializationLayout(context);
  if (after.status !== 'INITIALIZED') fail('STORE_INITIALIZATION_INCOMPLETE', 'Private store initialization did not create both namespaces');
  return {
    initialized: true,
    idempotent: false,
    status: 'INITIALIZED',
    projectRoot: context.root,
    directories: after.directories.map(item => item.relative),
    schemaFingerprint: context.schemaFingerprint,
  };
}

function ensureLayout(context) {
  // The namespaces must have been explicitly initialized by the writer before
  // this helper is reached.  The A2 assertions below then inspect all
  // existing ancestors before creating only the two non-business subdirs.
  inspectInitializationLayout(context);
  for (const relative of LAYOUT_GUARDS) safePrivatePath(context, relative, 'write');
  for (const relative of [LAYOUT.registry, LAYOUT.generations, LAYOUT.staging, LAYOUT.ledger]) {
    fs.mkdirSync(path.join(context.root, relative.replaceAll('/', path.sep)), { recursive: true });
  }
  // Re-run the boundary inspection after directory creation.  A caller must
  // never accidentally continue after a pre-existing link/junction.
  inspectInitializationLayout(context);
  for (const relative of LAYOUT_GUARDS) safePrivatePath(context, relative, 'write');
}

function filePath(context, relativePath, operation = 'write') {
  return safePrivatePath(context, relativePath, operation).artifactPath;
}

function readTextIfExists(context, relativePath) {
  const candidate = filePath(context, relativePath, 'write');
  if (!fs.existsSync(candidate)) return null;
  // Use the A2 read assertion once existence is known so a changed target or
  // link fails closed instead of being followed.
  const readPath = filePath(context, relativePath, 'read');
  try {
    return fs.readFileSync(readPath, 'utf8');
  } catch (error) {
    fail('STORE_READ_FAILED', `Unable to read private store artifact: ${relativePath}`, { cause: error.code || error.message });
  }
}

function fsyncFile(file) {
  const fd = fs.openSync(file, 'r');
  try {
    try {
      fs.fsyncSync(fd);
    } catch (error) {
      // Windows does not permit fsync on directory handles.  File contents
      // and the journal are still fsynced; directory metadata durability is a
      // documented local-platform limitation rather than a reason to rewrite
      // an already committed generation.
      if (!['EPERM', 'EINVAL', 'EBADF'].includes(error && error.code)) throw error;
    }
  } finally { fs.closeSync(fd); }
}

function writeImmutableJson(context, relativePath, value) {
  const target = filePath(context, relativePath, 'write');
  const content = `${stableJson(value)}\n`;
  if (fs.existsSync(target)) {
    const existing = readTextIfExists(context, relativePath);
    if (existing !== content) fail('IMMUTABLE_TARGET_COLLISION', `Immutable artifact already exists with different content: ${relativePath}`);
    return { path: target, bytes: Buffer.byteLength(content), existed: true };
  }
  const parent = path.dirname(target);
  fs.mkdirSync(parent, { recursive: true });
  const token = crypto.randomBytes(12).toString('hex');
  const temp = path.join(parent, `.tmp-${token}.json`);
  // The temporary file is in the already checked private directory.  Never
  // overwrite an external file; wx also protects against accidental reuse.
  const fd = fs.openSync(temp, 'wx');
  try {
    fs.writeFileSync(fd, content, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.renameSync(temp, target);
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* preserve the original error */ }
    if (error && error.code === 'EEXIST' && fs.existsSync(target)) {
      const existing = readTextIfExists(context, relativePath);
      if (existing === content) return { path: target, bytes: Buffer.byteLength(content), existed: true };
    }
    fail('IMMUTABLE_PUBLISH_FAILED', `Unable to publish immutable artifact: ${relativePath}`, { cause: error.code || error.message });
  }
  fsyncFile(parent);
  return { path: target, bytes: Buffer.byteLength(content), existed: false };
}

function journalRaw(context) {
  return readTextIfExists(context, LAYOUT.journal) || '';
}

function parseJournal(context, raw, options = {}) {
  if (raw === '') return [];
  const lines = raw.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  else if (!options.allowPartialJournal) fail('JOURNAL_PARTIAL_LINE', 'Registry journal does not end at a complete line');
  const commits = [];
  let previousCommitHash = GENESIS;
  let expectedSequence = 1;
  const seenKeys = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let value;
    try { value = JSON.parse(line); } catch (error) {
      fail('JOURNAL_CORRUPT', `Registry journal line ${index + 1} is not JSON`, { cause: error.message });
    }
    if (!isPlainObject(value)) fail('JOURNAL_CORRUPT', `Registry journal line ${index + 1} is not an object`);
    rejectPrototypeKeys(value, `$.journal[${index}]`);
    const expectedKeys = ['batchHash', 'commitHash', 'createdAt', 'format', 'generationHash', 'idempotencyKey', 'previousCommitHash', 'schemaFingerprint', 'sequence'];
    if (Object.keys(value).sort().join('|') !== expectedKeys.sort().join('|')) fail('JOURNAL_SHAPE', `Registry journal line ${index + 1} has unexpected fields`);
    if (value.format !== COMMIT_FORMAT || !Number.isInteger(value.sequence) || value.sequence !== expectedSequence) fail('JOURNAL_SEQUENCE', `Registry journal sequence ${index + 1} is invalid`);
    const batchHash = hashRef(value.batchHash, 'batchHash');
    const generationHash = hashRef(value.generationHash, 'generationHash');
    const commitHash = hashRef(value.commitHash, 'commitHash');
    if (value.previousCommitHash !== previousCommitHash) fail('JOURNAL_CHAIN_BROKEN', `Registry journal previous hash mismatch at line ${index + 1}`);
    if (typeof value.idempotencyKey !== 'string' || value.idempotencyKey.length === 0) fail('JOURNAL_IDEMPOTENCY_INVALID', `Registry journal idempotency key invalid at line ${index + 1}`);
    if (typeof value.schemaFingerprint !== 'string' || !HASH_RE.test(value.schemaFingerprint)) fail('JOURNAL_SCHEMA_FINGERPRINT_INVALID', `Registry journal schema fingerprint invalid at line ${index + 1}`);
    const core = {
      format: value.format,
      sequence: value.sequence,
      previousCommitHash: value.previousCommitHash,
      generationHash,
      batchHash,
      idempotencyKey: value.idempotencyKey,
      createdAt: value.createdAt,
      schemaFingerprint: value.schemaFingerprint,
    };
    if (sha256(core) !== commitHash) fail('JOURNAL_HASH_MISMATCH', `Registry journal commit hash mismatch at line ${index + 1}`);
    if (seenKeys.has(value.idempotencyKey)) fail('JOURNAL_DUPLICATE_IDEMPOTENCY', `Registry journal repeats idempotency key at line ${index + 1}`);
    seenKeys.set(value.idempotencyKey, value);
    const generationRelative = `_private/registry/generations/generation-${String(value.sequence).padStart(10, '0')}-${generationHash}.json`;
    const generationFile = filePath(context, generationRelative, 'read');
    let generation;
    try { generation = JSON.parse(fs.readFileSync(generationFile, 'utf8')); } catch (error) {
      fail('GENERATION_MISSING_OR_CORRUPT', `Committed generation cannot be read for journal line ${index + 1}`, { cause: error.code || error.message });
    }
    if (!isPlainObject(generation)) fail('GENERATION_CORRUPT', `Generation ${value.sequence} is not an object`);
    rejectPrototypeKeys(generation, `$.generation[${index}]`);
    if (generation.format !== GENERATION_FORMAT || generation.sequence !== value.sequence || generation.schemaFingerprint !== value.schemaFingerprint) fail('GENERATION_METADATA_MISMATCH', `Generation metadata mismatch at sequence ${value.sequence}`);
    if (sha256(generation) !== generationHash) fail('GENERATION_HASH_MISMATCH', `Generation hash mismatch at sequence ${value.sequence}`);
    if (generation.transaction?.batchHash !== batchHash || generation.transaction?.idempotencyKey !== value.idempotencyKey) fail('GENERATION_TRANSACTION_MISMATCH', `Generation transaction metadata mismatch at sequence ${value.sequence}`);
    if (generation.previousHeadHash !== previousCommitHash) fail('GENERATION_CHAIN_BROKEN', `Generation previous head mismatch at sequence ${value.sequence}`);
    if (!Array.isArray(generation.records) || !isPlainObject(generation.identities)) fail('GENERATION_SHAPE', `Generation ${value.sequence} has invalid records/identities`);
    commits.push({
      ...value,
      batchHash,
      generationHash,
      commitHash,
      generationRelative,
      generation,
    });
    previousCommitHash = commitHash;
    expectedSequence += 1;
  }
  return commits;
}

function validateLoadedRecords(context, records) {
  const result = validateRegistry(records, { contracts: context.contracts });
  if (!result.valid) {
    fail('HISTORY_INVALID', 'Committed registry history fails the frozen schema contract', {
      errorCodes: result.errors.map(error => error.code),
    });
  }
  validateHistoryInvariants(context, records);
}

function throwBatchValidation(result, message) {
  if (!result.valid) {
    fail('BATCH_VALIDATION_FAILED', message, {
      errorCodes: result.errors.map(error => error.code),
    });
  }
}

const GUARD_DEFERRED_VALIDATION_CODES = new Set([
  // Revision-pointer checks are intentionally owned by enforceAppendGuards
  // so callers retain its precise CAS/revision errors (for example
  // REVISION_NOT_LATEST_PLUS_ONE). They are still never silently discarded:
  // the guard must reject them before any write.
  'REVISION_SUPERSEDES_REQUIRED',
  'REVISION_SUPERSEDES_FORBIDDEN',
]);

function isGuardDeferredValidationCode(code) {
  return GUARD_DEFERRED_VALIDATION_CODES.has(code) || (typeof code === 'string' && code.startsWith('SUPERSEDES_'));
}

function validateUnfilteredBatchEntries(context, batch) {
  // Validate every input entry before any guard is allowed to select/skip
  // records. This catches null/non-object and missing identity fields while
  // still allowing references to resolve against the existing history in the
  // complete-candidate check below.
  const errors = [];
  batch.forEach((record, index) => {
    const result = validateRecord(record, { contracts: context.contracts });
    for (const error of result.errors) {
      errors.push({
        ...error,
        path: error.path === '$' ? `$.records[${index}]` : `$.records[${index}]${error.path.slice(1)}`,
      });
    }
  });
  throwBatchValidation({ valid: errors.length === 0, errors }, 'The transaction batch contains malformed records');
}

function validateUnfilteredAppend(context, state, batch, options = {}) {
  // Validate the complete candidate history before any append guard is
  // allowed to select/skip records. In particular, malformed entries must
  // never disappear into `working` and then reserve an idempotency key or
  // publish an empty generation.
  const result = validateRegistry(state.records.concat(batch), { contracts: context.contracts });
  const blockingErrors = result.errors.filter(error => !isGuardDeferredValidationCode(error.code));
  const effective = { ...result, valid: blockingErrors.length === 0, errors: blockingErrors };
  if (options.throwOnInvalid !== false) {
    throwBatchValidation(effective, 'The complete unfiltered history plus transaction batch is invalid');
  }
  return effective;
}

function validateHistoryInvariants(context, records) {
  const byId = new Map();
  for (const record of records) {
    if (!record || typeof record.entity_id !== 'string' || !Number.isInteger(record.revision)) continue;
    if (!byId.has(record.entity_id)) byId.set(record.entity_id, []);
    byId.get(record.entity_id).push(record);
  }
  for (const [entityId, revisions] of byId.entries()) {
    revisions.sort((left, right) => left.revision - right.revision);
    let previous = null;
    let identity = null;
    for (const record of revisions) {
      const expected = previous ? previous.revision + 1 : 1;
      if (record.revision !== expected) {
        fail('HISTORY_REVISION_GAP', `Committed history for ${entityId} is not contiguous`, {
          entityId,
          expectedRevision: expected,
          actualRevision: record.revision,
        });
      }
      if (previous && record.entity_type !== previous.entity_type) fail('ENTITY_TYPE_IMMUTABLE', `Committed history changes entity type for ${entityId}`);
      if (record.revision > 1) {
        const pointer = supersedesPointer(record);
        if (!pointer || pointer.entity_id !== entityId || (pointer.revision !== null && pointer.revision !== record.revision - 1)) {
          fail('HISTORY_SUPERSEDES_INVALID', `Committed history for ${entityId} does not supersede its exact prior revision`);
        }
      }
      const tuple = extractIdentity(record, context);
      if (tuple !== null) {
        if (identity !== null && stableJson(identity) !== stableJson(tuple)) fail('IDENTITY_IMMUTABLE', `Committed history changes canonical identity for ${entityId}`);
        identity = identity || tuple;
      }
      previous = record;
    }
  }
}

function listOrphans(context, commits) {
  const generationDir = path.join(context.root, LAYOUT.generations.replaceAll('/', path.sep));
  if (!fs.existsSync(generationDir)) return [];
  // Directory itself is checked via a file-shaped path before enumeration.
  safePrivatePath(context, '_private/registry/generations/layout.guard', 'write');
  const committed = new Set(commits.map(commit => path.basename(commit.generationRelative)));
  const files = fs.readdirSync(generationDir, { withFileTypes: true });
  return files
    .filter(entry => entry.isFile() && entry.name.startsWith('generation-') && entry.name.endsWith('.json'))
    .map(entry => entry.name)
    .filter(name => !committed.has(name))
    .sort();
}

function uninitializedState(context) {
  const empty = [];
  return {
    format: STORE_FORMAT,
    status: 'UNINITIALIZED',
    initialized: false,
    headHash: GENESIS,
    generationHash: null,
    sequence: 0,
    records: empty,
    identities: Object.create(null),
    commits: [],
    idempotency: new Map(),
    journalHash: sha256(''),
    journalBytes: 0,
    schemaFingerprint: context.schemaFingerprint,
    orphans: [],
  };
}

function loadState(context, options = {}) {
  const layout = inspectInitializationLayout(context);
  // Read-only calls must not create a private business store.  A fresh
  // synthetic root is a valid planned-empty state; appendTransaction invokes
  // initializeStore explicitly before it acquires a writer lock.
  if (layout.status === 'UNINITIALIZED') return uninitializedState(context);
  const raw = journalRaw(context);
  const commits = parseJournal(context, raw, options);
  if (commits.length > 0 && commits[commits.length - 1].schemaFingerprint !== context.schemaFingerprint) {
    fail('SCHEMA_FINGERPRINT_CHANGED', 'The frozen schema fingerprint does not match this store');
  }
  const latest = commits[commits.length - 1];
  const records = latest ? latest.generation.records : [];
  const identities = latest ? latest.generation.identities : Object.create(null);
  validateLoadedRecords(context, records);
  const idempotency = new Map(commits.map(commit => [commit.idempotencyKey, commit]));
  return {
    format: STORE_FORMAT,
    status: 'INITIALIZED',
    initialized: true,
    headHash: latest ? latest.commitHash : GENESIS,
    generationHash: latest ? latest.generationHash : null,
    sequence: latest ? latest.sequence : 0,
    records,
    identities,
    commits,
    idempotency,
    journalHash: sha256(raw),
    journalBytes: Buffer.byteLength(raw),
    schemaFingerprint: context.schemaFingerprint,
    orphans: listOrphans(context, commits),
  };
}

function extractIdentity(record, context) {
  if (!record || typeof record !== 'object' || typeof record.entity_type !== 'string') return null;
  const entry = (context.contracts.index.entities || []).find(item => item && item.entity_type === record.entity_type);
  const fields = entry && Array.isArray(entry.identity_fields) ? entry.identity_fields : [];
  if (fields.length === 0) return null;
  const values = fields.map(field => getPath(record, field));
  if (values.some(value => value === undefined || value === null || value === '')) return null;
  return values;
}

function identityKey(values) {
  return stableJson(values);
}

function supersedesPointer(record) {
  const pointer = record && record.supersedes;
  if (typeof pointer === 'string') return { entity_id: pointer, revision: null };
  if (pointer && typeof pointer === 'object' && !Array.isArray(pointer)) {
    return { entity_id: pointer.entity_id, revision: pointer.revision };
  }
  return null;
}

function latestById(records) {
  const latest = new Map();
  for (const record of records) {
    if (!record || typeof record.entity_id !== 'string' || !Number.isInteger(record.revision)) continue;
    const previous = latest.get(record.entity_id);
    if (!previous || record.revision > previous.revision) latest.set(record.entity_id, record);
  }
  return latest;
}

function findPolicy(records, policyRef) {
  return records.some(record => record && record.entity_id === policyRef && record.entity_type === 'policy_snapshot' && record.status !== 'tombstoned');
}

function referenceValues(record) {
  const values = [];
  const visit = (value, key, location) => {
    if (typeof value === 'string') {
      const isReferenceField = key === 'from' || key === 'to' || key === 'entity_ref' || key === 'parent_ref'
        || key === 'source_ref' || key === 'policy_ref' || /(?:^|_)refs?$/.test(key || '');
      if (isReferenceField && /^[A-Z][A-Z0-9]*(?:-[A-Za-z0-9][A-Za-z0-9._-]*)+$/.test(value)) values.push({ id: value, location });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, key, `${location}[${index}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const child of Object.keys(value)) {
        if (child === 'supersedes') continue;
        visit(value[child], child, `${location}.${child}`);
      }
    }
  };
  visit(record, '', '$');
  return values;
}

function enforceReferencePolicy(records, policy) {
  if (policy === undefined || policy === null || policy === 'full_history') return;
  if (policy !== 'visible_latest') fail('REFERENCE_POLICY_INVALID', 'referencePolicy must be full_history or visible_latest');
  const latest = latestById(records);
  for (const record of records) {
    for (const ref of referenceValues(record)) {
      const target = latest.get(ref.id);
      if (target && target.status === 'tombstoned') {
        fail('REFERENCE_TOMBSTONED', `visible_latest policy rejects a reference to tombstoned ${ref.id}`, { path: ref.location });
      }
    }
  }
}

function enforceAppendGuards(context, state, batch, options = {}) {
  const working = state.records.slice();
  const latest = latestById(working);
  const identities = Object.assign(Object.create(null), state.identities || {});
  const policyPool = working.concat(batch);
  for (const record of batch) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      fail('BATCH_RECORD_INVALID', 'Every transaction batch entry must be a JSON object');
    }
    const id = record.entity_id;
    const revision = record.revision;
    if (typeof id !== 'string' || typeof record.entity_type !== 'string' || !Number.isInteger(revision)) {
      fail('BATCH_RECORD_INVALID', 'Every transaction batch entry must have entity_id, entity_type, and integer revision');
    }
    const previous = latest.get(id);
    const expectedRevision = previous ? previous.revision + 1 : 1;
    if (revision !== expectedRevision) {
      fail('REVISION_NOT_LATEST_PLUS_ONE', `Revision for ${id} must be exactly latest+1`, {
        entityId: id,
        expectedRevision,
        actualRevision: revision,
      });
    }
    if (previous && previous.entity_type !== record.entity_type) {
      fail('ENTITY_TYPE_IMMUTABLE', `Entity type for ${id} cannot change across revisions`);
    }
    if (revision === 1) {
      if (record.supersedes !== null && record.supersedes !== undefined) fail('SUPERSEDES_REVISION_MISMATCH', `Revision 1 for ${id} must not supersede another record`);
    } else {
      const pointer = supersedesPointer(record);
      const expectedTargetRevision = revision - 1;
      if (!pointer || pointer.entity_id !== id || (pointer.revision !== null && pointer.revision !== expectedTargetRevision)) {
        fail('SUPERSEDES_LATEST_REQUIRED', `Revision ${revision} for ${id} must explicitly supersede ${id}@${expectedTargetRevision}`);
      }
      if (pointer.revision === null) {
        // A string supersedes pointer is accepted by A1; the writer still
        // resolves it to the exact previous revision and same entity.
        pointer.revision = expectedTargetRevision;
      }
      if (!previous || previous.revision !== pointer.revision || previous.entity_type !== record.entity_type) {
        fail('SUPERSEDES_LATEST_REQUIRED', `Revision ${revision} for ${id} must supersede the current latest revision`);
      }
    }
    const identity = extractIdentity(record, context);
    const key = identityKeyForRecord(record);
    const previousIdentity = identities[id];
    if (previousIdentity !== undefined && identity !== null && stableJson(previousIdentity) !== stableJson(identity)) {
      fail('IDENTITY_IMMUTABLE', `Canonical identity tuple changed for ${id}`);
    }
    if (identity !== null && previousIdentity === undefined) identities[id] = identity;
    if (previous && previous.status === 'tombstoned' && record.status !== 'tombstoned') {
      const policyRef = options.reactivationPolicyRef || options.tombstonePolicyRef || options.policyRef;
      if (options.allowTombstoneReactivation !== true || typeof policyRef !== 'string' || !findPolicy(policyPool, policyRef)) {
        fail('TOMBSTONE_REACTIVATION_POLICY_REQUIRED', `Reactivation of tombstoned ${id} requires an explicit existing policy reference`);
      }
    }
    working.push(record);
    latest.set(id, record);
  }
  // A non-tombstone record with a fully available identity tuple must never
  // collide with a different entity id, even if the A1 runtime is changed.
  const seenIdentity = new Map();
  for (const record of working) {
    const values = extractIdentity(record, context);
    if (values === null) continue;
    const key = `${record.entity_type}|${stableJson(values)}`;
    const existing = seenIdentity.get(key);
    if (existing && existing !== record.entity_id) fail('IDENTITY_COLLISION', `Canonical identity collides between ${existing} and ${record.entity_id}`);
    seenIdentity.set(key, record.entity_id);
  }
  return { records: working, identities };
}

function identityKeyForRecord(record) {
  if (!record || typeof record !== 'object') return null;
  return typeof record.entity_id === 'string' ? record.entity_id : null;
}

function verifyBatchHash(batch, supplied) {
  const expected = hashRef(supplied, 'batchHash');
  const actual = computeBatchHash(batch);
  if (expected !== actual) fail('BATCH_HASH_MISMATCH', 'batchHash does not match the canonical transaction batch', { expected, actual });
  return expected;
}

function lockAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (_) { return false; }
}

function readLock(context) {
  const raw = readTextIfExists(context, LAYOUT.lock);
  if (raw === null) return null;
  let value;
  try { value = JSON.parse(raw); } catch (_) { fail('LOCK_CORRUPT', 'Registry writer lock is not valid JSON'); }
  if (!isPlainObject(value) || typeof value.token !== 'string' || !Number.isInteger(value.pid)) fail('LOCK_CORRUPT', 'Registry writer lock has invalid metadata');
  return value;
}

function acquireWriterLock(context, options = {}) {
  ensureLayout(context);
  const target = filePath(context, LAYOUT.lock, 'write');
  const token = crypto.randomBytes(16).toString('hex');
  const metadata = {
    format: 'h2dev.registry-writer-lock.v1',
    pid: process.pid,
    token,
    acquiredAt: nowIso(),
  };
  const create = () => {
    const fd = fs.openSync(target, 'wx');
    try {
      fs.writeFileSync(fd, `${stableJson(metadata)}\n`, 'utf8');
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
    return { target, token, metadata };
  };
  try {
    return create();
  } catch (error) {
    if (!error || error.code !== 'EEXIST') fail('LOCK_CREATE_FAILED', 'Unable to create registry writer lock', { cause: error.code || error.message });
    const existing = readLock(context);
    if (existing && lockAlive(existing.pid)) fail('LOCK_HELD', 'Another live registry writer holds the lock', { pid: existing.pid });
    if (options.recoverStaleLock === true) {
      // Explicit recovery is allowed only after a liveness check proved the
      // owner is not running.  Never steal a live writer lock automatically.
      if (existing && lockAlive(existing.pid)) fail('LOCK_HELD', 'A live registry writer lock cannot be stolen', { pid: existing.pid });
      try { fs.unlinkSync(target); } catch (unlinkError) { fail('STALE_LOCK_RECOVERY_FAILED', 'Unable to remove the explicitly approved stale lock', { cause: unlinkError.code || unlinkError.message }); }
      return create();
    }
    fail('LOCK_STALE', 'A registry writer lock exists; explicit stale-lock recovery is required', { pid: existing && existing.pid });
  }
}

function releaseWriterLock(context, lock) {
  if (!lock) return;
  try {
    const current = readLock(context);
    if (!current || current.token !== lock.token) return; // preserve an external edit
    fs.unlinkSync(lock.target);
  } catch (_) {
    // Never overwrite or remove an externally changed lock during cleanup.
  }
}

function appendJournalLine(context, value) {
  const target = filePath(context, LAYOUT.journal, 'write');
  const line = `${stableJson(value)}\n`;
  const fd = fs.openSync(target, 'a');
  try {
    fs.writeSync(fd, line, null, 'utf8');
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  fsyncFile(path.dirname(target));
}

function failpoint(options, name) {
  const configured = options.failpoint || process.env.REGISTRY_STORE_FAILPOINT;
  if (configured === name) fail(`CRASH_${name.replace(/([A-Z])/g, '_$1').toUpperCase()}`, `Synthetic crash failpoint: ${name}`);
}

function transactionResult(commit, state, extra = {}) {
  return {
    committed: true,
    idempotent: Boolean(extra.idempotent),
    commitHash: commit.commitHash,
    headHash: commit.commitHash,
    generationHash: commit.generationHash,
    sequence: commit.sequence,
    batchHash: commit.batchHash,
    idempotencyKey: commit.idempotencyKey,
    previousHeadHash: commit.previousCommitHash,
    recordsTotal: commit.generation.records.length,
    recordsAdded: extra.recordsAdded,
    schemaFingerprint: state.schemaFingerprint,
  };
}

function appendTransaction(options = {}) {
  const context = makeContext(options);
  const batch = normalizeRecords(options.records ?? options.batch);
  const idempotencyKey = normalizeKey(options.idempotencyKey ?? options.idempotency_key);
  const expectedHead = normalizeExpectedHead(options.expectedHead ?? options.expected_head);
  const batchHash = verifyBatchHash(batch, options.batchHash ?? options.batch_hash);
  // Reject malformed entries before any initialization, lock, idempotency
  // lookup, or guard selection. Cross-record references are checked later
  // against the complete unfiltered history candidate.
  validateUnfilteredBatchEntries(context, batch);
  assertWriteAuthority(context, options);
  const preflight = loadState(context);
  const preflightCommit = preflight.idempotency.get(idempotencyKey);
  if (preflightCommit && preflightCommit.batchHash !== batchHash) {
    fail('IDEMPOTENCY_CONFLICT', 'idempotencyKey was already used for a different batch');
  }
  if (!preflightCommit) validateUnfilteredAppend(context, preflight, batch);
  // First use is an explicit write-side bootstrap.  Read/dry-run/recovery
  // paths never call this function and therefore never provision namespaces.
  initializeStore(options);
  const lock = acquireWriterLock(context, options);
  try {
    const before = loadState(context);
    const previousCommit = before.idempotency.get(idempotencyKey);
    if (previousCommit) {
      if (previousCommit.batchHash !== batchHash) fail('IDEMPOTENCY_CONFLICT', 'idempotencyKey was already used for a different batch');
      return transactionResult(previousCommit, before, { idempotent: true, recordsAdded: 0 });
    }
    if (before.headHash !== expectedHead) {
      fail('EXPECTED_HEAD_MISMATCH', 'expectedHead does not match the current store head', {
        expectedHead,
        actualHead: before.headHash,
      });
    }
    validateUnfilteredAppend(context, before, batch);
    const guarded = enforceAppendGuards(context, before, batch, options);
    enforceReferencePolicy(guarded.records, options.referencePolicy || 'full_history');
    const validation = validateRegistry(guarded.records, { contracts: context.contracts });
    if (!validation.valid) {
      fail('BATCH_VALIDATION_FAILED', 'The complete history plus transaction batch is invalid', {
        errorCodes: validation.errors.map(error => error.code),
      });
    }
    // Re-read under the lock immediately before publication.  A second local
    // writer cannot pass the lock; this check protects against external edits
    // and leaves an uncommitted generation behind instead of overwriting them.
    const reread = loadState(context);
    if (reread.headHash !== before.headHash || reread.journalHash !== before.journalHash) {
      fail('EXTERNAL_STATE_CHANGED', 'Registry journal changed while the transaction was prepared');
    }
    const sequence = reread.sequence + 1;
    const createdAt = options.createdAt || nowIso();
    const generation = {
      format: GENERATION_FORMAT,
      sequence,
      previousHeadHash: reread.headHash,
      previousGenerationHash: reread.generationHash,
      schemaFingerprint: context.schemaFingerprint,
      records: guarded.records.sort(canonicalRecordSort),
      identities: guarded.identities,
      transaction: {
        operation: options.operation || 'append',
        idempotencyKey,
        batchHash,
        reason: options.reason || null,
        compensatesCommit: options.compensatesCommit || null,
      },
    };
    const generationHash = sha256(generation);
    const generationRelative = `_private/registry/generations/generation-${String(sequence).padStart(10, '0')}-${generationHash}.json`;
    const commitCore = {
      format: COMMIT_FORMAT,
      sequence,
      previousCommitHash: reread.headHash,
      generationHash,
      batchHash,
      idempotencyKey,
      createdAt,
      schemaFingerprint: context.schemaFingerprint,
    };
    const commit = { ...commitCore, commitHash: sha256(commitCore) };
    const stageToken = crypto.randomBytes(16).toString('hex');
    const stageRelative = `_private/registry/staging/txn-${stageToken}.json`;
    // The stage is private and immutable audit evidence.  Leaving it in place
    // after commit lets recovery distinguish committed from orphan work.
    writeImmutableJson(context, stageRelative, {
      format: 'h2dev.registry-stage.v1',
      preparedAt: nowIso(),
      generationRelative,
      generationHash,
      commit,
    });
    writeImmutableJson(context, generationRelative, generation);
    failpoint(options, 'beforeCommit');
    const commitCheck = loadState(context);
    if (commitCheck.headHash !== reread.headHash || commitCheck.journalHash !== reread.journalHash) {
      fail('EXTERNAL_STATE_CHANGED', 'Registry journal changed before commit marker publication');
    }
    appendJournalLine(context, commit);
    failpoint(options, 'afterCommit');
    return transactionResult({ ...commit, generation }, commitCheck, { idempotent: false, recordsAdded: batch.length });
  } finally {
    releaseWriterLock(context, lock);
  }
}

function readStore(options = {}) {
  const context = makeContext(options);
  const state = loadState(context);
  return {
    format: state.format,
    status: state.status,
    initialized: state.initialized,
    headHash: state.headHash,
    generationHash: state.generationHash,
    sequence: state.sequence,
    records: cloneJson(state.records),
    identities: cloneJson(state.identities),
    commits: state.commits.map(commit => ({
      sequence: commit.sequence,
      commitHash: commit.commitHash,
      generationHash: commit.generationHash,
      batchHash: commit.batchHash,
      idempotencyKey: commit.idempotencyKey,
      previousCommitHash: commit.previousCommitHash,
      createdAt: commit.createdAt,
      schemaFingerprint: commit.schemaFingerprint,
    })),
    journalHash: state.journalHash,
    journalBytes: state.journalBytes,
    schemaFingerprint: state.schemaFingerprint,
    orphans: [...state.orphans],
  };
}

function dryRunTransaction(options = {}) {
  const context = makeContext(options);
  const batch = normalizeRecords(options.records ?? options.batch);
  const idempotencyKey = normalizeKey(options.idempotencyKey ?? options.idempotency_key);
  const expectedHead = normalizeExpectedHead(options.expectedHead ?? options.expected_head);
  const batchHash = verifyBatchHash(batch, options.batchHash ?? options.batch_hash);
  const state = loadState(context);
  let prior = null;
  let nextRecords = state.records;
  let errors = [];
  try {
    // Perform the per-entry validation before looking up idempotency. A
    // malformed retry is invalid input, never a successful prior transaction.
    validateUnfilteredBatchEntries(context, batch);
  } catch (error) {
    if (error instanceof RegistryStoreError) errors = [{ code: error.code, path: '$', message: error.message }];
    else throw error;
  }
  if (errors.length === 0) {
    prior = state.idempotency.get(idempotencyKey);
    if (prior && prior.batchHash !== batchHash) fail('IDEMPOTENCY_CONFLICT', 'idempotencyKey was already used for a different batch');
    if (!prior && state.headHash !== expectedHead) fail('EXPECTED_HEAD_MISMATCH', 'expectedHead does not match the current store head', { expectedHead, actualHead: state.headHash });
  }
  if (!prior && errors.length === 0) {
    try {
      const unfiltered = validateUnfilteredAppend(context, state, batch, { throwOnInvalid: false });
      errors = unfiltered.errors;
      if (unfiltered.valid) {
        const guarded = enforceAppendGuards(context, state, batch, options);
        enforceReferencePolicy(guarded.records, options.referencePolicy || 'full_history');
        const validation = validateRegistry(guarded.records, { contracts: context.contracts });
        errors = validation.errors;
        nextRecords = guarded.records;
      }
    } catch (error) {
      if (error instanceof RegistryStoreError) errors = [{ code: error.code, path: '$', message: error.message }];
      else throw error;
    }
  }
  return {
    dryRun: true,
    status: state.status,
    initialized: state.initialized,
    valid: prior ? true : errors.length === 0,
    idempotent: Boolean(prior),
    wouldCommit: !prior && errors.length === 0,
    expectedHead,
    actualHead: state.headHash,
    batchHash,
    idempotencyKey,
    nextSequence: prior ? state.sequence : state.sequence + 1,
    errors,
    before: {
      headHash: state.headHash,
      sequence: state.sequence,
      recordsTotal: state.records.length,
    },
    after: {
      headHash: prior ? state.headHash : errors.length === 0 ? '<computed-at-apply>' : state.headHash,
      sequence: prior ? state.sequence : errors.length === 0 ? state.sequence + 1 : state.sequence,
      recordsTotal: nextRecords.length,
    },
    schemaFingerprint: state.schemaFingerprint,
  };
}

function recoverStore(options = {}) {
  const context = makeContext(options);
  const state = loadState(context);
  const staged = [];
  const stagingDir = path.join(context.root, LAYOUT.staging.replaceAll('/', path.sep));
  if (fs.existsSync(stagingDir)) {
    safePrivatePath(context, '_private/registry/staging/layout.guard', 'write');
    for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json') || !entry.name.startsWith('txn-')) continue;
      const relative = `_private/registry/staging/${entry.name}`;
      const raw = readTextIfExists(context, relative);
      try {
        const item = JSON.parse(raw);
        staged.push({ file: relative, generationHash: item.generationHash, committed: state.commits.some(commit => commit.generationHash === item.generationHash) });
      } catch (_) {
        fail('STAGING_CORRUPT', `Registry staging artifact is not valid JSON: ${relative}`);
      }
    }
  }
  return {
    recovery: true,
    status: state.status,
    initialized: state.initialized,
    headHash: state.headHash,
    sequence: state.sequence,
    committedSequences: state.commits.map(commit => commit.sequence),
    staged,
    orphans: state.orphans,
    action: 'NO_OVERWRITE_NO_DELETE',
  };
}

module.exports = {
  STORE_FORMAT,
  GENERATION_FORMAT,
  COMMIT_FORMAT,
  GENESIS,
  LAYOUT,
  INITIALIZATION_DIRECTORIES,
  ENTITY_TYPES,
  RegistryStoreError,
  stableJson,
  sha256,
  hashRef,
  cloneJson,
  computeBatchHash,
  schemaFingerprint,
  makeContext,
  initializeStore,
  safePrivatePath,
  normalizeRecords,
  acquireWriterLock,
  releaseWriterLock,
  loadState,
  appendTransaction,
  dryRunTransaction,
  readStore,
  recoverStore,
  enforceAppendGuards,
  extractIdentity,
};
