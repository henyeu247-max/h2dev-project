#!/usr/bin/env node
'use strict';

// A16-C2 is intentionally a one-file, three-pointer patch. It validates the
// reviewed byte image and writes replacements into the JSON text; it never
// reserializes the transcript or scans media.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 'h2dev.a16-c2.targeted-translation-repair.v1';
const PLAN_SCHEMA = 'h2dev.a16-c2.targeted-translation-plan.v1';
const RECEIPT_SCHEMA = 'h2dev.a16-c2.targeted-translation-receipt.v1';
const ROLLBACK_SCHEMA = 'h2dev.a16-c2.targeted-translation-rollback-receipt.v1';
const DEFAULT_AUDIT_DIR = '_audit/20260911-campaign-wave4/A16-C2';
const TARGET = Object.freeze({
  repairId: 'A16-C2',
  transcriptPath: 'data/raw-channels-deep/RAW-016_Slow_Living_Agriculture_2/transcripts/5ENYu79XFcI_transcript.json',
  expectedBeforeSha256: 'd10fb384ed22257323791affdf36256773e239a8315b33aad52c50724d8d98fb',
  videoId: '5ENYu79XFcI',
  segmentIndexes: Object.freeze([1520, 1521]),
  sourceAnchors: Object.freeze([
    'Seabbuckthornne is diocious, meaning you absolutely must have one male plant and one female',
    'plant to get any fruit.',
  ]),
  oldViText: Object.freeze([
    'Seabbuckthornne rất độc hại, nghĩa là bạn nhất định phải có một cây đực và một cây cái',
    'trồng để lấy quả.',
  ]),
  newViText: Object.freeze([
    'Seabbuckthornne có cây đực và cây cái riêng biệt, nghĩa là bạn nhất định phải có một cây đực và một cây cái',
    'để cây có thể ra quả.',
  ]),
  evidence: Object.freeze([
    'https://www.kew.org/read-and-watch/plant-undateables-loneliest-plants-in-world',
    'https://growwild.kew.org/plants/red-campion',
  ]),
});

