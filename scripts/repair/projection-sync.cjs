#!/usr/bin/env node
'use strict';

/**
 * A16-P projection synchronizer.
 *
 * This module deliberately has no knowledge of the canonical raw writer.  The
 * canonical raw projection and transcript/summary files are read-only inputs;
 * only explicitly generated projection pointers may be written by `apply`.
 * The command line defaults to `plan`/dry-run.  Applying a plan requires both
 * an explicit approval flag and a reviewed plan (or a reviewer supplied by the
 * caller).  The implementation is also exported so the bounded regression can
 * exercise the write/rollback paths without touching the live corpus.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PLAN_SCHEMA = 'h2dev.a16p.projection-sync-plan.v1';
const RESULT_SCHEMA = 'h2dev.a16p.projection-sync-result.v1';
const SCAN_SCHEMA = 'h2dev.a16p.projection-sync-scan.v1';
const BACKUP_SCHEMA = 'h2dev.a16p.projection-sync-backup.v1';
const RECOVERY_SCHEMA = 'h2dev.a16p.projection-sync-recovery.v1';

const REL = Object.freeze({
  canonical: 'data-tabs/raw-kenh-mau.json',
  deepRoot: 'data/raw-channels-deep',
  rootManifest: 'data/raw-channels-deep/deep-channels-manifest.json',
  metadataFull: 'Raw Kênh Mẫu Tìm Kiếm/metadata-full.json',
});
const AUDIT_REL = '_audit/20260910-campaign-wave1/A16-P';

// These are the only vitality members A16-P is allowed to mirror. OCR,
// publicVerification, historical observations, estimates and any other
// members remain contextual fields in metadata-full and are intentionally
// kept. latestUploadDate/daysSinceLatest are activity snapshot fields, not
// values to recompute from the wall clock; their canonical/deep/profile
// consensus is copied verbatim.
const VITALITY_PATCH_FIELDS = Object.freeze([
  'healthStatus',
  'healthBadge',
  'healthDetail',
  'latestUploadDate',
  'daysSinceLatest',
]);
const VITALITY_OUT_OF_SCOPE_FIELDS = Object.freeze([
  'monetizationStatus',
  'monetizationBadge',
  'monetizationAdvisory',
]);
const VITALITY_PRESERVED_FIELDS = Object.freeze([
  'evaluatedAt',
  'estimatedMonthlyRev',
]);
const VITALITY_CONSENSUS_FIELDS = Object.freeze([
  ...VITALITY_PATCH_FIELDS,
  'evaluatedAt',
]);
const VITALITY_IDS = Object.freeze(['RAW-033', 'RAW-077']);

const TRANSCRIPT_SUFFIX = '_transcript.json';
const SUMMARY_SUFFIX = '_summary_vi.md';
const PROTECTED_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

class ProjectionSyncError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProjectionSyncError';
    this.code = code;
    this.details = details;
  }
}

function errorObject(error) {
  if (error instanceof ProjectionSyncError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.details && Object.keys(error.details).length ? { details: error.details } : {}),
    };
  }
  return { code: 'UNEXPECTED_ERROR', message: String(error && (error.message || error) || error) };
}

function stableStringify(value) {
  // All objects in generated plans are constructed in deterministic key order.
  // This helper is intentionally JSON-only so it cannot serialize functions or
  // prototype-bearing values supplied by an untrusted plan.
  return JSON.stringify(value);
}

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256Json(value) {
  return sha256Bytes(Buffer.from(stableStringify(value), 'utf8'));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function jsonEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function normalizeRel(abs, root) {
  return path.relative(root, abs).replace(/\\/g, '/');
}

function isReparseOrSymlink(stat) {
  // Node exposes Windows junctions through lstat as symbolic links on the
  // supported Windows versions.  Keep the explicit platform branch here as a
  // defence-in-depth marker for reparse-point aware runtimes; no stat result
  // which can redirect path traversal is accepted.
  return !!(stat && (stat.isSymbolicLink() || (process.platform === 'win32' && stat.reparsePoint === true)));
}

function assertNoFollowPath(root, absolute, relativePath, options = {}) {
  const rootAbs = path.resolve(root);
  const abs = path.resolve(absolute);
  const rel = path.relative(rootAbs, abs);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', `${options.label || relativePath} escapes project root`, { path: relativePath });
  }
  let cursor = rootAbs;
  const rootStat = (() => {
    try { return fs.lstatSync(cursor); } catch (error) {
      throw new ProjectionSyncError('MISSING_FILE', 'Project root is missing or inaccessible', { path: '.', error: String(error.message || error) });
    }
  })();
  if (isReparseOrSymlink(rootStat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Project root may not be a symlink/junction', { path: '.', role: options.role });
  if (!rootStat.isDirectory()) throw new ProjectionSyncError('NOT_A_DIRECTORY', 'Project root must be a directory', { path: '.', role: options.role });
  const components = rel ? rel.split(path.sep) : [];
  for (let index = 0; index < components.length; index += 1) {
    cursor = path.join(cursor, components[index]);
    let stat;
    try { stat = fs.lstatSync(cursor); } catch (error) {
      if (error && error.code === 'ENOENT' && options.allowMissing) return abs;
      throw new ProjectionSyncError('MISSING_FILE', 'Required path component is missing or inaccessible', { path: relativePath, component: components.slice(0, index + 1).join('/'), error: String(error.message || error) });
    }
    if (isReparseOrSymlink(stat)) {
      throw new ProjectionSyncError('SYMLINK_REJECTED', 'Symlink/junction/reparse-point path component is not accepted', {
        path: relativePath,
        component: components.slice(0, index + 1).join('/'),
        role: options.role,
      });
    }
  }
  return abs;
}

function resolveInside(root, relativePath, label = relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\0')) {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', `Invalid ${label}`, { path: relativePath });
  }
  const rootAbs = path.resolve(root);
  const absolute = path.resolve(rootAbs, relativePath);
  const rel = path.relative(rootAbs, absolute);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', `${label} escapes project root`, { path: relativePath });
  }
  // Existing parent components are checked here for every read and write,
  // including paths whose final component has not yet been created.
  return assertNoFollowPath(rootAbs, absolute, relativePath, { allowMissing: true, label });
}

function rejectUnsafeSegment(segment, label) {
  if (typeof segment !== 'string' || !segment || segment === '.' || segment === '..') {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', `Invalid ${label}`, { segment });
  }
  if (PROTECTED_SEGMENTS.has(segment.toLowerCase())) {
    throw new ProjectionSyncError('PROTOTYPE_PATH_REJECTED', `Prototype path segment is not allowed in ${label}`, { segment });
  }
  // The corpus has Unicode names and punctuation, but no Windows separators,
  // control characters, reserved wildcard/drive characters, or trailing dots.
  if (/[\u0000-\u001f<>:"/\\|?*]/.test(segment) || /[ .]$/.test(segment)) {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', `Unsafe ${label}`, { segment });
  }
}

function validateFolderName(folderName) {
  rejectUnsafeSegment(folderName, 'folderName');
  if (path.isAbsolute(folderName) || folderName.includes('/') || folderName.includes('\\')) {
    throw new ProjectionSyncError('PATH_TRAVERSAL_REJECTED', 'folderName must be one directory component', { folderName });
  }
}

function validateId(id, label = 'id') {
  if (typeof id !== 'string' || !/^RAW-[A-Za-z0-9_-]+$/.test(id)) {
    throw new ProjectionSyncError('INVALID_ID', `${label} is not an exact RAW id`, { id });
  }
}

function validateChannelId(channelId, label = 'channelId') {
  if (typeof channelId !== 'string' || !/^UC[A-Za-z0-9_-]+$/.test(channelId)) {
    throw new ProjectionSyncError('INVALID_CHANNEL_ID', `${label} is not an exact channel id`, { channelId });
  }
}

function own(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function safeLstat(abs, relativePath, errors, role, root = null) {
  try {
    if (root) assertNoFollowPath(root, abs, relativePath, { role });
    const stat = fs.lstatSync(abs);
    if (isReparseOrSymlink(stat)) {
      errors.push(new ProjectionSyncError('SYMLINK_REJECTED', 'Symlink is not an accepted project input', { path: relativePath, role }));
      return null;
    }
    return stat;
  } catch (error) {
    if (error instanceof ProjectionSyncError) {
      errors.push(error);
      return null;
    }
    errors.push(new ProjectionSyncError('MISSING_FILE', 'Required path is missing or inaccessible', { path: relativePath, role, error: String(error.message || error) }));
    return null;
  }
}

function hashFile(abs, relativePath, errors, role, root = null) {
  const stat = safeLstat(abs, relativePath, errors, role, root);
  if (!stat) return null;
  if (!stat.isFile()) {
    errors.push(new ProjectionSyncError('NOT_A_FILE', 'Expected a regular file', { path: relativePath, role }));
    return null;
  }
  try {
    const bytes = fs.readFileSync(abs);
    return { sha256: sha256Bytes(bytes), bytes: bytes.length, role };
  } catch (error) {
    errors.push(new ProjectionSyncError('READ_ERROR', 'Could not read required file', { path: relativePath, role, error: String(error.message || error) }));
    return null;
  }
}

function readJsonFile(root, relativePath, errors, role) {
  const abs = resolveInside(root, relativePath);
  const hash = hashFile(abs, relativePath, errors, role);
  if (!hash) return { value: null, hash: null, bytes: null };
  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch (error) {
    errors.push(new ProjectionSyncError('READ_ERROR', 'Could not read JSON text', { path: relativePath, error: String(error.message || error) }));
    return { value: null, hash, bytes: null };
  }
  if (!text.trim()) {
    errors.push(new ProjectionSyncError('EMPTY_FILE', 'JSON file is empty', { path: relativePath, role }));
    return { value: null, hash, bytes: text.length };
  }
  try {
    return { value: JSON.parse(text), hash, bytes: Buffer.byteLength(text) };
  } catch (error) {
    errors.push(new ProjectionSyncError('MALFORMED_JSON', 'JSON file cannot be parsed', { path: relativePath, role, error: String(error.message || error) }));
    return { value: null, hash, bytes: Buffer.byteLength(text) };
  }
}

function addHash(fileHashes, relativePath, hash) {
  if (!hash) return;
  if (own(fileHashes, relativePath)) {
    // The same relative path must never be assigned two roles.  This is an
    // internal guard, not a user-facing source conflict.
    if (fileHashes[relativePath].sha256 !== hash.sha256) {
      throw new ProjectionSyncError('HASH_COLLISION', 'A path was read twice with different content', { path: relativePath });
    }
    return;
  }
  fileHashes[relativePath] = hash;
}

function addError(errors, code, message, details) {
  errors.push(new ProjectionSyncError(code, message, details));
}

function getRequired(value, pathLabel, errors, expectedType = null) {
  if (value === null || value === undefined) {
    addError(errors, 'MISSING_FIELD', `Missing ${pathLabel}`, { pointer: pathLabel });
    return null;
  }
  if (expectedType && typeof value !== expectedType) {
    addError(errors, 'INVALID_FIELD', `Invalid ${pathLabel}`, { pointer: pathLabel, expectedType, actualType: typeof value });
    return null;
  }
  return value;
}

function ensureCount(value, pointer, errors) {
  if (!Number.isInteger(value) || value < 0) {
    addError(errors, 'INVALID_COUNT', 'Derived count field must be a non-negative integer', { pointer, value });
  }
}

function duplicateIds(records, label, errors) {
  const map = new Map();
  if (!Array.isArray(records)) {
    addError(errors, 'INVALID_COLLECTION', `${label} must be an array`, { label });
    return map;
  }
  records.forEach((record, index) => {
    const id = record && record.id;
    if (typeof id === 'string') {
      if (map.has(id)) addError(errors, 'DUPLICATE_ID', `Duplicate ${label} id`, { label, id, firstIndex: map.get(id), duplicateIndex: index });
      else map.set(id, index);
    }
  });
  return map;
}

function ptr(...segments) {
  return `/${segments.map((segment) => String(segment).replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
}

function decodePointer(pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) {
    throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'JSON pointer must begin with /', { pointer });
  }
  return pointer.slice(1).split('/').map((encoded) => {
    if (/~(?![01])/.test(encoded)) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Invalid JSON pointer escape', { pointer });
    const decoded = encoded.replace(/~1/g, '/').replace(/~0/g, '~');
    rejectUnsafeSegment(decoded, 'JSON pointer');
    return decoded;
  });
}

function getPointer(document, pointer) {
  const segments = decodePointer(pointer);
  let cursor = document;
  for (const segment of segments) {
    if (Array.isArray(cursor)) {
      if (!/^\d+$/.test(segment) || Number(segment) >= cursor.length) return { exists: false, value: undefined };
      cursor = cursor[Number(segment)];
    } else if (isPlainObject(cursor) && own(cursor, segment)) {
      cursor = cursor[segment];
    } else {
      return { exists: false, value: undefined };
    }
  }
  return { exists: true, value: cursor };
}

function setPointerExisting(document, pointer, value) {
  const segments = decodePointer(pointer);
  if (!segments.length) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Root replacement is not allowed', { pointer });
  let cursor = document;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (Array.isArray(cursor)) {
      if (!/^\d+$/.test(segment) || Number(segment) >= cursor.length) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Array pointer does not exist', { pointer });
      cursor = cursor[Number(segment)];
    } else if (isPlainObject(cursor) && own(cursor, segment)) {
      cursor = cursor[segment];
    } else {
      throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Pointer parent does not exist', { pointer });
    }
  }
  const leaf = segments[segments.length - 1];
  if (Array.isArray(cursor)) {
    if (!/^\d+$/.test(leaf) || Number(leaf) >= cursor.length) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Array pointer does not exist', { pointer });
    cursor[Number(leaf)] = value;
  } else if (isPlainObject(cursor) && own(cursor, leaf)) {
    cursor[leaf] = value;
  } else {
    throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Pointer leaf does not exist', { pointer });
  }
}

function listRegularEntries(dirAbs, relativeDir, errors) {
  const stat = safeLstat(dirAbs, relativeDir, errors, 'source');
  if (!stat) return [];
  if (!stat.isDirectory()) {
    addError(errors, 'NOT_A_DIRECTORY', 'Expected a regular directory', { path: relativeDir });
    return [];
  }
  let entries;
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch (error) {
    addError(errors, 'READ_DIRECTORY_ERROR', 'Could not enumerate directory', { path: relativeDir, error: String(error.message || error) });
    return [];
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name)).map((entry) => ({
    name: entry.name,
    path: path.join(dirAbs, entry.name),
    relativePath: `${relativeDir}/${entry.name}`.replace(/\\/g, '/'),
    entry,
  }));
}

function readSourceText(root, relativePath, errors) {
  const abs = resolveInside(root, relativePath);
  const hash = hashFile(abs, relativePath, errors, 'source');
  if (!hash) return { text: null, hash };
  if (hash.bytes === 0) {
    addError(errors, 'EMPTY_SOURCE_FILE', 'Source summary is empty', { path: relativePath });
    return { text: '', hash };
  }
  try {
    return { text: fs.readFileSync(abs, 'utf8'), hash };
  } catch (error) {
    addError(errors, 'READ_ERROR', 'Could not read source text', { path: relativePath, error: String(error.message || error) });
    return { text: null, hash };
  }
}

function resolveReference(folderName, reference, videoId, kind, root, errors, relativePath) {
  if (typeof reference !== 'string' || !reference) {
    addError(errors, 'MISSING_REFERENCE', 'Transcript rows with hasTranscript=true need a reference', { path: relativePath, videoId, kind, reference });
    return null;
  }
  const normalized = reference.replace(/\\/g, '/');
  const expectedFile = `${videoId}${kind === 'transcript' ? TRANSCRIPT_SUFFIX : SUMMARY_SUFFIX}`;
  let style = null;
  let segments;
  if (normalized.startsWith('transcripts/')) {
    style = 'folder_relative';
    segments = normalized.split('/');
    if (segments.length !== 2 || segments[0] !== 'transcripts') {
      addError(errors, 'UNEXPECTED_REFERENCE', 'Reference is not a direct folder-relative transcript path', { path: relativePath, videoId, kind, reference });
      return null;
    }
  } else if (normalized.startsWith(`${REL.deepRoot}/`)) {
    style = 'project_prefixed';
    segments = normalized.split('/');
    if (segments.length !== 5 || segments[0] !== 'data' || segments[1] !== 'raw-channels-deep' || segments[2] !== folderName || segments[3] !== 'transcripts') {
      addError(errors, 'UNEXPECTED_REFERENCE', 'Reference is not an exact project-prefixed transcript path', { path: relativePath, videoId, kind, reference });
      return null;
    }
  } else {
    addError(errors, 'UNEXPECTED_REFERENCE', 'Reference style is outside the accepted projection contract', { path: relativePath, videoId, kind, reference });
    return null;
  }
  const fileName = segments[segments.length - 1];
  try {
    rejectUnsafeSegment(fileName, 'reference filename');
  } catch (error) {
    errors.push(error);
    return null;
  }
  if (fileName !== expectedFile) {
    addError(errors, 'REFERENCE_BASENAME_MISMATCH', 'Reference basename does not match exact video id', { path: relativePath, videoId, kind, reference, expectedFile });
    return null;
  }
  const absolute = path.join(root, REL.deepRoot, folderName, 'transcripts', fileName);
  const normalizedRel = normalizeRel(absolute, root);
  const relativeFolder = `${REL.deepRoot}/${folderName}/transcripts/${fileName}`;
  if (normalizedRel !== relativeFolder) {
    addError(errors, 'PATH_TRAVERSAL_REJECTED', 'Reference resolved outside its exact folder', { path: relativePath, reference });
    return null;
  }
  if (!fs.existsSync(absolute)) {
    addError(errors, 'MISSING_REFERENCE', 'Referenced source file does not exist', { path: relativePath, videoId, kind, reference });
    return null;
  }
  return { style, absolute, relativePath: normalizedRel, fileName };
}

function validateTranscriptJson(abs, relativePath, expectedVideoId, errors) {
  const result = readJsonFile(path.dirname(path.dirname(path.dirname(abs))), relativePath, errors, 'source');
  // The root passed above is intentionally not used for path resolution in
  // normal operation; this fallback protects callers that pass a malformed
  // path while keeping all parse errors structured.
  if (!result.value) return;
  const value = result.value;
  if (!isPlainObject(value)) {
    addError(errors, 'PARTIAL_TRANSCRIPT', 'Transcript JSON must be an object', { path: relativePath });
    return;
  }
  if (value.videoId !== expectedVideoId) addError(errors, 'TRANSCRIPT_ID_MISMATCH', 'Transcript videoId does not match its exact filename/reference', { path: relativePath, expectedVideoId, actualVideoId: value.videoId });
  if (!Array.isArray(value.segments)) addError(errors, 'PARTIAL_TRANSCRIPT', 'Transcript JSON has no segments array', { path: relativePath });
}

function collectFolderSource(root, folderName, top, errors, fileHashes) {
  const folderRel = `${REL.deepRoot}/${folderName}`;
  const folderAbs = resolveInside(root, folderRel);
  const entries = listRegularEntries(folderAbs, folderRel, errors);
  const transcriptDirRel = `${folderRel}/transcripts`;
  const transcriptDirAbs = resolveInside(root, transcriptDirRel);
  const transcriptEntries = listRegularEntries(transcriptDirAbs, transcriptDirRel, errors);
  const transcriptFiles = [];
  const summaryFiles = [];
  for (const item of entries) {
    if (item.name !== 'top-videos.json' && item.name !== 'channel-profile.json' && !item.entry.isDirectory()) {
      addError(errors, 'UNEXPECTED_DEEP_FILE', 'Unexpected file directly in a deep dossier', { path: item.relativePath });
    }
    if (item.entry.isSymbolicLink()) addError(errors, 'SYMLINK_REJECTED', 'Symlink is not an accepted dossier entry', { path: item.relativePath });
  }
  for (const item of transcriptEntries) {
    if (item.entry.isSymbolicLink()) {
      addError(errors, 'SYMLINK_REJECTED', 'Symlink is not an accepted transcript/summary input', { path: item.relativePath });
      continue;
    }
    if (!item.entry.isFile()) {
      addError(errors, 'UNEXPECTED_SOURCE_ENTRY', 'Transcript directory may contain regular files only', { path: item.relativePath });
      continue;
    }
    const hash = hashFile(item.path, item.relativePath, errors, 'source');
    addHash(fileHashes, item.relativePath, hash);
    if (item.name.endsWith(TRANSCRIPT_SUFFIX)) transcriptFiles.push(item);
    else if (item.name.endsWith(SUMMARY_SUFFIX)) summaryFiles.push(item);
    else addError(errors, 'UNEXPECTED_SOURCE_FILE', 'Transcript directory contains an unexpected filename', { path: item.relativePath });
  }
  transcriptFiles.sort((a, b) => a.name.localeCompare(b.name));
  summaryFiles.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of transcriptFiles) {
    let text;
    try { text = fs.readFileSync(item.path, 'utf8'); } catch (error) { addError(errors, 'READ_ERROR', 'Could not read transcript source', { path: item.relativePath, error: String(error.message || error) }); continue; }
    if (!text.trim()) { addError(errors, 'PARTIAL_TRANSCRIPT', 'Transcript source is empty', { path: item.relativePath }); continue; }
    let parsed;
    try { parsed = JSON.parse(text); } catch (error) { addError(errors, 'MALFORMED_JSON', 'Transcript source cannot be parsed', { path: item.relativePath, role: 'source', error: String(error.message || error) }); continue; }
    if (!isPlainObject(parsed) || !Array.isArray(parsed.segments)) addError(errors, 'PARTIAL_TRANSCRIPT', 'Transcript source is missing its segments array', { path: item.relativePath });
    const expectedVideoId = item.name.slice(0, -TRANSCRIPT_SUFFIX.length);
    if (parsed && parsed.videoId !== expectedVideoId) addError(errors, 'TRANSCRIPT_ID_MISMATCH', 'Transcript source videoId does not match its filename', { path: item.relativePath, expectedVideoId, actualVideoId: parsed.videoId });
  }
  for (const item of summaryFiles) {
    const result = readSourceText(root, item.relativePath, errors);
    if (result.hash) addHash(fileHashes, item.relativePath, result.hash);
  }
  return {
    folderRel,
    folderAbs,
    transcriptDirRel,
    transcriptFiles,
    summaryFiles,
    transcriptNames: new Set(transcriptFiles.map((item) => item.name)),
    summaryNames: new Set(summaryFiles.map((item) => item.name)),
  };
}

function validateRefs(root, folderName, top, sourceInventory, errors) {
  const videos = Array.isArray(top && top.videos) ? top.videos : [];
  const transcriptRefs = new Map();
  const summaryRefs = new Map();
  const styles = { transcript: Object.create(null), summary: Object.create(null) };
  const unknownRows = [];
  const globalVideoIds = new Set();
  videos.forEach((video, index) => {
    const rowPath = `${REL.deepRoot}/${folderName}/top-videos.json#/videos/${index}`;
    if (!isPlainObject(video)) { addError(errors, 'INVALID_VIDEO_ROW', 'Top-videos entry must be an object', { pointer: rowPath }); return; }
    const videoId = video.videoId;
    if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(videoId)) addError(errors, 'INVALID_VIDEO_ID', 'Top-video id is not safe for exact file joins', { pointer: `${rowPath}/videoId`, videoId });
    if (globalVideoIds.has(videoId)) addError(errors, 'DUPLICATE_VIDEO_ID', 'Duplicate video id within a dossier', { pointer: `${rowPath}/videoId`, videoId });
    globalVideoIds.add(videoId);
    if (typeof video.hasTranscript !== 'boolean') { addError(errors, 'INVALID_TRANSCRIPT_FLAG', 'hasTranscript must be boolean', { pointer: `${rowPath}/hasTranscript`, value: video.hasTranscript }); return; }
    if (!video.hasTranscript) {
      unknownRows.push(videoId);
      if (video.transcriptJsonRel !== null || video.summaryViRel !== null) addError(errors, 'UNKNOWN_ROW_HAS_REFERENCE', 'hasTranscript=false rows must retain null references', { pointer: rowPath, videoId, transcriptJsonRel: video.transcriptJsonRel, summaryViRel: video.summaryViRel });
      return;
    }
    const transcript = resolveReference(folderName, video.transcriptJsonRel, videoId, 'transcript', root, errors, rowPath);
    const summary = resolveReference(folderName, video.summaryViRel, videoId, 'summary', root, errors, rowPath);
    for (const [kind, ref, map, inventory] of [['transcript', transcript, transcriptRefs, sourceInventory.transcriptNames], ['summary', summary, summaryRefs, sourceInventory.summaryNames]]) {
      if (!ref) continue;
      styles[kind][ref.style] = (styles[kind][ref.style] || 0) + 1;
      const previous = map.get(ref.fileName);
      if (previous) addError(errors, 'DUPLICATE_REFERENCE', 'A source file is referenced by more than one top-video row', { path: rowPath, kind, fileName: ref.fileName, firstVideoId: previous.videoId, duplicateVideoId: videoId });
      else map.set(ref.fileName, { videoId, rowPath });
      if (!inventory.has(ref.fileName)) addError(errors, 'MISSING_REFERENCE', 'Reference does not resolve to an inventory file', { path: rowPath, kind, fileName: ref.fileName });
    }
  });
  for (const fileName of sourceInventory.transcriptNames) if (!transcriptRefs.has(fileName)) addError(errors, 'ORPHAN_SOURCE_FILE', 'Transcript file is not referenced by an exact hasTranscript=true row', { folderName, kind: 'transcript', fileName });
  for (const fileName of sourceInventory.summaryNames) if (!summaryRefs.has(fileName)) addError(errors, 'ORPHAN_SOURCE_FILE', 'Summary file is not referenced by an exact hasTranscript=true row', { folderName, kind: 'summary', fileName });
  if (transcriptRefs.size !== sourceInventory.transcriptFiles.length || summaryRefs.size !== sourceInventory.summaryFiles.length) addError(errors, 'REFERENCE_INVENTORY_MISMATCH', 'Reference and file-backed inventories do not match exactly', { folderName, transcriptRefs: transcriptRefs.size, transcriptFiles: sourceInventory.transcriptFiles.length, summaryRefs: summaryRefs.size, summaryFiles: sourceInventory.summaryFiles.length });
  return { transcriptRefs, summaryRefs, styles, unknownRows, videoIds: globalVideoIds };
}

function readNumberField(document, pointer, errors) {
  const result = getPointer(document, pointer);
  if (!result.exists) { addError(errors, 'MISSING_POINTER', 'Expected projection pointer does not exist', { pointer }); return null; }
  ensureCount(result.value, pointer, errors);
  return result.value;
}

function loadProject(options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  const errors = [];
  const fileHashes = Object.create(null);
  const docs = Object.create(null);
  const roles = Object.create(null);
  function load(relativePath, role) {
    const result = readJsonFile(root, relativePath, errors, role);
    addHash(fileHashes, relativePath, result.hash);
    if (result.hash) roles[relativePath] = role;
    docs[relativePath] = result.value;
    return result.value;
  }

  const canonicalDoc = load(REL.canonical, 'source');
  const manifestDoc = load(REL.rootManifest, 'target');
  const metadataDoc = load(REL.metadataFull, 'target');
  const canonical = canonicalDoc && Array.isArray(canonicalDoc.records) ? canonicalDoc.records : null;
  const manifest = manifestDoc && Array.isArray(manifestDoc.channels) ? manifestDoc.channels : null;
  const metadata = metadataDoc && Array.isArray(metadataDoc.records) ? metadataDoc.records : null;
  if (!canonical) addError(errors, 'INVALID_COLLECTION', 'Canonical raw records must be an array', { path: REL.canonical, pointer: '/records' });
  if (!manifest) addError(errors, 'INVALID_COLLECTION', 'Deep manifest channels must be an array', { path: REL.rootManifest, pointer: '/channels' });
  if (!metadata) addError(errors, 'INVALID_COLLECTION', 'metadata-full records must be an array', { path: REL.metadataFull, pointer: '/records' });
  const canonicalIndexes = duplicateIds(canonical || [], 'canonical', errors);
  const manifestIndexes = duplicateIds(manifest || [], 'root manifest', errors);
  const metadataIndexes = duplicateIds(metadata || [], 'metadata-full', errors);
  const canonicalById = new Map();
  (canonical || []).forEach((record, index) => {
    if (!record || typeof record !== 'object') { addError(errors, 'INVALID_RECORD', 'Canonical record must be an object', { path: REL.canonical, index }); return; }
    try { validateId(record.id, `canonical[${index}].id`); } catch (error) { errors.push(error); }
    if (record.id && !canonicalById.has(record.id)) canonicalById.set(record.id, { record, index });
  });
  const canonicalIds = [...canonicalById.keys()].sort();
  const selection = options.ids === undefined || options.ids === null
    ? canonicalIds
    : (Array.isArray(options.ids) ? options.ids.slice() : String(options.ids).split(',').map((value) => value.trim()).filter(Boolean));
  const selectedIds = [];
  const selectionSeen = new Set();
  for (const id of selection) {
    try { validateId(id, 'selection id'); } catch (error) { errors.push(error); continue; }
    if (selectionSeen.has(id)) addError(errors, 'DUPLICATE_SELECTION_ID', 'Selection contains an id more than once', { id });
    selectionSeen.add(id);
    if (!canonicalById.has(id)) addError(errors, 'UNKNOWN_SELECTION_ID', 'Selection id is absent from canonical authority', { id });
    else selectedIds.push(id);
  }
  selectedIds.sort();
  const selectedSet = new Set(selectedIds);

  // Exact canonical ids are the authority.  Every projection must contain the
  // same set; no title/handle/fuzzy fallback is permitted.
  function compareIdSets(label, records, map) {
    if (!Array.isArray(records)) return;
    const ids = [...map.keys()].sort();
    const missing = canonicalIds.filter((id) => !map.has(id));
    const extra = ids.filter((id) => !canonicalById.has(id));
    if (missing.length) addError(errors, 'MISSING_ID', `${label} is missing exact canonical ids`, { label, ids: missing });
    if (extra.length) addError(errors, 'UNEXPECTED_ID', `${label} contains ids outside canonical authority`, { label, ids: extra });
    if (ids.length !== canonicalIds.length) addError(errors, 'ID_SET_MISMATCH', `${label} id set does not match canonical authority`, { label, expected: canonicalIds.length, actual: ids.length });
  }
  compareIdSets('root manifest', manifest, manifestIndexes);
  compareIdSets('metadata-full', metadata, metadataIndexes);

  const manifestById = new Map();
  (manifest || []).forEach((record, index) => { if (record && typeof record.id === 'string' && !manifestById.has(record.id)) manifestById.set(record.id, { record, index }); });
  const metadataById = new Map();
  (metadata || []).forEach((record, index) => { if (record && typeof record.id === 'string' && !metadataById.has(record.id)) metadataById.set(record.id, { record, index }); });

  const deepRootAbs = resolveInside(root, REL.deepRoot);
  const deepEntries = listRegularEntries(deepRootAbs, REL.deepRoot, errors);
  const deepFolders = new Map();
  for (const item of deepEntries) {
    if (item.name === 'deep-channels-manifest.json') continue;
    if (item.entry.isSymbolicLink()) { addError(errors, 'SYMLINK_REJECTED', 'Symlink is not an accepted deep dossier', { path: item.relativePath }); continue; }
    if (!item.entry.isDirectory()) { addError(errors, 'UNEXPECTED_DEEP_ENTRY', 'Unexpected entry at deep corpus root', { path: item.relativePath }); continue; }
    try { validateFolderName(item.name); } catch (error) { errors.push(error); continue; }
    if (deepFolders.has(item.name)) addError(errors, 'DUPLICATE_FOLDER', 'Duplicate dossier folder name', { folderName: item.name });
    else deepFolders.set(item.name, item);
  }

  const channels = [];
  for (const id of canonicalIds) {
    const canonicalEntry = canonicalById.get(id);
    const record = canonicalEntry && canonicalEntry.record;
    if (!record) continue;
    const channelId = record.channel && record.channel.channelId;
    try { validateChannelId(channelId, `${id}.channel.channelId`); } catch (error) { errors.push(error); }
    const deepIntelligence = record.deepIntelligence;
    if (!isPlainObject(deepIntelligence)) { addError(errors, 'MISSING_FIELD', 'Canonical record lacks deepIntelligence', { id, pointer: `/records/${canonicalEntry.index}/deepIntelligence` }); continue; }
    const folderName = deepIntelligence.folderName;
    try { validateFolderName(folderName); } catch (error) { errors.push(error); continue; }
    const expectedDossierPath = `${REL.deepRoot}/${folderName}`;
    if (deepIntelligence.dossierPath !== expectedDossierPath) addError(errors, 'IDENTITY_PATH_MISMATCH', 'Canonical dossierPath is not the exact folder path', { id, expected: expectedDossierPath, actual: deepIntelligence.dossierPath });
    const folderEntry = deepFolders.get(folderName);
    if (!folderEntry) addError(errors, 'MISSING_DOSSIER', 'Canonical folderName has no exact deep dossier', { id, folderName });
    const manifestEntry = manifestById.get(id);
    const metadataEntry = metadataById.get(id);
    if (!manifestEntry) addError(errors, 'MISSING_ID', 'Root manifest row is missing exact id', { id });
    if (!metadataEntry) addError(errors, 'MISSING_ID', 'metadata-full row is missing exact id', { id });
    const manifestRecord = manifestEntry && manifestEntry.record;
    const metadataRecord = metadataEntry && metadataEntry.record;
    if (manifestRecord) {
      try { validateChannelId(manifestRecord.channelId, `${id}.manifest.channelId`); } catch (error) { errors.push(error); }
      if (manifestRecord.channelId !== channelId) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'Manifest channelId differs from canonical authority', { id, canonical: channelId, manifest: manifestRecord.channelId });
      if (manifestRecord.folderName !== folderName) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'Manifest folderName differs from canonical authority', { id, canonical: folderName, manifest: manifestRecord.folderName });
      if (manifestRecord.dossierPath !== expectedDossierPath) addError(errors, 'IDENTITY_PATH_MISMATCH', 'Manifest dossierPath is not exact', { id, expected: expectedDossierPath, actual: manifestRecord.dossierPath });
      ensureCount(manifestRecord.topVideosCount, `/channels/${manifestEntry.index}/topVideosCount`, errors);
      ensureCount(manifestRecord.transcriptsCount, `/channels/${manifestEntry.index}/transcriptsCount`, errors);
    }
    if (metadataRecord) {
      const metadataChannelId = metadataRecord.channel && metadataRecord.channel.channelId;
      try { validateChannelId(metadataChannelId, `${id}.metadata.channel.channelId`); } catch (error) { errors.push(error); }
      if (metadataChannelId !== channelId) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'metadata-full channelId differs from canonical authority', { id, canonical: channelId, metadata: metadataChannelId });
      if (!metadataRecord.deepIntelligence || metadataRecord.deepIntelligence.folderName !== folderName) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'metadata-full folderName differs from canonical authority', { id, canonical: folderName, metadata: metadataRecord.deepIntelligence && metadataRecord.deepIntelligence.folderName });
      if (metadataRecord.deepIntelligence && metadataRecord.deepIntelligence.dossierPath !== expectedDossierPath) addError(errors, 'IDENTITY_PATH_MISMATCH', 'metadata-full dossierPath is not exact', { id, expected: expectedDossierPath, actual: metadataRecord.deepIntelligence.dossierPath });
      if (metadataRecord.deepIntelligence) {
        ensureCount(metadataRecord.deepIntelligence.topVideosCount, `/records/${metadataEntry.index}/deepIntelligence/topVideosCount`, errors);
        ensureCount(metadataRecord.deepIntelligence.transcriptsCount, `/records/${metadataEntry.index}/deepIntelligence/transcriptsCount`, errors);
      }
    }
    if (!folderEntry) continue;
    const topRel = `${expectedDossierPath}/top-videos.json`;
    const profileRel = `${expectedDossierPath}/channel-profile.json`;
    const top = load(topRel, 'target');
    const profile = load(profileRel, 'target');
    if (!isPlainObject(top)) { addError(errors, 'INVALID_DOCUMENT', 'top-videos.json must be an object', { path: topRel }); continue; }
    if (!isPlainObject(profile)) { addError(errors, 'INVALID_DOCUMENT', 'channel-profile.json must be an object', { path: profileRel }); continue; }
    if (top.rawId !== id) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'top-videos rawId differs from canonical authority', { id, path: topRel, actual: top.rawId });
    if (top.channelId !== channelId) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'top-videos channelId differs from canonical authority', { id, path: topRel, actual: top.channelId });
    if (profile.id !== id) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'channel-profile id differs from canonical authority', { id, path: profileRel, actual: profile.id });
    if (profile.channelId !== channelId) addError(errors, 'IDENTITY_JOIN_MISMATCH', 'channel-profile channelId differs from canonical authority', { id, path: profileRel, actual: profile.channelId });
    const topVideos = Array.isArray(top.videos) ? top.videos : null;
    if (!topVideos) addError(errors, 'INVALID_COLLECTION', 'top-videos.videos must be an array', { path: topRel, pointer: '/videos' });
    const profileStats = profile.summaryStats;
    if (!isPlainObject(profileStats)) addError(errors, 'INVALID_DOCUMENT', 'channel-profile.summaryStats must be an object', { path: profileRel, pointer: '/summaryStats' });
    try { readNumberField(top, '/totalVideos', errors); readNumberField(top, '/transcriptsCount', errors); } catch (error) { errors.push(error); }
    if (profileStats) { readNumberField(profile, '/summaryStats/topVideosCollected', errors); readNumberField(profile, '/summaryStats/transcriptsExtracted', errors); }
    const sourceInventory = collectFolderSource(root, folderName, top, errors, fileHashes);
    const refs = validateRefs(root, folderName, top, sourceInventory, errors);
    const actual = {
      topVideos: topVideos ? topVideos.length : 0,
      transcripts: sourceInventory.transcriptFiles.length,
      summaries: sourceInventory.summaryFiles.length,
      unknownRows: refs.unknownRows.length,
    };
    if (actual.transcripts !== actual.summaries) addError(errors, 'SOURCE_INVENTORY_MISMATCH', 'Transcript and summary source inventories must be paired', { id, transcripts: actual.transcripts, summaries: actual.summaries });
    const canonicalTop = deepIntelligence.topVideosCount;
    const canonicalTranscript = deepIntelligence.transcriptsCount;
    ensureCount(canonicalTop, `${REL.canonical}#/records/${canonicalEntry.index}/deepIntelligence/topVideosCount`, errors);
    ensureCount(canonicalTranscript, `${REL.canonical}#/records/${canonicalEntry.index}/deepIntelligence/transcriptsCount`, errors);
    if (canonicalTop !== actual.topVideos || canonicalTranscript !== actual.transcripts) addError(errors, 'CANONICAL_SOURCE_DRIFT', 'Canonical deepIntelligence counts do not match file-backed source inventory; canonical raw is read-only', { id, canonicalTopVideos: canonicalTop, actualTopVideos: actual.topVideos, canonicalTranscripts: canonicalTranscript, actualTranscripts: actual.transcripts });
    const profileVitality = profile.vitalityAudit;
    const canonicalVitality = record.vitalityAudit;
    const canonicalDeepVitality = deepIntelligence.vitalityAudit;
    if (!isPlainObject(canonicalVitality) || !isPlainObject(profileVitality)) addError(errors, 'VITALITY_SOURCE_MISSING', 'Canonical/profile vitality source is missing', { id });
    if (id === 'RAW-033' || id === 'RAW-077') {
      for (const field of VITALITY_CONSENSUS_FIELDS) {
        const values = [canonicalVitality && canonicalVitality[field], canonicalDeepVitality && canonicalDeepVitality[field], profileVitality && profileVitality[field]];
        if (values.some((value) => value === undefined)) addError(errors, 'VITALITY_SOURCE_FIELD_MISSING', 'Named vitality source field is missing', { id, field });
        if (!jsonEqual(values[0], values[1]) || !jsonEqual(values[0], values[2])) addError(errors, 'VITALITY_SOURCE_CONFLICT', 'Canonical/profile vitality sources disagree; no metadata patch can be selected', { id, field, canonical: values[0], canonicalDeepProjection: values[1], profile: values[2] });
        if (field === 'evaluatedAt' && metadataRecord && isPlainObject(metadataRecord.vitalityAudit)) {
          if (!own(metadataRecord.vitalityAudit, field)) addError(errors, 'VITALITY_TARGET_FIELD_MISSING', 'Preserved evaluatedAt field is missing from metadata-full', { id, field });
          else if (!jsonEqual(metadataRecord.vitalityAudit[field], values[0])) addError(errors, 'VITALITY_EVALUATED_AT_MISMATCH', 'Preserved evaluatedAt does not match canonical/deep/profile consensus', { id, canonical: values[0], metadata: metadataRecord.vitalityAudit[field] });
        }
      }
    }
    addHash(fileHashes, topRel, hashFile(resolveInside(root, topRel), topRel, errors, 'target'));
    addHash(fileHashes, profileRel, hashFile(resolveInside(root, profileRel), profileRel, errors, 'target'));
    channels.push({ id, channelId, folderName, selected: selectedSet.has(id), topRel, profileRel, top, profile, manifestEntry, metadataEntry, refs, actual, sourceInventory });
  }

  // Hash canonical/manifest/metadata were added before deep traversal; roles
  // for all target/source files are deterministic and complete.
  roles[REL.canonical] = 'source';
  roles[REL.rootManifest] = 'target';
  roles[REL.metadataFull] = 'target';
  const expectedFolderSet = new Set(canonicalIds.map((id) => canonicalById.get(id).record.deepIntelligence && canonicalById.get(id).record.deepIntelligence.folderName).filter(Boolean));
  for (const folderName of deepFolders.keys()) if (!expectedFolderSet.has(folderName)) addError(errors, 'UNEXPECTED_DOSSIER', 'Deep corpus contains a folder not named by canonical authority', { folderName });
  if (manifestDoc && manifestDoc.totalChannelsProcessed !== undefined && manifestDoc.totalChannelsProcessed !== canonicalIds.length) addError(errors, 'MANIFEST_TOTAL_MISMATCH', 'Root manifest totalChannelsProcessed does not match canonical records', { expected: canonicalIds.length, actual: manifestDoc.totalChannelsProcessed });
  if (metadataDoc && metadataDoc.totalRecords !== undefined && metadataDoc.totalRecords !== metadata.length) addError(errors, 'METADATA_TOTAL_MISMATCH', 'metadata-full totalRecords does not match its records array', { expected: metadata.length, actual: metadataDoc.totalRecords });
  const totals = channels.reduce((acc, channel) => {
    acc.topVideos += channel.actual.topVideos;
    acc.transcripts += channel.actual.transcripts;
    acc.summaries += channel.actual.summaries;
    acc.unknownRows += channel.actual.unknownRows;
    return acc;
  }, { topVideos: 0, transcripts: 0, summaries: 0, unknownRows: 0 });
  return { root, errors, docs, fileHashes, roles, canonicalDoc, manifestDoc, metadataDoc, canonical, manifest, metadata, canonicalById, manifestById, metadataById, channels, totals, canonicalIds, selectedIds, selectedSet };
}

function pointerChange(targetFiles, relativePath, id, role, document, pointer, after, context = {}) {
  const read = getPointer(document, pointer);
  if (!read.exists) throw new ProjectionSyncError('MISSING_POINTER', 'Writable pointer does not exist', { path: relativePath, pointer, id });
  if (jsonEqual(read.value, after)) return;
  let file = targetFiles.find((item) => item.path === relativePath);
  if (!file) {
    file = { path: relativePath, id, role, pointers: [] };
    targetFiles.push(file);
  }
  file.pointers.push({ pointer, before: read.value, after, ...context });
}

function buildTargetChanges(state) {
  const targetFiles = [];
  for (const channel of state.channels.filter((entry) => entry.selected)) {
    const { id, manifestEntry, metadataEntry, top, profile, actual } = channel;
    if (!manifestEntry || !metadataEntry) continue;
    pointerChange(targetFiles, REL.rootManifest, id, 'root_manifest', state.manifestDoc, ptr('channels', manifestEntry.index, 'topVideosCount'), actual.topVideos);
    pointerChange(targetFiles, REL.rootManifest, id, 'root_manifest', state.manifestDoc, ptr('channels', manifestEntry.index, 'transcriptsCount'), actual.transcripts);
    pointerChange(targetFiles, channel.topRel, id, 'top_videos', top, '/totalVideos', actual.topVideos);
    pointerChange(targetFiles, channel.topRel, id, 'top_videos', top, '/transcriptsCount', actual.transcripts);
    pointerChange(targetFiles, channel.profileRel, id, 'channel_profile', profile, '/summaryStats/topVideosCollected', actual.topVideos);
    pointerChange(targetFiles, channel.profileRel, id, 'channel_profile', profile, '/summaryStats/transcriptsExtracted', actual.transcripts);
    pointerChange(targetFiles, REL.metadataFull, id, 'metadata_full', state.metadataDoc, ptr('records', metadataEntry.index, 'deepIntelligence', 'topVideosCount'), actual.topVideos);
    pointerChange(targetFiles, REL.metadataFull, id, 'metadata_full', state.metadataDoc, ptr('records', metadataEntry.index, 'deepIntelligence', 'transcriptsCount'), actual.transcripts);
    if (VITALITY_IDS.includes(id)) {
      const source = state.canonicalById.get(id).record.vitalityAudit;
      const metadataVitality = state.metadataById.get(id).record.vitalityAudit;
      for (const field of VITALITY_PATCH_FIELDS) pointerChange(targetFiles, REL.metadataFull, id, 'metadata_full_vitality', state.metadataDoc, ptr('records', metadataEntry.index, 'vitalityAudit', field), source[field], { source: 'canonical+profile consensus', preservedFields: VITALITY_PRESERVED_FIELDS });
      // These assertions document the negative scope in the plan and protect
      // against an accidental future expansion of the vitality patch.
      if (metadataVitality) {
        for (const field of VITALITY_PRESERVED_FIELDS) {
          if (!own(metadataVitality, field)) throw new ProjectionSyncError('PRESERVED_FIELD_MISSING', 'A preserved historical vitality field is missing', { id, field });
        }
      }
    }
  }
  targetFiles.sort((a, b) => a.path.localeCompare(b.path));
  for (const file of targetFiles) file.pointers.sort((a, b) => a.pointer.localeCompare(b.pointer));
  return targetFiles;
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildAfterDocuments(state, targetFiles) {
  const docs = Object.create(null);
  for (const file of targetFiles) {
    const current = state.docs[file.path];
    if (!current) throw new ProjectionSyncError('MISSING_DOCUMENT', 'Target document is missing while building plan', { path: file.path });
    const after = cloneJson(current);
    for (const change of file.pointers) setPointerExisting(after, change.pointer, cloneJson(change.after));
    file.beforeHash = state.fileHashes[file.path] && state.fileHashes[file.path].sha256;
    file.beforeBytes = state.fileHashes[file.path] && state.fileHashes[file.path].bytes;
    file.afterHash = sha256Bytes(Buffer.from(serializeJson(after), 'utf8'));
    file.afterBytes = Buffer.byteLength(serializeJson(after));
    docs[file.path] = after;
  }
  return docs;
}

function defaultArtifactPaths(root, planId) {
  const base = AUDIT_REL;
  return {
    planPath: `${base}/projection-sync-${planId}.plan.json`,
    diffPath: `${base}/projection-sync-${planId}.diff.json`,
    backupDir: `${base}/backups/${planId}`,
    backupManifest: `${base}/backups/${planId}/manifest.json`,
    recoveryManifest: `${base}/backups/${planId}/recovery.json`,
  };
}

function normalizeArtifactPath(root, candidate, fallback) {
  const value = candidate || fallback;
  const abs = resolveInside(root, value, 'artifact path');
  const relative = normalizeRel(abs, root);
  if (relative !== AUDIT_REL && !relative.startsWith(`${AUDIT_REL}/`)) {
    throw new ProjectionSyncError('ARTIFACT_PATH_NOT_ALLOWED', 'Artifacts must remain below the exact A16-P audit directory', { path: relative, allowedPrefix: AUDIT_REL });
  }
  const components = relative.split('/');
  for (const component of components) rejectUnsafeSegment(component, 'artifact path');
  return relative;
}

function assertPlanArtifacts(root, plan) {
  const expected = defaultArtifactPaths(root, plan.planId);
  if (!isPlainObject(plan.artifacts) || !jsonEqual(plan.artifacts, expected)) {
    throw new ProjectionSyncError('ARTIFACT_CONTRACT_MISMATCH', 'Plan artifact paths are not the generated audit-only paths for this planId', {
      expected,
      actual: plan.artifacts,
    });
  }
  for (const value of Object.values(expected)) normalizeArtifactPath(root, value, value);
  return expected;
}

function planCore(plan) {
  return {
    schema: plan.schema,
    version: plan.version,
    operation: plan.operation,
    asOf: plan.asOf,
    root: plan.root,
    selection: plan.selection,
    scope: plan.scope,
    totals: plan.totals,
    files: plan.files,
    targetFiles: plan.targetFiles,
    guards: plan.guards,
  };
}

function computePlanId(plan) {
  return sha256Json(planCore(plan)).slice(0, 20);
}

function buildPlan(options = {}) {
  const overrides = ['planPath', 'outputPath', 'diffPath', 'backupDir', 'backupManifest', 'recoveryManifest']
    .filter((key) => options[key] !== undefined && options[key] !== null);
  if (overrides.length) {
    throw new ProjectionSyncError('ARTIFACT_PATH_OVERRIDE_REJECTED', 'CLI/caller artifact path overrides are disabled; generated audit paths are mandatory', { fields: overrides });
  }
  const state = loadProject(options);
  return buildPlanFromState(state, options);
}

function buildPlanFromState(state, options = {}) {
  if (state.errors.length) throw new ProjectionSyncError('SCAN_FAILED', 'Projection sync scan failed; no plan was produced', { errors: state.errors.map(errorObject) });
  let targetFiles;
  try { targetFiles = buildTargetChanges(state); } catch (error) { throw error instanceof ProjectionSyncError ? error : new ProjectionSyncError('PLAN_BUILD_FAILED', String(error.message || error)); }
  const afterDocuments = buildAfterDocuments(state, targetFiles);
  const allFiles = Object.keys(state.fileHashes).sort().map((filePath) => ({ path: filePath, role: state.roles[filePath] || state.fileHashes[filePath].role, sha256: state.fileHashes[filePath].sha256, bytes: state.fileHashes[filePath].bytes }));
  const plan = {
    schema: PLAN_SCHEMA,
    version: 1,
    operation: 'A16-P_PROJECTION_SYNC',
    asOf: options.asOf || null,
    root: normalizeRel(state.root, state.root) || '.',
    selection: { ids: state.selectedIds },
    scope: {
      canonicalAuthority: REL.canonical,
      targetKinds: ['root_manifest', 'top_videos', 'channel_profile', 'metadata_full', 'metadata_full_vitality'],
      sourcePathsImmutable: [REL.canonical, `${REL.deepRoot}/<folder>/transcripts/*`],
      summaryReferences: ['folder_relative', 'project_prefixed'],
      noPathNormalization: true,
      noFuzzyIdentity: true,
      noYppVerification: true,
      noIncomeComputation: true,
      noSpeechInference: true,
      artifactRoot: AUDIT_REL,
      artifactPathsBoundToPlanId: true,
      cliArtifactOverrides: false,
    },
    totals: {
      canonicalRecords: state.canonicalIds.length,
      selectedRecords: state.selectedIds.length,
      deepFolders: state.channels.length,
      topVideos: state.totals.topVideos,
      transcriptFiles: state.totals.transcripts,
      summaryFiles: state.totals.summaries,
      unknownHasTranscriptFalseRows: state.totals.unknownRows,
      expectedUnknownHasTranscriptFalseRowsPreserved: state.totals.unknownRows,
      referenceStyles: state.channels.reduce((acc, channel) => {
        for (const kind of ['transcript', 'summary']) for (const [style, count] of Object.entries(channel.refs.styles[kind])) acc[kind][style] = (acc[kind][style] || 0) + count;
        return acc;
      }, { transcript: Object.create(null), summary: Object.create(null) }),
    },
    files: allFiles,
    targetFiles,
    guards: {
      canonicalRawUnchanged: true,
      transcriptSourcesUnchanged: true,
      summarySourcesUnchanged: true,
      hasTranscriptRowsPreserved: true,
      unknownRowsPreserved: state.totals.unknownRows,
      yppStatus: 'NOT_VERIFIED',
      incomeComputed: false,
      noSpeechComputed: false,
      summaryRefsRewritten: false,
      raw091HandleTouched: false,
      vitalityPatchFields: VITALITY_PATCH_FIELDS.slice(),
      vitalityConsensusFields: VITALITY_CONSENSUS_FIELDS.slice(),
      vitalityOutOfScopeFields: VITALITY_OUT_OF_SCOPE_FIELDS.slice(),
      vitalityPreservedFields: VITALITY_PRESERVED_FIELDS.slice(),
    },
    approval: { required: true, reviewed: false, reviewer: null },
    artifacts: null,
  };
  plan.artifacts = null;
  // Artifact paths are generated from the final content hash, not a clock.
  plan.planId = computePlanId(plan);
  plan.artifacts = defaultArtifactPaths(state.root, plan.planId);
  return { plan, state, afterDocuments };
}

function assertSafeArtifactDestination(root, relativePath, options = {}) {
  const normalized = normalizeArtifactPath(root, relativePath, relativePath);
  const abs = resolveInside(root, normalized, 'artifact path');
  assertNoFollowPath(root, abs, normalized, { allowMissing: true, role: 'artifact' });
  const parent = path.dirname(abs);
  let cursor = parent;
  const missing = [];
  while (cursor !== path.resolve(root) && !fs.existsSync(cursor)) { missing.push(cursor); cursor = path.dirname(cursor); }
  if (cursor !== path.resolve(root)) {
    const rel = normalizeRel(cursor, root);
    const stat = (() => { try { return fs.lstatSync(cursor); } catch (error) { throw new ProjectionSyncError('ARTIFACT_PARENT_INVALID', 'Artifact parent is inaccessible', { path: rel, error: String(error.message || error) }); } })();
    if (isReparseOrSymlink(stat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Artifact parent may not be a symlink/junction', { path: rel });
    if (!stat.isDirectory()) throw new ProjectionSyncError('ARTIFACT_PARENT_INVALID', 'Artifact parent is not a directory', { path: rel });
  }
  for (const dir of missing.reverse()) {
    // Re-check the parent immediately before creating each directory.  A
    // junction inserted between the preflight and mkdir must not redirect the
    // artifact tree.
    assertNoFollowPath(root, path.dirname(dir), normalizeRel(path.dirname(dir), root), { role: 'artifact' });
    fs.mkdirSync(dir);
    const stat = fs.lstatSync(dir);
    if (isReparseOrSymlink(stat) || !stat.isDirectory()) throw new ProjectionSyncError('ARTIFACT_PARENT_INVALID', 'Created artifact parent is not a regular directory', { path: normalizeRel(dir, root) });
  }
  let finalStat = null;
  try { finalStat = fs.lstatSync(abs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
  if (finalStat && isReparseOrSymlink(finalStat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Artifact destination may not be a symlink/junction', { path: normalized });
  if (finalStat && !finalStat.isFile()) throw new ProjectionSyncError('ARTIFACT_DESTINATION_INVALID', 'Artifact destination must be a regular file', { path: normalized });
  if (finalStat && !options.allowExisting) throw new ProjectionSyncError('ARTIFACT_EXISTS', 'Artifact destination already exists; refusing overwrite', { path: normalized });
  return abs;
}

function archiveExistingArtifact(root, relativePath) {
  const abs = resolveInside(root, relativePath, 'artifact path');
  const stat = (() => { try { return fs.lstatSync(abs); } catch (error) { if (error && error.code === 'ENOENT') return null; throw error; } })();
  if (!stat) return null;
  if (isReparseOrSymlink(stat) || !stat.isFile()) throw new ProjectionSyncError('ARTIFACT_DESTINATION_INVALID', 'Existing artifact is not a regular file', { path: relativePath });
  const bytes = fs.readFileSync(abs);
  const suffix = sha256Bytes(bytes).slice(0, 20);
  const archiveBase = `${AUDIT_REL}/superseded/${path.basename(relativePath)}.${suffix}.previous`;
  let archiveRel = archiveBase;
  let counter = 1;
  while (true) {
    const candidateAbs = resolveInside(root, archiveRel, 'artifact archive path');
    let candidateStat = null;
    try { candidateStat = fs.lstatSync(candidateAbs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
    if (!candidateStat) break;
    archiveRel = `${archiveBase}.${counter}`;
    counter += 1;
  }
  const archiveAbs = assertSafeArtifactDestination(root, archiveRel);
  assertNoFollowPath(root, abs, relativePath, { role: 'artifact' });
  assertNoFollowPath(root, archiveAbs, archiveRel, { allowMissing: true, role: 'artifact' });
  fs.renameSync(abs, archiveAbs);
  return archiveRel;
}

function writeArtifact(root, relativePath, content, options = {}) {
  const normalized = normalizeArtifactPath(root, relativePath, relativePath);
  const abs = assertSafeArtifactDestination(root, normalized, { allowExisting: !!options.replace });
  if (options.replace) archiveExistingArtifact(root, normalized);
  const tempRel = `${normalized}.tmp-a16p`;
  const tempAbs = assertSafeArtifactDestination(root, tempRel);
  try {
    assertNoFollowPath(root, tempAbs, tempRel, { allowMissing: true, role: 'artifact' });
    fs.writeFileSync(tempAbs, content, { encoding: 'utf8', flag: 'wx' });
    assertNoFollowPath(root, tempAbs, tempRel, { role: 'artifact' });
    assertNoFollowPath(root, abs, normalized, { allowMissing: true, role: 'artifact' });
    fs.renameSync(tempAbs, abs);
  } catch (error) {
    // Never remove an unknown artifact/temp path.  A known temp residue is
    // retained for audit recovery rather than deleting project data.
    throw new ProjectionSyncError('ARTIFACT_WRITE_FAILED', 'Could not write plan/audit artifact', { path: normalized, tempPath: tempRel, error: String(error.message || error) });
  }
  return normalized;
}

function writeAuditArtifact(root, relativePath, content) {
  return writeArtifact(root, relativePath, content, { replace: true });
}

function writePlanArtifacts(result) {
  const { plan, state } = result;
  assertPlanArtifacts(state.root, plan);
  const diff = {
    schema: 'h2dev.a16p.projection-sync-diff.v1',
    planId: plan.planId,
    status: plan.targetFiles.length ? 'CHANGES_PLANNED' : 'NO_CHANGES',
    changes: plan.targetFiles,
  };
  // Generated plan/diff artifacts are audit records, not apply targets. When
  // the same deterministic plan is regenerated, preserve the prior record in
  // the audit superseded area before installing the replacement.
  writeAuditArtifact(state.root, plan.artifacts.planPath, `${JSON.stringify(plan, null, 2)}\n`);
  writeAuditArtifact(state.root, plan.artifacts.diffPath, `${JSON.stringify(diff, null, 2)}\n`);
  return { planPath: plan.artifacts.planPath, diffPath: plan.artifacts.diffPath };
}

function readPlan(planPath, rootOverride) {
  const absPlan = path.resolve(planPath);
  const root = path.resolve(rootOverride || path.resolve(__dirname, '..', '..'));
  let text;
  try { text = fs.readFileSync(absPlan, 'utf8'); } catch (error) { throw new ProjectionSyncError('PLAN_READ_ERROR', 'Could not read plan file', { path: planPath, error: String(error.message || error) }); }
  let plan;
  try { plan = JSON.parse(text); } catch (error) { throw new ProjectionSyncError('MALFORMED_PLAN', 'Plan file cannot be parsed', { path: planPath, error: String(error.message || error) }); }
  if (!isPlainObject(plan) || plan.schema !== PLAN_SCHEMA || plan.version !== 1) throw new ProjectionSyncError('INVALID_PLAN', 'Plan schema/version is not accepted', { path: planPath });
  if (!Array.isArray(plan.files) || !Array.isArray(plan.targetFiles) || !plan.planId) throw new ProjectionSyncError('INVALID_PLAN', 'Plan is missing immutable file/target contract', { path: planPath });
  if (plan.root && plan.root !== '.' && path.resolve(plan.root) !== root) {
    // `root` in generated live plans is `.` by design; fixture callers may
    // include an absolute root and must still match the explicit override.
    if (path.isAbsolute(plan.root) && path.resolve(plan.root) !== root) throw new ProjectionSyncError('PLAN_ROOT_MISMATCH', 'Plan root differs from apply root', { planRoot: plan.root, root });
  }
  return { plan, root };
}

function planFileMap(plan) {
  const map = new Map();
  for (const file of plan.files) {
    if (!isPlainObject(file) || typeof file.path !== 'string' || !/^[^/]+(?:\/[^/]+)*$/.test(file.path) || path.isAbsolute(file.path)) throw new ProjectionSyncError('INVALID_PLAN_PATH', 'Plan contains an invalid relative file path', { path: file && file.path });
    for (const segment of file.path.split('/')) rejectUnsafeSegment(segment, 'plan file path');
    if (map.has(file.path)) throw new ProjectionSyncError('DUPLICATE_PLAN_PATH', 'Plan contains a duplicate file path', { path: file.path });
    map.set(file.path, file);
  }
  return map;
}

function assertAllowedTargetPointer(filePath, role, pointer) {
  const segments = decodePointer(pointer);
  const numeric = (segment) => /^\d+$/.test(segment);
  let allowed = false;
  if (role === 'root_manifest') {
    allowed = segments.length === 3 && segments[0] === 'channels' && numeric(segments[1])
      && (segments[2] === 'topVideosCount' || segments[2] === 'transcriptsCount');
  } else if (role === 'top_videos') {
    allowed = segments.length === 1 && (segments[0] === 'totalVideos' || segments[0] === 'transcriptsCount');
  } else if (role === 'channel_profile') {
    allowed = segments.length === 2 && segments[0] === 'summaryStats'
      && (segments[1] === 'topVideosCollected' || segments[1] === 'transcriptsExtracted');
  } else if (role === 'metadata_full' || role === 'metadata_full_vitality') {
    allowed = segments.length === 4 && segments[0] === 'records' && numeric(segments[1])
      && segments[2] === 'deepIntelligence'
      && (segments[3] === 'topVideosCount' || segments[3] === 'transcriptsCount');
    if (!allowed) {
      allowed = segments.length === 4 && segments[0] === 'records' && numeric(segments[1])
        && segments[2] === 'vitalityAudit' && VITALITY_PATCH_FIELDS.includes(segments[3]);
    }
  }
  if (!allowed) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Pointer is outside the A16-P writable allowlist', { path: filePath, role, pointer });
}

function validatePlanContract(plan, state, expectedPlan = null) {
  assertPlanArtifacts(state.root, plan);
  const planMap = planFileMap(plan);
  const statePaths = Object.keys(state.fileHashes).sort();
  const planPaths = [...planMap.keys()].sort();
  if (!jsonEqual(planPaths, statePaths)) throw new ProjectionSyncError('INPUT_SET_DRIFT', 'Current relevant file set differs from plan', { expected: planPaths, actual: statePaths });
  const drift = [];
  for (const relativePath of statePaths) {
    const expected = planMap.get(relativePath);
    const actual = state.fileHashes[relativePath];
    if (!expected || expected.sha256 !== actual.sha256 || expected.bytes !== actual.bytes) drift.push({ path: relativePath, expected, actual, role: state.roles[relativePath] || actual.role });
  }
  if (drift.length) {
    const source = drift.filter((entry) => entry.role === 'source');
    const target = drift.filter((entry) => entry.role !== 'source');
    throw new ProjectionSyncError(source.length && !target.length ? 'SOURCE_DRIFT' : target.length && !source.length ? 'TARGET_DRIFT' : 'INPUT_TARGET_DRIFT', 'Relevant input/target hashes differ from the reviewed plan', { source, target });
  }
  const expectedTargets = expectedPlan ? expectedPlan.targetFiles : null;
  if (expectedTargets) {
    if (!jsonEqual(expectedTargets, plan.targetFiles)) throw new ProjectionSyncError('PLAN_TARGET_CONTRACT_MISMATCH', 'Plan target pointers differ from deterministic scan', { expected: expectedTargets, actual: plan.targetFiles });
  }
  for (const file of plan.targetFiles) {
    if (!isPlainObject(file) || typeof file.path !== 'string' || !Array.isArray(file.pointers) || typeof file.beforeHash !== 'string' || typeof file.afterHash !== 'string' || !Number.isInteger(file.beforeBytes) || !Number.isInteger(file.afterBytes)) throw new ProjectionSyncError('INVALID_TARGET_CONTRACT', 'Plan target entry is incomplete', { file });
    if (!planMap.has(file.path) || planMap.get(file.path).role === 'source') throw new ProjectionSyncError('TARGET_NOT_ALLOWED', 'A target file is not a hashed target projection', { path: file.path });
    const seen = new Set();
    for (const change of file.pointers) {
      if (!isPlainObject(change) || typeof change.pointer !== 'string' || seen.has(change.pointer)) throw new ProjectionSyncError('POINTER_NOT_ALLOWED', 'Plan contains a duplicate/malformed pointer', { path: file.path, pointer: change && change.pointer });
      seen.add(change.pointer);
      assertAllowedTargetPointer(file.path, file.role, change.pointer);
      const current = getPointer(state.docs[file.path], change.pointer);
      if (!current.exists || !jsonEqual(current.value, change.before)) throw new ProjectionSyncError('TARGET_BEFORE_VALUE_MISMATCH', 'Target pointer before value differs from plan', { path: file.path, pointer: change.pointer, expected: change.before, actual: current.value });
    }
    if (planMap.get(file.path).sha256 !== file.beforeHash) throw new ProjectionSyncError('TARGET_HASH_MISMATCH', 'Target before hash disagrees with input hash', { path: file.path });
    if (planMap.get(file.path).bytes !== file.beforeBytes) throw new ProjectionSyncError('TARGET_BYTES_MISMATCH', 'Target before bytes disagree with input file contract', { path: file.path });
  }
  const computedPlanId = computePlanId(plan);
  if (computedPlanId !== plan.planId) throw new ProjectionSyncError('PLAN_TAMPERED', 'Plan content does not match its planId', { expected: computedPlanId, actual: plan.planId });
  return true;
}

function buildStateForPlan(plan, root) {
  const state = loadProject({ root, ids: plan.selection && plan.selection.ids, asOf: plan.asOf });
  if (state.errors.length) throw new ProjectionSyncError('SCAN_FAILED', 'Current project cannot be scanned against the plan', { errors: state.errors.map(errorObject) });
  return state;
}

function targetStateMatches(plan, state, phase) {
  const hashKey = phase === 'before' ? 'beforeHash' : 'afterHash';
  const bytesKey = phase === 'before' ? 'beforeBytes' : 'afterBytes';
  const valueKey = phase === 'before' ? 'before' : 'after';
  return plan.targetFiles.every((file) => {
    const actual = state.fileHashes[file.path];
    if (!actual || actual.sha256 !== file[hashKey] || actual.bytes !== file[bytesKey]) return false;
    const document = state.docs[file.path];
    return file.pointers.every((change) => {
      const current = getPointer(document, change.pointer);
      return current.exists && jsonEqual(current.value, change[valueKey]);
    });
  });
}

function reviewedBeforeState(plan, state) {
  const baseline = {
    ...state,
    errors: [],
    docs: Object.create(null),
    fileHashes: Object.create(null),
    roles: { ...state.roles },
    channels: [],
  };
  for (const [relativePath, document] of Object.entries(state.docs)) baseline.docs[relativePath] = document === null ? null : cloneJson(document);
  for (const [relativePath, file] of Object.entries(state.fileHashes)) baseline.fileHashes[relativePath] = { ...file };
  for (const file of plan.targetFiles) {
    const document = baseline.docs[file.path];
    if (!document) throw new ProjectionSyncError('MISSING_DOCUMENT', 'Cannot reconstruct reviewed target before-image', { path: file.path });
    for (const change of file.pointers) setPointerExisting(document, change.pointer, cloneJson(change.before));
    baseline.fileHashes[file.path] = {
      ...(baseline.fileHashes[file.path] || {}),
      sha256: file.beforeHash,
      bytes: file.beforeBytes,
    };
  }
  baseline.manifestDoc = baseline.docs[REL.rootManifest];
  baseline.metadataDoc = baseline.docs[REL.metadataFull];
  baseline.manifest = baseline.manifestDoc && baseline.manifestDoc.channels;
  baseline.metadata = baseline.metadataDoc && baseline.metadataDoc.records;
  baseline.manifestById = new Map((baseline.manifest || []).map((record, index) => [record && record.id, { record, index }]));
  baseline.metadataById = new Map((baseline.metadata || []).map((record, index) => [record && record.id, { record, index }]));
  baseline.channels = state.channels.map((channel) => {
    const manifestEntry = baseline.manifestById.get(channel.id) || channel.manifestEntry;
    const metadataEntry = baseline.metadataById.get(channel.id) || channel.metadataEntry;
    return {
      ...channel,
      top: baseline.docs[channel.topRel],
      profile: baseline.docs[channel.profileRel],
      manifestEntry,
      metadataEntry,
    };
  });
  return baseline;
}

function validateReviewedPlan(plan, state, phase) {
  assertPlanArtifacts(state.root, plan);
  const computedPlanId = computePlanId(plan);
  if (computedPlanId !== plan.planId) throw new ProjectionSyncError('PLAN_TAMPERED', 'Plan content does not match its planId', { expected: computedPlanId, actual: plan.planId });
  const expectedState = phase === 'after' ? reviewedBeforeState(plan, state) : state;
  const expected = buildPlanFromState(expectedState, { asOf: plan.asOf });
  if (!jsonEqual(planCore(expected.plan), planCore(plan))) {
    throw new ProjectionSyncError('PLAN_TARGET_CONTRACT_MISMATCH', 'Plan full contract or target set differs from deterministic reviewed state', {
      expectedPlanId: expected.plan.planId,
      actualPlanId: plan.planId,
      expectedTargets: expected.plan.targetFiles,
      actualTargets: plan.targetFiles,
    });
  }
  return expected.plan;
}

function expectedBackupPath(backupDir, targetPath) {
  const encoded = Buffer.from(targetPath, 'utf8').toString('base64url');
  return `${backupDir}/${encoded}.before`;
}

function targetSetHash(plan) {
  return sha256Json(plan.targetFiles.map((file) => ({
    path: file.path,
    id: file.id,
    role: file.role,
    beforeHash: file.beforeHash,
    beforeBytes: file.beforeBytes,
    afterHash: file.afterHash,
    afterBytes: file.afterBytes,
    pointers: file.pointers,
  })));
}

function regularArtifactHash(root, relativePath) {
  const abs = resolveInside(root, relativePath, 'artifact path');
  assertNoFollowPath(root, abs, relativePath, { role: 'artifact' });
  let stat;
  try { stat = fs.lstatSync(abs); } catch (error) { throw new ProjectionSyncError('BACKUP_MISSING', 'Backup artifact is missing', { path: relativePath, error: String(error.message || error) }); }
  if (isReparseOrSymlink(stat) || !stat.isFile()) throw new ProjectionSyncError('BACKUP_INVALID', 'Backup artifact is not a regular file', { path: relativePath });
  return { ...hashFile(abs, relativePath, [], 'backup'), abs };
}

function assertExactObjectKeys(value, expectedKeys, code, label) {
  if (!isPlainObject(value)) throw new ProjectionSyncError(code, `${label} must be an object`, { label });
  const expected = new Set(expectedKeys);
  const actual = new Set(Object.keys(value));
  const missing = expectedKeys.filter((key) => !actual.has(key));
  const unexpected = [...actual].filter((key) => !expected.has(key)).sort();
  if (missing.length || unexpected.length) {
    throw new ProjectionSyncError(code, `${label} contains missing or unexpected fields`, { label, missing, unexpected });
  }
}

function expectedTargetStagingPath(targetPath, planId, kind) {
  if (kind !== 'temp' && kind !== 'displaced') throw new ProjectionSyncError('INVALID_RECOVERY', 'Unknown target staging kind', { targetPath, kind });
  return `${targetPath}.${kind === 'temp' ? 'tmp' : 'displaced'}-a16p-${planId}`;
}

function validateRecoveryStagingPath(target, field, actual, planId) {
  const kind = field === 'tempPath' ? 'temp' : field === 'displacedPath' ? 'displaced' : null;
  const expected = expectedTargetStagingPath(target.path, planId, kind);
  if (actual !== expected) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery staging path is not the exact generated path for its target', { path: target.path, field, expected, actual });
  const targetParent = path.posix.dirname(target.path);
  const actualParent = path.posix.dirname(actual);
  if (actualParent !== targetParent) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery staging path is not parent-confined to its target', { path: target.path, field, expectedParent: targetParent, actualParent });
}

function recoveryKeysForState(state) {
  const base = ['schema', 'planId', 'state', 'backupDir', 'backupManifest', 'recoveryManifest', 'targetSetHash', 'backupFiles', 'targetFiles', 'quarantined'];
  if (state === 'BACKUP_PREPARING') return [...base, 'pendingFiles'];
  if (state === 'PREPARED') return base;
  if (state === 'COMPLETED') return [...base, 'completedFiles'];
  if (state === 'ROLLED_BACK') return [...base, 'completedFiles', 'restoredFiles'];
  if (state === 'RECOVERY_REQUIRED') return [...base, 'completedFiles', 'restoredFiles', 'rollbackErrors', 'residueErrors', 'restoredCheck'];
  return null;
}

function expectedBackupEntry(plan, target, backupDir) {
  return {
    path: target.path,
    id: target.id,
    role: target.role,
    backupPath: expectedBackupPath(backupDir, target.path),
    sha256: target.beforeHash,
    bytes: target.beforeBytes,
    beforeHash: target.beforeHash,
    beforeBytes: target.beforeBytes,
    afterHash: target.afterHash,
    afterBytes: target.afterBytes,
  };
}

function recoveryTargetEntries(plan, backupDir) {
  return plan.targetFiles.map((file) => ({
    path: file.path,
    id: file.id,
    role: file.role,
    backupPath: expectedBackupPath(backupDir, file.path),
    tempPath: expectedTargetStagingPath(file.path, plan.planId, 'temp'),
    displacedPath: expectedTargetStagingPath(file.path, plan.planId, 'displaced'),
    status: 'PENDING',
  }));
}

function recoveryJournalDocument(plan, artifacts, state = 'BACKUP_PREPARING') {
  return {
    schema: RECOVERY_SCHEMA,
    planId: plan.planId,
    state,
    backupDir: artifacts.backupDir,
    backupManifest: artifacts.backupManifest,
    recoveryManifest: artifacts.recoveryManifest,
    targetSetHash: targetSetHash(plan),
    backupFiles: [],
    targetFiles: recoveryTargetEntries(plan, artifacts.backupDir),
    quarantined: [],
    ...(state === 'BACKUP_PREPARING' ? { pendingFiles: plan.targetFiles.map((file) => expectedBackupEntry(plan, file, artifacts.backupDir)) } : {}),
  };
}

function validateBackupPreparationManifest(root, plan, recovery, artifacts) {
  if (!isPlainObject(recovery) || recovery.schema !== RECOVERY_SCHEMA || recovery.planId !== plan.planId || recovery.state !== 'BACKUP_PREPARING' || recovery.backupDir !== artifacts.backupDir || recovery.backupManifest !== artifacts.backupManifest || recovery.recoveryManifest !== artifacts.recoveryManifest || recovery.targetSetHash !== targetSetHash(plan)) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation journal does not match the reviewed plan', { path: artifacts.recoveryManifest });
  }
  assertExactObjectKeys(recovery, recoveryKeysForState('BACKUP_PREPARING'), 'INVALID_RECOVERY', 'backup-preparation journal');
  if (!Array.isArray(recovery.backupFiles) || !Array.isArray(recovery.pendingFiles) || !Array.isArray(recovery.targetFiles) || !Array.isArray(recovery.quarantined) || recovery.quarantined.length) throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation journal collections are malformed', { path: artifacts.recoveryManifest });
  const expectedTargets = recoveryTargetEntries(plan, artifacts.backupDir);
  if (!jsonEqual(recovery.targetFiles, expectedTargets)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation target entries are not exactly bound to the reviewed plan', { path: artifacts.recoveryManifest });
  const expectedEntries = plan.targetFiles.map((file) => expectedBackupEntry(plan, file, artifacts.backupDir));
  const expectedByPath = new Map(expectedEntries.map((entry) => [entry.path, entry]));
  const validateEntry = (entry, label) => {
    assertExactObjectKeys(entry, ['path', 'id', 'role', 'backupPath', 'sha256', 'bytes', 'beforeHash', 'beforeBytes', 'afterHash', 'afterBytes'], 'INVALID_RECOVERY', label);
    const expected = expectedByPath.get(entry.path);
    if (!expected || !jsonEqual(entry, expected)) throw new ProjectionSyncError('INVALID_RECOVERY', `${label} is not bound to the reviewed backup contract`, { entry, expected });
    normalizeArtifactPath(root, entry.backupPath, entry.backupPath);
  };
  for (let index = 0; index < recovery.backupFiles.length; index += 1) validateEntry(recovery.backupFiles[index], `backup-preparation complete entry ${index}`);
  for (let index = 0; index < recovery.pendingFiles.length; index += 1) validateEntry(recovery.pendingFiles[index], `backup-preparation pending entry ${index}`);
  const completePaths = recovery.backupFiles.map((entry) => entry.path);
  const pendingPaths = recovery.pendingFiles.map((entry) => entry.path);
  validateRecoveryPathSet(completePaths, expectedEntries.map((entry) => entry.path), 'backupFiles');
  validateRecoveryPathSet(pendingPaths, expectedEntries.map((entry) => entry.path), 'pendingFiles');
  if (new Set([...completePaths, ...pendingPaths]).size !== expectedEntries.length || completePaths.some((value) => pendingPaths.includes(value))) throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation complete/pending membership is duplicate or incomplete', { completePaths, pendingPaths });
  for (const entry of recovery.backupFiles) {
    const actual = regularArtifactHash(root, entry.backupPath);
    if (actual.sha256 !== entry.beforeHash || actual.bytes !== entry.beforeBytes) throw new ProjectionSyncError('BACKUP_VERIFY_FAILED', 'A persisted partial backup does not match its reviewed before-image', { path: entry.path, backupPath: entry.backupPath, expected: { sha256: entry.beforeHash, bytes: entry.beforeBytes }, actual });
  }
  // A process may die after copyFileSync and before the journal publication.
  // Pending entries may therefore already have a verified backup on disk; do
  // not overwrite or trust it until the exact hash is checked.
  for (const entry of recovery.pendingFiles) {
    const actual = existingRecoveryFileHash(root, entry.backupPath, 'backup-preparation pending backup');
    if (actual && (actual.sha256 !== entry.beforeHash || actual.bytes !== entry.beforeBytes)) throw new ProjectionSyncError('BACKUP_VERIFY_FAILED', 'A pending partial backup is tampered', { path: entry.path, backupPath: entry.backupPath, expected: { sha256: entry.beforeHash, bytes: entry.beforeBytes }, actual });
  }
  return recovery;
}

function recoveryRollbackDocument(plan, artifacts, manifest, prior = null, restoredCheck = null) {
  const targetFiles = prior && Array.isArray(prior.targetFiles)
    ? cloneJson(prior.targetFiles)
    : recoveryTargetEntries(plan, artifacts.backupDir);
  const quarantined = prior && Array.isArray(prior.quarantined)
    ? cloneJson(prior.quarantined)
    : [];
  const completedFiles = prior && Array.isArray(prior.completedFiles)
    ? prior.completedFiles.slice()
    : plan.targetFiles.map((file) => file.path);
  return {
    schema: RECOVERY_SCHEMA,
    planId: plan.planId,
    state: 'RECOVERY_REQUIRED',
    backupDir: artifacts.backupDir,
    backupManifest: artifacts.backupManifest,
    recoveryManifest: artifacts.recoveryManifest,
    targetSetHash: targetSetHash(plan),
    backupFiles: cloneJson(manifest.backupFiles),
    targetFiles,
    quarantined,
    completedFiles,
    restoredFiles: [],
    rollbackErrors: [],
    residueErrors: [],
    restoredCheck: restoredCheck && isPlainObject(restoredCheck)
      ? cloneJson(restoredCheck)
      : { ok: false, reason: 'ROLLBACK_IN_PROGRESS' },
  };
}

function validateRecoveryPathSet(value, expectedPaths, label, options = {}) {
  if (!Array.isArray(value)) throw new ProjectionSyncError('INVALID_RECOVERY', `${label} must be an array`, { label });
  const expected = new Set(expectedPaths);
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string' || !expected.has(item) || seen.has(item)) throw new ProjectionSyncError('INVALID_RECOVERY', `${label} contains an unexpected or duplicate target path`, { label, item });
    seen.add(item);
  }
  if (options.exact && !jsonEqual(value, expectedPaths)) throw new ProjectionSyncError('INVALID_RECOVERY', `${label} does not exactly match the reviewed target set`, { label, expected: expectedPaths, actual: value });
}

function existingRecoveryFileHash(root, relativePath, label) {
  const abs = resolveInside(root, relativePath, label);
  let stat;
  try { stat = fs.lstatSync(abs); } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw new ProjectionSyncError('INVALID_RECOVERY', `${label} is inaccessible`, { path: relativePath, error: String(error.message || error) });
  }
  if (isReparseOrSymlink(stat) || !stat.isFile()) throw new ProjectionSyncError('INVALID_RECOVERY', `${label} must be a regular file`, { path: relativePath });
  try {
    const bytes = fs.readFileSync(abs);
    return { sha256: sha256Bytes(bytes), bytes: bytes.length };
  } catch (error) {
    throw new ProjectionSyncError('INVALID_RECOVERY', `${label} cannot be read`, { path: relativePath, error: String(error.message || error) });
  }
}

function recoveryTargetFilesystem(root, plan, recovery, options = {}) {
  const allowMissingTargets = options.allowMissingTargets === true;
  const expectedStaging = new Map();
  const quarantinedSources = new Set((recovery.quarantined || []).map((item) => item && item.source));
  for (const target of plan.targetFiles) {
    expectedStaging.set(target.path, {
      tempPath: expectedTargetStagingPath(target.path, plan.planId, 'temp'),
      displacedPath: expectedTargetStagingPath(target.path, plan.planId, 'displaced'),
    });
  }
  const observations = [];
  for (const target of plan.targetFiles) {
    const staging = expectedStaging.get(target.path);
    const targetHash = existingRecoveryFileHash(root, target.path, 'recovery target');
    const tempHash = existingRecoveryFileHash(root, staging.tempPath, 'recovery temp staging');
    const displacedHash = existingRecoveryFileHash(root, staging.displacedPath, 'recovery displaced staging');
    const targetState = targetHash && (targetHash.sha256 === target.beforeHash ? 'before' : targetHash.sha256 === target.afterHash ? 'after' : null);
    if (targetHash && !targetState) throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target is neither the reviewed before- nor after-image', { path: target.path, actual: targetHash, expected: { beforeHash: target.beforeHash, afterHash: target.afterHash } });
    if (tempHash && (tempHash.sha256 !== target.afterHash || tempHash.bytes !== target.afterBytes)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery temp staging does not match the reviewed after-image', { path: staging.tempPath, expected: { sha256: target.afterHash, bytes: target.afterBytes }, actual: tempHash });
    if (displacedHash && (displacedHash.sha256 !== target.beforeHash || displacedHash.bytes !== target.beforeBytes)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery displaced staging does not match the reviewed before-image', { path: staging.displacedPath, expected: { sha256: target.beforeHash, bytes: target.beforeBytes }, actual: displacedHash });
    const displacedKnown = !!displacedHash || quarantinedSources.has(staging.displacedPath);
    const tempKnown = !!tempHash || quarantinedSources.has(staging.tempPath);
    if (!targetHash && !allowMissingTargets && !displacedKnown) throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target is missing without a verified displaced staging image', { path: target.path });
    if (targetState === 'before' && displacedHash) throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target has both a before-image and live displaced staging copy', { path: target.path });
    if (targetState === 'after' && tempHash) throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target has both an after-image and live temp staging copy', { path: target.path });
    if (!targetHash && !allowMissingTargets && !tempKnown) throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target is missing without a verified temp staging image', { path: target.path });
    if (recovery.state === 'COMPLETED' && targetState !== 'after') throw new ProjectionSyncError('TARGET_DRIFT', 'Completed recovery target is not at the reviewed after-image', { path: target.path, actual: targetState });
    if (recovery.state === 'ROLLED_BACK' && targetState !== 'before') throw new ProjectionSyncError('TARGET_DRIFT', 'Rolled-back recovery target is not at the reviewed before-image', { path: target.path, actual: targetState });
    observations.push({ path: target.path, target: targetHash, targetState, temp: tempHash, displaced: displacedHash, tempKnown, displacedKnown });
  }
  return observations;
}

function assertRecoveryTargetObservationsUnchanged(root, observations) {
  for (const observation of observations) {
    const actual = existingRecoveryFileHash(root, observation.path, 'recovery target');
    if ((actual && !observation.target) || (!actual && observation.target) || (actual && observation.target && (actual.sha256 !== observation.target.sha256 || actual.bytes !== observation.target.bytes))) {
      throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target changed during recovery preflight; no restore was attempted', { path: observation.path, expected: observation.target, actual });
    }
  }
}

function assertRecoveryImmutableInputs(root, plan) {
  const targetPaths = new Set(plan.targetFiles.map((file) => file.path));
  const sourceDrift = [];
  const targetDrift = [];
  for (const file of plan.files) {
    if (targetPaths.has(file.path)) continue;
    let actual = null;
    let readError = null;
    try { actual = existingRecoveryFileHash(root, file.path, 'recovery immutable input'); } catch (error) { readError = errorObject(error); }
    if (!actual || readError || actual.sha256 !== file.sha256 || actual.bytes !== file.bytes) {
      const entry = { path: file.path, role: file.role, expected: { sha256: file.sha256, bytes: file.bytes }, actual, ...(readError ? { error: readError } : {}) };
      if (file.role === 'source') sourceDrift.push(entry); else targetDrift.push(entry);
    }
  }
  if (sourceDrift.length || targetDrift.length) {
    const code = sourceDrift.length && targetDrift.length ? 'INPUT_TARGET_DRIFT' : sourceDrift.length ? 'SOURCE_DRIFT' : 'TARGET_DRIFT';
    throw new ProjectionSyncError(code, 'Immutable recovery inputs differ from the reviewed plan', { source: sourceDrift, target: targetDrift });
  }
}

function validateRecoveryManifest(root, plan, recovery, recoveryManifestRel, artifacts) {
  if (!isPlainObject(recovery) || recovery.schema !== RECOVERY_SCHEMA || recovery.planId !== plan.planId || recovery.backupManifest !== artifacts.backupManifest || recovery.backupDir !== artifacts.backupDir || recovery.recoveryManifest !== artifacts.recoveryManifest || recovery.targetSetHash !== targetSetHash(plan)) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery manifest does not match the reviewed plan', { path: recoveryManifestRel });
  }
  if (!recoveryKeysForState(recovery.state)) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery manifest is not a recoverable process-death state', { path: recoveryManifestRel, state: recovery.state });
  }
  assertExactObjectKeys(recovery, recoveryKeysForState(recovery.state), 'INVALID_RECOVERY', 'recovery manifest');
  if (!Array.isArray(recovery.backupFiles) || !Array.isArray(recovery.targetFiles) || !Array.isArray(recovery.quarantined)) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery manifest collections are malformed', { path: recoveryManifestRel });
  }
  if (recovery.backupFiles.length !== plan.targetFiles.length) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery backup membership does not match the reviewed target set', { expected: plan.targetFiles.length, actual: recovery.backupFiles.length });
  }
  if (recovery.targetFiles.length !== plan.targetFiles.length) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery target membership does not match the reviewed target set', { expected: plan.targetFiles.length, actual: recovery.targetFiles.length });
  }
  const targetByPath = new Map();
  for (let index = 0; index < plan.targetFiles.length; index += 1) {
    const target = plan.targetFiles[index];
    const item = recovery.targetFiles[index];
    if (targetByPath.has(target.path)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Reviewed plan has duplicate target paths', { path: target.path });
    targetByPath.set(target.path, target);
    assertExactObjectKeys(item, ['path', 'id', 'role', 'backupPath', 'tempPath', 'displacedPath', 'status'], 'INVALID_RECOVERY', `recovery target entry ${index}`);
    if (item.path !== target.path || item.id !== target.id || item.role !== target.role || item.backupPath !== expectedBackupPath(artifacts.backupDir, target.path) || item.status !== 'PENDING') {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery target entry is not bound to the reviewed target contract', { index, expected: { path: target.path, id: target.id, role: target.role, backupPath: expectedBackupPath(artifacts.backupDir, target.path), status: 'PENDING' }, actual: item });
    }
    validateRecoveryStagingPath(target, 'tempPath', item.tempPath, plan.planId);
    validateRecoveryStagingPath(target, 'displacedPath', item.displacedPath, plan.planId);
  }
  const expectedTargetPaths = plan.targetFiles.map((target) => target.path);
  if (!jsonEqual(expectedTargetPaths, recovery.targetFiles.map((target) => target.path))) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery target membership/order is not exactly the reviewed target set', { expected: expectedTargetPaths, actual: recovery.targetFiles.map((target) => target.path) });
  }
  const backupEntryKeys = ['path', 'id', 'role', 'backupPath', 'sha256', 'bytes', 'beforeHash', 'beforeBytes', 'afterHash', 'afterBytes'];
  for (let index = 0; index < recovery.backupFiles.length; index += 1) {
    const item = recovery.backupFiles[index];
    assertExactObjectKeys(item, backupEntryKeys, 'INVALID_RECOVERY', `recovery backup entry ${index}`);
    const target = plan.targetFiles[index];
    if (!target || item.path !== target.path || item.id !== target.id || item.role !== target.role || item.backupPath !== expectedBackupPath(artifacts.backupDir, target.path)
      || item.sha256 !== target.beforeHash || item.bytes !== target.beforeBytes || item.beforeHash !== target.beforeHash || item.beforeBytes !== target.beforeBytes
      || item.afterHash !== target.afterHash || item.afterBytes !== target.afterBytes) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery backup entry is not bound to the reviewed target contract', { index, item, expected: target && { path: target.path, id: target.id, role: target.role, backupPath: expectedBackupPath(artifacts.backupDir, target.path), sha256: target.beforeHash, bytes: target.beforeBytes, beforeHash: target.beforeHash, beforeBytes: target.beforeBytes, afterHash: target.afterHash, afterBytes: target.afterBytes } });
    }
  }
  if (recovery.state === 'COMPLETED' || recovery.state === 'ROLLED_BACK') {
    validateRecoveryPathSet(recovery.completedFiles, expectedTargetPaths, 'completedFiles', { exact: true });
  } else if (recovery.state === 'RECOVERY_REQUIRED') {
    validateRecoveryPathSet(recovery.completedFiles, expectedTargetPaths, 'completedFiles');
    validateRecoveryPathSet(recovery.restoredFiles, expectedTargetPaths, 'restoredFiles');
    if (!Array.isArray(recovery.rollbackErrors) || !Array.isArray(recovery.residueErrors) || !isPlainObject(recovery.restoredCheck)) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery-required progress fields are malformed', { path: recoveryManifestRel });
    }
  }
  const expectedStaging = new Map();
  for (const target of plan.targetFiles) {
    expectedStaging.set(target.path, { tempPath: expectedTargetStagingPath(target.path, plan.planId, 'temp'), displacedPath: expectedTargetStagingPath(target.path, plan.planId, 'displaced') });
  }
  const quarantineSeen = new Set();
  const quarantineSourceSeen = new Set();
  for (let index = 0; index < recovery.quarantined.length; index += 1) {
    const item = recovery.quarantined[index];
    assertExactObjectKeys(item, ['source', 'destination', 'kind'], 'INVALID_RECOVERY', `recovery quarantine entry ${index}`);
    if (!['displaced', 'residue', 'process'].includes(item.kind)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine kind is not generated by A16-P', { index, kind: item.kind });
    const sourceTarget = [...expectedStaging.entries()].find(([, paths]) => paths.tempPath === item.source || paths.displacedPath === item.source);
    if (!sourceTarget) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine source is not a reviewed target staging path', { index, source: item.source });
    if (item.kind === 'displaced' && sourceTarget[1].displacedPath !== item.source) throw new ProjectionSyncError('INVALID_RECOVERY', 'Displaced quarantine source is not the generated displaced path', { index, source: item.source });
    if (quarantineSourceSeen.has(item.source)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine contains a duplicate source entry', { index, source: item.source, kind: item.kind });
    const quarantineKey = `${item.kind}\n${item.source}`;
    if (quarantineSeen.has(quarantineKey)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine contains a duplicate source entry', { index, source: item.source, kind: item.kind });
    quarantineSeen.add(quarantineKey);
    quarantineSourceSeen.add(item.source);
    const expectedDestination = `${artifacts.backupDir}/recovery/staging/${item.kind}-${Buffer.from(item.source, 'utf8').toString('base64url')}`;
    if (item.destination !== expectedDestination || path.posix.dirname(item.destination) !== `${artifacts.backupDir}/recovery/staging`) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine destination is not the exact generated audit path', { index, expected: expectedDestination, actual: item.destination });
    }
    const target = targetByPath.get(sourceTarget[0]);
    const expectedHash = item.source === sourceTarget[1].tempPath ? { sha256: target.afterHash, bytes: target.afterBytes } : { sha256: target.beforeHash, bytes: target.beforeBytes };
    const archiveHash = existingRecoveryFileHash(root, item.destination, 'recovery quarantine archive');
    if (!archiveHash || archiveHash.sha256 !== expectedHash.sha256 || archiveHash.bytes !== expectedHash.bytes) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine archive does not match the reviewed staging image', { index, path: item.destination, expected: expectedHash, actual: archiveHash });
    }
    const liveSource = existingRecoveryFileHash(root, item.source, 'recovery staging source');
    if (liveSource) throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery quarantine source still exists beside its archive', { index, path: item.source });
  }
  if (recovery.state === 'PREPARED' && recovery.quarantined.length !== 0) {
    throw new ProjectionSyncError('INVALID_RECOVERY', 'Prepared recovery manifest may not contain quarantine residue', { actual: recovery.quarantined.length });
  }
  if (recovery.state === 'COMPLETED') {
    const expectedQuarantine = plan.targetFiles.map((target) => ({
      source: expectedTargetStagingPath(target.path, plan.planId, 'displaced'),
      destination: `${artifacts.backupDir}/recovery/staging/displaced-${Buffer.from(expectedTargetStagingPath(target.path, plan.planId, 'displaced'), 'utf8').toString('base64url')}`,
      kind: 'displaced',
    }));
    if (!jsonEqual(recovery.quarantined, expectedQuarantine)) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Completed recovery quarantine is not exactly the generated displaced set', { expected: expectedQuarantine, actual: recovery.quarantined });
    }
  }
  // Validate every before-image backup, including exact membership and hashes,
  // before any process-death staging path is quarantined or moved.
  const backupManifest = {
    schema: BACKUP_SCHEMA,
    planId: recovery.planId,
    backupDir: recovery.backupDir,
    backupManifest: recovery.backupManifest,
    recoveryManifest: recovery.recoveryManifest,
    targetSetHash: recovery.targetSetHash,
    backupFiles: recovery.backupFiles,
  };
  validateBackupManifest(root, plan, backupManifest, artifacts.backupManifest);
  return backupManifest;
}

function validateBackupManifest(root, plan, manifest, backupManifestRel) {
  const artifacts = assertPlanArtifacts(root, plan);
  assertExactObjectKeys(manifest, ['schema', 'planId', 'backupDir', 'backupManifest', 'recoveryManifest', 'targetSetHash', 'backupFiles'], 'INVALID_BACKUP', 'backup manifest');
  if (backupManifestRel !== artifacts.backupManifest) throw new ProjectionSyncError('BACKUP_PATH_MISMATCH', 'Rollback manifest path is not the generated plan manifest path', { expected: artifacts.backupManifest, actual: backupManifestRel });
  if (!isPlainObject(manifest) || manifest.schema !== BACKUP_SCHEMA || manifest.planId !== plan.planId || manifest.backupManifest !== artifacts.backupManifest || manifest.backupDir !== artifacts.backupDir || manifest.recoveryManifest !== artifacts.recoveryManifest || !Array.isArray(manifest.backupFiles)) {
    throw new ProjectionSyncError('INVALID_BACKUP', 'Backup manifest does not match the reviewed plan', { path: backupManifestRel });
  }
  if (manifest.targetSetHash !== targetSetHash(plan) || manifest.backupFiles.length !== plan.targetFiles.length) throw new ProjectionSyncError('BACKUP_TARGET_SET_MISMATCH', 'Backup manifest target set is not exactly the reviewed target set', { expected: targetSetHash(plan), actual: manifest.targetSetHash });
  const seen = new Set();
  for (const target of plan.targetFiles) {
    const item = manifest.backupFiles.find((entry) => entry && entry.path === target.path);
    if (item) assertExactObjectKeys(item, ['path', 'id', 'role', 'backupPath', 'sha256', 'bytes', 'beforeHash', 'beforeBytes', 'afterHash', 'afterBytes'], 'INVALID_BACKUP', `backup entry for ${target.path}`);
    if (!item || seen.has(target.path) || item.id !== target.id || item.role !== target.role || item.backupPath !== expectedBackupPath(artifacts.backupDir, target.path) || item.sha256 !== target.beforeHash || item.bytes !== target.beforeBytes || item.beforeHash !== target.beforeHash || item.beforeBytes !== target.beforeBytes || item.afterHash !== target.afterHash || item.afterBytes !== target.afterBytes) {
      throw new ProjectionSyncError('BACKUP_TARGET_SET_MISMATCH', 'Backup manifest entry is not bound to the reviewed target contract', { path: target.path, item });
    }
    seen.add(target.path);
    normalizeArtifactPath(root, item.backupPath, item.backupPath);
    const backupHash = regularArtifactHash(root, item.backupPath);
    if (!backupHash || backupHash.sha256 !== target.beforeHash || backupHash.bytes !== target.beforeBytes) throw new ProjectionSyncError('BACKUP_VERIFY_FAILED', 'Backup bytes/hash do not match the reviewed before-image', { path: target.path, backupPath: item.backupPath, expected: { sha256: target.beforeHash, bytes: target.beforeBytes }, actual: backupHash });
  }
  if (seen.size !== manifest.backupFiles.length) throw new ProjectionSyncError('BACKUP_TARGET_SET_MISMATCH', 'Backup manifest contains unexpected or duplicate entries', { expected: seen.size, actual: manifest.backupFiles.length });
  return artifacts;
}

function copyChecked(root, sourceRel, destinationRel, role, options = {}) {
  const sourceAbs = resolveInside(root, sourceRel, `${role} source`);
  const destinationAbs = resolveInside(root, destinationRel, `${role} destination`);
  assertNoFollowPath(root, sourceAbs, sourceRel, { role });
  assertNoFollowPath(root, destinationAbs, destinationRel, { allowMissing: true, role });
  const sourceStat = fs.lstatSync(sourceAbs);
  if (isReparseOrSymlink(sourceStat) || !sourceStat.isFile()) throw new ProjectionSyncError('NOT_A_FILE', 'Copy source must be a regular file', { path: sourceRel, role });
  if (options.mustNotExist) {
    let destinationStat = null;
    try { destinationStat = fs.lstatSync(destinationAbs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
    if (destinationStat) throw new ProjectionSyncError('ARTIFACT_EXISTS', 'Copy destination already exists', { path: destinationRel, role });
  }
  fs.copyFileSync(sourceAbs, destinationAbs);
  assertNoFollowPath(root, destinationAbs, destinationRel, { role });
}

function renameChecked(root, sourceRel, destinationRel, role) {
  const sourceAbs = resolveInside(root, sourceRel, `${role} source`);
  const destinationAbs = resolveInside(root, destinationRel, `${role} destination`);
  assertNoFollowPath(root, sourceAbs, sourceRel, { role });
  assertNoFollowPath(root, destinationAbs, destinationRel, { allowMissing: true, role });
  const sourceStat = fs.lstatSync(sourceAbs);
  if (isReparseOrSymlink(sourceStat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Rename source may not be a symlink/junction', { path: sourceRel, role });
  let destinationStat = null;
  try { destinationStat = fs.lstatSync(destinationAbs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
  if (destinationStat && isReparseOrSymlink(destinationStat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Rename destination may not be a symlink/junction', { path: destinationRel, role });
  if (destinationStat) throw new ProjectionSyncError('STAGING_PATH_EXISTS', 'Rename destination already exists', { path: destinationRel, role });
  fs.renameSync(sourceAbs, destinationAbs);
  assertNoFollowPath(root, destinationAbs, destinationRel, { role });
}

function quarantineStaging(root, sourceRel, recoveryDirRel, label) {
  const sourceAbs = resolveInside(root, sourceRel, 'staging path');
  let stat;
  try { stat = fs.lstatSync(sourceAbs); } catch (error) { if (error && error.code === 'ENOENT') return null; throw error; }
  if (isReparseOrSymlink(stat)) throw new ProjectionSyncError('SYMLINK_REJECTED', 'Staging residue may not be a symlink/junction', { path: sourceRel });
  const encoded = Buffer.from(sourceRel, 'utf8').toString('base64url');
  const destinationRel = `${recoveryDirRel}/${label}-${encoded}`;
  const destinationAbs = assertSafeArtifactDestination(root, destinationRel);
  assertNoFollowPath(root, sourceAbs, sourceRel, { role: 'staging' });
  assertNoFollowPath(root, destinationAbs, destinationRel, { allowMissing: true, role: 'artifact' });
  fs.renameSync(sourceAbs, destinationAbs);
  return destinationRel;
}

function verifyPreApplyState(root, plan) {
  try {
    const state = buildStateForPlan(plan, root);
    const expectedPaths = plan.files.map((file) => file.path).sort();
    const actualPaths = Object.keys(state.fileHashes).sort();
    if (!jsonEqual(expectedPaths, actualPaths)) return { ok: false, reason: 'FILE_SET_MISMATCH', expectedPaths, actualPaths };
    for (const file of plan.files) {
      const actual = state.fileHashes[file.path];
      if (!actual || actual.sha256 !== file.sha256 || actual.bytes !== file.bytes) return { ok: false, reason: 'HASH_MISMATCH', path: file.path, expected: file, actual };
    }
    if (!targetStateMatches(plan, state, 'before')) return { ok: false, reason: 'TARGET_BEFORE_MISMATCH' };
    if (state.totals.unknownRows !== plan.guards.unknownRowsPreserved) return { ok: false, reason: 'UNKNOWN_ROWS_CHANGED', expected: plan.guards.unknownRowsPreserved, actual: state.totals.unknownRows };
    return { ok: true, state };
  } catch (error) {
    return { ok: false, reason: error.code || 'VERIFY_FAILED', error: errorObject(error) };
  }
}

function sourceDriftForPlan(plan, state) {
  return plan.files.filter((file) => file.role === 'source').flatMap((file) => {
    const actual = state.fileHashes[file.path];
    return !actual || actual.sha256 !== file.sha256 || actual.bytes !== file.bytes
      ? [{ path: file.path, role: 'source', expected: { sha256: file.sha256, bytes: file.bytes }, actual }]
      : [];
  });
}

function applyPlan(plan, options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  if (!options.approved) throw new ProjectionSyncError('APPROVAL_REQUIRED', 'A16-P apply is gated; pass explicit approval after review', { required: true });
  if (!(plan.approval && plan.approval.reviewed === true) && !options.reviewer) throw new ProjectionSyncError('REVIEW_REQUIRED', 'Plan must carry reviewed approval or an explicit reviewer at apply time', { required: true });
  const overrideFields = ['backupDir', 'backupManifest', 'recoveryManifest'].filter((key) => options[key] !== undefined && options[key] !== null);
  if (overrideFields.length) throw new ProjectionSyncError('ARTIFACT_PATH_OVERRIDE_REJECTED', 'Apply artifact path overrides are disabled; generated audit paths are mandatory', { fields: overrideFields });
  const state = buildStateForPlan(plan, root);
  const deterministic = buildPlan({ root, ids: plan.selection && plan.selection.ids, asOf: plan.asOf });
  validatePlanContract(plan, state, deterministic.plan);
  if (!plan.targetFiles.length) return { ok: true, status: 'NO_CHANGES', planId: plan.planId, appliedFiles: [], backupManifest: null };
  const afterDocuments = buildAfterDocuments(state, plan.targetFiles.map((file) => cloneJson(file)));
  const artifacts = assertPlanArtifacts(root, plan);
  const backupDir = artifacts.backupDir;
  const backupManifest = artifacts.backupManifest;
  const recoveryManifest = artifacts.recoveryManifest;
  const recoveryDir = `${backupDir}/recovery`;
  assertSafeArtifactDestination(root, `${backupDir}/.directory-marker`);
  assertSafeArtifactDestination(root, `${recoveryDir}/.directory-marker`);
  // Refuse any pre-existing final manifest (including a symlink) before a
  // target backup or write begins.  A recovery journal is different: a
  // BACKUP_PREPARING/PREPARED journal is the durable resume point for an
  // interrupted apply and is therefore intentionally allowed to exist.
  assertSafeArtifactDestination(root, backupManifest);
  assertSafeArtifactDestination(root, recoveryManifest, { allowExisting: true });

  let existingRecovery = null;
  let recoveryStat = null;
  try { recoveryStat = fs.lstatSync(resolveInside(root, recoveryManifest)); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
  if (recoveryStat) {
    regularArtifactHash(root, recoveryManifest);
    try {
      existingRecovery = JSON.parse(fs.readFileSync(resolveInside(root, recoveryManifest), 'utf8'));
    } catch (error) {
      throw new ProjectionSyncError('MALFORMED_RECOVERY', 'Recovery manifest cannot be parsed', { path: recoveryManifest, error: String(error.message || error) });
    }
    if (existingRecovery.state === 'BACKUP_PREPARING') {
      validateBackupPreparationManifest(root, plan, existingRecovery, artifacts);
    } else if (existingRecovery.state === 'PREPARED') {
      validateRecoveryManifest(root, plan, existingRecovery, recoveryManifest, artifacts);
    } else if (existingRecovery.state === 'RECOVERY_REQUIRED') {
      // A prior apply/rollback failure owns this plan until its recovery
      // journal is resolved.  Re-running apply must never overwrite a mixed
      // target set or reinterpret a recovery-required journal as a fresh run.
      validateRecoveryManifest(root, plan, existingRecovery, recoveryManifest, artifacts);
      throw new ProjectionSyncError('RECOVERY_REQUIRED', 'The reviewed plan has an unresolved recovery journal; rollback/recovery must complete before apply can resume', { recoveryManifest });
    } else {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Existing recovery journal is not an apply-resumable state', { path: recoveryManifest, state: existingRecovery.state });
    }
  }

  let recoveryDocument = existingRecovery ? cloneJson(existingRecovery) : recoveryJournalDocument(plan, artifacts, 'BACKUP_PREPARING');
  let backupFiles = existingRecovery ? recoveryDocument.backupFiles : [];
  const applied = [];
  const stagingPaths = [];
  const quarantined = [];
  let recoveryWritten = !!existingRecovery;
  let backupPreparing = !existingRecovery || existingRecovery.state === 'BACKUP_PREPARING';
  let targetWritesStarted = false;
  let backupCopyCount = 0;

  // Publish the first journal before the first backup copy.  This is the
  // recovery point for a process death at any later point in preparation.
  if (!existingRecovery) {
    writeArtifact(root, recoveryManifest, `${JSON.stringify(recoveryDocument, null, 2)}\n`);
    recoveryWritten = true;
  }

  const publishRecovery = (document) => {
    writeAuditArtifact(root, recoveryManifest, `${JSON.stringify(document, null, 2)}\n`);
    recoveryWritten = true;
  };

  const maybeInjectBackupCopyFailure = () => {
    backupCopyCount += 1;
    const requestedExit = options.exitAfterBackupCopy === true
      ? 1
      : Number.isInteger(options.exitAfterBackupCopy) ? options.exitAfterBackupCopy : null;
    if (requestedExit !== null && backupCopyCount === requestedExit) {
      // Test-only crash hook.  It intentionally runs after copyFileSync but
      // before hash verification/journal publication so retry must promote a
      // verified pending backup rather than copying it again.
      process.exit(Number.isInteger(options.exitCode) ? options.exitCode : 97);
    }
    if ((options.failAfterBackupCopy === true && backupCopyCount === 1)
      || (Number.isInteger(options.failAfterBackupCopy) && backupCopyCount === options.failAfterBackupCopy)) {
      throw new ProjectionSyncError('INJECTED_BACKUP_FAILURE', 'Test-only backup-preparation failure injected', { backupCopyCount });
    }
  };

  try {
    if (backupPreparing) {
      // Resume from the exact journal membership.  A pending path may already
      // exist when the previous process died immediately after copyFileSync;
      // validate and promote it instead of attempting an overwrite.
      for (const file of plan.targetFiles) {
        const expected = expectedBackupEntry(plan, file, backupDir);
        const complete = recoveryDocument.backupFiles.find((entry) => entry.path === file.path);
        if (complete) continue;
        const pending = recoveryDocument.pendingFiles.find((entry) => entry.path === file.path);
        if (!pending || !jsonEqual(pending, expected)) throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation journal is missing the exact pending entry for a reviewed target', { path: file.path });
        const existing = existingRecoveryFileHash(root, pending.backupPath, 'backup-preparation pending backup');
        if (existing) {
          if (existing.sha256 !== pending.beforeHash || existing.bytes !== pending.beforeBytes) throw new ProjectionSyncError('BACKUP_VERIFY_FAILED', 'A pending backup does not match its reviewed before-image', { path: file.path, backupPath: pending.backupPath, expected: { sha256: pending.beforeHash, bytes: pending.beforeBytes }, actual: existing });
        } else {
          assertSafeArtifactDestination(root, pending.backupPath);
          copyChecked(root, file.path, pending.backupPath, 'backup', { mustNotExist: true });
          maybeInjectBackupCopyFailure();
          const backupHash = regularArtifactHash(root, pending.backupPath);
          if (!backupHash || backupHash.sha256 !== pending.beforeHash || backupHash.bytes !== pending.beforeBytes) throw new ProjectionSyncError('BACKUP_VERIFY_FAILED', 'Backup hash/bytes do not match target before hash', { path: file.path, backupPath: pending.backupPath, expected: { sha256: pending.beforeHash, bytes: pending.beforeBytes }, actual: backupHash });
        }
        recoveryDocument.backupFiles.push(cloneJson(pending));
        recoveryDocument.pendingFiles = recoveryDocument.pendingFiles.filter((entry) => entry.path !== pending.path);
        publishRecovery(recoveryDocument);
      }
      if (recoveryDocument.pendingFiles.length) throw new ProjectionSyncError('INVALID_RECOVERY', 'Backup-preparation journal still has pending entries after preparation', { pending: recoveryDocument.pendingFiles.map((entry) => entry.path) });
      const prepared = {
        ...recoveryDocument,
        state: 'PREPARED',
        backupFiles: plan.targetFiles.map((file) => recoveryDocument.backupFiles.find((entry) => entry.path === file.path)),
        quarantined: [],
      };
      delete prepared.pendingFiles;
      publishRecovery(prepared);
      recoveryDocument = prepared;
      backupFiles = recoveryDocument.backupFiles;
      backupPreparing = false;
    } else {
      backupFiles = recoveryDocument.backupFiles;
    }

    const failAfter = Number.isInteger(options.failAfter) ? options.failAfter : null;
    targetWritesStarted = true;
    for (const file of plan.targetFiles) {
      if (failAfter !== null && applied.length >= failAfter) throw new ProjectionSyncError('INJECTED_WRITE_FAILURE', 'Test-only write failure injected', { failAfter, path: file.path });
      const targetAbs = resolveInside(root, file.path);
      const after = afterDocuments[file.path];
      if (!after) throw new ProjectionSyncError('MISSING_AFTER_DOCUMENT', 'No deterministic after document for target', { path: file.path });
      const tempRel = `${file.path}.tmp-a16p-${plan.planId}`;
      const tempAbs = resolveInside(root, tempRel);
      const displacedRel = `${file.path}.displaced-a16p-${plan.planId}`;
      const displacedAbs = resolveInside(root, displacedRel);
      stagingPaths.push(tempRel, displacedRel);
      assertNoFollowPath(root, targetAbs, file.path, { role: 'target' });
      assertNoFollowPath(root, tempAbs, tempRel, { allowMissing: true, role: 'staging' });
      assertNoFollowPath(root, displacedAbs, displacedRel, { allowMissing: true, role: 'staging' });
      let existingTemp = null;
      let existingDisplaced = null;
      try { existingTemp = fs.lstatSync(tempAbs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
      try { existingDisplaced = fs.lstatSync(displacedAbs); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
      if (existingTemp || existingDisplaced) throw new ProjectionSyncError('STAGING_PATH_EXISTS', 'Target staging path already exists', { path: file.path, tempRel, displacedRel });
      fs.writeFileSync(tempAbs, serializeJson(after), { encoding: 'utf8', flag: 'wx' });
      assertNoFollowPath(root, tempAbs, tempRel, { role: 'staging' });
      // Windows does not permit rename-over-existing.  Move the existing
      // target into a staging name, atomically install the temp file, and
      // preserve the displaced original in the audit recovery directory.
      renameChecked(root, file.path, displacedRel, 'target-displace');
      try {
        renameChecked(root, tempRel, file.path, 'target-install');
      } catch (error) {
        try { renameChecked(root, displacedRel, file.path, 'target-restore'); } catch (_) { /* verified backup rollback below */ }
        throw error;
      }
      const displacedArchive = quarantineStaging(root, displacedRel, `${recoveryDir}/staging`, 'displaced');
      if (displacedArchive) quarantined.push({ source: displacedRel, destination: displacedArchive, kind: 'displaced' });
      applied.push(file.path);
    }
    // The post-write check is also the structural gate for a successful
    // install; it verifies source hashes, target hashes/pointers, and the
    // exact relevant-file set before publishing the final manifest.
    verifyPlan(plan, { root });
    const manifest = { schema: BACKUP_SCHEMA, planId: plan.planId, backupDir, backupManifest, recoveryManifest, targetSetHash: targetSetHash(plan), backupFiles };
    writeArtifact(root, backupManifest, `${JSON.stringify(manifest, null, 2)}\n`);
    recoveryDocument.state = 'COMPLETED';
    recoveryDocument.completedFiles = applied.slice();
    recoveryDocument.quarantined = quarantined;
    publishRecovery(recoveryDocument);
    return { ok: true, status: 'APPLIED', planId: plan.planId, appliedFiles: applied, backupManifest, recoveryManifest };
  } catch (error) {
    if (backupPreparing && !targetWritesStarted) {
      // No reviewed target has been written yet.  Keep the valid
      // BACKUP_PREPARING journal and surface the preparation failure; retry
      // will verify/promote any on-disk pending backup before target writes.
      const details = {
        ...(error.details || {}),
        recoveryManifest,
        backupPreparedFiles: recoveryDocument && Array.isArray(recoveryDocument.backupFiles) ? recoveryDocument.backupFiles.map((entry) => entry.path) : [],
        backupPendingFiles: recoveryDocument && Array.isArray(recoveryDocument.pendingFiles) ? recoveryDocument.pendingFiles.map((entry) => entry.path) : [],
        targetWritesStarted: false,
      };
      if (error instanceof ProjectionSyncError) error.details = details;
      else error = new ProjectionSyncError('APPLY_BACKUP_PREPARATION_FAILED', String(error.message || error), details);
      throw error;
    }
    const rollbackErrors = [];
    const rollbackRestored = [];
    // Restore every target from its verified before copy.  This also restores
    // files whose write completed before the injected/actual failure.
    for (const item of backupFiles) {
      try {
        copyChecked(root, item.backupPath, item.path, 'rollback');
        const restoredHash = hashFile(resolveInside(root, item.path), item.path, [], 'target', root);
        if (!restoredHash || restoredHash.sha256 !== item.beforeHash || restoredHash.bytes !== item.beforeBytes) throw new ProjectionSyncError('RESTORE_HASH_MISMATCH', 'Failed apply restore differs from the verified before-image', { path: item.path, expected: { sha256: item.beforeHash, bytes: item.beforeBytes }, actual: restoredHash });
        rollbackRestored.push(item.path);
      } catch (restoreError) { rollbackErrors.push({ path: item.path, error: String(restoreError.message || restoreError), code: restoreError.code || null }); }
    }
    const residueErrors = [];
    for (const staging of stagingPaths) {
      try {
        const moved = quarantineStaging(root, staging, `${recoveryDir}/staging`, 'residue');
        if (moved) quarantined.push({ source: staging, destination: moved, kind: 'residue' });
      } catch (residueError) {
        residueErrors.push({ path: staging, error: String(residueError.message || residueError), code: residueError.code });
      }
    }
    const restoredCheck = verifyPreApplyState(root, plan);
    if (recoveryWritten) {
      recoveryDocument = {
        ...(recoveryDocument || {
          schema: RECOVERY_SCHEMA,
          planId: plan.planId,
          backupDir,
          backupManifest,
          recoveryManifest,
          targetSetHash: targetSetHash(plan),
          backupFiles,
          targetFiles: recoveryTargetEntries(plan, backupDir),
          quarantined,
        }),
        state: 'RECOVERY_REQUIRED',
        completedFiles: applied.slice(),
        restoredFiles: rollbackRestored.slice(),
        rollbackErrors,
        residueErrors,
        restoredCheck: restoredCheck.ok ? { ok: true } : restoredCheck,
      };
      try { writeAuditArtifact(root, recoveryManifest, `${JSON.stringify(recoveryDocument, null, 2)}\n`); } catch (recoveryError) { residueErrors.push({ path: recoveryManifest, error: String(recoveryError.message || recoveryError), code: recoveryError.code || null }); }
    }
    const restored = rollbackErrors.length === 0 && residueErrors.length === 0 && restoredCheck.ok;
    if (error instanceof ProjectionSyncError) error.details = { ...(error.details || {}), rollbackErrors, residueErrors, recoveryManifest: recoveryWritten ? recoveryManifest : null, restored };
    else error = new ProjectionSyncError('APPLY_FAILED', String(error.message || error), { rollbackErrors, residueErrors, recoveryManifest: recoveryWritten ? recoveryManifest : null, restored });
    throw error;
  }
}

