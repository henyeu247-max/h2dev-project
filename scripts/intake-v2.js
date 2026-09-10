'use strict';

/**
 * A4 — deterministic local intake v2.
 *
 * The intake boundary is deliberately narrower than a general file manager:
 * it reads a synthetic fixture tree, validates bytes and paths, and (only
 * with explicit apply permissions) copies the original bytes into the private
 * `_private/intake` quarantine.  It never writes data-tabs, the registry,
 * the ledger, public projections, or provider-facing state.
 *
 * Text is validated, not interpreted.  JSON is parsed only to prove syntax;
 * text/SRT is inspected only for bounded structure.  Binary files are either
 * classified by a small magic allowlist or preserved as NEEDS_ADAPTER.  No
 * archive/document extraction, macro execution, OCR, transcription, or
 * prompt execution exists in this module.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const boundaryApi = require('./security/private-boundary.cjs');
const adapterApi = require('./adapters/index.cjs');

const {
  DEFAULT_PROJECT_ROOT,
  createPrivateBoundary,
  assertPrivateWritePath,
  assertDescendantPath,
} = boundaryApi;

const {
  declaredMimeFor,
  findAdapter,
  isTextMime,
  isUnsupportedOfficeExtension,
  REGISTRY_FORMAT: ADAPTER_REGISTRY_FORMAT,
} = adapterApi;

const RESULT_SCHEMA = 'h2dev.intake-v2.result.v1';
const PLAN_SCHEMA = 'h2dev.intake-v2.plan.v1';
const MANIFEST_SCHEMA = 'h2dev.intake-v2.hash-manifest.v1';
const CHECKPOINT_SCHEMA = 'h2dev.intake-v2.checkpoint.v1';
const PROMOTION_SCHEMA = 'h2dev.intake-v2.registry-promotion-proposal.v1';
const INTAKE_FORMAT = 'h2dev.private-intake.v1';
const NAMESPACE = 'intake';
const HASH_RE = /^[a-f0-9]{64}$/;
const SAFE_RUN_RE = /^[A-Za-z0-9_-]{1,160}$/;
const DEFAULT_LIMITS = Object.freeze({
  maxBytes: 50 * 1024 * 1024,
  maxTextBytes: 5 * 1024 * 1024,
  maxJsonDepth: 64,
  maxJsonNodes: 10000,
  maxSrtCues: 10000,
  maxRetries: 2,
});

const BINARY_MAGIC = Object.freeze([
  Object.freeze({ mime: 'image/png', test: bytes => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) }),
  Object.freeze({ mime: 'image/jpeg', test: bytes => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }),
  Object.freeze({ mime: 'image/gif', test: bytes => bytes.length >= 6 && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a') }),
  Object.freeze({ mime: 'image/webp', test: bytes => bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP' }),
  Object.freeze({ mime: 'application/pdf', test: bytes => bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-' }),
  Object.freeze({ mime: 'application/zip', test: bytes => bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]) }),
  Object.freeze({ mime: 'video/mp4', test: bytes => bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' }),
]);

const TEXT_EXTENSIONS = new Set(['.txt', '.text', '.md', '.markdown', '.csv', '.tsv', '.log', '.vtt']);
const JSON_EXTENSIONS = new Set(['.json']);
const SRT_EXTENSIONS = new Set(['.srt']);
const PARTIAL_EXTENSIONS = new Set(['.partial', '.part', '.crdownload', '.tmp']);

const ERROR_MESSAGES = Object.freeze({
  A4_ROOT_REQUIRED: 'A4 requires an explicit synthetic fixture project root',
  A4_SYNTHETIC_ONLY: 'A4 execution is restricted to an explicitly synthetic fixture root',
  INPUT_ROOT_REQUIRED: 'An input fixture directory is required',
  INPUT_ROOT_INVALID: 'The input fixture directory is invalid or outside the synthetic project root',
  INPUT_ROOT_LINK: 'The input fixture directory contains a link or junction',
  INPUT_OUTSIDE_PROJECT: 'Input files must remain below the synthetic project root',
  INPUT_PRIVATE_RECURSION: 'The input fixture directory must be dedicated and must not include the private intake quarantine',
  PATH_TYPE: 'Input relative path must be a string',
  PATH_EMPTY: 'Input relative path must not be empty',
  PATH_NUL: 'Input relative path contains a NUL byte',
  PATH_CONTROL: 'Input relative path contains a control character',
  PATH_ABSOLUTE: 'Input relative path must not be absolute or drive-qualified',
  PATH_TRAVERSAL: 'Input relative path contains a traversal segment',
  PATH_ADS: 'Input relative path contains an alternate-data-stream delimiter',
  PATH_CHARACTER: 'Input relative path contains a reserved character',
  PATH_LINK: 'Input file path contains a link or junction ancestor',
  SOURCE_NOT_REGULAR: 'Input path is not a regular file',
  SOURCE_MISSING: 'Input source disappeared before it could be read',
  SOURCE_READ_FAILED: 'Input source could not be read',
  SOURCE_CHANGED: 'Input source changed while it was being read',
  PARTIAL_INPUT: 'Input is marked as a partial or unfinished artifact',
  ZERO_BYTE_INPUT: 'Zero-byte input is rejected',
  INPUT_TOO_LARGE: 'Input exceeds the configured size limit',
  INVALID_UTF8: 'Text input is not valid UTF-8',
  MIME_MISMATCH: 'Declared file type does not match safe content magic',
  MALFORMED_JSON: 'JSON input failed deterministic parsing',
  JSON_LIMIT: 'JSON input exceeds the bounded structure limit',
  MALFORMED_SRT: 'SRT input failed deterministic cue validation',
  UNSUPPORTED_ADAPTER: 'No safe adapter is available; original bytes require review',
  ARCHIVE_UNSUPPORTED: 'Archive or Office input is preserve-only; extraction is disabled',
  DOCUMENT_UNSUPPORTED: 'Document input is preserve-only; parsing is disabled',
  PRIVATE_ROOT_LINK: 'The private intake root contains a link or junction',
  PRIVATE_ROOT_CREATE_FAILED: 'The private intake quarantine could not be provisioned',
  APPLY_REQUIRED: 'Apply requires the explicit intake write permission',
  ROOT_WRITE_FORBIDDEN: 'The real project root is never an A4 synthetic target',
  IDEMPOTENCY_KEY_INVALID: 'Idempotency key is missing or invalid',
  IDEMPOTENCY_KEY_CONFLICT: 'Idempotency key is already bound to a different input hash',
  INPUT_HASH_DRIFT: 'Input hash changed since the checkpoint or prior run',
  DESTINATION_HASH_MISMATCH: 'Existing quarantine bytes do not match the source hash',
  PARTIAL_COPY: 'Quarantine copy did not produce the expected stable hash',
  COPY_FAILED: 'Input could not be copied into the private quarantine',
  CHECKPOINT_WRITE_FAILED: 'Intake checkpoint could not be written',
  MANIFEST_WRITE_FAILED: 'Intake manifest could not be written',
  INTAKE_LOCK_HELD: 'Another local intake writer owns this run checkpoint',
  INTERRUPTED: 'Synthetic interruption left a resumable intake checkpoint',
  EXISTING_STATE_INVALID: 'Existing intake state is not a valid deterministic manifest',
  PROMOTION_INPUT_REQUIRED: 'A promotion proposal requires a plan or intake result',
});

const TRANSIENT_IO_CODES = new Set(['EAGAIN', 'EBUSY', 'EINTR', 'EIO', 'EMFILE', 'ENFILE', 'ETIMEDOUT']);

class IntakeError extends Error {
  constructor(code, details = {}, options = {}) {
    super(ERROR_MESSAGES[code] || 'A4 intake operation failed');
    this.name = 'IntakeError';
    this.code = code;
    this.retryClass = options.retryClass || 'DETERMINISTIC';
    this.transient = this.retryClass === 'TRANSIENT_IO';
    this.details = details && typeof details === 'object' ? details : {};
  }
}

function fail(code, details, options) {
  throw new IntakeError(code, details, options);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stableJson(value, location = '$', seen = new WeakSet()) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('JSON_LIMIT', { location });
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') fail('JSON_LIMIT', { location });
  if (seen.has(value)) fail('JSON_LIMIT', { location });
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = `[${value.map((item, index) => stableJson(item, `${location}[${index}]`, seen)).join(',')}]`;
  } else {
    if (!isPlainObject(value)) fail('JSON_LIMIT', { location });
    const keys = Object.keys(value).sort();
    result = `{${keys.map(key => `${JSON.stringify(key)}:${stableJson(value[key], `${location}.${key}`, seen)}`).join(',')}}`;
  }
  seen.delete(value);
  return result;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sha256Ref(value) {
  return `sha256:${value}`;
}

function nowIso(options = {}) {
  if (typeof options.asOf === 'string' && options.asOf.length > 0) return options.asOf;
  return new Date().toISOString();
}

function normalizeRelativePath(value) {
  if (typeof value !== 'string') fail('PATH_TYPE');
  if (value.length === 0) fail('PATH_EMPTY');
  if (value.includes('\u0000')) fail('PATH_NUL');
  if (/[\u0001-\u001f\u007f]/.test(value)) fail('PATH_CONTROL');
  if (path.isAbsolute(value) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || /^[A-Za-z]:/.test(value) || /^[\\/]{2}/.test(value)) {
    fail('PATH_ABSOLUTE');
  }
  if (value.includes(':')) fail('PATH_ADS');
  if (/[<>"|?*]/.test(value)) fail('PATH_CHARACTER');
  const segments = value.split(/[\\/]/);
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) fail('PATH_TRAVERSAL');
  return segments.join('/');
}

function normalizedAbsolute(value) {
  const normal = path.normalize(path.resolve(value));
  return process.platform === 'win32' ? normal.toLowerCase() : normal;
}

function isSameOrDescendant(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function inspectNoLinks(root, candidate, options = {}) {
  const rootAbs = path.resolve(root);
  const candidateAbs = path.resolve(candidate);
  if (!isSameOrDescendant(candidateAbs, rootAbs)) fail(options.outsideCode || 'INPUT_OUTSIDE_PROJECT');
  let relative = path.relative(rootAbs, candidateAbs);
  const parts = relative ? relative.split(path.sep) : [];
  let current = rootAbs;
  const includeTarget = options.includeTarget !== false;
  const limit = includeTarget ? parts.length : Math.max(0, parts.length - 1);
  for (let index = 0; index <= limit; index += 1) {
    if (index === 0 && !fs.existsSync(current)) fail(options.missingCode || 'SOURCE_MISSING');
    if (index > 0) current = path.join(current, parts[index - 1]);
    let stats;
    try { stats = fs.lstatSync(current); } catch (error) {
      if (error && error.code === 'ENOENT') fail(options.missingCode || 'SOURCE_MISSING');
      fail(options.readCode || 'SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' });
    }
    if (stats.isSymbolicLink()) fail(options.linkCode || 'PATH_LINK');
    let real;
    try { real = fs.realpathSync.native(current); } catch (error) {
      fail(options.readCode || 'SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' });
    }
    if (normalizedAbsolute(real) !== normalizedAbsolute(current)) fail(options.linkCode || 'PATH_LINK');
    if (index < limit && !stats.isDirectory()) fail(options.notDirectoryCode || 'INPUT_ROOT_INVALID');
  }
  return candidateAbs;
}

function assertSyntheticRoot(options = {}) {
  if (!isPlainObject(options) || typeof options.projectRoot !== 'string' || options.projectRoot.length === 0) fail('A4_ROOT_REQUIRED');
  if (options.allowSyntheticRoot !== true && options.syntheticFixtureRoot !== true) fail('A4_SYNTHETIC_ONLY');
  const requested = normalizedAbsolute(options.projectRoot);
  if (requested === normalizedAbsolute(DEFAULT_PROJECT_ROOT)) fail('ROOT_WRITE_FORBIDDEN');
  let boundary;
  try {
    boundary = createPrivateBoundary({ projectRoot: options.projectRoot, allowSyntheticRoot: true });
  } catch (error) {
    if (error && error.code === 'BOUNDARY_TYPE') throw error;
    fail('A4_SYNTHETIC_ONLY');
  }
  return boundary;
}

function resolveInputRoot(boundary, inputRoot) {
  if (typeof inputRoot !== 'string' || inputRoot.length === 0) fail('INPUT_ROOT_REQUIRED');
  let resolved;
  try {
    if (path.isAbsolute(inputRoot) || path.posix.isAbsolute(inputRoot) || path.win32.isAbsolute(inputRoot) || /^[A-Za-z]:/.test(inputRoot)) {
      resolved = path.resolve(inputRoot);
    } else {
      const isProjectRootAlias = inputRoot === '.' || inputRoot === './' || inputRoot === '.\\';
      const withoutSafePrefix = inputRoot.replace(/^(?:\.\/|\.\\)+/, '');
      if (isProjectRootAlias || withoutSafePrefix === '') resolved = boundary.canonicalProjectRoot;
      else {
        const relative = normalizeRelativePath(withoutSafePrefix);
        resolved = path.resolve(boundary.canonicalProjectRoot, ...relative.split('/'));
      }
    }
    assertDescendantPath(boundary.canonicalProjectRoot, resolved, { allowRoot: true });
    inspectNoLinks(boundary.canonicalProjectRoot, resolved, {
      linkCode: 'INPUT_ROOT_LINK', missingCode: 'INPUT_ROOT_INVALID', notDirectoryCode: 'INPUT_ROOT_INVALID',
    });
    const stats = fs.lstatSync(resolved);
    if (!stats.isDirectory()) fail('INPUT_ROOT_INVALID');
    const intakeRoot = path.join(boundary.canonicalProjectRoot, '_private', 'intake');
    // A project-root input such as `.` would include the quarantine created by
    // a prior apply and recursively ingest its own manifests/payloads.  A4
    // therefore requires a dedicated source subtree that is neither inside
    // the quarantine nor an ancestor of it.
    if (isSameOrDescendant(resolved, intakeRoot) || isSameOrDescendant(intakeRoot, resolved)) fail('INPUT_PRIVATE_RECURSION');
  } catch (error) {
    if (error instanceof IntakeError) throw error;
    if (error && error.code === 'TRAVERSAL_SEGMENT') fail('PATH_TRAVERSAL');
    fail('INPUT_ROOT_INVALID');
  }
  return resolved;
}

function sortedEntries(directory) {
  try {
    return fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => {
      const a = left.name.normalize('NFC');
      const b = right.name.normalize('NFC');
      return a < b ? -1 : (a > b ? 1 : 0);
    });
  } catch (error) {
    fail('SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' });
  }
}

function walkInput(root) {
  const files = [];
  const issues = [];
  const visit = (directory, relativeDirectory) => {
    let entries;
    try { entries = sortedEntries(directory); } catch (error) {
      issues.push({ relativePath: relativeDirectory || '.', error: error instanceof IntakeError ? error : new IntakeError('SOURCE_READ_FAILED') });
      return;
    }
    for (const entry of entries) {
      const relative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      let safeRelative;
      try { safeRelative = normalizeRelativePath(relative); } catch (error) {
        issues.push({ relativePath: relative, error });
        continue;
      }
      const absolute = path.join(root, ...safeRelative.split('/'));
      let stats;
      try { stats = fs.lstatSync(absolute); } catch (error) {
        issues.push({ relativePath: safeRelative, error: new IntakeError('SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' }) });
        continue;
      }
      if (stats.isSymbolicLink()) {
        issues.push({ relativePath: safeRelative, error: new IntakeError('PATH_LINK') });
        continue;
      }
      try {
        const real = fs.realpathSync.native(absolute);
        if (normalizedAbsolute(real) !== normalizedAbsolute(absolute)) {
          issues.push({ relativePath: safeRelative, error: new IntakeError('PATH_LINK') });
          continue;
        }
      } catch (error) {
        issues.push({ relativePath: safeRelative, error: new IntakeError('SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' }) });
        continue;
      }
      if (stats.isDirectory()) visit(absolute, safeRelative);
      else if (stats.isFile()) files.push({ absolute, relativePath: safeRelative });
      else issues.push({ relativePath: safeRelative, error: new IntakeError('SOURCE_NOT_REGULAR') });
    }
  };
  visit(root, '');
  files.sort((left, right) => left.relativePath < right.relativePath ? -1 : (left.relativePath > right.relativePath ? 1 : 0));
  issues.sort((left, right) => left.relativePath < right.relativePath ? -1 : (left.relativePath > right.relativePath ? 1 : 0));
  return { files, issues };
}

function magicMime(bytes) {
  for (const item of BINARY_MAGIC) if (item.test(bytes)) return item.mime;
  return null;
}

function tryDecodeUtf8(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (_) {
    return null;
  }
}

function detectMime(bytes, extension) {
  const magic = magicMime(bytes);
  if (magic) return magic;
  if (tryDecodeUtf8(bytes) !== null) {
    if (extension === '.json') return 'application/json';
    if (extension === '.srt') return 'application/x-subrip';
    return 'text/plain';
  }
  return 'application/octet-stream';
}

function mimeCompatible(declaredMime, detectedMime, extension) {
  if (declaredMime === 'application/octet-stream') return true;
  if (declaredMime === detectedMime) return true;
  if (isTextMime(declaredMime) && detectedMime === 'text/plain') return true;
  // An undecodable text file has no trustworthy magic.  Let the fatal UTF-8
  // decoder report INVALID_UTF8 instead of masking it as a MIME mismatch.
  if (isTextMime(declaredMime) && detectedMime === 'application/octet-stream') return true;
  if ((declaredMime === 'application/json' || declaredMime === 'application/x-subrip') && detectedMime === 'application/octet-stream') return true;
  // JSON/SRT have no binary magic; their parser is the content check.
  if (JSON_EXTENSIONS.has(extension) && detectedMime === 'application/json') return true;
  if (SRT_EXTENSIONS.has(extension) && detectedMime === 'application/x-subrip') return true;
  return false;
}

function checkJsonShape(value, limits, state = { depth: 0, nodes: 0 }) {
  state.nodes += 1;
  if (state.nodes > limits.maxJsonNodes) fail('JSON_LIMIT');
  if (value === null || typeof value !== 'object') return;
  state.depth += 1;
  if (state.depth > limits.maxJsonDepth) fail('JSON_LIMIT');
  const values = Array.isArray(value) ? value : Object.keys(value).sort().map(key => value[key]);
  for (const child of values) checkJsonShape(child, limits, state);
  state.depth -= 1;
}

function validateSrt(text, limits) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
  let index = 0;
  let cues = 0;
  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') index += 1;
    if (index >= lines.length) break;
    if (!/^\d+$/.test(lines[index].trim())) fail('MALFORMED_SRT');
    index += 1;
    if (index >= lines.length || !/^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}(?:\s+.*)?$/.test(lines[index].trim())) fail('MALFORMED_SRT');
    index += 1;
    let hasText = false;
    while (index < lines.length && lines[index].trim() !== '') {
      hasText = true;
      index += 1;
    }
    if (!hasText) fail('MALFORMED_SRT');
    cues += 1;
    if (cues > limits.maxSrtCues) fail('JSON_LIMIT');
  }
  if (cues === 0) fail('MALFORMED_SRT');
  return cues;
}

function readStableFile(file, limits, options = {}) {
  let lastError;
  for (let attempt = 0; attempt <= limits.maxRetries; attempt += 1) {
    let before;
    try { before = fs.lstatSync(file); } catch (error) {
      if (error && error.code === 'ENOENT') fail('SOURCE_MISSING');
      if (TRANSIENT_IO_CODES.has(error && error.code) && attempt < limits.maxRetries) { lastError = error; continue; }
      fail('SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' });
    }
    if (before.isSymbolicLink() || !before.isFile()) fail('SOURCE_NOT_REGULAR');
    let bytes;
    try { bytes = fs.readFileSync(file); } catch (error) {
      if (TRANSIENT_IO_CODES.has(error && error.code) && attempt < limits.maxRetries) { lastError = error; continue; }
      fail('SOURCE_READ_FAILED', {}, { retryClass: TRANSIENT_IO_CODES.has(error && error.code) ? 'TRANSIENT_IO' : 'DETERMINISTIC' });
    }
    let after;
    try { after = fs.lstatSync(file); } catch (error) { fail('SOURCE_CHANGED'); }
    const beforeMtime = before.mtimeNs !== undefined ? before.mtimeNs : BigInt(Math.trunc(before.mtimeMs * 1000000));
    const afterMtime = after.mtimeNs !== undefined ? after.mtimeNs : BigInt(Math.trunc(after.mtimeMs * 1000000));
    if (before.size !== after.size || beforeMtime !== afterMtime) fail('SOURCE_CHANGED');
    if (bytes.length !== after.size) fail('SOURCE_CHANGED');
    return bytes;
  }
  if (lastError) fail('SOURCE_READ_FAILED', {}, { retryClass: 'TRANSIENT_IO' });
  fail('SOURCE_READ_FAILED');
}

function limitsFrom(options = {}) {
  const limits = { ...DEFAULT_LIMITS };
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    if (options[key] !== undefined) {
      if (!Number.isSafeInteger(options[key]) || options[key] < 0) fail('INPUT_TOO_LARGE');
      limits[key] = options[key];
    }
  }
  return limits;
}

function makeErrorRecord(error) {
  const code = error && error.code ? error.code : 'SOURCE_READ_FAILED';
  return Object.freeze({ code, retry_class: error && error.retryClass ? error.retryClass : 'DETERMINISTIC' });
}

function sourceRecordBase(file, asOf, hash, size, declaredMime, detectedMime, adapter, status, reason, metadata = {}) {
  const identitySeed = `${file.relativePath}\n${hash}`;
  const identity = sha256(identitySeed).slice(0, 24);
  return {
    schema: 'h2dev.intake-record.v2',
    intake_id: `INT-${identity}`,
    identity: {
      type: 'exact-path-and-content',
      key: sha256Ref(sha256(identitySeed)),
    },
    path: file.relativePath,
    hash: hash ? sha256Ref(hash) : null,
    size: size,
    source: {
      relative_path: file.relativePath,
      path_base: 'synthetic-project',
      basename: path.posix.basename(file.relativePath),
      extension: path.posix.extname(file.relativePath).toLowerCase(),
    },
    content_hash: { algorithm: 'sha256', value: hash },
    byte_size: size,
    declared_mime: declaredMime,
    detected_mime: detectedMime,
    adapter: adapter || null,
    adapter_registry: ADAPTER_REGISTRY_FORMAT,
    status,
    reason: reason || null,
    sensitivity: 'restricted',
    rights: { status: 'UNKNOWN', evidence_refs: [] },
    retention: { status: 'UNKNOWN', policy_ref: null },
    provenance: {
      status: 'RECORDED',
      source_locator: { type: 'file_path', value: file.relativePath, path_base: 'synthetic-project' },
      method: 'direct',
      input_hashes: [sha256Ref(hash)],
      observed_at: asOf,
    },
    as_of: asOf,
    metadata,
    errors: [],
    quarantine: { relative_path: null, copied: false, source_preserved: false },
  };
}

function classifyFile(file, options, asOf, limits) {
  const extension = path.posix.extname(file.relativePath).toLowerCase();
  let bytes;
  try {
    inspectNoLinks(options.inputRoot, file.absolute, { linkCode: 'PATH_LINK', missingCode: 'SOURCE_MISSING' });
    const stats = fs.lstatSync(file.absolute);
    if (stats.size === 0) {
      const record = sourceRecordBase(file, asOf, sha256(Buffer.alloc(0)), 0, declaredMimeFor(extension), 'application/octet-stream', null, 'REJECTED', 'ZERO_BYTE_INPUT');
      record.errors.push(makeErrorRecord(new IntakeError('ZERO_BYTE_INPUT')));
      return { record, bytes: null };
    }
    if (stats.size > limits.maxBytes) {
      const record = sourceRecordBase(file, asOf, null, stats.size, declaredMimeFor(extension), 'unknown', null, 'REJECTED', 'INPUT_TOO_LARGE');
      record.errors.push(makeErrorRecord(new IntakeError('INPUT_TOO_LARGE')));
      return { record, bytes: null };
    }
    bytes = readStableFile(file.absolute, limits);
  } catch (error) {
    const record = sourceRecordBase(file, asOf, null, null, declaredMimeFor(extension), 'unknown', null, 'REJECTED', error.code || 'SOURCE_READ_FAILED');
    record.errors.push(makeErrorRecord(error));
    return { record, bytes: null };
  }

  const hash = sha256(bytes);
  const size = bytes.length;
  const declaredMime = declaredMimeFor(extension);
  const detectedMime = detectMime(bytes, extension);
  const definition = findAdapter({ extension, declaredMime, detectedMime });
  let adapter = definition ? definition.adapter : null;
  let status = 'NEEDS_REVIEW';
  let reason = 'RIGHTS_RETENTION_REVIEW_REQUIRED';
  const metadata = { classification: definition ? definition.kind : 'unknown', metadata_only: false };
  const record = sourceRecordBase(file, asOf, hash, size, declaredMime, detectedMime, adapter, status, reason, metadata);

  if (PARTIAL_EXTENSIONS.has(extension)) {
    record.status = 'REJECTED';
    record.reason = 'PARTIAL_INPUT';
    record.errors.push(makeErrorRecord(new IntakeError('PARTIAL_INPUT')));
    return { record, bytes };
  }

  if (!mimeCompatible(declaredMime, detectedMime, extension)) {
    record.status = 'REJECTED';
    record.reason = 'MIME_MISMATCH';
    record.errors.push(makeErrorRecord(new IntakeError('MIME_MISMATCH')));
    return { record, bytes };
  }

  const textExpected = JSON_EXTENSIONS.has(extension) || SRT_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension) || isTextMime(declaredMime);
  let text = null;
  if (textExpected) {
    if (size > limits.maxTextBytes) {
      record.status = 'REJECTED';
      record.reason = 'INPUT_TOO_LARGE';
      record.errors.push(makeErrorRecord(new IntakeError('INPUT_TOO_LARGE')));
      return { record, bytes };
    }
    text = tryDecodeUtf8(bytes);
    if (text === null) {
      record.status = 'REJECTED';
      record.reason = 'INVALID_UTF8';
      record.errors.push(makeErrorRecord(new IntakeError('INVALID_UTF8')));
      return { record, bytes };
    }
    if (text.includes('\u0000')) {
      record.status = 'REJECTED';
      record.reason = 'MIME_MISMATCH';
      record.errors.push(makeErrorRecord(new IntakeError('MIME_MISMATCH')));
      return { record, bytes };
    }
  }

  try {
    if (extension === '.json') {
      let parsed;
      try { parsed = JSON.parse(text); } catch (_) { fail('MALFORMED_JSON'); }
      checkJsonShape(parsed, limits);
      record.metadata.parsed_type = Array.isArray(parsed) ? 'array' : (parsed === null ? 'null' : typeof parsed);
      record.metadata.metadata_only = true;
    } else if (extension === '.srt') {
      record.metadata.cue_count = validateSrt(text, limits);
      record.metadata.metadata_only = true;
    } else if (TEXT_EXTENSIONS.has(extension) || isTextMime(declaredMime)) {
      record.metadata.character_count = text.length;
      record.metadata.metadata_only = true;
    }
  } catch (error) {
    record.status = 'REJECTED';
    record.reason = error.code || 'SOURCE_READ_FAILED';
    record.errors.push(makeErrorRecord(error));
    return { record, bytes };
  }

  if (definition && definition.adapter === 'binary-metadata') {
    record.metadata.metadata_only = true;
    record.reason = 'METADATA_ONLY_RIGHTS_RETENTION_REVIEW';
  } else if (definition && definition.adapter === 'unsupported-archive') {
    record.status = 'NEEDS_ADAPTER';
    record.reason = 'ARCHIVE_OR_OFFICE_UNSUPPORTED';
    record.errors.push(makeErrorRecord(new IntakeError('ARCHIVE_UNSUPPORTED')));
    record.metadata.preserve_only = true;
  } else if (definition && definition.adapter === 'unsupported-document') {
    record.status = 'NEEDS_ADAPTER';
    record.reason = 'DOCUMENT_UNSUPPORTED';
    record.errors.push(makeErrorRecord(new IntakeError('DOCUMENT_UNSUPPORTED')));
    record.metadata.preserve_only = true;
  } else if (!definition) {
    record.status = 'NEEDS_ADAPTER';
    record.reason = 'UNSUPPORTED_ADAPTER';
    record.adapter = null;
    record.errors.push(makeErrorRecord(new IntakeError('UNSUPPORTED_ADAPTER')));
    record.metadata.preserve_only = true;
  }
  return { record, bytes };
}

function issueRecord(issue, asOf) {
  const relativePath = typeof issue.relativePath === 'string' ? issue.relativePath : null;
  const seed = relativePath || 'unknown';
  const record = {
    schema: 'h2dev.intake-record.v2',
    intake_id: `INT-${sha256(seed).slice(0, 24)}`,
    identity: { type: 'unresolved-source-path', key: null },
    path: relativePath,
    hash: null,
    size: null,
    source: { relative_path: relativePath, path_base: 'synthetic-project' },
    content_hash: null,
    byte_size: null,
    declared_mime: relativePath ? declaredMimeFor(path.posix.extname(relativePath).toLowerCase()) : 'unknown',
    detected_mime: 'unknown',
    adapter: null,
    adapter_registry: ADAPTER_REGISTRY_FORMAT,
    status: issue.error && issue.error.code === 'PATH_LINK' ? 'REJECTED' : 'NEEDS_REVIEW',
    reason: issue.error && issue.error.code ? issue.error.code : 'SOURCE_READ_FAILED',
    sensitivity: 'restricted',
    rights: { status: 'UNKNOWN', evidence_refs: [] },
    retention: { status: 'UNKNOWN', policy_ref: null },
    provenance: { status: 'MISSING', source_locator: relativePath ? { type: 'file_path', value: relativePath, path_base: 'synthetic-project' } : null, method: 'direct', input_hashes: [], observed_at: asOf },
    as_of: asOf,
    metadata: {},
    errors: [makeErrorRecord(issue.error)],
    quarantine: { relative_path: null, copied: false, source_preserved: false },
  };
  return record;
}

function validateIdempotencyKey(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 512 || /[\u0000-\u001f\u007f]/.test(value)) fail('IDEMPOTENCY_KEY_INVALID');
  return value;
}

function buildInputHash(records) {
  const summary = records.map(record => ({
    relative_path: record.source.relative_path,
    content_hash: record.content_hash ? record.content_hash.value : null,
    byte_size: record.byte_size,
    status: record.status,
    reason: record.reason,
  }));
  return sha256(stableJson(summary));
}

function addDuplicateCandidates(records) {
  const byHash = new Map();
  for (const record of records) {
    if (!record.content_hash || !HASH_RE.test(record.content_hash.value)) continue;
    const list = byHash.get(record.content_hash.value) || [];
    list.push(record);
    byHash.set(record.content_hash.value, list);
  }
  const duplicateGroups = [];
  for (const [hash, group] of byHash.entries()) {
    if (group.length < 2) continue;
    const ids = group.map(record => record.intake_id).sort();
    duplicateGroups.push({ content_hash: sha256Ref(hash), intake_ids: ids, merge: 'NEVER_AUTOMATIC' });
    for (const record of group) record.duplicate_candidates = ids.filter(id => id !== record.intake_id);
  }
  duplicateGroups.sort((left, right) => left.content_hash.localeCompare(right.content_hash));
  return duplicateGroups;
}

function assignQuarantinePaths(records, runId) {
  records.forEach((record, index) => {
    const suffix = record.source.relative_path ? path.posix.basename(record.source.relative_path).normalize('NFC').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 64) : 'unresolved';
    record.quarantine.relative_path = `runs/${runId}/quarantine/${String(index).padStart(5, '0')}-${suffix || 'input'}`;
  });
}

function makePlan(options = {}) {
  const boundary = assertSyntheticRoot(options);
  const inputRoot = resolveInputRoot(boundary, options.inputRoot);
  const limits = limitsFrom(options);
  const asOf = nowIso(options);
  const walked = walkInput(inputRoot);
  const records = [];
  for (const file of walked.files) records.push(classifyFile(file, { ...options, inputRoot }, asOf, limits).record);
  for (const issue of walked.issues) records.push(issueRecord(issue, asOf));
  records.sort((left, right) => String(left.source.relative_path).localeCompare(String(right.source.relative_path)));
  const duplicateGroups = addDuplicateCandidates(records);
  const inputHash = buildInputHash(records);
  const suppliedKey = validateIdempotencyKey(options.idempotencyKey);
  const idempotencyKey = suppliedKey || `intake:${inputHash}`;
  const runId = `RUN-${sha256(`${idempotencyKey}\n${inputHash}`).slice(0, 32)}`;
  if (!SAFE_RUN_RE.test(runId)) fail('IDEMPOTENCY_KEY_INVALID');
  assignQuarantinePaths(records, runId);
  const counts = {};
  for (const record of records) counts[record.status] = (counts[record.status] || 0) + 1;
  const hasFatal = records.some(record => record.status === 'REJECTED' && ['PATH_LINK', 'SOURCE_READ_FAILED', 'SOURCE_MISSING'].includes(record.reason));
  return {
    schema: PLAN_SCHEMA,
    ticket: 'A4',
    contract: INTAKE_FORMAT,
    mode: 'DRY_RUN',
    valid: !hasFatal,
    status: hasFatal ? 'NEEDS_REVIEW' : (records.some(record => record.status === 'NEEDS_ADAPTER') ? 'NEEDS_ADAPTER' : 'NEEDS_REVIEW'),
    input_hash: sha256Ref(inputHash),
    idempotency_key: idempotencyKey,
    run_id: runId,
    as_of: asOf,
    source: { relative_root: path.relative(boundary.canonicalProjectRoot, inputRoot).replace(/\\/g, '/') || '.', file_count: records.length },
    limits,
    counts,
    duplicate_candidates: duplicateGroups,
    records,
    errors: [],
    no_writes: true,
    private_namespace: '_private/intake',
    boundary_contract: boundary.version,
    _internal: { boundary, inputRoot, files: walked.files },
  };
}

function publicPlan(plan) {
  const { _internal, ...visible } = plan;
  return visible;
}

function lstatMaybe(file) {
  try { return fs.lstatSync(file); } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    fail('PRIVATE_ROOT_LINK');
  }
}

function ensureDirectorySafe(root, relativeParts) {
  let current = root;
  for (const part of relativeParts) {
    current = path.join(current, part);
    const stats = lstatMaybe(current);
    if (stats) {
      if (stats.isSymbolicLink() || !stats.isDirectory()) fail('PRIVATE_ROOT_LINK');
      let real;
      try { real = fs.realpathSync.native(current); } catch (_) { fail('PRIVATE_ROOT_LINK'); }
      if (normalizedAbsolute(real) !== normalizedAbsolute(current)) fail('PRIVATE_ROOT_LINK');
    } else {
      try { fs.mkdirSync(current); } catch (error) {
        if (error && error.code === 'EEXIST') {
          const retry = lstatMaybe(current);
          if (!retry || retry.isSymbolicLink() || !retry.isDirectory()) fail('PRIVATE_ROOT_CREATE_FAILED');
        } else fail('PRIVATE_ROOT_CREATE_FAILED');
      }
    }
  }
  return current;
}

function ensureIntakeLayout(boundary, runId) {
  const base = ensureIntakeBase(boundary);
  const intakeRoot = base.intakeRoot;
  ensureDirectorySafe(path.join(intakeRoot, 'runs'), [runId]);
  ensureDirectorySafe(path.join(intakeRoot, 'runs', runId), ['quarantine']);
  return { intakeRoot, runRoot: path.join(intakeRoot, 'runs', runId), quarantineRoot: path.join(intakeRoot, 'runs', runId, 'quarantine') };
}

function ensureIntakeBase(boundary) {
  const privateRoot = path.join(boundary.canonicalProjectRoot, '_private');
  ensureDirectorySafe(boundary.canonicalProjectRoot, ['_private']);
  const intakeRoot = ensureDirectorySafe(privateRoot, ['intake']);
  const runsRoot = ensureDirectorySafe(intakeRoot, ['runs']);
  const locksRoot = ensureDirectorySafe(intakeRoot, ['locks']);
  return { intakeRoot, runsRoot, locksRoot };
}

function privateTarget(boundary, relativePath) {
  try {
    return assertPrivateWritePath(boundary, relativePath, { namespace: NAMESPACE }).artifactPath;
  } catch (error) {
    if (error && error.code === 'PRIVATE_ROOT_NOT_FOUND') fail('PRIVATE_ROOT_CREATE_FAILED');
    throw error;
  }
}

function writePrivateJson(boundary, relativePath, value, code) {
  const target = privateTarget(boundary, relativePath);
  const content = `${stableJson(value)}\n`;
  const tempRelative = `${relativePath}.partial`;
  const temp = privateTarget(boundary, tempRelative);
  try {
    fs.writeFileSync(temp, content, { encoding: 'utf8', flag: 'w' });
    const existing = lstatMaybe(target);
    if (existing && (existing.isSymbolicLink() || !existing.isFile())) fail('PRIVATE_ROOT_LINK');
    if (existing) {
      // Keep the previous metadata bytes before attempting replacement.  On
      // Windows rename(existing) is not an atomic overwrite; the recovery
      // copy lets readers recover the prior checkpoint if a process dies in
      // the small move window.  These backups are never deleted by intake.
      const previous = fs.readFileSync(target);
      const backupPrefix = `${target}.previous-${sha256(previous).slice(0, 16)}`;
      let retainedBackup = backupPrefix;
      let suffix = 1;
      while (fs.existsSync(retainedBackup)) retainedBackup = `${backupPrefix}-${suffix++}`;
      fs.copyFileSync(target, retainedBackup, fs.constants.COPYFILE_EXCL);
      const backupStats = lstatMaybe(retainedBackup);
      if (backupStats && (backupStats.isSymbolicLink() || !backupStats.isFile())) fail('PRIVATE_ROOT_LINK');
    }
    try {
      fs.renameSync(temp, target);
    } catch (error) {
      if (!existing || !error || !['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
      // Preserve the old target under a unique, hash-bound name.  If the
      // process stops before the second rename, readPrivateJson falls back to
      // this retained copy rather than treating the run as fresh.
      const oldPrefix = `${target}.previous-${sha256(fs.readFileSync(target)).slice(0, 16)}-move`;
      let oldPath = oldPrefix;
      let suffix = 1;
      while (fs.existsSync(oldPath)) oldPath = `${oldPrefix}-${suffix++}`;
      if (fs.existsSync(target)) fs.renameSync(target, oldPath);
      fs.renameSync(temp, target);
    }
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* best effort inside synthetic private root */ }
    fail(code || 'MANIFEST_WRITE_FAILED');
  }
  return sha256(content);
}

