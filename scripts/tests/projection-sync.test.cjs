'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sync = require('../repair/projection-sync.cjs');
const { makeFixture } = require('./fixtures/projection-sync-fixture.cjs');

function jsonPath(root, relativePath) {
  return path.join(root, relativePath.split('/').join(path.sep));
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(jsonPath(root, relativePath), 'utf8'));
}

function writeJson(root, relativePath, value) {
  fs.writeFileSync(jsonPath(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function hashFile(root, relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(jsonPath(root, relativePath))).digest('hex');
}

function allFiles(root, prefix = '') {
  const absolute = path.join(root, prefix);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(prefix.replace(/\\/g, '/'), entry.name);
    if (entry.isDirectory()) return allFiles(root, rel);
    return [rel];
  }).sort();
}

function cleanup(root) {
  if (root && fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
}

function errorCode(error) {
  return error && error.code;
}

function expectError(fn, code, detailCode = null) {
  let error;
  try { fn(); } catch (caught) { error = caught; }
  assert(error, `expected ${code}, but no error was thrown`);
  assert.strictEqual(errorCode(error), code, `expected ${code}, got ${errorCode(error)}: ${error.message}`);
  if (detailCode) {
    const details = error.details || {};
    const errors = Array.isArray(details.errors) ? details.errors : [];
    assert(errors.some((item) => item.code === detailCode), `expected nested ${detailCode} in ${JSON.stringify(details)}`);
  }
  return error;
}

function makePlan() {
  const fixture = makeFixture();
  const result = sync.buildPlan({ root: fixture.root });
  return { fixture, result, plan: result.plan };
}

function planTargetPaths(plan) {
  return new Set(plan.targetFiles.map((file) => file.path));
}

function testGoodFixtureAndDeterminism() {
  const { fixture, result, plan } = makePlan();
  try {
    assert.strictEqual(result.plan.schema, sync.PLAN_SCHEMA);
    assert.strictEqual(plan.totals.topVideos, 3);
    assert.strictEqual(plan.totals.transcriptFiles, 2);
    assert.strictEqual(plan.totals.summaryFiles, 2);
    assert.strictEqual(plan.totals.unknownHasTranscriptFalseRows, 1);
    assert.deepStrictEqual({ ...plan.totals.referenceStyles.summary }, { folder_relative: 1, project_prefixed: 1 });
    assert.strictEqual(plan.targetFiles.length, 6, 'root + two top + two profile + metadata-full');
    assert(plan.targetFiles.every((file) => file.pointers.every((change) => own(change, 'before') && own(change, 'after'))));
    assert(plan.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256)));
    const second = sync.buildPlan({ root: fixture.root }).plan;
    assert.strictEqual(second.planId, plan.planId, 'plan must be idempotent without an as-of override');
    assert.deepStrictEqual(second.targetFiles, plan.targetFiles);
    expectError(() => sync.applyPlan(plan, { root: fixture.root }), 'APPROVAL_REQUIRED');
    return { name: 'good fixture + deterministic/idempotent plan', status: 'PASS', targets: plan.targetFiles.length };
  } finally { cleanup(fixture.root); }
}

function testMissingAndDuplicateIds() {
  let fixture = makeFixture();
  try {
    const manifest = readJson(fixture.root, 'data/raw-channels-deep/deep-channels-manifest.json');
    manifest.channels.shift();
    writeJson(fixture.root, 'data/raw-channels-deep/deep-channels-manifest.json', manifest);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'MISSING_ID');
  } finally { cleanup(fixture.root); }
  fixture = makeFixture();
  try {
    const manifest = readJson(fixture.root, 'data/raw-channels-deep/deep-channels-manifest.json');
    manifest.channels.push({ ...manifest.channels[0] });
    writeJson(fixture.root, 'data/raw-channels-deep/deep-channels-manifest.json', manifest);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'DUPLICATE_ID');
  } finally { cleanup(fixture.root); }
  return { name: 'missing/duplicate exact ids', status: 'PASS' };
}

function testMissingDuplicateAndUnexpectedReferences() {
  let fixture = makeFixture();
  try {
    const topPath = 'data/raw-channels-deep/RAW-001_One/top-videos.json';
    const top = readJson(fixture.root, topPath);
    top.videos[0].transcriptJsonRel = 'transcripts/VIDA_transcript.json';
    writeJson(fixture.root, topPath, top);
    fs.unlinkSync(jsonPath(fixture.root, 'data/raw-channels-deep/RAW-001_One/transcripts/VIDA_transcript.json'));
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'MISSING_REFERENCE');
  } finally { cleanup(fixture.root); }
  fixture = makeFixture();
  try {
    const topPath = 'data/raw-channels-deep/RAW-001_One/top-videos.json';
    const top = readJson(fixture.root, topPath);
    top.videos[1] = { ...top.videos[0], hasTranscript: true };
    writeJson(fixture.root, topPath, top);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'DUPLICATE_REFERENCE');
  } finally { cleanup(fixture.root); }
  fixture = makeFixture();
  try {
    const topPath = 'data/raw-channels-deep/RAW-001_One/top-videos.json';
    const top = readJson(fixture.root, topPath);
    top.videos[0].summaryViRel = '../outside.md';
    writeJson(fixture.root, topPath, top);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'UNEXPECTED_REFERENCE');
  } finally { cleanup(fixture.root); }
  return { name: 'missing/duplicate/unexpected references', status: 'PASS' };
}

