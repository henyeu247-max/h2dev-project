'use strict';

/**
 * A4 local adapter registry.
 *
 * This registry only describes safe, offline classifications.  It never
 * invokes a provider, executes a document, extracts an archive, OCRs media,
 * or interprets text as instructions.  Intake owns the byte/magic/encoding
 * checks; this module supplies the deterministic adapter vocabulary.
 */

const REGISTRY_FORMAT = 'h2dev.intake-adapter-registry.v1';

const MIME_BY_EXTENSION = Object.freeze({
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.text': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.log': 'text/plain',
  '.srt': 'application/x-subrip',
  '.vtt': 'text/vtt',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  '.docm': 'application/vnd.ms-word.document.macroEnabled.12',
});

const DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'json-v1',
    adapter: 'json',
    kind: 'structured-text',
    mime: 'application/json',
    capabilities: Object.freeze(['utf8', 'json-parse']),
  }),
  Object.freeze({
    id: 'text-v1',
    adapter: 'text',
    kind: 'text',
    mime: 'text/*',
    capabilities: Object.freeze(['utf8']),
  }),
  Object.freeze({
    id: 'srt-v1',
    adapter: 'srt',
    kind: 'subtitle',
    mime: 'application/x-subrip',
    capabilities: Object.freeze(['utf8', 'srt-structure']),
  }),
  Object.freeze({
    id: 'binary-metadata-v1',
    adapter: 'binary-metadata',
    kind: 'binary',
    mime: Object.freeze(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4']),
    capabilities: Object.freeze(['magic', 'metadata-only']),
  }),
  Object.freeze({
    id: 'unsupported-archive-v1',
    adapter: 'unsupported-archive',
    kind: 'archive',
    mime: 'application/zip',
    capabilities: Object.freeze(['magic', 'preserve-only']),
  }),
  Object.freeze({
    id: 'unsupported-document-v1',
    adapter: 'unsupported-document',
    kind: 'document',
    mime: 'application/pdf-or-office',
    capabilities: Object.freeze(['magic', 'preserve-only']),
  }),
]);

const UNSUPPORTED_OFFICE_EXTENSIONS = new Set([
  '.doc', '.docx', '.docm', '.xls', '.xlsx', '.xlsm', '.ppt', '.pptx', '.pptm',
]);

function normalizeExtension(value) {
  if (typeof value !== 'string') return '';
  const lower = value.toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot >= 0 ? lower.slice(dot) : '';
}

function declaredMimeFor(value) {
  const extension = normalizeExtension(value);
  return MIME_BY_EXTENSION[extension] || 'application/octet-stream';
}

function isTextMime(mime) {
  return typeof mime === 'string' && (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/x-subrip');
}

function isUnsupportedOfficeExtension(value) {
  return UNSUPPORTED_OFFICE_EXTENSIONS.has(normalizeExtension(value));
}

function findAdapter({ extension = '', declaredMime = '', detectedMime = '' } = {}) {
  const ext = normalizeExtension(extension);
  const mime = detectedMime || declaredMime;
  if (mime === 'application/json' || ext === '.json') return DEFINITIONS[0];
  if (mime === 'application/x-subrip' || ext === '.srt') return DEFINITIONS[2];
  if (isTextMime(mime) || ['.txt', '.text', '.md', '.markdown', '.csv', '.tsv', '.log', '.vtt'].includes(ext)) {
    return DEFINITIONS[1];
  }
  if (['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4'].includes(mime)) return DEFINITIONS[3];
  if (mime === 'application/zip' || ext === '.zip' || isUnsupportedOfficeExtension(ext)) return DEFINITIONS[4];
  if (mime === 'application/pdf' || ext === '.pdf') return DEFINITIONS[5];
  return null;
}

function listAdapters() {
  return DEFINITIONS.map(definition => ({
    ...definition,
    capabilities: [...definition.capabilities],
    mime: Array.isArray(definition.mime) ? [...definition.mime] : definition.mime,
  }));
}

module.exports = {
  REGISTRY_FORMAT,
  MIME_BY_EXTENSION,
  UNSUPPORTED_OFFICE_EXTENSIONS: Object.freeze([...UNSUPPORTED_OFFICE_EXTENSIONS]),
  declaredMimeFor,
  findAdapter,
  isTextMime,
  isUnsupportedOfficeExtension,
  listAdapters,
};