function readPrivateJson(boundary, relativePath) {
  let target = (() => {
    try {
      return boundaryApi.assertPrivateReadPath(boundary, relativePath, { namespace: NAMESPACE }).artifactPath;
    } catch (error) {
      if (error && error.code === 'ARTIFACT_NOT_FOUND') return privateTarget(boundary, relativePath);
      throw error;
    }
  })();
  if (!fs.existsSync(target)) {
    const directory = path.dirname(target);
    const base = path.basename(target);
    let candidates = [];
    try {
      candidates = fs.readdirSync(directory).filter(name => name.startsWith(`${base}.previous-`)).sort().reverse();
    } catch (_) {
      return null;
    }
    target = candidates.length ? path.join(directory, candidates[0]) : null;
  }
  if (!target) return null;
  try {
    // The fixed target or retained backup is still below the issued boundary;
    // use the read assertion before opening a recovery copy.
    const relativeTarget = target === privateTarget(boundary, relativePath)
      ? relativePath
      : `${relativePath}.previous-${path.basename(target).split('.previous-')[1]}`;
    target = boundaryApi.assertPrivateReadPath(boundary, relativeTarget, { namespace: NAMESPACE }).artifactPath;
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (!isPlainObject(parsed)) fail('EXISTING_STATE_INVALID');
    return parsed;
  } catch (error) {
    if (error instanceof IntakeError) throw error;
    fail('EXISTING_STATE_INVALID');
  }
}