function testMalformedPartialSources() {
  let fixture = makeFixture();
  try {
    const transcript = jsonPath(fixture.root, 'data/raw-channels-deep/RAW-001_One/transcripts/VIDA_transcript.json');
    fs.writeFileSync(transcript, '{not-json\n', 'utf8');
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'MALFORMED_JSON');
  } finally { cleanup(fixture.root); }
  fixture = makeFixture();
  try {
    const transcriptPath = 'data/raw-channels-deep/RAW-001_One/transcripts/VIDA_transcript.json';
    const transcript = readJson(fixture.root, transcriptPath);
    delete transcript.segments;
    writeJson(fixture.root, transcriptPath, transcript);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'PARTIAL_TRANSCRIPT');
  } finally { cleanup(fixture.root); }
  return { name: 'malformed/partial source files', status: 'PASS' };
}

function testDriftGuards() {
  let fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const transcriptPath = 'data/raw-channels-deep/RAW-001_One/transcripts/VIDA_transcript.json';
    const transcript = readJson(fixture.root, transcriptPath);
    transcript.fullText = 'changed source text';
    writeJson(fixture.root, transcriptPath, transcript);
    expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' }), 'SOURCE_DRIFT');
  } finally { cleanup(fixture.root); }
  fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const topPath = 'data/raw-channels-deep/RAW-001_One/top-videos.json';
    const top = readJson(fixture.root, topPath);
    top.transcriptsCount = 77;
    writeJson(fixture.root, topPath, top);
    expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' }), 'TARGET_DRIFT');
  } finally { cleanup(fixture.root); }
  return { name: 'source/target hash drift guards', status: 'PASS' };
}

function testPointerAndPathGuards() {
  expectError(() => sync.getPointer({}, '/__proto__/polluted'), 'PROTOTYPE_PATH_REJECTED');
  expectError(() => sync.assertAllowedTargetPointer('x.json', 'top_videos', '/videos/0/title'), 'POINTER_NOT_ALLOWED');
  const fixture = makeFixture();
  try {
    const rawPath = 'data-tabs/raw-kenh-mau.json';
    const raw = readJson(fixture.root, rawPath);
    raw.records[0].deepIntelligence.folderName = '../escape';
    writeJson(fixture.root, rawPath, raw);
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SCAN_FAILED', 'PATH_TRAVERSAL_REJECTED');
  } finally { cleanup(fixture.root); }
  return { name: 'pointer allowlist/prototype/path guards', status: 'PASS' };
}

