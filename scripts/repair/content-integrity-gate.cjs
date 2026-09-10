#!/usr/bin/env node
'use strict';

/**
 * A16-C1 local source-integrity / translation safety gate.
 *
 * This program is intentionally a read-only classifier.  It does not edit a
 * transcript, rescale timestamps, truncate/remap segments, translate text, or
 * inspect media.  Source text is treated as data; prompt-like text in a
 * source is never executed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXIT_CODES = Object.freeze({
  OK: 0,
  USAGE_ERROR: 2,
  GATE_HOLD: 10,
  TOOL_FAILURE: 20,
});

const SCHEMA = 'h2dev.a16-c1.content-integrity-report.v1';
const CONFIG_SCHEMA = 'h2dev.a16-c1.content-integrity-config.v1';
const RUN_MANIFEST_SCHEMA = 'h2dev.a16-c1.run-manifest.v1';
const TOOL_VERSION = 'a16-c1-local-gate/1.0.0';

const DEFAULT_THRESHOLDS = Object.freeze({
  positiveSeconds: 30,
  positiveFraction: 0.10,
  earlySeconds: 30,
  earlyFraction: 0.10,
});

const DEFAULT_OVERLAP = Object.freeze({
  strongContiguousSegments: 10,
  maxCandidatePairs: 250000,
  minComparableCharacters: 12,
  minComparableWords: 3,
  boilerplatePatterns: [
    'thanks for watching',
    'thank you for watching',
    'like and subscribe',
    "don't forget to subscribe",
    'welcome back to the channel',
    'see you next time',
    'subscribe to the channel',
  ],
});

const PROMPT_LIKE_RE = /(ignore\s+(?:all\s+)?previous|system\s+message|developer\s+instruction|assistant\s+instruction|execute\s+(?:this|the)|powershell|rm\s+-rf|<\/?script\b)/i;

function fail(message, code = 'TOOL_FAILURE', details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function readJson(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath);
  } catch (error) {
    throw fail(`Cannot read ${label}: ${error.message}`, 'INPUT_READ_ERROR', {
      path: filePath,
      errno: error.code || null,
    });
  }
  try {
    // JSON.parse does not accept a UTF-8 BOM.  A BOM is a transport detail,
    // not a content repair, so remove it only for parsing.
    return {
      value: JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, '')),
      raw,
    };
  } catch (error) {
    throw fail(`Invalid JSON in ${label}: ${error.message}`, 'CORRUPT_JSON', {
      path: filePath,
    });
  }
}

function sha256(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function isHash(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

function normalizeHash(value, label) {
  if (!isHash(value)) {
    throw fail(`${label} must be a 64-character SHA-256 hex digest`, 'INVALID_HASH', {
      value: value == null ? null : String(value),
    });
  }
  return value.toLowerCase();
}

function asObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw fail(`${label} must be an object`, 'INVALID_SHAPE');
  }
  return value;
}

function asArray(value, label) {
  if (!Array.isArray(value)) {
    throw fail(`${label} must be an array`, 'INVALID_SHAPE');
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw fail(`${label} must be a non-empty string`, 'INVALID_CONFIG');
  }
  return value;
}

function normalizeRelativePath(value, label) {
  if (value == null) return null;
  if (typeof value !== 'string' || !value.trim()) {
    throw fail(`${label} must be a relative path or null`, 'INVALID_CONFIG');
  }
  if (path.isAbsolute(value)) {
    throw fail(`${label} must be relative to the project root`, 'PATH_OUTSIDE_ROOT', { path: value });
  }
  return value.replace(/\\/g, '/');
}

function resolveInsideRoot(root, relativePath, label) {
  if (relativePath == null) return null;
  const rootAbs = path.resolve(root);
  const candidate = path.resolve(rootAbs, relativePath);
  const rel = path.relative(rootAbs, candidate);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw fail(`${label} escapes project root`, 'PATH_OUTSIDE_ROOT', { path: relativePath });
  }
  return candidate;
}

function getExpectedHash(record, keys, label) {
  for (const key of keys) {
    if (record[key] != null) return normalizeHash(record[key], label);
  }
  throw fail(`${label} is required`, 'INVALID_CONFIG');
}

function parseIsoAsOf(value) {
  if (typeof value !== 'string' || !value.includes('T')) {
    throw fail('asOf must be an ISO-8601 timestamp with a time component', 'INVALID_ASOF');
  }
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) {
    throw fail(`Invalid asOf timestamp: ${value}`, 'INVALID_ASOF');
  }
  return new Date(millis).toISOString();
}

function finiteNumber(value, label, { min = -Infinity, allowString = true } = {}) {
  const candidate = typeof value === 'string' && allowString && value.trim() !== ''
    ? Number(value)
    : value;
  if (typeof candidate !== 'number' || !Number.isFinite(candidate) || candidate < min) {
    throw fail(`${label} must be a finite number >= ${min}`, 'INVALID_TIME_VALUE', {
      value,
    });
  }
  return candidate;
}

function parseIsoDuration(value, label) {
  if (typeof value !== 'string') {
    throw fail(`${label} must be an ISO-8601 duration`, 'INVALID_DURATION', { value });
  }
  // Supports the duration forms used by the raw top-videos data.  Years and
  // months are intentionally rejected because they are not fixed seconds.
  const match = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(value.trim());
  if (!match || /^P$/i.test(value.trim())) {
    throw fail(`${label} is not a fixed-length ISO-8601 duration`, 'INVALID_DURATION', { value });
  }
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  const result = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  if (!Number.isFinite(result) || result < 0) {
    throw fail(`${label} duration is not finite`, 'INVALID_DURATION', { value });
  }
  return result;
}

function roundNumber(value, digits = 6) {
  if (value == null) return value;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLowerCase();
}

function isCueOnly(value) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return false;
  return /^(?:\[(?:music|applause|laughter|inaudible|noise|silence|speaking foreign language|foreign language)[^\]]*\]|\((?:music|applause|laughter|inaudible|noise|silence)[^)]*\)|[♪♫]+|<[^>]+>)$/iu.test(text);
}

const SCRIPT_PATTERNS = Object.freeze({
  arabic: /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u,
  latin: /[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/u,
  cyrillic: /[\u0400-\u052f]/u,
  devanagari: /[\u0900-\u097f]/u,
  han: /[\u3400-\u4dbf\u4e00-\u9fff]/u,
  hiragana: /[\u3040-\u309f]/u,
  katakana: /[\u30a0-\u30ff]/u,
  hangul: /[\uac00-\ud7af]/u,
  thai: /[\u0e00-\u0e7f]/u,
});

function scriptFlags(value) {
  const text = String(value == null ? '' : value);
  const result = {};
  for (const [name, pattern] of Object.entries(SCRIPT_PATTERNS)) {
    result[name] = pattern.test(text);
  }
  return result;
}

function countScripts(segments, field) {
  const counts = Object.fromEntries(Object.keys(SCRIPT_PATTERNS).map(name => [name, 0]));
  for (const segment of segments) {
    const flags = scriptFlags(segment[field]);
    for (const [name, present] of Object.entries(flags)) {
      if (present) counts[name] += 1;
    }
  }
  return counts;
}

function sourceLanguageUsesScript(language, script) {
  const lang = String(language || '').toLowerCase();
  if (script === 'arabic') return lang === 'ar' || lang.startsWith('ar-');
  if (script === 'cyrillic') return ['ru', 'uk', 'bg', 'sr', 'mk'].some(prefix => lang === prefix || lang.startsWith(`${prefix}-`));
  if (script === 'han') return lang === 'zh' || lang.startsWith('zh-');
  if (script === 'hiragana' || script === 'katakana') return lang === 'ja' || lang.startsWith('ja-');
  if (script === 'hangul') return lang === 'ko' || lang.startsWith('ko-');
  return false;
}

function expectedTargetScripts(language) {
  const lang = String(language || '').toLowerCase();
  if (lang === 'vi' || lang.startsWith('vi-') || lang === 'en' || lang.startsWith('en-') || lang === 'fr' || lang.startsWith('fr-') || lang === 'de' || lang.startsWith('de-') || lang === 'es' || lang.startsWith('es-') || lang === 'pt' || lang.startsWith('pt-') || lang === 'nl' || lang.startsWith('nl-')) return ['latin'];
  if (lang === 'ar' || lang.startsWith('ar-')) return ['arabic'];
  if (lang === 'ru' || lang.startsWith('ru-')) return ['cyrillic'];
  if (lang === 'ja' || lang.startsWith('ja-')) return ['hiragana', 'katakana', 'han'];
  if (lang === 'ko' || lang.startsWith('ko-')) return ['hangul'];
  if (lang === 'zh' || lang.startsWith('zh-')) return ['han'];
  return [];
}

function comparePrimitive(actual, expected, label, errors) {
  if (expected == null) return;
  if (actual !== expected) {
    errors.push({
      code: 'IDENTITY_MISMATCH',
      severity: 'error',
      label,
      expected,
      actual: actual == null ? null : actual,
    });
  }
}

function targetRecordShape(rawTarget, index) {
  const target = asObject(rawTarget, `targets[${index}]`);
  const id = nonEmptyString(target.id, `targets[${index}].id`);
  const rawId = nonEmptyString(target.rawId, `${id}.rawId`);
  const videoId = nonEmptyString(target.videoId, `${id}.videoId`);
  const transcriptPath = normalizeRelativePath(target.transcriptPath, `${id}.transcriptPath`);
  const topVideosPath = normalizeRelativePath(target.topVideosPath, `${id}.topVideosPath`);
  if (!topVideosPath) throw fail(`${id}.topVideosPath is required`, 'INVALID_CONFIG');
  const transcriptSha256 = transcriptPath
    ? getExpectedHash(target, ['transcriptSha256', 'expectedTranscriptSha256', 'expectedSha256'], `${id}.transcriptSha256`)
    : null;
  const topVideosSha256 = getExpectedHash(target, ['topVideosSha256', 'expectedTopVideosSha256'], `${id}.topVideosSha256`);
  const expected = asObject(target.expected || {}, `${id}.expected`);
  const expectedTranscript = expected.transcript == null ? {} : asObject(expected.transcript, `${id}.expected.transcript`);
  const expectedTopVideo = expected.topVideo == null ? {} : asObject(expected.topVideo, `${id}.expected.topVideo`);
  const reviewAnchors = Array.isArray(target.reviewAnchors) ? target.reviewAnchors : [];
  const comparison = target.comparisonSource == null ? null : asObject(target.comparisonSource, `${id}.comparisonSource`);
  let comparisonShape = null;
  if (comparison) {
    comparisonShape = {
      id: nonEmptyString(comparison.id || `${id}:comparison`, `${id}.comparisonSource.id`),
      rawId: comparison.rawId == null ? null : nonEmptyString(comparison.rawId, `${id}.comparisonSource.rawId`),
      videoId: nonEmptyString(comparison.videoId, `${id}.comparisonSource.videoId`),
      transcriptPath: normalizeRelativePath(comparison.transcriptPath, `${id}.comparisonSource.transcriptPath`),
      sha256: getExpectedHash(comparison, ['sha256', 'expectedSha256', 'transcriptSha256'], `${id}.comparisonSource.sha256`),
      overlap: comparison.overlap == null ? {} : asObject(comparison.overlap, `${id}.comparisonSource.overlap`),
      readPolicy: comparison.readPolicy || 'STRUCTURAL_HASH_TEXT_OVERLAP_ONLY',
    };
    if (!comparisonShape.transcriptPath) throw fail(`${id}.comparisonSource.transcriptPath is required`, 'INVALID_CONFIG');
  }
  return {
    id,
    rawId,
    videoId,
    transcriptPath,
    transcriptSha256,
    topVideosPath,
    topVideosSha256,
    expectedTranscript,
    expectedTopVideo,
    reviewAnchors,
    comparisonSource: comparisonShape,
  };
}

function normalizeConfig(rawConfig) {
  const config = asObject(rawConfig, 'config');
  if (config.schema && config.schema !== CONFIG_SCHEMA) {
    throw fail(`Unsupported config schema: ${config.schema}`, 'UNSUPPORTED_SCHEMA');
  }
  const rawTargets = asArray(config.targets, 'config.targets');
  if (!rawTargets.length) throw fail('config.targets must not be empty', 'INVALID_CONFIG');
  const targets = rawTargets.map(targetRecordShape);
  const ids = new Set();
  for (const target of targets) {
    if (ids.has(target.id)) throw fail(`Duplicate target id: ${target.id}`, 'DUPLICATE_TARGET_ID');
    ids.add(target.id);
  }
  const rawThresholds = config.thresholds == null ? {} : asObject(config.thresholds, 'config.thresholds');
  const thresholds = {};
  for (const key of Object.keys(DEFAULT_THRESHOLDS)) {
    thresholds[key] = finiteNumber(rawThresholds[key] == null ? DEFAULT_THRESHOLDS[key] : rawThresholds[key], `thresholds.${key}`, { min: 0 });
  }
  const safetyPolicy = config.safetyPolicy == null ? {} : asObject(config.safetyPolicy, 'config.safetyPolicy');
  const overlapDefaults = config.overlap == null ? {} : asObject(config.overlap, 'config.overlap');
  return {
    schema: config.schema || CONFIG_SCHEMA,
    gateId: config.gateId || 'A16-C1',
    purpose: config.purpose || 'local source-integrity and translation safety classification only',
    targets,
    thresholds,
    overlap: {
      ...DEFAULT_OVERLAP,
      ...overlapDefaults,
      boilerplatePatterns: Array.isArray(overlapDefaults.boilerplatePatterns)
        ? overlapDefaults.boilerplatePatterns.map(value => String(value).toLowerCase())
        : DEFAULT_OVERLAP.boilerplatePatterns,
    },
    safetyPolicy,
  };
}

function targetProjection(target) {
  return {
    id: target.id,
    rawId: target.rawId,
    videoId: target.videoId,
    transcriptPath: target.transcriptPath,
    transcriptSha256: target.transcriptSha256,
    topVideosPath: target.topVideosPath,
    topVideosSha256: target.topVideosSha256,
    comparisonSource: target.comparisonSource
      ? {
        id: target.comparisonSource.id,
        videoId: target.comparisonSource.videoId,
        transcriptPath: target.comparisonSource.transcriptPath,
        sha256: target.comparisonSource.sha256,
      }
      : null,
  };
}

function normalizeManifestTarget(rawTarget, index) {
  const target = asObject(rawTarget, `runManifest.targets[${index}]`);
  return {
    id: nonEmptyString(target.id, `runManifest.targets[${index}].id`),
    transcriptPath: normalizeRelativePath(target.transcriptPath, `runManifest.targets[${index}].transcriptPath`),
    transcriptSha256: target.transcriptPath == null ? null : getExpectedHash(target, ['transcriptSha256', 'expectedTranscriptSha256', 'expectedSha256'], `runManifest.targets[${index}].transcriptSha256`),
    topVideosPath: normalizeRelativePath(target.topVideosPath, `runManifest.targets[${index}].topVideosPath`),
    topVideosSha256: getExpectedHash(target, ['topVideosSha256', 'expectedTopVideosSha256'], `runManifest.targets[${index}].topVideosSha256`),
    comparisonSource: target.comparisonSource == null ? null : {
      id: nonEmptyString(target.comparisonSource.id, `runManifest.targets[${index}].comparisonSource.id`),
      videoId: nonEmptyString(target.comparisonSource.videoId, `runManifest.targets[${index}].comparisonSource.videoId`),
      transcriptPath: normalizeRelativePath(target.comparisonSource.transcriptPath, `runManifest.targets[${index}].comparisonSource.transcriptPath`),
      sha256: getExpectedHash(target.comparisonSource, ['sha256', 'expectedSha256', 'transcriptSha256'], `runManifest.targets[${index}].comparisonSource.sha256`),
    },
  };
}

function validateRunManifest(rawManifest, config, configSha256) {
  const manifest = asObject(rawManifest, 'runManifest');
  if (manifest.schema && manifest.schema !== RUN_MANIFEST_SCHEMA) {
    throw fail(`Unsupported run manifest schema: ${manifest.schema}`, 'UNSUPPORTED_SCHEMA');
  }
  const runId = nonEmptyString(manifest.runId, 'runManifest.runId');
  const asOf = parseIsoAsOf(manifest.asOf);
  if (manifest.configSha256 == null) {
    throw fail('runManifest.configSha256 is required when a run manifest is supplied', 'CONFIG_HASH_REQUIRED');
  }
  const manifestConfigSha256 = normalizeHash(manifest.configSha256, 'runManifest.configSha256');
  if (manifestConfigSha256 !== configSha256) {
    throw fail('Config hash differs from run manifest lock', 'CONFIG_HASH_MISMATCH', {
      expected: manifestConfigSha256,
      actual: configSha256,
    });
  }
  const targets = asArray(manifest.targets, 'runManifest.targets').map(normalizeManifestTarget);
  if (targets.length !== config.targets.length) {
    throw fail('Run manifest target count differs from config', 'MANIFEST_TARGET_MISMATCH', {
      expected: config.targets.length,
      actual: targets.length,
    });
  }
  for (let index = 0; index < config.targets.length; index += 1) {
    const expected = targetProjection(config.targets[index]);
    const actual = targets[index];
    const expectedJson = JSON.stringify(expected);
    const actualJson = JSON.stringify({
      id: actual.id,
      rawId: config.targets[index].rawId,
      videoId: config.targets[index].videoId,
      transcriptPath: actual.transcriptPath,
      transcriptSha256: actual.transcriptSha256,
      topVideosPath: actual.topVideosPath,
      topVideosSha256: actual.topVideosSha256,
      comparisonSource: actual.comparisonSource,
    });
    if (expectedJson !== actualJson) {
      throw fail(`Run manifest target lock differs at index ${index}`, 'MANIFEST_TARGET_MISMATCH', {
        index,
        expected,
        actual,
      });
    }
  }
  return {
    runId,
    asOf,
    targets,
  };
}

function hashAndReadJson(root, relativePath, expectedHash, label) {
  const absolutePath = resolveInsideRoot(root, relativePath, label);
  let file;
  try {
    file = fs.readFileSync(absolutePath);
  } catch (error) {
    throw fail(`Cannot read ${label}: ${error.message}`, 'INPUT_READ_ERROR', {
      path: relativePath,
      errno: error.code || null,
    });
  }
  const actualHash = sha256(file);
  if (expectedHash && actualHash !== expectedHash) {
    throw fail(`${label} SHA-256 does not match the locked hash`, 'TARGET_HASH_MISMATCH', {
      path: relativePath,
      expectedSha256: expectedHash,
      actualSha256: actualHash,
    });
  }
  let parsed;
  try {
    parsed = JSON.parse(file.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw fail(`Invalid JSON in ${label}: ${error.message}`, 'CORRUPT_JSON', {
      path: relativePath,
    });
  }
  return { absolutePath, parsed, actualHash, bytes: file.length };
}

function findTopVideo(topVideos, target, label) {
  asObject(topVideos, label);
  if (topVideos.rawId != null && topVideos.rawId !== target.rawId) {
    throw fail(`${label}.rawId does not match target`, 'IDENTITY_MISMATCH', {
      expected: target.rawId,
      actual: topVideos.rawId,
    });
  }
  const videos = asArray(topVideos.videos, `${label}.videos`);
  const matches = videos.filter(video => video && video.videoId === target.videoId);
  if (!matches.length) {
    throw fail(`${label}.videos is missing locked video id ${target.videoId}`, 'MISSING_TARGET_ID', {
      rawId: target.rawId,
      videoId: target.videoId,
    });
  }
  if (matches.length !== 1) {
    throw fail(`${label}.videos contains duplicate locked video id ${target.videoId}`, 'DUPLICATE_TARGET_ID', {
      rawId: target.rawId,
      videoId: target.videoId,
      count: matches.length,
    });
  }
  return matches[0];
}

function validateSegments(transcript, target, label) {
  const segments = asArray(transcript.segments, `${label}.segments`);
  const endpointParts = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = asObject(segments[index], `${label}.segments[${index}]`);
    const start = finiteNumber(segment.start, `${label}.segments[${index}].start`, { min: 0 });
    const duration = finiteNumber(segment.duration, `${label}.segments[${index}].duration`, { min: 0 });
    endpointParts.push({ index, start, duration, end: start + duration });
  }
  if (!segments.length) throw fail(`${label}.segments must not be empty`, 'EMPTY_SEGMENTS');
  const endpoint = Math.max(...endpointParts.map(item => item.end));
  return { segments, endpoint, endpointParts };
}

function timeReconciliation(transcript, topVideo, segmentInfo, thresholds) {
  const metadataDurationSeconds = parseIsoDuration(topVideo.duration, 'top video duration');
  const transcriptEndpointSeconds = segmentInfo.endpoint;
  const deltaSeconds = transcriptEndpointSeconds - metadataDurationSeconds;
  const deltaFraction = metadataDurationSeconds === 0 ? null : deltaSeconds / metadataDurationSeconds;
  const flags = [];
  if (deltaSeconds > thresholds.positiveSeconds) flags.push('END_OVER_POSITIVE_SECONDS_THRESHOLD');
  if (deltaFraction != null && deltaFraction > thresholds.positiveFraction) flags.push('END_OVER_POSITIVE_FRACTION_THRESHOLD');
  if (deltaSeconds < -thresholds.earlySeconds) flags.push('END_EARLY_NEGATIVE_SECONDS_THRESHOLD');
  if (deltaFraction != null && deltaFraction < -thresholds.earlyFraction) flags.push('END_EARLY_NEGATIVE_FRACTION_THRESHOLD');
  const relation = deltaSeconds > 0 ? 'TRANSCRIPT_ENDPOINT_AFTER_METADATA' : deltaSeconds < 0 ? 'TRANSCRIPT_ENDPOINT_BEFORE_METADATA' : 'ENDPOINTS_EQUAL';
  return {
    metadataDuration: topVideo.duration,
    metadataDurationSeconds: roundNumber(metadataDurationSeconds),
    transcriptEndpointSeconds: roundNumber(transcriptEndpointSeconds),
    deltaSeconds: roundNumber(deltaSeconds),
    deltaFraction: roundNumber(deltaFraction),
    relation,
    flags,
    status: flags.length ? 'MISMATCH_UNCLASSIFIED' : 'WITHIN_CONFIGURED_TOLERANCE',
    interpretation: 'METADATA_VS_TRANSCRIPT_ENDPOINT_ONLY',
    audioFault: 'UNKNOWN',
    trustedMediaDuration: 'NOT_PROVIDED',
    repairOffered: false,
    repairActions: [],
  };
}

function translationDiagnostics(transcript, target) {
  const segments = transcript.segments;
  const sourceLanguage = transcript.language == null ? null : String(transcript.language);
  const targetLanguage = transcript.targetLanguage == null ? null : String(transcript.targetLanguage);
  const expectedTarget = target.expectedTranscript.targetLanguage;
  const rows = segments.map((segment, index) => {
    const sourceText = segment.text;
    const translatedText = segment.viText;
    const sourceNonEmpty = typeof sourceText === 'string' && sourceText.trim() !== '';
    const translatedNonEmpty = typeof translatedText === 'string' && translatedText.trim() !== '';
    const cueOnly = sourceNonEmpty && isCueOnly(sourceText) && translatedNonEmpty && isCueOnly(translatedText);
    return {
      index,
      sourceNonEmpty,
      translatedNonEmpty,
      cueOnly,
      exactEqual: sourceNonEmpty && translatedNonEmpty && sourceText === translatedText,
      source: sourceText,
      translation: translatedText,
    };
  });
  const missingSource = rows.filter(row => !row.sourceNonEmpty).map(row => row.index);
  const missingTranslation = rows.filter(row => !row.translatedNonEmpty).map(row => row.index);
  if (missingSource.length || missingTranslation.length) {
    throw fail(`Translation fields missing for ${target.id}`, 'TRANSLATION_FIELD_MISSING', {
      targetId: target.id,
      missingSourceSegments: missingSource,
      missingTranslationSegments: missingTranslation,
    });
  }
  const meaningful = rows.filter(row => !row.cueOnly);
  const exactEqualMeaningful = meaningful.filter(row => row.exactEqual);
  const exactEqualNonEmpty = rows.filter(row => row.exactEqual);
  const sourceArabic = rows.filter(row => scriptFlags(row.source).arabic);
  const translationArabic = rows.filter(row => scriptFlags(row.translation).arabic);
  const sourceScripts = countScripts(segments, 'text');
  const translationScripts = countScripts(segments, 'viText');
  const expectedScripts = expectedTargetScripts(targetLanguage || expectedTarget);
  const targetScriptRetained = translationArabic.length > 0 && expectedScripts.includes('latin');
  const allMeaningfulEqual = meaningful.length > 0 && exactEqualMeaningful.length === meaningful.length;
  const sourceLanguageMatch = target.expectedTranscript.language == null || sourceLanguage === target.expectedTranscript.language;
  const targetLanguageMatch = expectedTarget == null || targetLanguage === expectedTarget;
  let status = 'STRUCTURAL_EQUALITY_SIGNAL_ONLY';
  let hold = false;
  let holdCode = null;
  if (targetScriptRetained) {
    status = allMeaningfulEqual
      ? 'SOURCE_SCRIPT_RETAINED_IN_TARGET_FIELD'
      : 'MIXED_SOURCE_AND_TARGET_SCRIPT_REVIEW_REQUIRED';
    hold = true;
    holdCode = 'NON_TARGET_SCRIPT_RETAINED';
  } else if (allMeaningfulEqual && sourceLanguageUsesScript(sourceLanguage, 'arabic')) {
    status = 'SOURCE_SCRIPT_RETAINED_IN_TARGET_FIELD';
    hold = true;
    holdCode = 'NON_TARGET_SCRIPT_RETAINED';
  }
  return {
    sourceLanguage,
    targetLanguage,
    expectedTargetLanguage: expectedTarget || null,
    sourceLanguageMatch,
    targetLanguageMatch,
    segments: segments.length,
    nonemptySegments: rows.filter(row => row.sourceNonEmpty && row.translatedNonEmpty).length,
    meaningfulSegments: meaningful.length,
    cueOnlySegments: rows.filter(row => row.cueOnly).length,
    exactEqualNonemptySegments: exactEqualNonEmpty.length,
    exactEqualMeaningfulSegments: exactEqualMeaningful.length,
    exactEqualMeaningfulFraction: meaningful.length ? exactEqualMeaningful.length / meaningful.length : null,
    sourceArabicSegments: sourceArabic.length,
    translationArabicSegments: translationArabic.length,
    sourceScripts,
    translationScripts,
    expectedTargetScripts: expectedScripts,
    targetScriptRetained,
    status,
    hold,
    holdCode,
    exactEqualityInterpretation: 'STRUCTURAL_SIGNAL_ONLY_NOT_SEMANTIC_TRUTH',
    translationQuality: 'UNKNOWN',
    semanticInference: 'NOT_PERFORMED',
    equalityIsTranslationError: false,
    cueEqualityExcludedFromMeaningfulSignal: true,
    promptLikeSegments: rows.filter(row => PROMPT_LIKE_RE.test(String(row.source))).map(row => ({ index: row.index, field: 'text' })),
  };
}

function anchorDiagnostics(transcript, anchors, targetId) {
  const segments = transcript.segments;
  const results = [];
  for (let anchorIndex = 0; anchorIndex < anchors.length; anchorIndex += 1) {
    const anchor = asObject(anchors[anchorIndex], `${targetId}.reviewAnchors[${anchorIndex}]`);
    const indexes = asArray(anchor.segmentIndexes, `${targetId}.reviewAnchors[${anchorIndex}].segmentIndexes`);
    const validIndexes = indexes.filter(index => Number.isInteger(index) && index >= 0 && index < segments.length);
    const missingIndexes = indexes.filter(index => !Number.isInteger(index) || index < 0 || index >= segments.length);
    if (missingIndexes.length) {
      throw fail(`Review anchor has missing segment locator for ${targetId}`, 'MISSING_LOCATOR', {
        targetId,
        anchorId: anchor.id || `anchor-${anchorIndex}`,
        missingIndexes,
      });
    }
    const sourceText = validIndexes.map(index => String(segments[index].text || '')).join(' ');
    const translationText = validIndexes.map(index => String(segments[index].viText || '')).join(' ');
    const sourceSignals = Array.isArray(anchor.sourceContains)
      ? anchor.sourceContains.map(signal => String(signal)).filter(signal => signal && sourceText.toLowerCase().includes(signal.toLowerCase()))
      : [];
    const translationSignals = Array.isArray(anchor.translationContains)
      ? anchor.translationContains.map(signal => String(signal)).filter(signal => signal && translationText.toLowerCase().includes(signal.toLowerCase()))
      : [];
    results.push({
      id: anchor.id || `anchor-${anchorIndex}`,
      segmentIndexes: validIndexes,
      provenance: anchor.provenance || 'UNSPECIFIED',
      observedSignal: anchor.observedSignal || 'REVIEW_REQUIRED',
      gate: anchor.gate || 'HUMAN_TRANSLATION_REVIEW_REQUIRED',
      sourceSignals,
      translationSignals,
      signalMatch: Boolean(sourceSignals.length || translationSignals.length),
      status: 'HUMAN_REVIEW_REQUIRED',
      semanticCorrection: 'NOT_PERFORMED',
    });
  }
  return results;
}

function overlapConfig(source, globalOverlap) {
  const local = source.overlap || {};
  const strongContiguousSegments = finiteNumber(local.strongContiguousSegments == null ? globalOverlap.strongContiguousSegments : local.strongContiguousSegments, 'comparison strongContiguousSegments', { min: 2 });
  const maxCandidatePairs = finiteNumber(local.maxCandidatePairs == null ? globalOverlap.maxCandidatePairs : local.maxCandidatePairs, 'comparison maxCandidatePairs', { min: 1 });
  const minComparableCharacters = finiteNumber(local.minComparableCharacters == null ? globalOverlap.minComparableCharacters : local.minComparableCharacters, 'comparison minComparableCharacters', { min: 0 });
  const minComparableWords = finiteNumber(local.minComparableWords == null ? globalOverlap.minComparableWords : local.minComparableWords, 'comparison minComparableWords', { min: 0 });
  const targetRanges = Array.isArray(local.targetRanges) ? local.targetRanges.map((range, index) => {
    const object = asObject(range, `comparison targetRanges[${index}]`);
    const start = finiteNumber(object.start, `comparison targetRanges[${index}].start`, { min: 0 });
    const end = finiteNumber(object.end, `comparison targetRanges[${index}].end`, { min: start });
    return { start: Math.trunc(start), end: Math.trunc(end), label: object.label || null };
  }) : null;
  const boilerplatePatterns = Array.isArray(local.boilerplatePatterns)
    ? local.boilerplatePatterns.map(value => String(value).toLowerCase())
    : globalOverlap.boilerplatePatterns;
  return { strongContiguousSegments, maxCandidatePairs, minComparableCharacters, minComparableWords, targetRanges, boilerplatePatterns };
}

function inTargetRanges(index, ranges) {
  if (!ranges || !ranges.length) return true;
  return ranges.some(range => index >= range.start && index <= range.end);
}

function isBoilerplate(normalized, config) {
  if (!normalized) return true;
  return config.boilerplatePatterns.some(pattern => pattern && normalized.includes(pattern));
}

function isLowInformation(normalized, config) {
  if (!normalized) return true;
  return normalized.length < config.minComparableCharacters
    || normalized.split(/\s+/u).filter(Boolean).length < config.minComparableWords;
}

function textOverlapEvidence(targetSegments, sourceSegments, source, globalOverlap) {
  const cfg = overlapConfig(source, globalOverlap);
  const sourceIndex = new Map();
  for (let index = 0; index < sourceSegments.length; index += 1) {
    const normalized = normalizeText(sourceSegments[index].text);
    if (!normalized || isCueOnly(sourceSegments[index].text)) continue;
    if (!sourceIndex.has(normalized)) sourceIndex.set(normalized, []);
    sourceIndex.get(normalized).push(index);
  }
  const pairs = [];
  const targetMatchIndexes = new Set();
  const unambiguousTargetMatchIndexes = new Set();
  const sourceMatchIndexes = new Set();
  const boilerplatePairs = [];
  let ambiguousTargetSegments = 0;
  for (let targetIndex = 0; targetIndex < targetSegments.length; targetIndex += 1) {
    if (!inTargetRanges(targetIndex, cfg.targetRanges)) continue;
    const normalized = normalizeText(targetSegments[targetIndex].text);
    if (!normalized || isCueOnly(targetSegments[targetIndex].text)) continue;
    const candidates = sourceIndex.get(normalized) || [];
    if (!candidates.length) continue;
    if (candidates.length > 1) ambiguousTargetSegments += 1;
    for (const sourceIndexValue of candidates) {
      if (pairs.length >= cfg.maxCandidatePairs) {
        return {
          status: 'ANALYSIS_LIMIT_REACHED',
          readPolicy: source.readPolicy,
          normalization: 'NFC_TRIM_COLLAPSE_WHITESPACE_LOWER',
          targetRanges: cfg.targetRanges,
          candidatePairs: pairs.length,
          maxCandidatePairs: cfg.maxCandidatePairs,
          matchedTargetSegments: targetMatchIndexes.size,
          unambiguousMatchedTargetSegments: unambiguousTargetMatchIndexes.size,
          matchedSourceSegments: sourceMatchIndexes.size,
          strongLocator: null,
          longestExactContiguousSegments: null,
          boilerplatePairsExcluded: boilerplatePairs.length,
          ambiguousTargetSegments,
          unknown: true,
          classification: 'NEEDS_REVIEW_ANALYSIS_LIMIT',
          semanticRead: false,
          semanticInference: 'NOT_PERFORMED',
          repairOffered: false,
        };
      }
      const boilerplate = isBoilerplate(normalized, cfg);
      const pair = {
        targetIndex,
        sourceIndex: sourceIndexValue,
        normalized,
        boilerplate,
        lowInformation: isLowInformation(normalized, cfg),
      };
      pairs.push(pair);
      if (boilerplate) {
        boilerplatePairs.push(pair);
      } else {
        targetMatchIndexes.add(targetIndex);
        if (candidates.length === 1) unambiguousTargetMatchIndexes.add(targetIndex);
        sourceMatchIndexes.add(sourceIndexValue);
      }
    }
  }
  const pairSet = new Set(pairs.map(pair => `${pair.targetIndex},${pair.sourceIndex}`));
  const dp = new Map();
  const runCandidates = [];
  for (const pair of pairs.filter(item => !item.boilerplate)) {
    const key = `${pair.targetIndex},${pair.sourceIndex}`;
    const previous = dp.get(`${pair.targetIndex - 1},${pair.sourceIndex - 1}`) || 0;
    dp.set(key, previous + 1);
  }
  for (const pair of pairs.filter(item => !item.boilerplate)) {
    const key = `${pair.targetIndex},${pair.sourceIndex}`;
    const length = dp.get(key) || 1;
    if (!pairSet.has(`${pair.targetIndex + 1},${pair.sourceIndex + 1}`)) {
      const startTarget = pair.targetIndex - length + 1;
      const startSource = pair.sourceIndex - length + 1;
      runCandidates.push({
        targetStart: startTarget,
        targetEnd: pair.targetIndex,
        sourceStart: startSource,
        sourceEnd: pair.sourceIndex,
        length,
      });
    }
  }
  runCandidates.sort((a, b) => b.length - a.length || a.targetStart - b.targetStart || a.sourceStart - b.sourceStart);
  const longest = runCandidates[0] || null;
  const pairByKey = new Map(pairs.map(pair => [`${pair.targetIndex},${pair.sourceIndex}`, pair]));
  for (const run of runCandidates) {
    let informativeCount = 0;
    for (let offset = 0; offset < run.length; offset += 1) {
      const pair = pairByKey.get(`${run.targetStart + offset},${run.sourceStart + offset}`);
      if (pair && !pair.lowInformation) informativeCount += 1;
    }
    run.informativeSegments = informativeCount;
    run.informativeFraction = run.length ? informativeCount / run.length : 0;
  }
  const strongRuns = runCandidates.filter(run => run.length >= cfg.strongContiguousSegments && run.informativeSegments >= Math.max(1, Math.ceil(run.length * 0.5)));
  const strongest = strongRuns[0] || null;
  const strongLocator = strongest
    ? {
      target: {
        startSegmentIndex: strongest.targetStart,
        endSegmentIndex: strongest.targetEnd,
        startTime: Number(targetSegments[strongest.targetStart].start),
        endTime: Number(targetSegments[strongest.targetEnd].start) + Number(targetSegments[strongest.targetEnd].duration),
      },
      comparison: {
        startSegmentIndex: strongest.sourceStart,
        endSegmentIndex: strongest.sourceEnd,
        startTime: Number(sourceSegments[strongest.sourceStart].start),
        endTime: Number(sourceSegments[strongest.sourceEnd].start) + Number(sourceSegments[strongest.sourceEnd].duration),
      },
      contiguousSegments: strongest.length,
      informativeSegments: strongest.informativeSegments,
      informativeFraction: strongest.informativeFraction,
      evidence: 'EXACT_NORMALIZED_TEXT_SEQUENCE',
    }
    : null;
  let status = 'NO_STRONG_OVERLAP_OBSERVED';
  let classification = 'NO_STRUCTURAL_OVERLAP_CONCLUSION';
  let unknown = true;
  if (strongLocator) {
    status = 'SUSPECTED_MIXED_SOURCE';
    classification = 'NEEDS_PROVENANCE_REVIEW';
  } else if (pairs.length && !strongRuns.length && boilerplatePairs.length === pairs.length) {
    status = 'BOILERPLATE_ONLY_OVERLAP';
    classification = 'NO_MIXED_SOURCE_CONCLUSION';
  }
  return {
    status,
    readPolicy: source.readPolicy,
    normalization: 'NFC_TRIM_COLLAPSE_WHITESPACE_LOWER',
    targetRanges: cfg.targetRanges,
    candidatePairs: pairs.length,
    matchedTargetSegments: targetMatchIndexes.size,
    unambiguousMatchedTargetSegments: unambiguousTargetMatchIndexes.size,
    matchedSourceSegments: sourceMatchIndexes.size,
    strongContiguousThreshold: cfg.strongContiguousSegments,
    longestExactContiguousSegments: longest ? longest.length : 0,
    strongRunCount: strongRuns.length,
    strongLocator,
    boilerplatePairsExcluded: boilerplatePairs.length,
    ambiguousTargetSegments,
    unknown,
    classification,
    semanticRead: false,
    semanticInference: 'NOT_PERFORMED',
    repairOffered: false,
    repairActions: [],
  };
}

function identityDiagnostics(transcript, topVideos, topVideo, target, segmentInfo) {
  const errors = [];
  comparePrimitive(transcript.videoId, target.expectedTranscript.videoId || target.videoId, `${target.id}.transcript.videoId`, errors);
  comparePrimitive(transcript.language, target.expectedTranscript.language, `${target.id}.transcript.language`, errors);
  comparePrimitive(transcript.targetLanguage, target.expectedTranscript.targetLanguage, `${target.id}.transcript.targetLanguage`, errors);
  comparePrimitive(transcript.segmentCount, target.expectedTranscript.segmentCount, `${target.id}.transcript.segmentCount`, errors);
  comparePrimitive(segmentInfo.segments.length, transcript.segmentCount, `${target.id}.transcript.segments.length`, errors);
  comparePrimitive(topVideos.rawId || null, target.expectedTopVideo.rawId || target.rawId, `${target.id}.topVideos.rawId`, errors);
  comparePrimitive(topVideo.videoId || null, target.expectedTopVideo.videoId || target.videoId, `${target.id}.topVideo.videoId`, errors);
  if (typeof topVideo.hasTranscript !== 'boolean') {
    errors.push({
      code: 'IDENTITY_MISMATCH',
      severity: 'error',
      label: `${target.id}.topVideo.hasTranscript`,
      expected: 'boolean',
      actual: topVideo.hasTranscript == null ? null : typeof topVideo.hasTranscript,
    });
  } else if (target.expectedTopVideo.hasTranscript != null) {
    comparePrimitive(topVideo.hasTranscript, Boolean(target.expectedTopVideo.hasTranscript), `${target.id}.topVideo.hasTranscript`, errors);
  }
  if (target.expectedTopVideo.segmentCount != null) {
    comparePrimitive(topVideo.segmentCount, target.expectedTopVideo.segmentCount, `${target.id}.topVideo.segmentCount`, errors);
  }
  if (target.transcriptPath && topVideo.hasTranscript === false) {
    errors.push({
      code: 'TRANSCRIPT_FLAG_CONFLICT',
      severity: 'error',
      label: `${target.id}.topVideo.hasTranscript`,
      expected: true,
      actual: false,
    });
  }
  return errors;
}

function usageSafety({ affected, hasTranscript, toolFailure = false }) {
  if (toolFailure) {
    return {
      researchDiscovery: {
        decision: 'BLOCKED_BY_TOOL_FAILURE',
        reason: 'tool failure prevents safe classification for this target',
      },
      sourceSupportedLocators: {
        decision: 'BLOCKED_BY_TOOL_FAILURE',
        reason: 'tool failure prevents safe locator validation for this target',
      },
      subtitles: {
        decision: 'BLOCKED_BY_TOOL_FAILURE',
        reason: 'tool failure prevents subtitle safety classification for this target',
      },
      alignment: {
        decision: 'BLOCKED_BY_TOOL_FAILURE',
        reason: 'tool failure prevents alignment safety classification for this target',
      },
      release: {
        decision: 'BLOCKED_BY_TOOL_FAILURE',
        reason: 'tool failure prevents release safety classification for this target',
      },
      factVerification: {
        decision: 'UNKNOWN',
        reason: 'no independent external fact verification was performed',
      },
      rights: {
        decision: 'UNKNOWN',
        reason: 'rights, license, consent, ownership, and reuse policy were not inspected',
      },
      mediaProvenance: {
        decision: 'UNKNOWN',
        reason: 'no trusted media/audio provenance was supplied to this local gate',
      },
      semanticTruth: 'UNKNOWN',
      repair: {
        decision: 'NO_REPAIR_PROPOSED',
        actions: [],
      },
    };
  }
  const affectedReason = affected
    ? 'translation, timeline, or source-provenance classification is unresolved for this target'
    : 'structural checks did not find a target-specific hold; semantic, rights, and media checks remain open';
  return {
    researchDiscovery: {
      decision: 'ALLOW_CONDITIONALLY',
      condition: 'source-supported locators only; preserve source hash and locator',
      reason: affectedReason,
    },
    sourceSupportedLocators: {
      decision: 'ALLOW_CONDITIONALLY',
      condition: 'use only explicitly classified source-supported locators',
    },
    subtitles: {
      decision: affected || !hasTranscript ? 'BLOCK' : 'ALLOW_CONDITIONALLY',
      reason: affected || !hasTranscript ? 'C content gate is open for this target' : 'no target-specific structural hold; human/localization QA still required',
    },
    alignment: {
      decision: affected || !hasTranscript ? 'BLOCK' : 'ALLOW_CONDITIONALLY',
      reason: affected || !hasTranscript ? 'trusted media/source alignment is not established' : 'no target-specific structural hold; media alignment remains unverified',
    },
    release: {
      decision: affected || !hasTranscript ? 'BLOCK' : 'ALLOW_CONDITIONALLY',
      reason: affected || !hasTranscript ? 'promotion cannot consume unresolved C findings' : 'rights, fact, human QA, and release approvals remain unknown',
    },
    factVerification: {
      decision: 'UNKNOWN',
      reason: 'no independent external fact verification was performed',
    },
    rights: {
      decision: 'UNKNOWN',
      reason: 'rights, license, consent, ownership, and reuse policy were not inspected',
    },
    mediaProvenance: {
      decision: 'UNKNOWN',
      reason: 'no trusted media/audio provenance was supplied to this local gate',
    },
    semanticTruth: 'UNKNOWN',
    repair: {
      decision: 'NO_REPAIR_PROPOSED',
      actions: [],
    },
  };
}

function classifyTarget(root, target, config) {
  const result = {
    id: target.id,
    rawId: target.rawId,
    videoId: target.videoId,
    lockedInputs: {
      transcript: {
        path: target.transcriptPath,
        expectedSha256: target.transcriptSha256,
      },
      topVideos: {
        path: target.topVideosPath,
        expectedSha256: target.topVideosSha256,
      },
      comparisonSource: target.comparisonSource
        ? {
          id: target.comparisonSource.id,
          path: target.comparisonSource.transcriptPath,
          expectedSha256: target.comparisonSource.sha256,
          readPolicy: target.comparisonSource.readPolicy,
        }
        : null,
    },
    errors: [],
    holds: [],
    unknowns: [],
    sourceIntegrity: {
      status: 'NOT_EVALUATED',
      identity: null,
      transcript: null,
      topVideo: null,
      comparisonSource: null,
      overlapEvidence: null,
    },
    timeReconciliation: null,
    translationDiagnostics: null,
    reviewAnchors: [],
    usageSafety: null,
    repairDecision: {
      decision: 'NO_REPAIR_PROPOSED',
      actions: [],
      reason: 'A16-C1 is classification-only and has no media provenance for repair.',
    },
  };
  let transcriptData;
  let topVideoData;
  try {
    const top = hashAndReadJson(root, target.topVideosPath, target.topVideosSha256, `${target.id} top-videos`);
    topVideoData = top;
    const topVideo = findTopVideo(top.parsed, target, `${target.id} top-videos`);
    result.sourceIntegrity.topVideo = {
      path: target.topVideosPath,
      sha256: top.actualHash,
      bytes: top.bytes,
      rawId: top.parsed.rawId || null,
      videoId: topVideo.videoId || null,
      hasTranscript: Boolean(topVideo.hasTranscript),
      duration: topVideo.duration || null,
    };
    if (!target.transcriptPath) {
      if (topVideo.hasTranscript !== false) {
        throw fail(`${target.id} has no transcript path but top row is not hasTranscript:false`, 'IDENTITY_MISMATCH');
      }
      result.sourceIntegrity.transcript = {
        status: 'NOT_PRESENT',
        noSpeechVerified: false,
        classification: 'UNKNOWN_NO_SPEECH',
      };
      result.unknowns.push({ code: 'NO_TRANSCRIPT_NO_SPEECH_UNKNOWN', locator: { targetId: target.id }, message: 'hasTranscript:false is preserved as UNKNOWN; no speech was not inferred.' });
      result.usageSafety = usageSafety({ affected: true, hasTranscript: false });
      result.sourceIntegrity.status = 'CLASSIFIED_WITH_UNKNOWN';
      return result;
    }
    const transcript = hashAndReadJson(root, target.transcriptPath, target.transcriptSha256, `${target.id} transcript`);
    transcriptData = transcript;
    const transcriptShape = asObject(transcript.parsed, `${target.id} transcript`);
    const segmentInfo = validateSegments(transcriptShape, target, `${target.id} transcript`);
    const identityErrors = identityDiagnostics(transcriptShape, top.parsed, topVideo, target, segmentInfo);
    result.sourceIntegrity.transcript = {
      path: target.transcriptPath,
      sha256: transcript.actualHash,
      bytes: transcript.bytes,
      videoId: transcriptShape.videoId || null,
      language: transcriptShape.language || null,
      targetLanguage: transcriptShape.targetLanguage || null,
      segmentCount: segmentInfo.segments.length,
      declaredSegmentCount: transcriptShape.segmentCount == null ? null : transcriptShape.segmentCount,
      endpointSeconds: segmentInfo.endpoint,
    };
    result.sourceIntegrity.identity = {
      targetId: target.id,
      rawId: target.rawId,
      videoId: target.videoId,
      checks: identityErrors.length ? 'FAIL' : 'PASS',
      errors: identityErrors,
    };
    if (identityErrors.length) {
      result.errors.push(...identityErrors);
    }
    result.timeReconciliation = timeReconciliation(transcriptShape, topVideo, segmentInfo, config.thresholds);
    result.translationDiagnostics = translationDiagnostics(transcriptShape, target);
    result.reviewAnchors = anchorDiagnostics(transcriptShape, target.reviewAnchors, target.id);
    if (result.timeReconciliation.flags.length) {
      result.holds.push({
        code: 'TIME_RECONCILIATION_UNCLASSIFIED',
        severity: 'high',
        locator: { targetId: target.id, transcriptPath: target.transcriptPath },
        flags: result.timeReconciliation.flags,
        message: 'Timeline mismatch is a metadata-versus-transcript flag only; trusted source/audio is required.',
        doesNotProve: ['audio_fault', 'transcript_wrong', 'metadata_wrong'],
      });
      result.unknowns.push({
        code: 'TIME_RECONCILIATION_REQUIRES_TRUSTED_SOURCE_AUDIO',
        locator: { targetId: target.id, transcriptPath: target.transcriptPath },
        message: 'The endpoint classification remains unknown until trusted duration or audio provenance is supplied.',
      });
    }
    if (result.translationDiagnostics.hold) {
      result.holds.push({
        code: result.translationDiagnostics.holdCode,
        severity: 'high',
        locator: { targetId: target.id, transcriptPath: target.transcriptPath },
        message: 'Target-language script/equality diagnostic requires translation review; semantic truth was not inferred.',
        doesNotProve: ['all_equal_text_is_wrong', 'source_audio_identity', 'fact_truth'],
      });
      result.unknowns.push({
        code: 'TRANSLATION_SEMANTIC_STATUS_UNKNOWN',
        locator: { targetId: target.id, transcriptPath: target.transcriptPath },
        message: 'Script/equality diagnostics do not establish semantic translation quality.',
      });
    }
    for (const anchor of result.reviewAnchors) {
      result.holds.push({
        code: 'HUMAN_VERIFIED_ANCHOR_REVIEW_REQUIRED',
        severity: 'high',
        locator: { targetId: target.id, segmentIndexes: anchor.segmentIndexes },
        message: anchor.observedSignal,
        provenance: anchor.provenance,
      });
    }
    if (target.comparisonSource) {
      const comparison = hashAndReadJson(root, target.comparisonSource.transcriptPath, target.comparisonSource.sha256, `${target.id} comparison source`);
      const comparisonShape = asObject(comparison.parsed, `${target.id} comparison source`);
      const comparisonInfo = validateSegments(comparisonShape, target, `${target.id} comparison source`);
      const comparisonErrors = [];
      comparePrimitive(comparisonShape.videoId, target.comparisonSource.videoId, `${target.id}.comparisonSource.videoId`, comparisonErrors);
      if (target.comparisonSource.rawId != null) comparePrimitive(comparisonShape.rawId, target.comparisonSource.rawId, `${target.id}.comparisonSource.rawId`, comparisonErrors);
      result.sourceIntegrity.comparisonSource = {
        id: target.comparisonSource.id,
        path: target.comparisonSource.transcriptPath,
        sha256: comparison.actualHash,
        bytes: comparison.bytes,
        videoId: comparisonShape.videoId || null,
        segmentCount: comparisonInfo.segments.length,
        readPolicy: target.comparisonSource.readPolicy,
        semanticRead: false,
        semanticInference: 'NOT_PERFORMED',
        identityChecks: comparisonErrors.length ? 'FAIL' : 'PASS',
        identityErrors: comparisonErrors,
      };
      if (comparisonErrors.length) result.errors.push(...comparisonErrors);
      const overlap = textOverlapEvidence(segmentInfo.segments, comparisonInfo.segments, target.comparisonSource, config.overlap);
      result.sourceIntegrity.overlapEvidence = overlap;
      if (overlap.status === 'SUSPECTED_MIXED_SOURCE') {
        result.sourceIntegrity.status = 'SUSPECTED_MIXED_SOURCE_UNKNOWN';
        result.holds.push({
          code: 'SOURCE_PROVENANCE_UNRESOLVED',
          severity: 'high',
          locator: overlap.strongLocator,
          message: 'Strong structural overlap is reported as a locator, not as proof that all target content came from the comparison source.',
          classification: 'SUSPECTED_MIXED_SOURCE',
          conclusion: 'UNKNOWN_PENDING_MEDIA_PROVENANCE',
          repairOffered: false,
        });
        result.unknowns.push({
          code: 'SUSPECTED_MIXED_SOURCE_REMAINS_UNKNOWN',
          locator: overlap.strongLocator,
          classification: 'SUSPECTED_MIXED_SOURCE',
          conclusion: 'UNKNOWN_PENDING_MEDIA_PROVENANCE',
          message: 'Structural overlap is a strong locator, not a confirmation of source composition.',
        });
      } else if (overlap.status === 'ANALYSIS_LIMIT_REACHED') {
        result.unknowns.push({ code: 'OVERLAP_ANALYSIS_LIMIT', message: 'Overlap was bounded before semantic interpretation.', locator: { targetId: target.id } });
      }
    }
    if (result.sourceIntegrity.status === 'NOT_EVALUATED') {
      result.sourceIntegrity.status = result.errors.length
        ? 'TOOL_FAILURE'
        : result.holds.length
          ? 'TARGET_HOLD'
          : result.unknowns.length
            ? 'CLASSIFIED_WITH_UNKNOWN'
            : 'STRUCTURALLY_CHECKED';
    }
    const affected = result.errors.length > 0 || result.holds.length > 0 || result.unknowns.length > 0;
    result.usageSafety = usageSafety({ affected, hasTranscript: true, toolFailure: result.errors.length > 0 });
    if (!affected) result.sourceIntegrity.status = 'STRUCTURALLY_CHECKED_NO_TARGET_HOLD';
    return result;
  } catch (error) {
    result.errors.push({
      code: error.code || 'TOOL_FAILURE',
      severity: 'error',
      message: error.message,
      ...(error.details || {}),
    });
    result.sourceIntegrity.status = 'TOOL_FAILURE';
    result.usageSafety = usageSafety({ affected: true, hasTranscript: Boolean(transcriptData), toolFailure: true });
    return result;
  }
}

function toolFailureSafety() {
  return {
    researchDiscovery: 'BLOCKED_BY_TOOL_FAILURE',
    sourceSupportedLocators: 'BLOCKED_BY_TOOL_FAILURE',
    subtitles: 'BLOCKED_BY_TOOL_FAILURE',
    alignment: 'BLOCKED_BY_TOOL_FAILURE',
    release: 'BLOCKED_BY_TOOL_FAILURE',
    factVerification: 'UNKNOWN',
    rights: 'UNKNOWN',
    mediaProvenance: 'UNKNOWN',
    repair: 'NO_REPAIR_PROPOSED',
    conditions: [
      'all source use is blocked until the tool/input failure is resolved',
      'do not consume partial target results as validated locators',
      'a deterministic successful gate run is required before repair or alignment',
    ],
  };
}

function makeToolFailureReport({ root, configPath, runManifestPath, asOf, errors, configHash = null, runManifestHash = null }) {
  return {
    schema: SCHEMA,
    toolVersion: TOOL_VERSION,
    gate: {
      id: 'A16-C1',
      implementationStatus: 'QUALITY_GATE_IMPLEMENTED',
      contentStatus: 'C_CONTENT_OPEN',
      mode: 'READ_ONLY_DRYRUN',
    },
    run: {
      runId: null,
      asOf: asOf || null,
      projectRoot: path.resolve(root),
      configPath: configPath || null,
      configSha256: configHash,
      runManifestPath: runManifestPath || null,
      runManifestSha256: runManifestHash,
    },
    result: {
      status: 'TOOL_FAILURE',
      exitCode: EXIT_CODES.TOOL_FAILURE,
      targetCount: 0,
      affectedTargetCount: 0,
      holdCount: 0,
      errorCount: errors.length,
      unknownCount: 0,
    },
    errors,
    holds: [],
    targets: [],
    safety: toolFailureSafety(),
  };
}

function runGate(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const configPath = options.configPath ? path.resolve(options.configPath) : path.resolve(root, 'scripts/repair/content-integrity-config.json');
  const runManifestPath = options.runManifestPath ? path.resolve(options.runManifestPath) : null;
  let configHash = null;
  let runManifestHash = null;
  let asOf = null;
  try {
    const configFile = fs.readFileSync(configPath);
    configHash = sha256(configFile);
    const config = normalizeConfig(readJson(configPath, 'config').value);
    if (options.asOf != null) asOf = parseIsoAsOf(options.asOf);
    let manifest = null;
    if (runManifestPath) {
      const manifestFile = fs.readFileSync(runManifestPath);
      runManifestHash = sha256(manifestFile);
      manifest = validateRunManifest(readJson(runManifestPath, 'run manifest').value, config, configHash);
      if (asOf && asOf !== manifest.asOf) {
        throw fail('CLI asOf differs from locked run manifest asOf', 'ASOF_MISMATCH', { cliAsOf: asOf, manifestAsOf: manifest.asOf });
      }
      asOf = manifest.asOf;
    }
    if (!asOf) throw fail('An explicit --asof value or runManifest.asOf is required for deterministic dry-run', 'INVALID_ASOF');
    const runId = manifest ? manifest.runId : (options.runId || `${config.gateId}-DRYRUN`);
    const targets = config.targets.map(target => classifyTarget(root, target, config));
    const errors = [];
    const holds = [];
    const unknowns = [];
    for (const target of targets) {
      for (const error of target.errors) errors.push({ targetId: target.id, ...error });
      for (const hold of target.holds) holds.push({ targetId: target.id, ...hold });
      for (const unknown of target.unknowns) unknowns.push({ targetId: target.id, ...unknown });
    }
    const hasToolFailure = errors.length > 0;
    const status = hasToolFailure ? 'TOOL_FAILURE' : holds.length || unknowns.length ? 'GATE_HOLD' : 'STRUCTURAL_CHECK_PASS_NO_SEMANTIC_APPROVAL';
    const exitCode = hasToolFailure ? EXIT_CODES.TOOL_FAILURE : (holds.length || unknowns.length ? EXIT_CODES.GATE_HOLD : EXIT_CODES.OK);
    const affectedTargetIds = new Set([...errors, ...holds, ...unknowns]
      .map(item => item.targetId)
      .filter(Boolean));
    const safety = hasToolFailure
      ? toolFailureSafety()
      : {
        researchDiscovery: 'ALLOW_CONDITIONALLY',
        sourceSupportedLocators: 'ALLOW_CONDITIONALLY',
        subtitles: affectedTargetIds.size ? 'BLOCK_AFFECTED_TARGETS' : 'ALLOW_CONDITIONALLY',
        alignment: affectedTargetIds.size ? 'BLOCK_AFFECTED_TARGETS' : 'ALLOW_CONDITIONALLY',
        release: affectedTargetIds.size ? 'BLOCK_AFFECTED_TARGETS' : 'ALLOW_CONDITIONALLY',
        factVerification: 'UNKNOWN',
        rights: 'UNKNOWN',
        mediaProvenance: 'UNKNOWN',
        repair: 'NO_REPAIR_PROPOSED',
        conditions: [
          'research may consume only source-supported locators from this report',
          'do not treat structural equality or overlap as semantic truth',
          'a trusted source/audio provenance record is required before repair or alignment',
        ],
      };
    return {
      schema: SCHEMA,
      toolVersion: TOOL_VERSION,
      gate: {
        id: config.gateId,
        implementationStatus: 'QUALITY_GATE_IMPLEMENTED',
        contentStatus: 'C_CONTENT_OPEN',
        mode: 'READ_ONLY_DRYRUN',
        purpose: config.purpose,
        forbiddenActions: ['TRANSCRIPT_REWRITE', 'TIMESTAMP_RESCALE', 'SEGMENT_TRUNCATE', 'SEGMENT_REMAP', 'BULK_RETRANSLATION', 'MEDIA_DOWNLOAD', 'PUBLIC_RELEASE'],
      },
      run: {
        runId,
        asOf,
        projectRoot: root,
        configPath,
        configSha256: configHash,
        runManifestPath,
        runManifestSha256: runManifestHash,
        targetLock: config.targets.map(targetProjection),
      },
      result: {
        status,
        exitCode,
        targetCount: targets.length,
        affectedTargetCount: affectedTargetIds.size,
        holdCount: holds.length,
        errorCount: errors.length,
        unknownCount: unknowns.length,
        semanticTruth: 'UNKNOWN',
        independentlyFactVerified: false,
        rightsVerified: false,
        repairCompleted: false,
      },
      errors,
      holds,
      unknowns,
      safety,
      targets,
    };
  } catch (error) {
    const report = makeToolFailureReport({
      root,
      configPath,
      runManifestPath,
      asOf,
      configHash,
      runManifestHash,
      errors: [{
        code: error.code || 'TOOL_FAILURE',
        severity: 'error',
        message: error.message,
        ...(error.details || {}),
      }],
    });
    return report;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token.startsWith('--')) {
      const key = token.slice(2);
      if (!key) throw fail('Empty CLI option', 'USAGE_ERROR');
      const next = argv[index + 1];
      if (next == null || next.startsWith('--')) throw fail(`Missing value for --${key}`, 'USAGE_ERROR');
      args[key] = next;
      index += 1;
    } else {
      throw fail(`Unexpected argument: ${token}`, 'USAGE_ERROR');
    }
  }
  return args;
}

function usage() {
  return [
    'A16-C1 read-only content-integrity gate',
    '',
    'Usage:',
    '  node scripts/repair/content-integrity-gate.cjs --config <path> --asof <ISO> [options]',
    '',
    'Options:',
    '  --root <dir>              Project/fixture root (default: cwd)',
    '  --config <path>           Config with exact target IDs and SHA-256 locks',
    '  --run-manifest <path>     Optional exact run lock; its target list must match config',
    '  --asof <ISO>              Deterministic as-of timestamp (required without manifest)',
    '  --run-id <id>              Run id when no run manifest is supplied',
    '  --output <path>           Write one report; existing files are never overwritten',
    '  --pretty                  Pretty JSON (default)',
    '  --help                    Show this help',
  ].join('\n');
}

function writeOutputOnce(filePath, content) {
  const absolute = path.resolve(filePath);
  if (fs.existsSync(absolute)) throw fail(`Refusing to overwrite existing output: ${absolute}`, 'OUTPUT_EXISTS');
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, { encoding: 'utf8', flag: 'wx' });
  return absolute;
}

function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    const report = makeToolFailureReport({ root: process.cwd(), configPath: null, runManifestPath: null, asOf: null, errors: [{ code: error.code || 'USAGE_ERROR', severity: 'error', message: error.message }] });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return error.code === 'USAGE_ERROR' ? EXIT_CODES.USAGE_ERROR : EXIT_CODES.TOOL_FAILURE;
  }
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return EXIT_CODES.OK;
  }
  let report;
  try {
    report = runGate({
      root: args.root,
      configPath: args.config,
      runManifestPath: args['run-manifest'],
      asOf: args.asof,
      runId: args['run-id'],
    });
  } catch (error) {
    report = makeToolFailureReport({ root: args.root || process.cwd(), configPath: args.config || null, runManifestPath: args['run-manifest'] || null, asOf: args.asof || null, errors: [{ code: error.code || 'TOOL_FAILURE', severity: 'error', message: error.message }] });
  }
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) {
    try {
      const outputPath = writeOutputOnce(args.output, text);
      report.outputPath = outputPath;
      // The outputPath is deliberately not written back into the report file;
      // this keeps the file deterministic and avoids a self-referential write.
    } catch (error) {
      report = makeToolFailureReport({ root: args.root || process.cwd(), configPath: args.config || null, runManifestPath: args['run-manifest'] || null, asOf: args.asof || null, errors: [{ code: error.code || 'OUTPUT_WRITE_ERROR', severity: 'error', message: error.message }] });
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return EXIT_CODES.TOOL_FAILURE;
    }
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.result && Number.isInteger(report.result.exitCode) ? report.result.exitCode : EXIT_CODES.TOOL_FAILURE;
}

if (require.main === module) process.exitCode = main();

module.exports = {
  EXIT_CODES,
  SCHEMA,
  CONFIG_SCHEMA,
  RUN_MANIFEST_SCHEMA,
  normalizeConfig,
  runGate,
  parseIsoDuration,
  normalizeText,
  isCueOnly,
  textOverlapEvidence,
};