function acquireRunLock(boundary, runId) {
  const relative = `runs/${runId}/intake.lock`;
  const target = privateTarget(boundary, relative);
  let fd;
  try {
    fd = fs.openSync(target, 'wx');
    fs.writeFileSync(fd, `${JSON.stringify({ format: 'h2dev.intake-lock.v1', pid: process.pid, run_id: runId })}\n`, 'utf8');
  } catch (error) {
    try { if (fd !== undefined) fs.closeSync(fd); } catch (_) { /* synthetic lock cleanup */ }
    if (error && error.code === 'EEXIST') fail('INTAKE_LOCK_HELD');
    fail('PRIVATE_ROOT_CREATE_FAILED');
  }
  return () => {
    try { fs.closeSync(fd); } catch (_) { /* already closed */ }
    try { fs.unlinkSync(target); } catch (_) { /* lock cleanup is best effort */ }
  };
}

function acquireIdempotencyLock(boundary, idempotencyKey) {
  const lockId = `KEY-${sha256(`h2dev.intake-key-lock.v1\n${idempotencyKey}`).slice(0, 32)}`;
  const relative = `locks/${lockId}.lock`;
  const target = privateTarget(boundary, relative);
  let fd;
  try {
    fd = fs.openSync(target, 'wx');
    fs.writeFileSync(fd, `${JSON.stringify({ format: 'h2dev.intake-key-lock.v1', pid: process.pid, lock_id: lockId })}\n`, 'utf8');
  } catch (error) {
    try { if (fd !== undefined) fs.closeSync(fd); } catch (_) { /* synthetic lock cleanup */ }
    if (error && error.code === 'EEXIST') fail('INTAKE_LOCK_HELD');
    fail('PRIVATE_ROOT_CREATE_FAILED');
  }
  return () => {
    try { fs.closeSync(fd); } catch (_) { /* already closed */ }
    try { fs.unlinkSync(target); } catch (_) { /* lock cleanup is best effort */ }
  };
}