function testReviewVerifyTamper() {
  const fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const tampered = JSON.parse(JSON.stringify(plan));
    tampered.targetFiles = [];
    expectError(() => sync.verifyPlan(tampered, { root: fixture.root }), 'PLAN_TAMPERED');
    return { name: 'review R4 verify rejects target-list tamper', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testReviewRollbackBinding() {
  const fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    const manifestPath = jsonPath(fixture.root, plan.artifacts.backupManifest);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const canonicalPath = jsonPath(fixture.root, 'data-tabs/raw-kenh-mau.json');
    const beforeCanonical = hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json');
    manifest.backupFiles[0].path = 'data-tabs/raw-kenh-mau.json';
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    expectError(() => sync.rollbackPlan(plan, { root: fixture.root }), 'BACKUP_TARGET_SET_MISMATCH');
    assert.strictEqual(hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json'), beforeCanonical, 'tampered rollback must never write canonical raw');
    assert(fs.existsSync(canonicalPath));
    return { name: 'review R3 rollback exact-target binding/source protection', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testReviewParentJunctionAndAuditConfinement() {
  let fixture = makeFixture();
  const outside = `${fixture.root}-outside`;
  try {
    fs.cpSync(path.join(fixture.root, 'data'), outside, { recursive: true });
    fs.rmSync(path.join(fixture.root, 'data'), { recursive: true, force: true });
    fs.symlinkSync(outside, path.join(fixture.root, 'data'), 'junction');
    const target = path.join(outside, 'raw-channels-deep', 'RAW-001_One', 'top-videos.json');
    const before = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    const error = expectError(() => sync.buildPlan({ root: fixture.root }), 'SYMLINK_REJECTED');
    assert(error.code === 'SYMLINK_REJECTED');
    assert.strictEqual(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'), before);
  } finally { cleanup(fixture.root, [outside]); }

  fixture = makeFixture();
  const nestedOutside = `${fixture.root}-nested-outside`;
  try {
    fs.cpSync(path.join(fixture.root, 'data/raw-channels-deep'), nestedOutside, { recursive: true });
    fs.rmSync(path.join(fixture.root, 'data/raw-channels-deep'), { recursive: true, force: true });
    fs.symlinkSync(nestedOutside, path.join(fixture.root, 'data/raw-channels-deep'), 'junction');
    expectError(() => sync.buildPlan({ root: fixture.root }), 'SYMLINK_REJECTED');
  } finally { cleanup(fixture.root, [nestedOutside]); }

  fixture = makeFixture();
  const auditOutside = `${fixture.root}-audit-outside`;
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    fs.mkdirSync(path.dirname(path.join(fixture.root, '_audit')), { recursive: true });
    fs.mkdirSync(auditOutside, { recursive: true });
    fs.symlinkSync(auditOutside, path.join(fixture.root, '_audit'), 'junction');
    expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' }), 'SYMLINK_REJECTED');
  } finally { cleanup(fixture.root, [auditOutside]); }
  return { name: 'review R1 parent junction/audit confinement', status: 'PASS' };
}

function testReviewArtifactBinding() {
  const fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const sentinel = jsonPath(fixture.root, 'scripts/owned.txt');
    fs.mkdirSync(path.dirname(sentinel), { recursive: true });
    fs.writeFileSync(sentinel, 'DO NOT OVERWRITE\n', 'utf8');
    const beforeTargets = Object.fromEntries(plan.targetFiles.map((file) => [file.path, hashFile(fixture.root, file.path)]));
    plan.artifacts = { ...plan.artifacts, backupManifest: 'scripts/owned.txt' };
    expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' }), 'ARTIFACT_CONTRACT_MISMATCH');
    assert.strictEqual(fs.readFileSync(sentinel, 'utf8'), 'DO NOT OVERWRITE\n');
    for (const [target, before] of Object.entries(beforeTargets)) assert.strictEqual(hashFile(fixture.root, target), before);
    const fresh = sync.buildPlan({ root: fixture.root }).plan;
    expectError(() => sync.applyPlan(fresh, { root: fixture.root, approved: true, reviewer: 'fixture-review', backupDir: 'review-backups' }), 'ARTIFACT_PATH_OVERRIDE_REJECTED');
    return { name: 'review R2 exact audit artifact binding/no override', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testReviewRecoveryOnRenameFailure() {
  const fixture = makeFixture();
  const originalRename = fs.renameSync;
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const auditPrefix = `${path.join(fixture.root, '_audit')}${path.sep}`;
    fs.renameSync = function injectedRename(source, destination) {
      const sourceText = String(source);
      const destinationText = String(destination);
      const dataTarget = !destinationText.startsWith(auditPrefix);
      if (dataTarget && (sourceText.includes(`.tmp-a16p-${plan.planId}`) || sourceText.includes(`.displaced-a16p-${plan.planId}`))) throw new Error('fixture injected install/restore rename failure');
      return originalRename.call(fs, source, destination);
    };
    const failed = expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' }), 'APPLY_FAILED');
    assert.strictEqual(failed.details.restored, true, 'recovery must only report restored after full structural/hash verification');
    assert(failed.details.recoveryManifest);
    assert(fs.existsSync(jsonPath(fixture.root, failed.details.recoveryManifest)));
    const scan = sync.buildPlan({ root: fixture.root });
    assert(scan.plan);
    return { name: 'review R5 rename failure/recovery residue quarantine', status: 'PASS' };
  } finally { fs.renameSync = originalRename; cleanup(fixture.root); }
}

function testReviewProcessRecoveryRollback() {
  const fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    const manifest = jsonPath(fixture.root, plan.artifacts.backupManifest);
    const preservedManifest = jsonPath(fixture.root, `${plan.artifacts.backupDir}/manifest.process-preserved.json`);
    fs.renameSync(manifest, preservedManifest);
    const rolledBack = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(rolledBack.recoveredProcessDeath, true);
    assert.strictEqual(rolledBack.status, 'ROLLED_BACK');
    return { name: 'review R5 process-death recovery rollback', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testReviewRecoveryManifestPreflight() {
  const mutations = [
    ['tempPath', (recovery, canonical) => { recovery.targetFiles[0].tempPath = canonical; }],
    ['displacedPath', (recovery, canonical) => { recovery.targetFiles[0].displacedPath = canonical; }],
    ['quarantine source', (recovery, canonical) => { recovery.quarantined[0].source = canonical; }],
    ['unknown recovery field', (recovery) => { recovery.unexpected = true; }],
    ['missing target entry', (recovery) => { recovery.targetFiles.pop(); }],
    ['duplicate target entry', (recovery) => { recovery.targetFiles[1] = { ...recovery.targetFiles[0] }; }],
    ['extra backup entry', (recovery) => { recovery.backupFiles.push({ ...recovery.backupFiles[0] }); }],
    ['unknown backup field', (recovery) => { recovery.backupFiles[0].unexpected = true; }],
  ];
  for (const [label, mutate] of mutations) {
    const fixture = makeFixture();
    try {
      const plan = sync.buildPlan({ root: fixture.root }).plan;
      sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
      fs.unlinkSync(jsonPath(fixture.root, plan.artifacts.backupManifest));
      const recoveryPath = jsonPath(fixture.root, plan.artifacts.recoveryManifest);
      const recovery = JSON.parse(fs.readFileSync(recoveryPath, 'utf8'));
      const canonicalPath = 'data-tabs/raw-kenh-mau.json';
      const canonicalBefore = hashFile(fixture.root, canonicalPath);
      mutate(recovery, canonicalPath);
      fs.writeFileSync(recoveryPath, `${JSON.stringify(recovery, null, 2)}\n`, 'utf8');
      expectError(() => sync.rollbackPlan(plan, { root: fixture.root }), 'INVALID_RECOVERY');
      assert.strictEqual(hashFile(fixture.root, canonicalPath), canonicalBefore, `${label} mutation changed canonical raw`);
      assert(fs.existsSync(jsonPath(fixture.root, canonicalPath)), `${label} mutation removed canonical raw`);
    } finally { cleanup(fixture.root); }
  }

  const fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    fs.unlinkSync(jsonPath(fixture.root, plan.artifacts.backupManifest));
    const rolledBack = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(rolledBack.status, 'ROLLED_BACK');
    assert.strictEqual(rolledBack.recoveredProcessDeath, true);
    return { name: 'review R7 recovery manifest preflight/no-mutation and valid process recovery', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function prepareCrashRecoveryFixture(mode) {
  assert(['before-first-write', 'after-displace', 'after-install'].includes(mode), `unsupported crash mode ${mode}`);
  const fixture = makeFixture();
  const plan = sync.buildPlan({ root: fixture.root }).plan;
  sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
  const afterBytes = new Map(plan.targetFiles.map((file) => [file.path, fs.readFileSync(jsonPath(fixture.root, file.path))]));
  const recoveryPath = jsonPath(fixture.root, plan.artifacts.recoveryManifest);
  const recovery = JSON.parse(fs.readFileSync(recoveryPath, 'utf8'));
  delete recovery.completedFiles;
  recovery.state = 'PREPARED';
  recovery.quarantined = [];
  for (const file of plan.targetFiles) {
    const backup = recovery.backupFiles.find((item) => item.path === file.path);
    fs.copyFileSync(jsonPath(fixture.root, backup.backupPath), jsonPath(fixture.root, file.path));
  }
  const first = plan.targetFiles[0];
  const backup = recovery.backupFiles.find((item) => item.path === first.path);
  const tempPath = `${first.path}.tmp-a16p-${plan.planId}`;
  const displacedPath = `${first.path}.displaced-a16p-${plan.planId}`;
  if (mode === 'after-displace') {
    fs.copyFileSync(jsonPath(fixture.root, backup.backupPath), jsonPath(fixture.root, displacedPath));
    fs.writeFileSync(jsonPath(fixture.root, tempPath), afterBytes.get(first.path));
    fs.unlinkSync(jsonPath(fixture.root, first.path));
  } else if (mode === 'after-install') {
    fs.copyFileSync(jsonPath(fixture.root, backup.backupPath), jsonPath(fixture.root, displacedPath));
    fs.writeFileSync(jsonPath(fixture.root, first.path), afterBytes.get(first.path));
  }
  fs.unlinkSync(jsonPath(fixture.root, plan.artifacts.backupManifest));
  fs.writeFileSync(recoveryPath, `${JSON.stringify(recovery, null, 2)}\n`, 'utf8');
  return { fixture, plan };
}

function testRecoveryCrashProgressStates() {
  const modes = ['before-first-write', 'after-displace', 'after-install'];
  for (const mode of modes) {
    const { fixture, plan } = prepareCrashRecoveryFixture(mode);
    const canonicalBefore = hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json');
    const sentinelPath = 'scripts/recovery-sentinel.txt';
    fs.mkdirSync(path.dirname(jsonPath(fixture.root, sentinelPath)), { recursive: true });
    fs.writeFileSync(jsonPath(fixture.root, sentinelPath), 'immutable sentinel\n', 'utf8');
    try {
      const rolledBack = sync.rollbackPlan(plan, { root: fixture.root });
      assert.strictEqual(rolledBack.status, 'ROLLED_BACK', `${mode} recovery did not complete`);
      assert.strictEqual(rolledBack.recoveredProcessDeath, true);
      assert.strictEqual(hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json'), canonicalBefore, `${mode} changed canonical raw`);
      assert.strictEqual(fs.readFileSync(jsonPath(fixture.root, sentinelPath), 'utf8'), 'immutable sentinel\n', `${mode} changed immutable sentinel`);
      for (const file of plan.targetFiles) {
        const before = plan.files.find((item) => item.path === file.path);
        assert.strictEqual(hashFile(fixture.root, file.path), before.sha256, `${mode} did not restore ${file.path}`);
      }
    } finally { cleanup(fixture.root); }
  }
  const external = prepareCrashRecoveryFixture('before-first-write');
  try {
    const canonicalBefore = hashFile(external.fixture.root, 'data-tabs/raw-kenh-mau.json');
    fs.writeFileSync(jsonPath(external.fixture.root, external.plan.targetFiles[0].path), 'unexpected external edit\n', 'utf8');
    expectError(() => sync.rollbackPlan(external.plan, { root: external.fixture.root }), 'TARGET_DRIFT');
    assert.strictEqual(hashFile(external.fixture.root, 'data-tabs/raw-kenh-mau.json'), canonicalBefore);
  } finally { cleanup(external.fixture.root); }
  return { name: 'actual crash progress states (before-write/displace/install) and external target rejection', status: 'PASS' };
}

function testRecoveryCopyFailureRequired() {
  const { fixture, plan } = prepareCrashRecoveryFixture('after-install');
  const originalCopy = fs.copyFileSync;
  let rollbackCopies = 0;
  const canonicalBefore = hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json');
  const sentinelPath = 'scripts/recovery-copy-failure-sentinel.txt';
  fs.mkdirSync(path.dirname(jsonPath(fixture.root, sentinelPath)), { recursive: true });
  fs.writeFileSync(jsonPath(fixture.root, sentinelPath), 'immutable copy-failure sentinel\n', 'utf8');
  try {
    fs.copyFileSync = function injectedRollbackCopy(source, destination, ...rest) {
      const sourceText = String(source);
      if (sourceText.includes(`${path.sep}backups${path.sep}${plan.planId}${path.sep}`)) {
        rollbackCopies += 1;
        if (rollbackCopies === 2) throw new Error('fixture injected rollback copy failure');
      }
      return originalCopy.call(fs, source, destination, ...rest);
    };
    const failed = expectError(() => sync.rollbackPlan(plan, { root: fixture.root }), 'RECOVERY_REQUIRED');
    assert(failed.details.recoveryManifest);
    const recovery = readJson(fixture.root, failed.details.recoveryManifest);
    assert.strictEqual(recovery.state, 'RECOVERY_REQUIRED');
    assert.strictEqual(hashFile(fixture.root, 'data-tabs/raw-kenh-mau.json'), canonicalBefore);
    assert.strictEqual(fs.readFileSync(jsonPath(fixture.root, sentinelPath), 'utf8'), 'immutable copy-failure sentinel\n');
  } finally { fs.copyFileSync = originalCopy; }
  try {
    const recovered = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(recovered.status, 'ROLLED_BACK');
    assert.strictEqual(recovered.recoveredProcessDeath, true);
    return { name: 'rollback copy failure persists RECOVERY_REQUIRED and retries from verified backups', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testNormalRollbackJournalAndRetry() {
  const fixture = makeFixture();
  const originalCopy = fs.copyFileSync;
  let rollbackCopies = 0;
  let journalStateBeforeFirstCopy = null;
  let plan;
  let before;
  try {
    plan = sync.buildPlan({ root: fixture.root }).plan;
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    before = Object.fromEntries(plan.targetFiles.map((file) => [file.path, plan.files.find((entry) => entry.path === file.path).sha256]));
    const sentinelPath = 'scripts/normal-rollback-sentinel.txt';
    fs.mkdirSync(path.dirname(jsonPath(fixture.root, sentinelPath)), { recursive: true });
    fs.writeFileSync(jsonPath(fixture.root, sentinelPath), 'normal rollback sentinel\n', 'utf8');
    fs.copyFileSync = function injectedRollbackCopy(source, destination, ...rest) {
      const sourceText = String(source);
      if (sourceText.includes(`${path.sep}backups${path.sep}${plan.planId}${path.sep}`)) {
        rollbackCopies += 1;
        if (rollbackCopies === 1) journalStateBeforeFirstCopy = readJson(fixture.root, plan.artifacts.recoveryManifest).state;
        if (rollbackCopies === 2) throw new Error('fixture injected normal rollback copy failure');
      }
      return originalCopy.call(fs, source, destination, ...rest);
    };
    const failed = expectError(() => sync.rollbackPlan(plan, { root: fixture.root }), 'RECOVERY_REQUIRED');
    assert.strictEqual(journalStateBeforeFirstCopy, 'RECOVERY_REQUIRED', 'normal rollback journal must precede first restore copy');
    const recovery = readJson(fixture.root, failed.details.recoveryManifest);
    assert.strictEqual(recovery.state, 'RECOVERY_REQUIRED');
    assert.deepStrictEqual(recovery.restoredFiles, [plan.targetFiles[0].path]);
    assert.strictEqual(recovery.rollbackErrors.length, 1);
    assert.strictEqual(recovery.rollbackErrors[0].path, plan.targetFiles[1].path);
    for (const file of plan.targetFiles) {
      if (file.path === plan.targetFiles[0].path) assert.strictEqual(hashFile(fixture.root, file.path), before[file.path]);
    }
    assert.strictEqual(fs.readFileSync(jsonPath(fixture.root, sentinelPath), 'utf8'), 'normal rollback sentinel\n');
  } finally { fs.copyFileSync = originalCopy; }
  try {
    const recovered = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(recovered.status, 'ROLLED_BACK');
    assert.strictEqual(recovered.recoveredProcessDeath, true);
    for (const file of plan.targetFiles) assert.strictEqual(hashFile(fixture.root, file.path), before[file.path]);
    return { name: 'normal rollback journal precedes restore, persists second-copy failure, and retries mixed state', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testBackupPreparationCrashRecovery() {
  const runCrashedApply = (fixture, plan) => {
    const planPath = jsonPath(fixture.root, 'scripts/backup-preparation-plan.json');
    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, `${JSON.stringify(plan)}\n`, 'utf8');
    const modulePath = path.resolve(__dirname, '../repair/projection-sync.cjs');
    const child = [
      `const fs = require('fs');`,
      `const sync = require(${JSON.stringify(modulePath)});`,
      `const plan = JSON.parse(fs.readFileSync(${JSON.stringify(planPath)}, 'utf8'));`,
      `sync.applyPlan(plan, { root: ${JSON.stringify(fixture.root)}, approved: true, reviewer: 'fixture-child', exitAfterBackupCopy: 1 });`,
    ].join(' ');
    return childProcess.spawnSync(process.execPath, ['-e', child], { encoding: 'utf8' });
  };

  let fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const before = Object.fromEntries(plan.targetFiles.map((file) => [file.path, hashFile(fixture.root, file.path)]));
    const child = runCrashedApply(fixture, plan);
    assert.strictEqual(child.status, 97, `child backup-preparation crash exited unexpectedly: ${child.stderr}`);
    const recovery = readJson(fixture.root, plan.artifacts.recoveryManifest);
    assert.strictEqual(recovery.state, 'BACKUP_PREPARING');
    assert.strictEqual(recovery.backupFiles.length, 0);
    assert.strictEqual(recovery.pendingFiles.length, plan.targetFiles.length);
    const first = recovery.pendingFiles[0];
    assert.strictEqual(hashFile(fixture.root, first.backupPath), before[first.path]);
    const applied = sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-retry' });
    assert.strictEqual(applied.status, 'APPLIED');
    assert.strictEqual(sync.verifyPlan(plan, { root: fixture.root }).status, 'VERIFIED');
    const rolledBack = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(rolledBack.status, 'ROLLED_BACK');
    for (const file of plan.targetFiles) assert.strictEqual(hashFile(fixture.root, file.path), before[file.path]);
  } finally { cleanup(fixture.root); }

  fixture = makeFixture();
  try {
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const before = Object.fromEntries(plan.targetFiles.map((file) => [file.path, hashFile(fixture.root, file.path)]));
    const child = runCrashedApply(fixture, plan);
    assert.strictEqual(child.status, 97);
    const recovery = readJson(fixture.root, plan.artifacts.recoveryManifest);
    fs.writeFileSync(jsonPath(fixture.root, recovery.pendingFiles[0].backupPath), 'tampered pending backup\n', 'utf8');
    expectError(() => sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-retry' }), 'BACKUP_VERIFY_FAILED');
    for (const file of plan.targetFiles) assert.strictEqual(hashFile(fixture.root, file.path), before[file.path]);
    return { name: 'backup-preparation journal/crash resume verifies pending backups and rejects tampering before target writes', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testVitalityActivityDateContract() {
  const fixture = makeFixture();
  try {
    // Promote the fixture rows to the two named vitality records and provide
    // the deep projection used for canonical/profile consensus.
    const canonicalPath = 'data-tabs/raw-kenh-mau.json';
    const manifestPath = 'data/raw-channels-deep/deep-channels-manifest.json';
    const metadataPath = 'raw-kenh-goc/metadata-full.json';
    const canonical = readJson(fixture.root, canonicalPath);
    const manifest = readJson(fixture.root, manifestPath);
    const metadata = readJson(fixture.root, metadataPath);
    const ids = ['RAW-033', 'RAW-077'];
    for (let index = 0; index < ids.length; index += 1) {
      canonical.records[index].id = ids[index];
      canonical.records[index].deepIntelligence.vitalityAudit = JSON.parse(JSON.stringify(canonical.records[index].vitalityAudit));
      manifest.channels[index].id = ids[index];
      metadata.records[index].id = ids[index];
    }
    // The writable projection is intentionally stale, while the canonical,
    // deep and profile activity snapshot remains 2026-09-09/1. The as-of date
    // is deliberately unrelated so daysSinceLatest cannot be recomputed.
    metadata.records[1].vitalityAudit.latestUploadDate = '2000-01-01';
    metadata.records[1].vitalityAudit.daysSinceLatest = 999;
    writeJson(fixture.root, canonicalPath, canonical);
    writeJson(fixture.root, manifestPath, manifest);
    writeJson(fixture.root, metadataPath, metadata);
    for (const [index, folder] of ['RAW-001_One', 'RAW-002_Two'].entries()) {
      const topPath = `data/raw-channels-deep/${folder}/top-videos.json`;
      const profilePath = `data/raw-channels-deep/${folder}/channel-profile.json`;
      const top = readJson(fixture.root, topPath);
      const profile = readJson(fixture.root, profilePath);
      top.rawId = ids[index];
      profile.id = ids[index];
      writeJson(fixture.root, topPath, top);
      writeJson(fixture.root, profilePath, profile);
    }
    const plan = sync.buildPlan({ root: fixture.root, asOf: '2030-01-01T00:00:00Z' }).plan;
    const vitalityPointers = plan.targetFiles.flatMap((file) => file.pointers).filter((change) => /\/vitalityAudit\//.test(change.pointer));
    assert.deepStrictEqual(vitalityPointers.map((change) => ({ pointer: change.pointer, before: change.before, after: change.after })), [
      { pointer: '/records/1/vitalityAudit/daysSinceLatest', before: 999, after: 1 },
      { pointer: '/records/1/vitalityAudit/latestUploadDate', before: '2000-01-01', after: '2026-09-09' },
    ]);
    assert(vitalityPointers.every((change) => !['evaluatedAt', 'estimatedMonthlyRev'].includes(change.pointer.split('/').pop())));
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    const after = readJson(fixture.root, metadataPath).records[1].vitalityAudit;
    assert.strictEqual(after.latestUploadDate, '2026-09-09');
    assert.strictEqual(after.daysSinceLatest, 1);
    assert.strictEqual(after.evaluatedAt, '2026-09-10');
    return { name: 'generic vitality activity date/as-of contract', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testPostApplyNoDiffIdempotenceFixture() {
  const fixture = makeFixture();
  try {
    const before = sync.buildPlan({ root: fixture.root }).plan;
    sync.applyPlan(before, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    const after = sync.buildPlan({ root: fixture.root }).plan;
    assert.strictEqual(after.targetFiles.length, 0, 'post-apply fixture must have no writable diff');
    assert.strictEqual(after.targetFiles.reduce((total, file) => total + file.pointers.length, 0), 0);
    const repeat = sync.buildPlan({ root: fixture.root }).plan;
    assert.strictEqual(repeat.planId, after.planId, 'post-apply no-diff plan must be deterministic');
    assert.strictEqual(repeat.targetFiles.length, 0);
    return { name: 'post-apply fixture no-diff idempotence', status: 'PASS', planId: after.planId, targets: 0, pointerCount: 0 };
  } finally { cleanup(fixture.root); }
}

function testReviewMonetizationOutOfScope() {
  const fixture = makeFixture();
  try {
    const metadataPath = 'raw-kenh-goc/metadata-full.json';
    const metadata = readJson(fixture.root, metadataPath);
    metadata.records[0].vitalityAudit.monetizationStatus = 'OWNER_LABEL_UNCERTAIN';
    metadata.records[0].vitalityAudit.monetizationBadge = 'preserve this label';
    metadata.records[0].vitalityAudit.monetizationAdvisory = 'preserve this advisory';
    writeJson(fixture.root, metadataPath, metadata);
    const plan = sync.buildPlan({ root: fixture.root }).plan;
    const vitalityPointers = plan.targetFiles.flatMap((file) => file.pointers).filter((change) => /\/vitalityAudit\//.test(change.pointer));
    assert(vitalityPointers.every((change) => !sync.VITALITY_OUT_OF_SCOPE_FIELDS.includes(change.pointer.split('/').pop())));
    sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    const after = readJson(fixture.root, metadataPath).records[0].vitalityAudit;
    assert.strictEqual(after.monetizationStatus, 'OWNER_LABEL_UNCERTAIN');
    assert.strictEqual(after.monetizationBadge, 'preserve this label');
    assert.strictEqual(after.monetizationAdvisory, 'preserve this advisory');
    return { name: 'review R6 monetization labels remain out of scope', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testFixtureApplyRollbackAndPreservation() {
  // A failed run leaves immutable, audit-bound recovery/backup artifacts.  Do
  // not reuse that plan for a second apply; a fresh fixture is the explicit
  // retry boundary.
  let failedFixture = makeFixture();
  try {
    const failedPlan = sync.buildPlan({ root: failedFixture.root }).plan;
    const targetPaths = planTargetPaths(failedPlan);
    const beforeAll = Object.fromEntries(allFiles(failedFixture.root).map((relativePath) => [relativePath, hashFile(failedFixture.root, relativePath)]));
    const failed = expectError(() => sync.applyPlan(failedPlan, { root: failedFixture.root, approved: true, reviewer: 'fixture-review', failAfter: 1 }), 'INJECTED_WRITE_FAILURE');
    assert.strictEqual(failed.details.restored, true, 'failed apply may report restored only after full structural/hash verification');
    assert(failed.details.recoveryManifest, 'failed apply must persist a recovery manifest before writing targets');
    for (const relativePath of targetPaths) assert.strictEqual(hashFile(failedFixture.root, relativePath), beforeAll[relativePath], `failed apply did not rollback ${relativePath}`);
  } finally { cleanup(failedFixture.root); }

  const { fixture, plan } = makePlan();
  const targetPaths = planTargetPaths(plan);
  const beforeAll = Object.fromEntries(allFiles(fixture.root).map((relativePath) => [relativePath, hashFile(fixture.root, relativePath)]));
  const beforeUnknown = readJson(fixture.root, 'data/raw-channels-deep/RAW-001_One/top-videos.json').videos[1];
  try {
    const applied = sync.applyPlan(plan, { root: fixture.root, approved: true, reviewer: 'fixture-review' });
    assert.strictEqual(applied.status, 'APPLIED');
    const verified = sync.verifyPlan(plan, { root: fixture.root });
    assert.strictEqual(verified.status, 'VERIFIED');
    assert.strictEqual(verified.unknownRowsPreserved, 1);
    const afterUnknown = readJson(fixture.root, 'data/raw-channels-deep/RAW-001_One/top-videos.json').videos[1];
    assert.deepStrictEqual(afterUnknown, beforeUnknown, 'hasTranscript=false unknown row was modified');
    for (const relativePath of Object.keys(beforeAll)) {
      if (relativePath.startsWith('_audit/')) continue;
      if (!targetPaths.has(relativePath)) assert.strictEqual(hashFile(fixture.root, relativePath), beforeAll[relativePath], `non-target changed: ${relativePath}`);
    }
    const rolledBack = sync.rollbackPlan(plan, { root: fixture.root });
    assert.strictEqual(rolledBack.status, 'ROLLED_BACK');
    for (const relativePath of targetPaths) assert.strictEqual(hashFile(fixture.root, relativePath), beforeAll[relativePath], `restore hash mismatch: ${relativePath}`);
    for (const relativePath of Object.keys(beforeAll)) {
      if (relativePath.startsWith('_audit/')) continue;
      assert.strictEqual(hashFile(fixture.root, relativePath), beforeAll[relativePath], `rollback changed source/non-target: ${relativePath}`);
    }
    return { name: 'atomic apply, failed-write rollback, restore hash, unknown/non-target preservation', status: 'PASS' };
  } finally { cleanup(fixture.root); }
}

function testLiveDryRunContract() {
  const result = sync.buildPlan({
    root: path.resolve(__dirname, '..', '..'),
    asOf: process.env.A16P_TEST_ASOF || '2026-09-10T00:00:00Z',
  });
  const plan = result.plan;
  if (!plan.targetFiles.length) {
    return { name: 'live corpus dry-run contract (post-apply no-diff; pre-apply assertions skipped)', status: 'PASS', planId: plan.planId, targets: 0, pointerCount: 0 };
  }
  assert.strictEqual(plan.totals.canonicalRecords, 83);
  assert.strictEqual(plan.totals.topVideos, 793);
  assert.strictEqual(plan.totals.transcriptFiles, 765);
  assert.strictEqual(plan.totals.summaryFiles, 765);
  assert.strictEqual(plan.totals.unknownHasTranscriptFalseRows, 28);
  assert.strictEqual(plan.guards.yppStatus, 'NOT_VERIFIED');
  assert.strictEqual(plan.guards.incomeComputed, false);
  assert.strictEqual(plan.guards.noSpeechComputed, false);
  assert.strictEqual(plan.guards.summaryRefsRewritten, false);
  assert.strictEqual(plan.guards.raw091HandleTouched, false);
  const metadata = plan.targetFiles.find((file) => file.path === 'raw-kenh-goc/metadata-full.json');
  assert(metadata, 'selected named records must include metadata-full projection');
  const vitalityPointers = metadata.pointers.filter((change) => /\/vitalityAudit\//.test(change.pointer));
  assert.strictEqual(vitalityPointers.length, 8, 'five activity-vitality fields for each named id; monetization is out of scope');
  assert(vitalityPointers.every((change) => sync.VITALITY_PATCH_FIELDS.includes(change.pointer.split('/').pop())));
  assert(!vitalityPointers.some((change) => sync.VITALITY_OUT_OF_SCOPE_FIELDS.includes(change.pointer.split('/').pop())));
  assert(!vitalityPointers.some((change) => sync.VITALITY_PRESERVED_FIELDS.includes(change.pointer.split('/').pop())));
  assert.deepStrictEqual(
    vitalityPointers.filter((change) => /\/(latestUploadDate|daysSinceLatest)$/.test(change.pointer)).map((change) => ({
      pointer: change.pointer,
      before: change.before,
      after: change.after,
    })),
    [
      { pointer: '/records/67/vitalityAudit/daysSinceLatest', before: 1674, after: 4 },
      { pointer: '/records/67/vitalityAudit/latestUploadDate', before: '2022-02-08', after: '2026-09-05' },
    ],
    'only RAW-077 activity date fields may be newly writable',
  );
  assert(!vitalityPointers.some((change) => /\/records\/30\/vitalityAudit\/(latestUploadDate|daysSinceLatest)$/.test(change.pointer)));
  assert(!vitalityPointers.some((change) => /\/(evaluatedAt|estimatedMonthlyRev|monetizationStatus|monetizationBadge|monetizationAdvisory)$/.test(change.pointer)));
  assert(plan.targetFiles.every((file) => !file.path.endsWith('data-tabs/raw-kenh-mau.json')));
  const pointerCount = plan.targetFiles.reduce((total, file) => total + file.pointers.length, 0);
  assert.strictEqual(plan.targetFiles.length, 164, 'pre-apply live plan target count changed');
  assert.strictEqual(pointerCount, 333, 'pre-apply live plan pointer count changed');
  return { name: 'live corpus dry-run contract [pre-apply-only] (83/793/765/765/28)', status: 'PASS', planId: plan.planId, targets: plan.targetFiles.length, pointerCount };
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

const tests = [
  testGoodFixtureAndDeterminism,
  testMissingAndDuplicateIds,
  testMissingDuplicateAndUnexpectedReferences,
  testMalformedPartialSources,
  testDriftGuards,
  testPointerAndPathGuards,
  testReviewVerifyTamper,
  testReviewRollbackBinding,
  testReviewParentJunctionAndAuditConfinement,
  testReviewArtifactBinding,
  testReviewRecoveryOnRenameFailure,
  testReviewProcessRecoveryRollback,
  testReviewRecoveryManifestPreflight,
  testRecoveryCrashProgressStates,
  testRecoveryCopyFailureRequired,
  testNormalRollbackJournalAndRetry,
  testBackupPreparationCrashRecovery,
  testVitalityActivityDateContract,
  testPostApplyNoDiffIdempotenceFixture,
  testReviewMonetizationOutOfScope,
  testFixtureApplyRollbackAndPreservation,
  testLiveDryRunContract,
];

const results = [];
try {
  for (const test of tests) results.push(test());
  console.log(JSON.stringify({ schema: 'h2dev.a16p.projection-sync-tests.v1', ok: true, tests: results, count: results.length }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ schema: 'h2dev.a16p.projection-sync-tests.v1', ok: false, error: { code: error.code || 'ASSERTION_FAILED', message: error.message, stack: error.stack } }, null, 2));
  process.exitCode = 1;
}