function verifyPlan(plan, options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  const state = buildStateForPlan(plan, root);
  const sourceDrift = sourceDriftForPlan(plan, state);
  if (sourceDrift.length) throw new ProjectionSyncError('SOURCE_DRIFT', 'Source inputs changed; verification refused', { drift: sourceDrift });
  const phase = !plan.targetFiles.length || targetStateMatches(plan, state, 'before') ? 'before' : targetStateMatches(plan, state, 'after') ? 'after' : null;
  if (!phase) throw new ProjectionSyncError('VERIFY_FAILED', 'Target files are neither the reviewed before-image nor after-image', { planId: plan.planId });
  const deterministic = validateReviewedPlan(plan, state, phase);
  if (phase === 'before' && plan.targetFiles.length) throw new ProjectionSyncError('VERIFY_FAILED', 'Plan has not been applied; after-image verification cannot pass', { planId: plan.planId });
  const planMap = planFileMap(plan);
  const errors = [];
  for (const file of plan.files) {
    const current = state.fileHashes[file.path];
    if (!current) { errors.push({ code: 'INPUT_MISSING', path: file.path }); continue; }
    const target = plan.targetFiles.find((candidate) => candidate.path === file.path);
    const expectedHash = target ? target.afterHash : file.sha256;
    const expectedBytes = target ? target.afterBytes : file.bytes;
    if (current.sha256 !== expectedHash || current.bytes !== expectedBytes) errors.push({ code: file.role === 'source' ? 'SOURCE_DRIFT' : 'TARGET_VERIFY_MISMATCH', path: file.path, expected: { sha256: expectedHash, bytes: expectedBytes }, actual: current });
  }
  for (const file of plan.targetFiles) {
    const document = state.docs[file.path];
    for (const change of file.pointers) {
      const current = getPointer(document, change.pointer);
      if (!current.exists || !jsonEqual(current.value, change.after)) errors.push({ code: 'POINTER_VERIFY_MISMATCH', path: file.path, pointer: change.pointer, expected: change.after, actual: current.value });
    }
  }
  // Structural scan already proves the 28 (or fixture-equivalent) unknown
  // rows remain explicit; verify never turns them into a no-speech claim.
  if (state.totals.unknownRows !== plan.guards.unknownRowsPreserved) errors.push({ code: 'UNKNOWN_ROWS_CHANGED', expected: plan.guards.unknownRowsPreserved, actual: state.totals.unknownRows });
  if (errors.length) throw new ProjectionSyncError('VERIFY_FAILED', 'Projection sync verification failed', { errors });
  return { ok: true, status: 'VERIFIED', planId: plan.planId, verifiedFiles: plan.files.length, verifiedTargets: plan.targetFiles.length, unknownRowsPreserved: state.totals.unknownRows, phase, contractPlanId: deterministic.planId };
}