function listRunDirectories(layout) {
  let entries;
  try { entries = fs.readdirSync(path.join(layout.intakeRoot, 'runs'), { withFileTypes: true }); } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    fail('EXISTING_STATE_INVALID');
  }
  const result = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(layout.intakeRoot, 'runs', entry.name);
    inspectNoLinks(layout.intakeRoot, dir, { linkCode: 'PRIVATE_ROOT_LINK' });
    result.push(entry.name);
  }
  return result;
}

function findExistingRun(boundary, idempotencyKey, inputHash, layout) {
  for (const runId of listRunDirectories(layout)) {
    const manifest = readPrivateJson(boundary, `runs/${runId}/manifest.json`);
    if (!manifest || manifest.idempotency_key !== idempotencyKey) continue;
    if (manifest.input_hash !== sha256Ref(inputHash)) fail('IDEMPOTENCY_KEY_CONFLICT');
    if (manifest.run_id !== runId) fail('EXISTING_STATE_INVALID');
    return { runId, manifest, checkpoint: readPrivateJson(boundary, `runs/${runId}/checkpoint.json`) };
  }
  return null;
}

function makeManifest(plan, asOf, state = 'IN_PROGRESS') {
  return {
    schema: MANIFEST_SCHEMA,
    format: INTAKE_FORMAT,
    ticket: 'A4',
    run_id: plan.run_id,
    idempotency_key: plan.idempotency_key,
    input_hash: plan.input_hash,
    as_of: asOf,
    state,
    source: plan.source,
    private_namespace: '_private/intake',
    adapter_registry: ADAPTER_REGISTRY_FORMAT,
    records: plan.records.map(record => ({
      intake_id: record.intake_id,
      relative_path: record.source.relative_path,
      content_hash: record.content_hash ? record.content_hash.value : null,
      byte_size: record.byte_size,
      status: record.status,
      reason: record.reason,
      quarantine_path: record.quarantine.relative_path,
      processed: false,
      copied: false,
      source_preserved: false,
    })),
    duplicate_candidates: plan.duplicate_candidates,
    registry_commit: false,
    public_projection: false,
  };
}