class RepairError extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}
function fail(code, message, details = {}) { throw new RepairError(code, message, details); }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function count(text, needle) {
  let n = 0, at = 0;
  while (needle) {
    at = text.indexOf(needle, at);
    if (at < 0) break;
    n += 1; at += needle.length;
  }
  return n;
}
function relative(value, label) {
  if (typeof value !== 'string' || !value.trim() || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)) fail('INVALID_PATH', `${label} must be relative`);
  const normalized = value.replace(/\\/g, '/');
  if (normalized.split('/').includes('..')) fail('PATH_OUTSIDE_ROOT', `${label} contains ..`, { path: value });
  return normalized;
}
function inside(root, rel, label) {
  const base = path.resolve(root), absolute = path.resolve(base, rel), escaped = path.relative(base, absolute);
  if (escaped === '..' || escaped.startsWith(`..${path.sep}`) || path.isAbsolute(escaped)) fail('PATH_OUTSIDE_ROOT', `${label} escapes root`, { path: rel });
  return absolute;
}
function audit(rel, label) {
  const normalized = relative(rel, label);
  if (normalized !== '_audit' && !normalized.startsWith('_audit/')) fail('AUDIT_PATH_REQUIRED', `${label} must stay under _audit/`, { path: normalized });
  return normalized;
}
function artifacts(auditDir = DEFAULT_AUDIT_DIR) {
  const dir = audit(auditDir, 'auditDir');
  return {
    auditDir: dir,
    planPath: `${dir}/A16-C2-PLAN.json`,
    applyReceiptPath: `${dir}/A16-C2-APPLY-RECEIPT.json`,
    rollbackReceiptPath: `${dir}/A16-C2-ROLLBACK-RECEIPT.json`,
    backupPath: `${dir}/backup/5ENYu79XFcI_transcript.before.json`,
  };
}
function jsonFile(file, label) {
  let bytes;
  try { bytes = fs.readFileSync(file); } catch (error) { fail('INPUT_READ_ERROR', `Cannot read ${label}: ${error.message}`, { path: file }); }
  try { return { bytes, value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/u, '')) }; }
  catch (error) { fail('INVALID_JSON', `Invalid JSON in ${label}: ${error.message}`, { path: file }); }
}
function spec(raw = TARGET) {
  const value = { ...raw, transcriptPath: relative(raw.transcriptPath, 'transcriptPath') };
  if (typeof value.videoId !== 'string' || !value.videoId || !/^[a-f0-9]{64}$/iu.test(value.expectedBeforeSha256 || '')) fail('INVALID_SPEC', 'videoId and expectedBeforeSha256 are required');
  for (const key of ['segmentIndexes', 'sourceAnchors', 'oldViText', 'newViText']) {
    if (!Array.isArray(value[key]) || value[key].length !== 2) fail('INVALID_SPEC', `${key} must contain two items`);
  }
  if (value.segmentIndexes.some((index) => !Number.isInteger(index) || index < 0)) fail('INVALID_SPEC', 'segmentIndexes must be non-negative integers');
  return value;
}
function segment(document, index) {
  if (!Array.isArray(document.segments) || !document.segments[index] || typeof document.segments[index] !== 'object') fail('STRUCTURE_MISMATCH', `segments[${index}] is missing`);
  return document.segments[index];
}
function inspect(root, rawSpec = TARGET) {
  const target = spec(rawSpec), file = inside(root, target.transcriptPath, 'transcriptPath'), read = jsonFile(file, 'transcript');
  const beforeSha256 = sha256(read.bytes);
  if (beforeSha256 !== target.expectedBeforeSha256.toLowerCase()) fail('INPUT_DRIFT', 'Transcript is not the reviewed before-image', { expected: target.expectedBeforeSha256.toLowerCase(), actual: beforeSha256 });
  if (read.value.videoId !== target.videoId || read.value.targetLanguage !== 'vi') fail('IDENTITY_MISMATCH', 'Transcript identity differs from reviewed target');
  const [a, b] = target.segmentIndexes, first = segment(read.value, a), second = segment(read.value, b);
  if (first.text !== target.sourceAnchors[0] || second.text !== target.sourceAnchors[1]) fail('SOURCE_ANCHOR_MISMATCH', 'English source anchors differ', { expected: target.sourceAnchors, actual: [first.text, second.text] });
  if (first.viText !== target.oldViText[0] || second.viText !== target.oldViText[1]) {
    if (first.viText === target.newViText[0] && second.viText === target.newViText[1]) fail('ALREADY_APPLIED', 'The reviewed repair is already applied');
    fail('TARGET_ANCHOR_MISMATCH', 'Vietnamese segment anchors differ', { expected: target.oldViText, actual: [first.viText, second.viText] });
  }
  const sourceJoin = `${target.sourceAnchors[0]} ${target.sourceAnchors[1]}`;
  if (count(String(read.value.fullText || ''), sourceJoin) !== 1) fail('SOURCE_ANCHOR_MISMATCH', 'fullText source join is not unique');
  const oldJoin = `${target.oldViText[0]} ${target.oldViText[1]}`, newJoin = `${target.newViText[0]} ${target.newViText[1]}`;
  if (count(String(read.value.fullTextVi || ''), oldJoin) !== 1) fail('FULLTEXT_ANCHOR_MISMATCH', 'fullTextVi old join is not unique');
  if (count(String(read.value.fullTextVi || ''), newJoin) !== 0) fail('ALREADY_APPLIED', 'fullTextVi repair is already present');
  return { target, file, bytes: read.bytes, value: read.value, beforeSha256 };
}
function replacement(pointer, before, after) {
  const fullText = pointer === '/fullTextVi', encode = value => JSON.stringify(value);
  return { pointer, before, after, needle: fullText ? encode(before).slice(1, -1) : encode(before), replacement: fullText ? encode(after).slice(1, -1) : encode(after) };
}
function patchBytes(bytes, replacements) {
  let text = bytes.toString('utf8');
  for (const item of replacements) {
    const occurrences = count(text, item.needle);
    if (occurrences !== 1) fail('BYTE_ANCHOR_MISMATCH', `Expected one byte anchor for ${item.pointer}`, { pointer: item.pointer, occurrences });
    text = text.replace(item.needle, item.replacement);
  }
  return Buffer.from(text, 'utf8');
}
function expectedDocument(before, replacements) {
  const after = JSON.parse(JSON.stringify(before));
  for (const item of replacements) {
    const match = /^\/segments\/(\d+)\/viText$/u.exec(item.pointer);
    if (match) segment(after, Number(match[1])).viText = item.after;
    else if (item.pointer === '/fullTextVi') after.fullTextVi = after.fullTextVi.replace(item.before, item.after);
    else fail('INVALID_POINTER', `Unsupported pointer ${item.pointer}`);
  }
  return after;
}
function assertOnlyReviewedFields(before, after, replacements) {
  if (JSON.stringify(expectedDocument(before, replacements)) !== JSON.stringify(after)) fail('UNEXPECTED_CONTENT_DIFF', 'Patch changed a field outside the reviewed pointers');
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function buildPlan(options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..')), checked = inspect(root, options.targetSpec || TARGET), target = checked.target;
  const [a, b] = target.segmentIndexes;
  const pointers = [
    replacement(`/segments/${a}/viText`, target.oldViText[0], target.newViText[0]),
    replacement(`/segments/${b}/viText`, target.oldViText[1], target.newViText[1]),
    replacement('/fullTextVi', `${target.oldViText[0]} ${target.oldViText[1]}`, `${target.newViText[0]} ${target.newViText[1]}`),
  ];
  const afterBytes = patchBytes(checked.bytes, pointers), after = JSON.parse(afterBytes.toString('utf8'));
  assertOnlyReviewedFields(checked.value, after, pointers);
  const plan = {
    schema: PLAN_SCHEMA, repairId: target.repairId || 'A16-C2', asOf: options.asOf || null,
    transcriptPath: target.transcriptPath, videoId: target.videoId,
    before: { sha256: checked.beforeSha256, bytes: checked.bytes.length },
    after: { sha256: sha256(afterBytes), bytes: afterBytes.length },
    pointers: pointers.map((item) => ({ pointer: item.pointer, before: item.before, after: item.after })),
    sourceAnchors: target.sourceAnchors.slice(),
    preserved: { englishSource: true, timestamps: true, title: true, segmentCount: true, otherSegments: true, asrPlantName: 'Seabbuckthornne' },
    evidence: { references: (target.evidence || TARGET.evidence).slice(), status: 'REFERENCE_SUPPLIED; NO_INDEPENDENT_FACT_OR_RIGHTS_VERIFICATION_PERFORMED' },
    artifacts: artifacts(options.auditDir || DEFAULT_AUDIT_DIR),
  };
  plan.planId = sha256(Buffer.from(stable(plan), 'utf8')).slice(0, 32);
  return { plan, beforeBytes: checked.bytes, afterBytes, beforeDocument: checked.value, file: checked.file };
}
function writeAudit(root, rel, value) {
  const file = inside(root, audit(rel, 'audit artifact'), 'audit artifact');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.writeFileSync(file, bytes);
  return { path: rel, sha256: sha256(bytes), bytes: bytes.length };
}
function readPlan(root, rel) {
  const value = jsonFile(inside(root, audit(rel, 'plan path'), 'plan path'), 'repair plan').value;
  if (!value || value.schema !== PLAN_SCHEMA || !Array.isArray(value.pointers) || value.pointers.length !== 3) fail('INVALID_PLAN', 'A16-C2 plan must contain exactly three pointers');
  if (value.pointers[2].pointer !== '/fullTextVi') fail('INVALID_PLAN', 'Third pointer must be /fullTextVi');
  return value;
}
function targetSpecFromPlan(plan) {
  const indexes = plan.pointers.slice(0, 2).map((item) => {
    const match = /^\/segments\/(\d+)\/viText$/u.exec(item.pointer);
    if (!match) fail('INVALID_PLAN', 'Segment pointers are invalid');
    return Number(match[1]);
  });
  return { repairId: plan.repairId, transcriptPath: plan.transcriptPath, expectedBeforeSha256: plan.before.sha256, videoId: plan.videoId, segmentIndexes: indexes, sourceAnchors: plan.sourceAnchors, oldViText: plan.pointers.slice(0, 2).map((item) => item.before), newViText: plan.pointers.slice(0, 2).map((item) => item.after) };
}
function backup(root, plan, bytes) {
  const rel = audit(plan.artifacts.backupPath, 'backup path'), file = inside(root, rel, 'backup path');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && !fs.readFileSync(file).equals(bytes)) fail('BACKUP_CONFLICT', 'Existing backup differs from before-image', { path: rel });
  if (!fs.existsSync(file)) fs.writeFileSync(file, bytes, { flag: 'wx' });
  const saved = fs.readFileSync(file);
  if (sha256(saved) !== plan.before.sha256 || saved.length !== plan.before.bytes) fail('BACKUP_VERIFY_FAILED', 'Before-image backup does not match plan');
  return { path: rel, sha256: sha256(saved), bytes: saved.length };
}
function applyPlan(plan, options = {}) {
  if (!options.approved) fail('APPROVAL_REQUIRED', 'A16-C2 apply requires explicit approval');
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..')), checked = inspect(root, targetSpecFromPlan(plan));
  const replacements = plan.pointers.map((item) => replacement(item.pointer, item.before, item.after)), afterBytes = patchBytes(checked.bytes, replacements);
  if (sha256(afterBytes) !== plan.after.sha256 || afterBytes.length !== plan.after.bytes) fail('PLAN_RESULT_MISMATCH', 'Recomputed after-image differs from plan');
  assertOnlyReviewedFields(checked.value, JSON.parse(afterBytes.toString('utf8')), replacements);
  const savedBackup = backup(root, plan, checked.bytes);
  fs.writeFileSync(checked.file, afterBytes);
  const final = fs.readFileSync(checked.file);
  if (sha256(final) !== plan.after.sha256 || final.length !== plan.after.bytes) fail('APPLY_VERIFY_FAILED', 'Applied bytes differ from plan');
  const receipt = { schema: RECEIPT_SCHEMA, repairId: plan.repairId, planId: plan.planId || null, status: 'APPLIED', approved: true, reviewer: options.reviewer || 'user-requested-current-fix', transcriptPath: plan.transcriptPath, before: plan.before, after: plan.after, backup: savedBackup, pointers: plan.pointers, sourceAnchors: plan.sourceAnchors, dependencyInvalidation: 'Previous A16-C1/T01/A6 hash-locked snapshots require a new reviewed snapshot; immutable historical manifests are not rewritten.', asOf: options.asOf || new Date().toISOString() };
  writeAudit(root, options.receiptPath || plan.artifacts.applyReceiptPath, receipt);
  return receipt;
}
function rollbackPlan(plan, options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..')), target = inside(root, relative(plan.transcriptPath, 'transcriptPath'), 'transcriptPath');
  const backupRel = audit(plan.artifacts.backupPath, 'backup path'), backupFile = inside(root, backupRel, 'backup path');
  if (!fs.existsSync(backupFile)) fail('BACKUP_MISSING', 'Before-image backup is missing');
  const before = fs.readFileSync(backupFile), current = fs.readFileSync(target);
  if (sha256(before) !== plan.before.sha256 || before.length !== plan.before.bytes) fail('BACKUP_VERIFY_FAILED', 'Before-image backup does not match plan');
  if (sha256(current) !== plan.after.sha256 || current.length !== plan.after.bytes) fail('TARGET_DRIFT', 'Rollback target is not the reviewed after-image');
  fs.writeFileSync(target, before);
  const restored = fs.readFileSync(target);
  if (sha256(restored) !== plan.before.sha256 || restored.length !== plan.before.bytes) fail('ROLLBACK_VERIFY_FAILED', 'Rollback result differs from before-image');
  const receipt = { schema: ROLLBACK_SCHEMA, repairId: plan.repairId, planId: plan.planId || null, status: 'ROLLED_BACK', transcriptPath: plan.transcriptPath, restored: plan.before, backup: { path: backupRel, sha256: sha256(before), bytes: before.length }, asOf: options.asOf || new Date().toISOString() };
  writeAudit(root, options.receiptPath || plan.artifacts.rollbackReceiptPath, receipt);
  return receipt;
}
function verifyPlan(plan, options = {}) {
  const root = path.resolve(options.root || path.resolve(__dirname, '..', '..')), bytes = fs.readFileSync(inside(root, relative(plan.transcriptPath, 'transcriptPath'), 'transcriptPath')), actual = { sha256: sha256(bytes), bytes: bytes.length };
  if (actual.sha256 === plan.before.sha256 && actual.bytes === plan.before.bytes) return { schema: RECEIPT_SCHEMA, status: 'BEFORE_IMAGE_VERIFIED', transcriptPath: plan.transcriptPath, actual };
  if (actual.sha256 === plan.after.sha256 && actual.bytes === plan.after.bytes) return { schema: RECEIPT_SCHEMA, status: 'AFTER_IMAGE_VERIFIED', transcriptPath: plan.transcriptPath, actual };
  fail('VERIFY_FAILED', 'Target is neither reviewed before nor after image', { actual });
}
function args(argv) {
  const out = { command: argv[0] || 'plan' };
  for (let i = 1; i < argv.length; i += 1) {
    const match = /^--([^=]+)(?:=(.*))?$/u.exec(argv[i]); if (!match) fail('CLI_USAGE', `Unexpected argument ${argv[i]}`);
    const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (match[2] !== undefined) out[key] = match[2]; else if (['root', 'output', 'plan', 'receipt', 'auditDir', 'asOf', 'reviewer'].includes(key)) out[key] = argv[++i]; else if (key === 'approved') out.approved = true; else fail('CLI_USAGE', `Unknown option --${match[1]}`);
  }
  return out;
}
function main(argv = process.argv.slice(2)) {
  try {
    const options = args(argv), root = path.resolve(options.root || path.resolve(__dirname, '..', '..'));
    if (options.command === 'plan') {
      const built = buildPlan({ root, auditDir: options.auditDir, asOf: options.asOf });
      const planPath = options.output || built.plan.artifacts.planPath; writeAudit(root, planPath, built.plan);
      console.log(JSON.stringify({ schema: SCHEMA, status: 'PLANNED', planPath, planId: built.plan.planId, pointers: built.plan.pointers }, null, 2)); return 0;
    }
    const plan = readPlan(root, options.plan);
    const result = options.command === 'apply' ? applyPlan(plan, { root, approved: options.approved, reviewer: options.reviewer, receiptPath: options.receipt, asOf: options.asOf }) : options.command === 'rollback' ? rollbackPlan(plan, { root, receiptPath: options.receipt, asOf: options.asOf }) : options.command === 'verify' ? verifyPlan(plan, { root }) : fail('CLI_USAGE', `Unknown command ${options.command}`);
    console.log(JSON.stringify({ schema: SCHEMA, ...result }, null, 2)); return 0;
  } catch (error) { console.error(JSON.stringify({ schema: SCHEMA, ok: false, code: error.code || 'ERROR', message: error.message, details: error.details || {} }, null, 2)); return 1; }
}
if (require.main === module) process.exitCode = main();
module.exports = { SCHEMA, PLAN_SCHEMA, RECEIPT_SCHEMA, ROLLBACK_SCHEMA, TARGET, RepairError, buildPlan, applyPlan, rollbackPlan, verifyPlan, writeAudit, readPlan, artifacts, sha256 };