function rollbackPlan(plan, options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  if (options.backupManifest !== undefined && options.backupManifest !== null) throw new ProjectionSyncError('ARTIFACT_PATH_OVERRIDE_REJECTED', 'Rollback artifact path overrides are disabled; generated audit paths are mandatory', {});
  if (!plan.targetFiles.length) throw new ProjectionSyncError('NO_CHANGES', 'A no-change plan has no rollback target set', { planId: plan.planId });
  const artifacts = assertPlanArtifacts(root, plan);
  const backupManifestRel = artifacts.backupManifest;
  const recoveryManifestRel = artifacts.recoveryManifest;
  let manifest;
  let recoveryMode = false;
  let recovery = null;
  let recoveryQuarantined = [];
  let recoveryObservations = null;
  let backupStat;
  try { backupStat = fs.lstatSync(resolveInside(root, backupManifestRel)); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
  let recoveryStat;
  try { recoveryStat = fs.lstatSync(resolveInside(root, recoveryManifestRel)); } catch (error) { if (!error || error.code !== 'ENOENT') throw error; }
  if (recoveryStat) {
    regularArtifactHash(root, recoveryManifestRel);
    try { recovery = JSON.parse(fs.readFileSync(resolveInside(root, recoveryManifestRel), 'utf8')); } catch (error) { throw new ProjectionSyncError('MALFORMED_RECOVERY', 'Recovery manifest cannot be parsed', { path: recoveryManifestRel, error: String(error.message || error) }); }
  }

  // A RECOVERY_REQUIRED journal is authoritative even when the final backup
  // manifest survived.  This is the normal-rollback retry boundary: the
  // target set may now be a verified mixture of before/after/missing images,
  // so requiring the original all-after state would strand the recovery.
  if (recovery && recovery.state === 'RECOVERY_REQUIRED') {
    const recoveryBackupManifest = validateRecoveryManifest(root, plan, recovery, recoveryManifestRel, artifacts);
    assertRecoveryImmutableInputs(root, plan);
    recoveryObservations = recoveryTargetFilesystem(root, plan, recovery, { allowMissingTargets: true });
    recoveryMode = true;
    manifest = recoveryBackupManifest;
  } else if (backupStat) {
    regularArtifactHash(root, backupManifestRel);
    try { manifest = JSON.parse(fs.readFileSync(resolveInside(root, backupManifestRel), 'utf8')); } catch (error) { throw new ProjectionSyncError('MALFORMED_BACKUP', 'Backup manifest cannot be parsed', { path: backupManifestRel, error: String(error.message || error) }); }
  } else {
    // A process can die after the recovery manifest and before the final
    // backup manifest. Validate the complete recovery contract first; no
    // staging path may be moved until every generated name, parent, hash and
    // target-membership binding has passed validation.
    if (!recovery) regularArtifactHash(root, recoveryManifestRel);
    if (!recovery || !['PREPARED', 'COMPLETED', 'ROLLED_BACK'].includes(recovery.state)) {
      throw new ProjectionSyncError('INVALID_RECOVERY', 'Recovery manifest is not a recoverable process-death state', { path: recoveryManifestRel, state: recovery && recovery.state });
    }
    const recoveryBackupManifest = validateRecoveryManifest(root, plan, recovery, recoveryManifestRel, artifacts);
    assertRecoveryImmutableInputs(root, plan);
    recoveryObservations = recoveryTargetFilesystem(root, plan, recovery);
    recoveryMode = true;
    for (const item of recovery.targetFiles || []) {
      for (const stagingPath of [item.tempPath, item.displacedPath]) {
        if (typeof stagingPath !== 'string') continue;
        try {
          const moved = quarantineStaging(root, stagingPath, `${artifacts.backupDir}/recovery/staging`, 'process');
          if (moved) recoveryQuarantined.push({ source: stagingPath, destination: moved, kind: 'process' });
        } catch (error) {
          throw new ProjectionSyncError('RECOVERY_REQUIRED', 'Could not quarantine process-death staging residue', { path: stagingPath, error: errorObject(error) });
        }
      }
    }
    // Quarantining process residue must not silently hide an external edit to
    // a reviewed target. Check the complete target set again immediately
    // before the first restore copy; no target has been written yet.
    assertRecoveryTargetObservationsUnchanged(root, recoveryObservations);
    manifest = recoveryBackupManifest;
  }
  if (!recoveryMode) {
    const state = buildStateForPlan(plan, root);
    const sourceDrift = sourceDriftForPlan(plan, state);
    if (sourceDrift.length) throw new ProjectionSyncError('SOURCE_DRIFT', 'Source inputs changed; rollback refused', { drift: sourceDrift });
    validateReviewedPlan(plan, state, 'after');
    if (!targetStateMatches(plan, state, 'after')) throw new ProjectionSyncError('TARGET_DRIFT', 'Targets are not at the reviewed after-image; rollback refused', { planId: plan.planId });
    validateBackupManifest(root, plan, manifest, backupManifestRel);
    for (const item of manifest.backupFiles) {
      const current = hashFile(resolveInside(root, item.path), item.path, [], 'target', root);
      if (!current || current.sha256 !== item.afterHash || current.bytes !== item.afterBytes) throw new ProjectionSyncError('TARGET_DRIFT', 'Target changed after apply; rollback refused', { path: item.path, expected: { sha256: item.afterHash, bytes: item.afterBytes }, actual: current });
    }
    // A normal rollback also gets a complete target observation.  The
    // recovery journal below is written before any restore copy, and this
    // observation closes the gap between validation and the first write.
    recovery = recoveryRollbackDocument(plan, artifacts, manifest, null);
    recoveryObservations = recoveryTargetFilesystem(root, plan, recovery, { allowMissingTargets: true });
  } else {
    // A recovery-required retry starts from the current mixed target state;
    // process recovery starts from PREPARED/COMPLETED/ROLLED_BACK.  In both
    // cases, publish a fresh RECOVERY_REQUIRED progress record before the
    // first restore copy.
    recovery = recoveryRollbackDocument(plan, artifacts, manifest, recovery);
  }

  recovery.quarantined = [...(recovery.quarantined || []), ...recoveryQuarantined];
  recovery.completedFiles = Array.isArray(recovery.completedFiles) ? recovery.completedFiles.slice() : [];
  recovery.restoredFiles = [];
  recovery.rollbackErrors = [];
  recovery.residueErrors = [];
  recovery.restoredCheck = { ok: false, reason: 'ROLLBACK_IN_PROGRESS' };
  try {
    writeAuditArtifact(root, recoveryManifestRel, `${JSON.stringify(recovery, null, 2)}\n`);
  } catch (error) {
    throw new ProjectionSyncError('RECOVERY_REQUIRED', 'Could not persist recovery journal before rollback restore', { recoveryManifest: recoveryManifestRel, error: errorObject(error) });
  }

  // The journal write only touches the audit tree. Re-check every reviewed
  // target immediately before the first restore copy so an external edit
  // cannot be silently overwritten by recovery.
  assertRecoveryTargetObservationsUnchanged(root, recoveryObservations);

  const restored = [];
  const restoreErrors = [];
  for (const item of manifest.backupFiles) {
    try {
      if (recoveryObservations && !recoveryObservations.some((observation) => {
        if (observation.path !== item.path) return false;
        const current = existingRecoveryFileHash(root, item.path, 'recovery target');
        return ((!current && !observation.target) || (current && observation.target && current.sha256 === observation.target.sha256 && current.bytes === observation.target.bytes));
      })) {
        const current = existingRecoveryFileHash(root, item.path, 'recovery target');
        throw new ProjectionSyncError('TARGET_DRIFT', 'Recovery target changed after preflight; restore refused', { path: item.path, actual: current });
      }
      copyChecked(root, item.backupPath, item.path, 'rollback');
      const restoredHash = hashFile(resolveInside(root, item.path), item.path, [], 'target', root);
      if (!restoredHash || restoredHash.sha256 !== item.beforeHash || restoredHash.bytes !== item.beforeBytes) throw new ProjectionSyncError('RESTORE_HASH_MISMATCH', 'Restored target hash differs from before hash', { path: item.path, expected: { sha256: item.beforeHash, bytes: item.beforeBytes }, actual: restoredHash });
      restored.push(item.path);
    } catch (error) {
      const object = errorObject(error);
      restoreErrors.push({ path: item.path, error: object.message, code: object.code, ...(object.details ? { details: object.details } : {}) });
      // Preserve the ordered progress boundary.  A retry will re-preflight
      // the resulting mixed before/after/missing state and attempt every
      // reviewed target again from its verified backup.
      break;
    }
  }
  if (restoreErrors.length) {
    const recoveryRequired = {
      ...recovery,
      state: 'RECOVERY_REQUIRED',
      restoredFiles: restored,
      rollbackErrors: restoreErrors,
      residueErrors: [],
      restoredCheck: verifyPreApplyState(root, plan),
    };
    try { writeAuditArtifact(root, recoveryManifestRel, `${JSON.stringify(recoveryRequired, null, 2)}\n`); } catch (writeError) { restoreErrors.push({ path: recoveryManifestRel, error: String(writeError.message || writeError), code: writeError.code || null }); }
    throw new ProjectionSyncError('RECOVERY_REQUIRED', 'Rollback could not restore every reviewed target from its verified before-image', { restored, errors: restoreErrors, recoveryManifest: recoveryManifestRel });
  }

  const finalCheck = verifyPreApplyState(root, plan);
  if (!finalCheck.ok) {
    const recoveryRequired = {
      ...recovery,
      state: 'RECOVERY_REQUIRED',
      restoredFiles: restored,
      rollbackErrors: [],
      residueErrors: [],
      restoredCheck: finalCheck,
    };
    try { writeAuditArtifact(root, recoveryManifestRel, `${JSON.stringify(recoveryRequired, null, 2)}\n`); } catch (_) { /* report the verified failure below */ }
    throw new ProjectionSyncError('RECOVERY_REQUIRED', 'Rollback restored targets but full pre-apply verification failed', { restored, check: finalCheck, recoveryManifest: recoveryManifestRel });
  }
  recovery.state = 'ROLLED_BACK';
  recovery.completedFiles = plan.targetFiles.map((file) => file.path);
  recovery.quarantined = [...(recovery.quarantined || []), ...recoveryQuarantined];
  recovery.restoredFiles = restored;
  recovery.rollbackErrors = [];
  recovery.residueErrors = [];
  recovery.restoredCheck = { ok: true };
  writeAuditArtifact(root, recoveryManifestRel, `${JSON.stringify(recovery, null, 2)}\n`);
  return { ok: true, status: 'ROLLED_BACK', planId: plan.planId, restoredFiles: restored, backupManifest: backupManifestRel, recoveryManifest: artifacts.recoveryManifest, recoveredProcessDeath: recoveryMode };
}

function scanReport(options = {}) {
  const state = loadProject(options);
  if (state.errors.length) throw new ProjectionSyncError('SCAN_FAILED', 'Projection sync scan failed', { errors: state.errors.map(errorObject) });
  const targetFiles = buildTargetChanges(state);
  return {
    schema: SCAN_SCHEMA,
    asOf: options.asOf || null,
    root: state.root,
    selection: { ids: state.selectedIds },
    totals: state.totals,
    targetFiles: targetFiles.map((file) => ({ path: file.path, id: file.id, role: file.role, pointers: file.pointers })),
    fileCount: Object.keys(state.fileHashes).length,
    sourceFileCount: Object.values(state.fileHashes).filter((entry) => entry.role === 'source').length,
    targetFileCount: Object.values(state.fileHashes).filter((entry) => entry.role !== 'source').length,
    guards: { yppStatus: 'NOT_VERIFIED', noIncomeComputed: true, noSpeechComputed: false, unknownRowsPreserved: state.totals.unknownRows },
  };
}

function parseArgs(argv) {
  const args = { command: 'plan', ids: undefined };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) { positional.push(token); continue; }
    const eq = token.indexOf('=');
    const key = eq >= 0 ? token.slice(2, eq) : token.slice(2);
    const inline = eq >= 0 ? token.slice(eq + 1) : null;
    const needs = new Set(['root', 'output', 'plan', 'diff', 'backup-dir', 'backup-manifest', 'asof', 'ids', 'reviewer']);
    let value = inline;
    if (value === null && needs.has(key)) { i += 1; value = argv[i]; }
    if (key === 'dry-run') args.dryRun = true;
    else if (key === 'approved' || key === 'reviewed') args.approved = true;
    else if (key === 'root') args.root = value;
    else if (key === 'output') args.outputPath = value;
    else if (key === 'plan') args.planPath = value;
    else if (key === 'diff') args.diffPath = value;
    else if (key === 'backup-dir') args.backupDir = value;
    else if (key === 'backup-manifest') args.backupManifest = value;
    else if (key === 'asof') args.asOf = value;
    else if (key === 'ids') args.ids = String(value || '').split(',').map((id) => id.trim()).filter(Boolean);
    else if (key === 'reviewer') args.reviewer = value;
    else if (key === 'help' || key === 'h') args.help = true;
    else throw new ProjectionSyncError('CLI_USAGE', `Unknown option --${key}`);
  }
  if (positional[0]) args.command = positional[0];
  return args;
}