function makeCheckpoint(plan, processed, copied, state = 'IN_PROGRESS') {
  // `processed` means the item was accounted for (including an explicit
  // rejection/unreadable source); `copied` means bytes were actually placed in
  // quarantine.  Keeping the sets separate prevents rejected/oversized files
  // from being falsely reported as copied while still making the run complete.
  const processedIndexes = Array.from(processed || []);
  const copiedIndexes = Array.from(copied || []);
  return {
    schema: CHECKPOINT_SCHEMA,
    run_id: plan.run_id,
    idempotency_key: plan.idempotency_key,
    input_hash: plan.input_hash,
    state,
    processed_indexes: processedIndexes.slice().sort((a, b) => a - b),
    copied_indexes: copiedIndexes.slice().sort((a, b) => a - b),
    next_index: plan.records.findIndex((_, index) => !processedIndexes.includes(index)),
    updated_at: plan.as_of,
  };
}

function makeHashManifest(plan) {
  return {
    schema: MANIFEST_SCHEMA,
    run_id: plan.run_id,
    idempotency_key: plan.idempotency_key,
    input_hash: plan.input_hash,
    records: plan.records.map(record => ({
      intake_id: record.intake_id,
      relative_path: record.source.relative_path,
      content_hash: record.content_hash ? sha256Ref(record.content_hash.value) : null,
      byte_size: record.byte_size,
      status: record.status,
    })),
    no_fuzzy_merge: true,
  };
}

