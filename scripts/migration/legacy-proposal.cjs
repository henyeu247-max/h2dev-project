#!/usr/bin/env node
'use strict';

/**
 * A5 legacy import proposal (audit-only).
 *
 * This reads metadata and hashes for the legacy corpus.  It never opens MP4
 * files, writes a registry/ledger/public projection, performs a migration, or
 * infers semantic, rights, retention, language, or fact-verification values.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 'h2dev.a5.legacy-proposal.v1';
const STATUS = Object.freeze({ MAPPED: 'MAPPED', EXCLUDED: 'EXCLUDED', NEEDS_REVIEW: 'NEEDS_REVIEW' });
const DEFAULT_OUTPUT = '_audit/20260911-campaign-wave4/A5/A5-RESULTS.json';
const REQUIRED_COUNTS = Object.freeze({
  learningTriads: 132,
  competitorTranscripts: 765,
  competitorUnknownRows: 28,
  canonicalRaw: 83,
  archivedDuplicateSignals: 12,
  mainChannels: 165,
});
const SOURCE_PATHS = Object.freeze({
  learning: 'data-tabs/videos.json',
  catalog: 'data/catalog_full.json',
  modules: 'data/modules.json',
  deepManifest: 'data/raw-channels-deep/deep-channels-manifest.json',
  canonicalRaw: 'data-tabs/raw-kenh-mau.json',
  archivedDuplicates: '_archive/raw-kenh-duplicates/duplicates-manifest.json',
  mainChannels: 'data-tabs/kenh-mau.json',
  rawMetadata: 'raw-kenh-goc/metadata-full.json',
});

class ProposalError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ProposalError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = {}) {
  throw new ProposalError(code, message, details);
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isoAsOf(value) {
  if (typeof value !== 'string' || !value.includes('T') || !Number.isFinite(Date.parse(value))) fail('INVALID_ASOF', 'asOf must be an ISO-8601 timestamp with a time component');
  return new Date(value).toISOString();
}

function normalizeRelative(value, label) {
  if (typeof value !== 'string' || !value.trim() || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) fail('INVALID_PATH', `${label} must be a non-empty relative path`, { path: value });
  const normalized = value.replace(/\\/g, '/');
  if (normalized.split('/').includes('..')) fail('PATH_OUTSIDE_ROOT', `${label} contains traversal`, { path: value });
  return normalized;
}

function resolveInside(root, relativePath, label) {
  const rootAbs = path.resolve(root);
  const candidate = path.resolve(rootAbs, relativePath);
  const rel = path.relative(rootAbs, candidate);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) fail('PATH_OUTSIDE_ROOT', `${label} escapes project root`, { path: relativePath });
  assertNoLinkAncestors(rootAbs, candidate, label);
  return candidate;
}

function assertNoLinkAncestors(root, candidate, label) {
  let rootStat;
  try { rootStat = fs.lstatSync(root); } catch (error) { fail('FILESYSTEM_INSPECTION_FAILED', `Cannot inspect project root for ${label}: ${error.message}`); }
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail('LINK_ANCESTOR', `Project root is not a trusted directory for ${label}`);
  let realRoot;
  try { realRoot = fs.realpathSync.native(root); } catch (error) { fail('FILESYSTEM_INSPECTION_FAILED', `Cannot canonicalize project root for ${label}: ${error.message}`); }
  if (path.resolve(realRoot) !== path.resolve(root)) fail('LINK_ANCESTOR', `Project root resolves through a link for ${label}`);
  const relativePath = path.relative(root, candidate);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) fail('PATH_OUTSIDE_ROOT', `${label} is not below project root`);
  let current = root;
  for (const segment of relativePath.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stats;
    try { stats = fs.lstatSync(current); } catch (error) {
      if (error && error.code === 'ENOENT') break;
      fail('FILESYSTEM_INSPECTION_FAILED', `Cannot inspect ${label} ancestor: ${error.message}`);
    }
    if (stats.isSymbolicLink()) fail('LINK_ANCESTOR', `${label} contains a symbolic-link/junction ancestor`, { ancestor: current });
    let real;
    try { real = fs.realpathSync.native(current); } catch (error) { fail('FILESYSTEM_INSPECTION_FAILED', `Cannot canonicalize ${label} ancestor: ${error.message}`); }
    if (path.resolve(real) !== path.resolve(current)) fail('LINK_ANCESTOR', `${label} contains a junction/reparse ancestor`, { ancestor: current });
    if (current !== candidate && !stats.isDirectory()) fail('ANCESTOR_NOT_DIRECTORY', `${label} contains a non-directory ancestor`, { ancestor: current });
  }
}

function auditPath(relativePath, label) {
  const normalized = normalizeRelative(relativePath, label);
  if (normalized !== '_audit' && !normalized.startsWith('_audit/')) fail('AUDIT_PATH_REQUIRED', `${label} must stay below _audit/`, { path: normalized });
  return normalized;
}

function readJson(root, relativePath, label) {
  const rel = normalizeRelative(relativePath, label);
  const absolute = resolveInside(root, rel, label);
  let bytes;
  try {
    bytes = fs.readFileSync(absolute);
  } catch (error) {
    fail('INPUT_READ_ERROR', `Cannot read ${label}: ${error.message}`, { path: rel });
  }
  try {
    return { rel, absolute, bytes, value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/u, '')) };
  } catch (error) {
    fail('INVALID_JSON', `Invalid JSON in ${label}: ${error.message}`, { path: rel });
  }
}

function fileHash(root, relativePath, label, role = 'source') {
  const rel = normalizeRelative(relativePath, label);
  const absolute = resolveInside(root, rel, label);
  let bytes;
  try {
    bytes = fs.readFileSync(absolute);
  } catch (error) {
    fail('MISSING_REFERENCE', `Cannot read ${label}: ${error.message}`, { path: rel });
  }
  return { path: rel, sha256: sha256(bytes), bytes: bytes.length, role };
}

function pointer(pathValue, value) {
  return { path: pathValue, pointer: value };
}

function uniquePush(array, value) {
  if (!array.some(item => item.path === value.path && item.sha256 === value.sha256)) array.push(value);
}

function makeRecord({ id, namespace, kind, status, refs, aliases = {}, provenance, conflicts = [], ...rest }) {
  if (!Object.values(STATUS).includes(status)) fail('INVALID_STATUS', `Unsupported status for ${id}`, { status });
  return {
    id,
    namespace,
    kind,
    status,
    sourceRefs: refs,
    aliases,
    provenance,
    conflicts,
    ...rest,
  };
}

function reference(root, rawValue, baseDir, label, refs, conflicts, { required = true } = {}) {
  if (rawValue == null || rawValue === '') {
    if (required) conflicts.push({ code: 'EMPTY_REFERENCE', label, original: rawValue == null ? null : rawValue });
    return { original: rawValue == null ? null : rawValue, resolved: null, style: null, status: 'UNKNOWN' };
  }
  if (typeof rawValue !== 'string') {
    conflicts.push({ code: 'INVALID_REFERENCE', label, original: rawValue });
    return { original: rawValue, resolved: null, style: null, status: 'UNKNOWN' };
  }
  const original = rawValue.replace(/\\/g, '/');
  const style = original.startsWith('data/') ? 'project_prefixed' : 'folder_relative';
  const resolved = style === 'project_prefixed' ? original : path.posix.join(baseDir.replace(/\\/g, '/'), original);
  let hash;
  try {
    hash = fileHash(root, resolved, label);
    uniquePush(refs, hash);
  } catch (error) {
    conflicts.push({ code: error.code || 'MISSING_REFERENCE', label, original, resolved, message: error.message });
    return { original, resolved, style, status: 'MISSING' };
  }
  return { original, resolved, style, status: 'PRESENT', sha256: hash.sha256, bytes: hash.bytes };
}

function sourceProvenance(asOf, sourceFiles, sourcePointers = []) {
  return {
    observedAt: asOf,
    method: 'METADATA_AND_CONTENT_HASH_ONLY',
    semanticRead: 'NOT_PERFORMED',
    sourceFiles: sourceFiles.map(item => item.path),
    sourcePointers,
    noFuzzyMatching: true,
  };
}

function loadLearning(root, asOf, inputFiles) {
  const videos = readJson(root, SOURCE_PATHS.learning, 'learning catalog').value;
  const catalog = readJson(root, SOURCE_PATHS.catalog, 'full catalog').value;
  const modules = readJson(root, SOURCE_PATHS.modules, 'modules').value;
  if (!Array.isArray(videos) || !Array.isArray(catalog) || !Array.isArray(modules.modules)) fail('SHAPE_ERROR', 'Learning sources have unexpected shape');
  const moduleBySku = new Map();
  const moduleConflicts = [];
  for (const module of modules.modules) {
    for (const item of Array.isArray(module.items) ? module.items : []) {
      if (!item || typeof item.sku !== 'string') continue;
      if (moduleBySku.has(item.sku) && moduleBySku.get(item.sku) !== module.id) moduleConflicts.push({ sku: item.sku, modules: [moduleBySku.get(item.sku), module.id] });
      else moduleBySku.set(item.sku, module.id);
    }
  }
  const catalogBySku = new Map(catalog.filter(item => item && typeof item.sku === 'string').map(item => [item.sku, item]));
  const records = [];
  const catalogSource = fileHash(root, SOURCE_PATHS.catalog, 'full catalog');
  const learningSource = fileHash(root, SOURCE_PATHS.learning, 'learning catalog');
  uniquePush(inputFiles, catalogSource); uniquePush(inputFiles, learningSource);
  const seen = new Set();
  for (const [index, row] of videos.entries()) {
    const sku = row && row.sku;
    const id = `LSKU:${sku || `row-${index}`}`;
    const conflicts = [];
    if (typeof sku !== 'string' || !sku.trim()) conflicts.push({ code: 'EMPTY_ID', pointer: `/videos/${index}/sku` });
    if (sku && seen.has(sku)) conflicts.push({ code: 'DUPLICATE_ID', namespace: 'LSKU', value: sku });
    if (sku) seen.add(sku);
    const catalogRow = sku ? catalogBySku.get(sku) : null;
    if (!catalogRow) conflicts.push({ code: 'MISSING_REFERENCE', reference: 'data/catalog_full.json', sku });
    else if (catalogRow.title !== row.title || catalogRow.mp4 !== row.mp4) conflicts.push({ code: 'CATALOG_IDENTITY_CONFLICT', sku });
    const moduleId = sku ? moduleBySku.get(sku) : null;
    if (!moduleId) conflicts.push({ code: 'MODULE_JOIN_MISSING_NOT_FILLED', sku });
    if (moduleConflicts.some(item => item.sku === sku)) conflicts.push({ code: 'MODULE_JOIN_DUPLICATE', sku });
    const folder = sku ? `video/${sku}` : `video/row-${index}`;
    const refs = [];
    for (const ext of ['json', 'srt', 'txt']) {
      const rel = `${folder}/transcript.${ext}`;
      try { const hash = fileHash(root, rel, `learning ${sku} ${ext}`); refs.push(hash); uniquePush(inputFiles, hash); }
      catch (error) { conflicts.push({ code: error.code || 'MISSING_REFERENCE', path: rel, message: error.message }); }
    }
    const status = conflicts.length ? STATUS.NEEDS_REVIEW : STATUS.MAPPED;
    records.push(makeRecord({
      id, namespace: 'LSKU', kind: 'learning_transcript_triad', status, refs,
      aliases: { sku, title: row && row.title, origin: row && row.origin },
      provenance: sourceProvenance(asOf, [learningSource, catalogSource], [`data-tabs/videos.json#/index/${index}`, `data/catalog_full.json#/sku/${sku}`]),
      conflicts,
      moduleJoin: moduleId ? { status: 'EXPLICIT_EXISTING_JOIN', moduleId } : { status: 'NOT_FILLED', moduleId: null },
      media: { mp4Reference: row && row.mp4 ? { path: row.mp4, read: false } : null, read: 'NOT_PERFORMED' },
    }));
  }
  return records;
}

function loadCompetitor(root, asOf, inputFiles) {
  const manifestRead = readJson(root, SOURCE_PATHS.deepManifest, 'deep channel manifest');
  const manifest = manifestRead.value;
  if (!Array.isArray(manifest.channels)) fail('SHAPE_ERROR', 'deep channel manifest channels must be an array');
  const manifestHash = fileHash(root, SOURCE_PATHS.deepManifest, 'deep channel manifest');
  uniquePush(inputFiles, manifestHash);
  const records = [];
  const seenIds = new Set();
  const seenTranscriptPaths = new Map();
  for (const [channelIndex, channel] of manifest.channels.entries()) {
    const rawId = channel && channel.id;
    const dossier = channel && channel.dossierPath;
    const topPath = dossier && path.posix.join(dossier, 'top-videos.json');
    if (!rawId || !dossier || !topPath) fail('EMPTY_REFERENCE', `Channel manifest row ${channelIndex} lacks id/path`);
    const topRead = readJson(root, topPath, `top-videos ${rawId}`);
    const topHash = fileHash(root, topPath, `top-videos ${rawId}`);
    uniquePush(inputFiles, topHash);
    const videos = topRead.value && topRead.value.videos;
    if (!Array.isArray(videos)) fail('SHAPE_ERROR', `top-videos ${rawId} videos must be an array`);
    for (const [videoIndex, row] of videos.entries()) {
      const videoId = row && row.videoId;
      const id = `CV:${rawId}:${videoId || `row-${videoIndex}`}`;
      const conflicts = [];
      if (!videoId) conflicts.push({ code: 'EMPTY_ID', pointer: `${topPath}#/videos/${videoIndex}/videoId` });
      if (seenIds.has(id)) conflicts.push({ code: 'DUPLICATE_ID', namespace: 'CV', value: id });
      seenIds.add(id);
      if (row.rawId != null && row.rawId !== rawId) conflicts.push({ code: 'NAMESPACE_ID_CONFLICT', expectedRawId: rawId, actualRawId: row.rawId });
      const refs = [topHash];
      const transcript = reference(root, row.transcriptJsonRel, dossier, `${id} transcript`, refs, conflicts, { required: row.hasTranscript === true });
      const summary = reference(root, row.summaryViRel, dossier, `${id} summary`, refs, conflicts, { required: row.hasSummaryVi === true });
      if (row.hasTranscript === false) {
        // A false declaration is preserved as UNKNOWN; transcriptLength=0 is
        // not interpreted as no speech and no transcript file is invented.
        if (row.transcriptJsonRel != null) conflicts.push({ code: 'FALSE_WITH_REFERENCE', field: 'transcriptJsonRel' });
      } else if (row.hasTranscript !== true) {
        conflicts.push({ code: 'TRANSCRIPT_STATUS_AMBIGUOUS', value: row.hasTranscript });
      }
      const transcriptPresent = transcript.status === 'PRESENT';
      const status = conflicts.length ? STATUS.NEEDS_REVIEW : (row.hasTranscript === false ? STATUS.NEEDS_REVIEW : (transcriptPresent ? STATUS.MAPPED : STATUS.NEEDS_REVIEW));
      const rowSource = sourceProvenance(asOf, refs, [`${topPath}#/videos/${videoIndex}`]);
      const record = makeRecord({
        id, namespace: 'CV', kind: row.hasTranscript === false ? 'competitor_transcript_unknown' : 'competitor_transcript', status, refs,
        aliases: { rawId, videoId, title: row.title, url: row.url, transcriptJsonRel: row.transcriptJsonRel, summaryViRel: row.summaryViRel },
        provenance: rowSource,
        conflicts,
        transcript: row.hasTranscript === false
          ? { state: 'UNKNOWN', reason: 'hasTranscript:false; no no_speech inference', reference: transcript }
          : { state: transcriptPresent ? 'PRESENT_BY_EXPLICIT_REFERENCE' : 'UNKNOWN', reference: transcript },
        summary: { state: row.hasSummaryVi === true && summary.status === 'PRESENT' ? 'PRESENT_BY_EXPLICIT_REFERENCE' : 'UNKNOWN', reference: summary },
        sourceRow: { path: topPath, pointer: `/videos/${videoIndex}`, topVideosHash: topHash.sha256 },
      });
      for (const item of refs) uniquePush(inputFiles, item);
      if (transcript.resolved) {
        if (seenTranscriptPaths.has(transcript.resolved)) conflicts.push({ code: 'PATH_COLLISION', path: transcript.resolved, previous: seenTranscriptPaths.get(transcript.resolved) });
        else seenTranscriptPaths.set(transcript.resolved, id);
      }
      records.push(record);
    }
  }
  return records;
}

function loadChannels(root, asOf, inputFiles) {
  const canonicalRead = readJson(root, SOURCE_PATHS.canonicalRaw, 'canonical raw channels');
  const metadataRead = readJson(root, SOURCE_PATHS.rawMetadata, 'raw metadata-full');
  const duplicateRead = readJson(root, SOURCE_PATHS.archivedDuplicates, 'archived duplicate manifest');
  const mainRead = readJson(root, SOURCE_PATHS.mainChannels, 'main channel catalog');
  const canonical = canonicalRead.value.records;
  const metadata = metadataRead.value.records;
  const duplicates = duplicateRead.value;
  const main = mainRead.value;
  if (!Array.isArray(canonical) || !Array.isArray(metadata) || !Array.isArray(duplicates) || !Array.isArray(main)) fail('SHAPE_ERROR', 'Channel sources have unexpected shape');
  const sourceFiles = [
    fileHash(root, SOURCE_PATHS.canonicalRaw, 'canonical raw channels'),
    fileHash(root, SOURCE_PATHS.rawMetadata, 'raw metadata-full'),
    fileHash(root, SOURCE_PATHS.archivedDuplicates, 'archived duplicate manifest'),
    fileHash(root, SOURCE_PATHS.mainChannels, 'main channel catalog'),
  ];
  sourceFiles.forEach(item => uniquePush(inputFiles, item));
  const metadataById = new Map(metadata.filter(row => row && row.id).map(row => [row.id, row]));
  const records = [];
  const seenCanonical = new Set();
  for (const [index, row] of canonical.entries()) {
    const id = row && row.id;
    const conflicts = [];
    if (!id) conflicts.push({ code: 'EMPTY_ID', pointer: `/records/${index}/id` });
    if (seenCanonical.has(id)) conflicts.push({ code: 'DUPLICATE_ID', namespace: 'CH', value: id });
    seenCanonical.add(id);
    const counterpart = metadataById.get(id);
    if (!counterpart) conflicts.push({ code: 'MISSING_REFERENCE', path: SOURCE_PATHS.rawMetadata, id });
    else if (row.sha256 !== counterpart.sha256 || row.fileName !== counterpart.fileName || row.channel?.channelId !== counterpart.channel?.channelId) conflicts.push({ code: 'CANONICAL_METADATA_CONFLICT', id });
    records.push(makeRecord({
      id: `CH:${id || `row-${index}`}`, namespace: 'CH', kind: 'canonical_raw_channel', status: conflicts.length ? STATUS.NEEDS_REVIEW : STATUS.MAPPED,
      refs: sourceFiles, aliases: { rawId: id, fileName: row.fileName, channelId: row.channel?.channelId, handle: row.channel?.handle, title: row.channel?.title },
      provenance: sourceProvenance(asOf, sourceFiles, [`${SOURCE_PATHS.canonicalRaw}#/records/${index}`, `${SOURCE_PATHS.rawMetadata}#/records/${metadata.findIndex(item => item.id === id)}`]), conflicts,
      lineage: { canonical: true, countsAsNewChannel: true },
    }));
  }
  const canonicalIds = new Set(canonical.map(row => row && row.id));
  for (const [index, row] of duplicates.entries()) {
    const id = row && row.id;
    const conflicts = [];
    if (!id || !row.duplicateOf) conflicts.push({ code: 'EMPTY_REFERENCE', pointer: `#/duplicates/${index}` });
    if (row.duplicateOf && !canonicalIds.has(row.duplicateOf)) conflicts.push({ code: 'MISSING_REFERENCE', duplicateOf: row.duplicateOf });
    records.push(makeRecord({
      id: `CH:${id || `duplicate-row-${index}`}:ARCHIVED_DUPLICATE`, namespace: 'CH', kind: 'archived_duplicate_signal', status: conflicts.length ? STATUS.NEEDS_REVIEW : STATUS.EXCLUDED,
      refs: [sourceFiles[2]], aliases: { rawId: id, duplicateOf: row.duplicateOf, handle: row.channel?.handle, title: row.channel?.title },
      provenance: sourceProvenance(asOf, [sourceFiles[2]], [`${SOURCE_PATHS.archivedDuplicates}#/${index}`]), conflicts,
      lineage: { archived: true, duplicateOf: row.duplicateOf ? `CH:${row.duplicateOf}` : null, countsAsNewChannel: false, exclusionReason: 'duplicate signal is retained but not a new channel' },
    }));
  }
  const seenHandles = new Map();
  for (const [index, row] of main.entries()) {
    const handle = row && row.handle;
    const conflicts = [];
    if (!handle || !row.url) conflicts.push({ code: 'EMPTY_REFERENCE', pointer: `${SOURCE_PATHS.mainChannels}#/${index}` });
    if (handle && seenHandles.has(handle)) conflicts.push({ code: 'DUPLICATE_ID', namespace: 'CH', value: handle, previous: seenHandles.get(handle) });
    if (handle) seenHandles.set(handle, index);
    records.push(makeRecord({
      id: `CH:MAIN:${index}`, namespace: 'CH', kind: 'main_channel_catalog_row', status: conflicts.length ? STATUS.NEEDS_REVIEW : STATUS.MAPPED,
      refs: [sourceFiles[3]], aliases: { handle, url: row && row.url, niche: row && row.niche, markets: row && row.markets },
      provenance: sourceProvenance(asOf, [sourceFiles[3]], [`${SOURCE_PATHS.mainChannels}#/${index}`]), conflicts,
      lineage: { canonical: false, countsAsNewChannel: true, identitySource: 'explicit_row_pointer' },
    }));
  }
  return records;
}

function validateRecords(records) {
  const ids = new Map();
  const exclusivePaths = new Map();
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object') fail('INVALID_RECORD', `Record ${index} is not an object`);
    if (!record.id || !record.namespace || !Object.values(STATUS).includes(record.status)) fail('INVALID_RECORD', `Record ${index} lacks id/namespace/status`);
    if (ids.has(record.id)) fail('DUPLICATE_ID', `Duplicate record id: ${record.id}`, { first: ids.get(record.id), second: index });
    ids.set(record.id, index);
    if (!Array.isArray(record.sourceRefs) || !record.sourceRefs.length) fail('EMPTY_REFERENCE', `Record ${record.id} has no sourceRefs`);
    for (const ref of record.sourceRefs) {
      if (!ref || !ref.path || !/^[a-f0-9]{64}$/iu.test(ref.sha256 || '') || !Number.isInteger(ref.bytes)) fail('INVALID_SOURCE_REF', `Record ${record.id} has an invalid source ref`);
      if (ref.exclusive) {
        if (exclusivePaths.has(ref.path) && exclusivePaths.get(ref.path) !== record.id) fail('PATH_COLLISION', `Exclusive source path collision: ${ref.path}`, { first: exclusivePaths.get(ref.path), second: record.id });
        exclusivePaths.set(ref.path, record.id);
      }
    }
    if (!record.provenance || record.provenance.noFuzzyMatching !== true) fail('PROVENANCE_MISSING', `Record ${record.id} lacks explicit provenance/no-fuzzy marker`);
  }
  return { recordCount: records.length, uniqueIds: ids.size };
}

function summarize(records, expectedCounts = REQUIRED_COUNTS) {
  const byKind = {};
  const byStatus = {};
  for (const record of records) {
    byKind[record.kind] = (byKind[record.kind] || 0) + 1;
    byStatus[record.status] = (byStatus[record.status] || 0) + 1;
  }
  const count = kind => byKind[kind] || 0;
  return {
    byKind,
    byStatus,
    accounting: {
      learningTriads: { expected: expectedCounts.learningTriads, observed: count('learning_transcript_triad') },
      competitorTranscripts: { expected: expectedCounts.competitorTranscripts, observed: count('competitor_transcript') },
      competitorUnknownRows: { expected: expectedCounts.competitorUnknownRows, observed: count('competitor_transcript_unknown') },
      canonicalRaw: { expected: expectedCounts.canonicalRaw, observed: count('canonical_raw_channel') },
      archivedDuplicateSignals: { expected: expectedCounts.archivedDuplicateSignals, observed: count('archived_duplicate_signal') },
      mainChannels: { expected: expectedCounts.mainChannels, observed: count('main_channel_catalog_row') },
      newCanonicalChannelCount: records.filter(record => record.kind === 'canonical_raw_channel' && record.lineage?.countsAsNewChannel).length,
      archivedDuplicateNewChannelCount: records.filter(record => record.kind === 'archived_duplicate_signal' && record.lineage?.countsAsNewChannel).length,
      unknownTranscriptRows: records.filter(record => record.kind === 'competitor_transcript_unknown' && record.transcript?.state === 'UNKNOWN').length,
    },
  };
}

function snapshotHash(inputFiles) {
  return sha256(Buffer.from(stable(inputFiles.slice().sort((a, b) => a.path.localeCompare(b.path))), 'utf8'));
}

function buildProposal(options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  const asOf = isoAsOf(options.asOf || new Date().toISOString());
  const expectedCounts = { ...REQUIRED_COUNTS, ...(options.expectedCounts || {}) };
  const inputFiles = [];
  const records = [
    ...loadLearning(root, asOf, inputFiles),
    ...loadCompetitor(root, asOf, inputFiles),
    ...loadChannels(root, asOf, inputFiles),
  ];
  validateRecords(records);
  const summary = summarize(records, expectedCounts);
  for (const [key, values] of Object.entries(summary.accounting)) {
    if (values && typeof values === 'object' && 'expected' in values && values.expected !== values.observed) fail('ACCOUNTING_MISMATCH', `${key}: expected ${values.expected}, observed ${values.observed}`, values);
  }
  if (summary.accounting.archivedDuplicateNewChannelCount !== 0) fail('DUPLICATE_COUNTED_AS_NEW_CHANNEL', 'Archived duplicate signal counted as a new channel');
  if (summary.accounting.newCanonicalChannelCount !== expectedCounts.canonicalRaw) fail('ACCOUNTING_MISMATCH', `Canonical new-channel count differs from ${expectedCounts.canonicalRaw}`);
  const sortedInputs = inputFiles.slice().sort((a, b) => a.path.localeCompare(b.path));
  return {
    schema: SCHEMA,
    ticket: 'A5',
    proposalStatus: 'DRY_RUN_ONLY',
    expectedCounts,
    countPolicy: 'These are expected counts for this legacy snapshot, not universal project limits.',
    statusSemantics: 'MAPPED means explicit identity/path mapping only; it is not A1 schema validation or import readiness.',
    fieldDraftSchemaValidation: { status: 'NEEDS_REVIEW', reason: 'A1 field/schema validator was not run by this audit-only proposal.' },
    asOf,
    rootPolicy: 'PROJECT_ROOT_RELATIVE_PATHS_ONLY',
    readPolicy: {
      metadata: 'READ',
      contentHashes: 'READ',
      mp4VideoCorpus: 'NOT_READ',
      semanticReread: 'NOT_PERFORMED',
      liveImport: 'NOT_PERFORMED',
      registryLedgerProjectionWrites: 'NOT_PERFORMED',
      fuzzyMatching: 'FORBIDDEN',
      autoModuleFill: 'FORBIDDEN',
    },
    namespaces: { learning: 'LSKU', source: 'SRC', channels: 'CH', competitorVideos: 'CV' },
    sources: { ...SOURCE_PATHS, canonicalMetadataActualPath: SOURCE_PATHS.rawMetadata },
    inputSnapshot: { fileCount: sortedInputs.length, files: sortedInputs, sha256: snapshotHash(sortedInputs) },
    summary,
    records,
    guarantees: {
      noSilentDrops: true,
      allowedStatuses: Object.values(STATUS),
      unknownUntranscribedPreserved: true,
      archivedDuplicatesNotNewChannels: true,
      sourcePathsAndHashesPreserved: true,
      aliasesPreservedWithoutFuzzyResolution: true,
      rightsRetentionLanguageFactVerification: 'UNKNOWN_NOT_INFERRED',
    },
  };
}

function assertInputSnapshot(proposal, options = {}) {
  if (!proposal || proposal.schema !== SCHEMA || !proposal.inputSnapshot || !Array.isArray(proposal.inputSnapshot.files)) fail('INVALID_PROPOSAL', 'Proposal snapshot is malformed');
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  const declaredSnapshotHash = snapshotHash(proposal.inputSnapshot.files);
  if (declaredSnapshotHash !== proposal.inputSnapshot.sha256) fail('SNAPSHOT_TAMPERED', 'Proposal input snapshot digest does not match its file list', { expected: proposal.inputSnapshot.sha256, actual: declaredSnapshotHash });
  const drift = [];
  for (const expected of proposal.inputSnapshot.files) {
    let actual;
    try { actual = fileHash(root, expected.path, 'snapshot input'); }
    catch (error) { drift.push({ path: expected.path, code: error.code || 'INPUT_READ_ERROR', message: error.message }); continue; }
    if (actual.sha256 !== expected.sha256 || actual.bytes !== expected.bytes) drift.push({ path: expected.path, expected, actual });
  }
  if (drift.length) fail('INPUT_DRIFT', 'One or more A5 inputs changed since proposal snapshot', { drift });
  return { ok: true, checked: proposal.inputSnapshot.files.length, sha256: proposal.inputSnapshot.sha256 };
}

function writeProposal(proposal, options = {}) {
  if (!proposal || proposal.schema !== SCHEMA) fail('INVALID_PROPOSAL', 'Unsupported proposal schema');
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
  const outputPath = auditPath(options.output || DEFAULT_OUTPUT, 'proposal output');
  const absolute = resolveInside(root, outputPath, 'proposal output');
  const bytes = Buffer.from(`${JSON.stringify(proposal, null, 2)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  if (fs.existsSync(absolute)) {
    const existing = fs.readFileSync(absolute);
    if (existing.equals(bytes)) return { status: 'IDENTICAL_OUTPUT_REUSED', path: outputPath, sha256: sha256(existing), bytes: existing.length, overwritten: false, backup: null };
    const backupPath = `${outputPath}.previous-${sha256(existing).slice(0, 16)}`;
    const backupAbsolute = resolveInside(root, backupPath, 'proposal backup');
    if (fs.existsSync(backupAbsolute) && !fs.readFileSync(backupAbsolute).equals(existing)) fail('BACKUP_CONFLICT', 'Existing proposal backup differs', { path: backupPath });
    if (!fs.existsSync(backupAbsolute)) fs.writeFileSync(backupAbsolute, existing, { flag: 'wx' });
    fs.writeFileSync(absolute, bytes);
    return { status: 'WRITTEN_WITH_PREVIOUS_BACKUP', path: outputPath, sha256: sha256(bytes), bytes: bytes.length, overwritten: true, backup: { path: backupPath, sha256: sha256(existing), bytes: existing.length } };
  }
  fs.writeFileSync(absolute, bytes, { flag: 'wx' });
  return { status: 'WRITTEN', path: outputPath, sha256: sha256(bytes), bytes: bytes.length, overwritten: false, backup: null };
}

function readProposal(root, relativePath) {
  return readJson(root, auditPath(relativePath, 'proposal path'), 'proposal').value;
}

function parseArgs(argv) {
  const args = { command: argv[0] || 'build' };
  for (let index = 1; index < argv.length; index += 1) {
    const match = /^--([^=]+)(?:=(.*))?$/u.exec(argv[index]);
    if (!match) fail('CLI_USAGE', `Unexpected argument: ${argv[index]}`);
    const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (match[2] !== undefined) args[key] = match[2];
    else if (['root', 'output', 'proposal', 'asOf'].includes(key)) args[key] = argv[++index];
    else fail('CLI_USAGE', `Unknown option --${match[1]}`);
  }
  return args;
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const root = path.resolve(args.root || path.resolve(__dirname, '..', '..'));
    if (args.command === 'build') {
      const proposal = buildProposal({ root, asOf: args.asOf });
      const write = writeProposal(proposal, { root, output: args.output });
      console.log(JSON.stringify({ schema: SCHEMA, status: write.status, proposalStatus: proposal.proposalStatus, output: write, summary: proposal.summary }, null, 2));
      return 0;
    }
    if (args.command === 'verify') {
      const proposal = readProposal(root, args.proposal || DEFAULT_OUTPUT);
      console.log(JSON.stringify({ schema: SCHEMA, ...assertInputSnapshot(proposal, { root }), summary: proposal.summary }, null, 2));
      return 0;
    }
    fail('CLI_USAGE', `Unknown command ${args.command}`);
  } catch (error) {
    console.error(JSON.stringify({ schema: SCHEMA, ok: false, code: error.code || 'ERROR', message: error.message, details: error.details || {} }, null, 2));
    return 1;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = {
  SCHEMA,
  STATUS,
  REQUIRED_COUNTS,
  SOURCE_PATHS,
  ProposalError,
  buildProposal,
  fileHash,
  validateRecords,
  assertInputSnapshot,
  writeProposal,
  readProposal,
  snapshotHash,
  sha256,
  auditPath,
};