function usage() {
  return [
    'A16-P projection sync (dry-run by default)',
    '  node scripts/repair/projection-sync.cjs scan [--root ROOT] [--output FILE] [--asof ISO]',
    '  node scripts/repair/projection-sync.cjs plan [--root ROOT] [--output FILE] [--asof ISO] [--ids RAW-033,RAW-077]',
    '  node scripts/repair/projection-sync.cjs apply --plan FILE --approved [--reviewer NAME] [--root ROOT]',
    '  node scripts/repair/projection-sync.cjs verify --plan FILE [--root ROOT]',
    '  node scripts/repair/projection-sync.cjs rollback --plan FILE [--root ROOT]',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  let args;
  try { args = parseArgs(argv); } catch (error) { const result = { schema: RESULT_SCHEMA, ok: false, stage: 'cli', errors: [errorObject(error)] }; console.error(JSON.stringify(result, null, 2)); return 1; }
  if (args.help) { console.log(usage()); return 0; }
  try {
    if (args.command === 'scan') {
      const report = scanReport(args);
      if (args.outputPath) writeArtifact(path.resolve(args.root || path.resolve(__dirname, '..', '..')), normalizeArtifactPath(path.resolve(args.root || path.resolve(__dirname, '..', '..')), args.outputPath, args.outputPath), `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify({ schema: RESULT_SCHEMA, ok: true, stage: 'scan', report }, null, 2));
      return 0;
    }
    if (args.command === 'plan' || args.dryRun) {
      const result = buildPlan(args);
      let artifacts = null;
      if (args.outputPath || args.command === 'plan') artifacts = writePlanArtifacts(result);
      console.log(JSON.stringify({ schema: RESULT_SCHEMA, ok: true, stage: 'plan', status: result.plan.targetFiles.length ? 'DRY_RUN_CHANGES' : 'NO_CHANGES', planId: result.plan.planId, targets: result.plan.targetFiles.length, totals: result.plan.totals, artifacts, plan: artifacts ? undefined : result.plan }, null, 2));
      return 0;
    }
    if (args.command === 'apply' || args.command === 'verify' || args.command === 'rollback') {
      if (!args.planPath) throw new ProjectionSyncError('CLI_USAGE', `--plan is required for ${args.command}`);
      const loaded = readPlan(args.planPath, args.root);
      let result;
      if (args.command === 'apply') result = applyPlan(loaded.plan, { root: loaded.root, approved: args.approved, reviewer: args.reviewer, backupDir: args.backupDir, backupManifest: args.backupManifest });
      else if (args.command === 'verify') result = verifyPlan(loaded.plan, { root: loaded.root });
      else result = rollbackPlan(loaded.plan, { root: loaded.root, backupManifest: args.backupManifest });
      console.log(JSON.stringify({ schema: RESULT_SCHEMA, ...result }, null, 2));
      return 0;
    }
    throw new ProjectionSyncError('CLI_USAGE', `Unknown command ${args.command}`);
  } catch (error) {
    console.error(JSON.stringify({ schema: RESULT_SCHEMA, ok: false, stage: args.command, errors: [errorObject(error)] }, null, 2));
    return 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = {
  PLAN_SCHEMA,
  RESULT_SCHEMA,
  SCAN_SCHEMA,
  VITALITY_PATCH_FIELDS,
  VITALITY_CONSENSUS_FIELDS,
  VITALITY_OUT_OF_SCOPE_FIELDS,
  VITALITY_PRESERVED_FIELDS,
  ProjectionSyncError,
  buildPlan,
  scanReport,
  writePlanArtifacts,
  writeAuditArtifact,
  readPlan,
  applyPlan,
  verifyPlan,
  rollbackPlan,
  getPointer,
  setPointerExisting,
  assertAllowedTargetPointer,
  computePlanId,
  loadProject,
  main,
};