function copyRecord(boundary, plan, record, file, layout) {
  if (!file || !record.content_hash || !HASH_RE.test(record.content_hash.value)) return false;
  inspectNoLinks(plan._internal.inputRoot, file.absolute, { linkCode: 'PATH_LINK', missingCode: 'SOURCE_MISSING' });
  let current;
  try { current = fs.readFileSync(file.absolute); } catch (_) { fail('COPY_FAILED'); }
  const currentHash = sha256(current);
  if (currentHash !== record.content_hash.value) fail('INPUT_HASH_DRIFT');
  const relative = record.quarantine.relative_path;
  const target = privateTarget(boundary, relative);
  const parent = path.dirname(target);
  ensureDirectorySafe(layout.quarantineRoot, [path.posix.dirname(relative.split('/quarantine/')[1] || '').replace(/\\/g, '/')].filter(item => item && item !== '.'));
  const existing = lstatMaybe(target);
  if (existing) {
    if (existing.isSymbolicLink() || !existing.isFile()) fail('DESTINATION_HASH_MISMATCH');
    let existingHash;
    try { existingHash = sha256(fs.readFileSync(target)); } catch (_) { fail('DESTINATION_HASH_MISMATCH'); }
    if (existingHash !== record.content_hash.value) fail('DESTINATION_HASH_MISMATCH');
    return true;
  }
  const tempRelative = `${relative}.partial`;
  const temp = privateTarget(boundary, tempRelative);
  try {
    // COPYFILE_EXCL prevents an interrupted or concurrent writer from
    // silently replacing an existing quarantine artifact.
    fs.copyFileSync(file.absolute, temp, fs.constants.COPYFILE_EXCL);
    const tempHash = sha256(fs.readFileSync(temp));
    if (tempHash !== record.content_hash.value) {
      try { fs.unlinkSync(temp); } catch (_) { /* remain fail-closed */ }
      fail('PARTIAL_COPY');
    }
    fs.renameSync(temp, target);
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* best effort */ }
    if (error instanceof IntakeError) throw error;
    fail('COPY_FAILED');
  }
  const verified = sha256(fs.readFileSync(target));
  if (verified !== record.content_hash.value) fail('PARTIAL_COPY');
  return true;
}

function applyIntake(options = {}) {
  if (options.apply !== true || (options.allowIntakeWrite !== true && options.allowPrivateWrite !== true)) fail('APPLY_REQUIRED');
  const plan = makePlan(options);
  const boundary = plan._internal.boundary;
  // A path/link/read preflight failure is represented in the machine result,
  // but must not provision even the private quarantine.  The source remains
  // at its original fixture location for explicit operator review.
  if (!plan.valid) {
    return {
      ...publicPlan(plan),
      schema: RESULT_SCHEMA,
      mode: 'APPLY',
      valid: false,
      status: 'NEEDS_REVIEW',
      idempotent: false,
      resumed: false,
      no_writes: true,
      no_public_write: true,
      registry_commit: false,
    };
  }
  // Provision only the namespace needed to inspect prior runs first.  The
  // deterministic run directory is created after the idempotency conflict
  // check so a hash-drifted retry leaves no empty side directory behind.
  const baseLayout = ensureIntakeBase(boundary);
  // The idempotency-key lock is deliberately independent of the input hash.
  // It closes the race where two different hashes for one explicit key would
  // otherwise derive different run locks and both create manifests.
  const releaseKeyLock = acquireIdempotencyLock(boundary, plan.idempotency_key);
  try {
    // Re-read existing state only after the key lock is held.  This is the
    // authoritative conflict/idempotency check for all manifest creation.
    const existing = findExistingRun(boundary, plan.idempotency_key, plan.input_hash.slice(7), baseLayout);
    if (existing && !['IN_PROGRESS', 'COMPLETE'].includes(existing.manifest.state)) fail('EXISTING_STATE_INVALID');
    // A manifest marked COMPLETE before its checkpoint reached COMPLETE is a
    // recoverable interrupted write, not an idempotent success.  It must pass
    // through the same locked re-verification path below.
    const manifestWasComplete = Boolean(existing
      && existing.manifest.state === 'COMPLETE'
      && existing.checkpoint
      && existing.checkpoint.state === 'COMPLETE'
      && Array.isArray(existing.checkpoint.processed_indexes)
      && existing.checkpoint.processed_indexes.length === plan.records.length
      && new Set(existing.checkpoint.processed_indexes).size === plan.records.length
      && existing.checkpoint.processed_indexes.every(index => Number.isSafeInteger(index) && index >= 0 && index < plan.records.length));
    const layout = ensureIntakeLayout(boundary, plan.run_id);
    const releaseLock = acquireRunLock(boundary, plan.run_id);
    if (!existing) {
      const manifest = makeManifest(plan, plan.as_of);
      const checkpoint = makeCheckpoint(plan, [], []);
      writePrivateJson(boundary, `runs/${plan.run_id}/manifest.json`, manifest, 'MANIFEST_WRITE_FAILED');
      writePrivateJson(boundary, `runs/${plan.run_id}/hash-manifest.json`, makeHashManifest(plan), 'MANIFEST_WRITE_FAILED');
      writePrivateJson(boundary, `runs/${plan.run_id}/checkpoint.json`, checkpoint, 'CHECKPOINT_WRITE_FAILED');
    }
    try {
      const manifest = existing ? existing.manifest : makeManifest(plan, plan.as_of);
      const checkpoint = existing && existing.checkpoint ? existing.checkpoint : makeCheckpoint(plan, [], []);
      if (checkpoint.input_hash !== plan.input_hash || checkpoint.idempotency_key !== plan.idempotency_key) fail('INPUT_HASH_DRIFT');
      const copied = new Set(Array.isArray(checkpoint.copied_indexes) ? checkpoint.copied_indexes.filter(index => Number.isSafeInteger(index) && index >= 0 && index < plan.records.length) : []);
      // Checkpoints written by A4 v1.1 carry both sets.  A legacy checkpoint
      // with only copied_indexes is safe to resume because copied work is also
      // processed work; rejected/unreadable records are never inferred copied.
      const processed = new Set(Array.isArray(checkpoint.processed_indexes)
        ? checkpoint.processed_indexes.filter(index => Number.isSafeInteger(index) && index >= 0 && index < plan.records.length)
        : [...copied]);
      for (const index of copied) processed.add(index);
      // A checkpoint is evidence of completed work, not permission to trust a
      // mutable destination forever.  Re-verify every previously copied artifact
      // before skipping it; a tampered/missing target is repaired only when its
      // exact source hash still matches, otherwise the run fails closed.
      for (const index of [...copied].sort((a, b) => a - b)) {
        const record = plan.records[index];
        const file = plan._internal.files.find(item => item.relativePath === record.source.relative_path);
        if (file && record.content_hash && HASH_RE.test(record.content_hash.value)) copyRecord(boundary, plan, record, file, layout);
      }
      let copiedThisRun = 0;
      try {
        for (let index = 0; index < plan.records.length; index += 1) {
          if (processed.has(index)) continue;
          const record = plan.records[index];
          const file = plan._internal.files.find(item => item.relativePath === record.source.relative_path);
          // Oversized/unreadable/link records are intentionally not copied.  They
          // are still represented in the manifest/checkpoint so the run is
          // complete and never silently drops an input from the audit trail.
          if (!file || !record.content_hash || !HASH_RE.test(record.content_hash.value)) {
            processed.add(index);
            writePrivateJson(boundary, `runs/${plan.run_id}/checkpoint.json`, makeCheckpoint(plan, [...processed], [...copied]), 'CHECKPOINT_WRITE_FAILED');
            continue;
          }
          const didCopy = copyRecord(boundary, plan, record, file, layout);
          if (didCopy) {
            processed.add(index);
            copied.add(index);
            copiedThisRun += 1;
            writePrivateJson(boundary, `runs/${plan.run_id}/checkpoint.json`, makeCheckpoint(plan, [...processed], [...copied]), 'CHECKPOINT_WRITE_FAILED');
            if (Number.isSafeInteger(options.failAfterCopies) && options.failAfterCopies > 0 && copiedThisRun >= options.failAfterCopies) fail('INTERRUPTED');
          }
        }
      } catch (error) {
        if (error instanceof IntakeError && error.code === 'INTERRUPTED') {
          writePrivateJson(boundary, `runs/${plan.run_id}/checkpoint.json`, makeCheckpoint(plan, [...processed], [...copied]), 'CHECKPOINT_WRITE_FAILED');
          const interrupted = { ...publicPlan(plan), schema: RESULT_SCHEMA, mode: 'APPLY', valid: false, status: 'INTERRUPTED', idempotent: false, resumed: Boolean(existing), checkpoint_path: `_private/intake/runs/${plan.run_id}/checkpoint.json`, manifest_path: `_private/intake/runs/${plan.run_id}/manifest.json`, processed_indexes: [...processed].sort((a, b) => a - b), copied_indexes: [...copied].sort((a, b) => a - b), no_public_write: true, registry_commit: false };
          const interruption = new IntakeError('INTERRUPTED');
          interruption.result = interrupted;
          throw interruption;
        }
        throw error;
      }
      const completed = processed.size === plan.records.length;
      if (!completed) fail('INTERRUPTED');
      if (manifestWasComplete) {
        // The complete pair was hash-verified under the exclusive lock.  Do not
        // rewrite metadata or create another versioned backup on an idempotent
        // retry; a missing/tampered checkpoint would have taken the recovery
        // branch instead.
        return {
        schema: RESULT_SCHEMA,
        ticket: 'A4',
        contract: INTAKE_FORMAT,
        mode: 'APPLY',
        valid: true,
        status: 'COMPLETE',
        idempotent: true,
        resumed: false,
        run_id: plan.run_id,
        input_hash: plan.input_hash,
        idempotency_key: plan.idempotency_key,
        as_of: plan.as_of,
        source: plan.source,
        limits: plan.limits,
        counts: plan.counts,
        records: plan.records.map((record, index) => ({ ...record, quarantine: { ...record.quarantine, copied: copied.has(index), processed: processed.has(index), source_preserved: copied.has(index) } })),
        duplicate_candidates: plan.duplicate_candidates,
        manifest_path: `_private/intake/runs/${plan.run_id}/manifest.json`,
        hash_manifest_path: `_private/intake/runs/${plan.run_id}/hash-manifest.json`,
        checkpoint_path: `_private/intake/runs/${plan.run_id}/checkpoint.json`,
        no_public_write: true,
        registry_commit: false,
        promotion: 'SEPARATE_PROPOSAL_ONLY',
        };
      }
      manifest.state = 'COMPLETE';
      manifest.completed_at = plan.as_of;
      manifest.records = manifest.records.map((item, index) => ({ ...item, processed: processed.has(index), copied: copied.has(index), source_preserved: copied.has(index) }));
      manifest.manifest_hash = sha256(stableJson(manifest));
      writePrivateJson(boundary, `runs/${plan.run_id}/manifest.json`, manifest, 'MANIFEST_WRITE_FAILED');
      writePrivateJson(boundary, `runs/${plan.run_id}/checkpoint.json`, makeCheckpoint(plan, [...processed], [...copied], 'COMPLETE'), 'CHECKPOINT_WRITE_FAILED');
      return {
    schema: RESULT_SCHEMA,
    ticket: 'A4',
    contract: INTAKE_FORMAT,
    mode: 'APPLY',
    valid: true,
    status: 'COMPLETE',
    idempotent: false,
    resumed: Boolean(existing),
    run_id: plan.run_id,
    input_hash: plan.input_hash,
    idempotency_key: plan.idempotency_key,
    as_of: plan.as_of,
    source: plan.source,
    limits: plan.limits,
    counts: plan.counts,
    records: plan.records.map((record, index) => ({ ...record, quarantine: { ...record.quarantine, copied: copied.has(index), processed: processed.has(index), source_preserved: copied.has(index) } })),
    duplicate_candidates: plan.duplicate_candidates,
    manifest_path: `_private/intake/runs/${plan.run_id}/manifest.json`,
    hash_manifest_path: `_private/intake/runs/${plan.run_id}/hash-manifest.json`,
    checkpoint_path: `_private/intake/runs/${plan.run_id}/checkpoint.json`,
    no_public_write: true,
    registry_commit: false,
    promotion: 'SEPARATE_PROPOSAL_ONLY',
      };
    } finally {
      releaseLock();
    }
  } finally {
    releaseKeyLock();
  }
}

function planIntake(options = {}) {
  return publicPlan(makePlan({ ...options, apply: false }));
}

function createRegistryPromotionProposal(input) {
  if (!input || typeof input !== 'object') fail('PROMOTION_INPUT_REQUIRED');
  const source = input.records ? input : (input.plan || input.result || null);
  if (!source || !Array.isArray(source.records)) fail('PROMOTION_INPUT_REQUIRED');
  return {
    schema: PROMOTION_SCHEMA,
    ticket: 'A4',
    status: 'PROPOSAL_ONLY',
    input_hash: source.input_hash || null,
    run_id: source.run_id || null,
    a3_store_validation: 'NOT_RUN',
    registry_commit: false,
    public_projection: false,
    records: source.records.filter(record => record && record.status === 'NEEDS_REVIEW').map(record => ({
      intake_id: record.intake_id,
      content_hash: record.content_hash,
      source_path: record.source && record.source.relative_path,
      status: 'BLOCKED_UNTIL_REVIEW',
    })),
    blocked_reasons: ['rights_unknown', 'retention_unknown', 'human_review_required', 'a3_validation_separate'],
  };
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function has(args, flag) { return args.includes(flag); }

function helpText() {
  return [
    'A4 local intake v2 (synthetic fixture roots only)',
    '  node scripts/intake-v2.js --root <fixture-root> --allow-synthetic-root --input <relative-dir>',
    '  node scripts/intake-v2.js --apply --allow-intake-write --root <fixture-root> --allow-synthetic-root --input <relative-dir>',
    '',
    'Without --apply the command is deterministic discovery/dry-run and performs no writes.',
    'Apply writes only to <root>/_private/intake and never commits an A3 registry record.',
  ].join('\n');
}

function parseNumericArg(args, flag) {
  const value = valueAfter(args, flag);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) fail('INPUT_TOO_LARGE');
  return parsed;
}

function cli(argv = process.argv.slice(2)) {
  const args = [...argv];
  if (has(args, '--help') || has(args, '-h')) {
    process.stdout.write(`${helpText()}\n`);
    return 0;
  }
  try {
    const root = valueAfter(args, '--root');
    const inputRoot = valueAfter(args, '--input') || valueAfter(args, '--inbox');
    if (!root) fail('A4_ROOT_REQUIRED');
    const isApply = has(args, '--apply');
    if (isApply && !has(args, '--allow-intake-write') && !has(args, '--allow-private-write')) fail('APPLY_REQUIRED');
    const options = {
      projectRoot: root,
      inputRoot,
      allowSyntheticRoot: has(args, '--allow-synthetic-root') || has(args, '--synthetic-root'),
      apply: isApply,
      allowIntakeWrite: has(args, '--allow-intake-write') || has(args, '--allow-private-write'),
      idempotencyKey: valueAfter(args, '--idempotency-key'),
      asOf: valueAfter(args, '--as-of'),
      maxBytes: parseNumericArg(args, '--max-bytes'),
      maxTextBytes: parseNumericArg(args, '--max-text-bytes'),
      maxRetries: parseNumericArg(args, '--max-retries'),
      maxJsonDepth: parseNumericArg(args, '--max-json-depth'),
      maxJsonNodes: parseNumericArg(args, '--max-json-nodes'),
      maxSrtCues: parseNumericArg(args, '--max-srt-cues'),
      failAfterCopies: parseNumericArg(args, '--fail-after-copies'),
    };
    const result = isApply ? applyIntake(options) : planIntake(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    if (error && error.result) {
      process.stdout.write(`${JSON.stringify(error.result, null, 2)}\n`);
      return 1;
    }
    const output = {
      schema: RESULT_SCHEMA,
      ticket: 'A4',
      valid: false,
      status: 'ERROR',
      error: {
        code: error && error.code ? error.code : 'INTAKE_RUNTIME_ERROR',
        message: error && ERROR_MESSAGES[error.code] ? ERROR_MESSAGES[error.code] : 'A4 intake operation failed',
        retry_class: error && error.retryClass ? error.retryClass : 'DETERMINISTIC',
      },
      no_public_write: true,
      registry_commit: false,
    };
    process.stderr.write(`${JSON.stringify(output, null, 2)}\n`);
    return 2;
  }
}

module.exports = {
  RESULT_SCHEMA,
  PLAN_SCHEMA,
  MANIFEST_SCHEMA,
  CHECKPOINT_SCHEMA,
  PROMOTION_SCHEMA,
  INTAKE_FORMAT,
  ADAPTER_REGISTRY_FORMAT,
  DEFAULT_LIMITS,
  IntakeError,
  normalizeRelativePath,
  detectMime,
  tryDecodeUtf8,
  validateSrt,
  planIntake,
  discover: planIntake,
  dryRun: planIntake,
  applyIntake,
  intake: applyIntake,
  createRegistryPromotionProposal,
  prepareRegistryPromotionProposal: createRegistryPromotionProposal,
  cli,
};

if (require.main === module) process.exitCode = cli();
