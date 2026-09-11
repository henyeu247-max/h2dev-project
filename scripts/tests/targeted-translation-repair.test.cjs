'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repair = require('../repair/targeted-translation-repair.cjs');

const FIXTURE_NAME = 'fixture-transcript.json';
const SOURCE_ANCHORS = [
  'one male plant and one female',
  'plant to get any fruit.',
];
const OLD_VI = [
  'Cây có cây đực và cây cái riêng biệt, nghĩa là bạn nhất định phải có một cây đực và một cây cái',
  'trồng để lấy quả.',
];
const NEW_VI = [
  'Cây đực và cây cái riêng biệt phải đi cùng nhau, nghĩa là bạn nhất định phải có một cây đực và một cây cái',
  'để cây có thể ra quả.',
];

function hash(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a16-c2-'));
  fs.mkdirSync(path.join(root, '_audit'), { recursive: true });
  const source = path.join(__dirname, 'fixtures', 'targeted-translation', FIXTURE_NAME);
  const destination = path.join(root, FIXTURE_NAME);
  fs.copyFileSync(source, destination);
  const beforeBytes = fs.readFileSync(destination);
  return {
    root,
    path: destination,
    beforeBytes,
    targetSpec: {
      repairId: 'A16-C2-fixture',
      transcriptPath: FIXTURE_NAME,
      expectedBeforeSha256: hash(beforeBytes),
      videoId: 'fixture-video',
      segmentIndexes: [0, 1],
      sourceAnchors: SOURCE_ANCHORS,
      oldViText: OLD_VI,
      newViText: NEW_VI,
      evidence: [],
    },
  };
}

function cleanup(fixture) {
  fs.rmSync(fixture.root, { recursive: true, force: true });
}

function expectCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.strictEqual(error.code, code, `${error.code}: ${error.message}`);
    return true;
  });
}

function testExactPlanAndDeterminism() {
  const fixture = makeFixture();
  try {
    const options = { root: fixture.root, targetSpec: fixture.targetSpec, auditDir: '_audit/A16-C2', asOf: '2026-09-11T00:00:00.000Z' };
    const first = repair.buildPlan(options);
    const second = repair.buildPlan(options);
    assert.strictEqual(first.plan.planId, second.plan.planId);
    assert.deepStrictEqual(first.plan.pointers.map((item) => item.pointer), ['/segments/0/viText', '/segments/1/viText', '/fullTextVi']);
    assert.deepStrictEqual(first.plan.pointers.map((item) => item.before), [OLD_VI[0], OLD_VI[1], `${OLD_VI[0]} ${OLD_VI[1]}`]);
    assert.deepStrictEqual(first.plan.pointers.map((item) => item.after), [NEW_VI[0], NEW_VI[1], `${NEW_VI[0]} ${NEW_VI[1]}`]);
    assert.notStrictEqual(first.plan.before.sha256, first.plan.after.sha256);
    return { name: 'exact three-pointer plan + deterministic rerun', status: 'PASS' };
  } finally { cleanup(fixture); }
}

function testApplyBackupVerifyAndRollback() {
  const fixture = makeFixture();
  try {
    const built = repair.buildPlan({ root: fixture.root, targetSpec: fixture.targetSpec, auditDir: '_audit/A16-C2', asOf: '2026-09-11T00:00:00.000Z' });
    expectCode(() => repair.applyPlan(built.plan, { root: fixture.root }), 'APPROVAL_REQUIRED');
    const receipt = repair.applyPlan(built.plan, { root: fixture.root, approved: true, reviewer: 'fixture-review', asOf: '2026-09-11T00:00:00.000Z' });
    assert.strictEqual(receipt.status, 'APPLIED');
    const afterBytes = fs.readFileSync(fixture.path);
    assert.strictEqual(hash(afterBytes), built.plan.after.sha256);
    const backup = fs.readFileSync(path.join(fixture.root, built.plan.artifacts.backupPath));
    assert.deepStrictEqual(backup, fixture.beforeBytes, 'backup must be byte-identical to the before-image');
    const after = JSON.parse(afterBytes);
    const before = JSON.parse(fixture.beforeBytes);
    assert.strictEqual(after.fullText, before.fullText);
    assert.deepStrictEqual(after.segments.map((segment) => [segment.start, segment.duration]), before.segments.map((segment) => [segment.start, segment.duration]));
    assert.strictEqual(after.title, before.title);
    assert.strictEqual(after.segments[2].viText, before.segments[2].viText);
    assert.strictEqual(repair.verifyPlan(built.plan, { root: fixture.root }).status, 'AFTER_IMAGE_VERIFIED');
    const rollback = repair.rollbackPlan(built.plan, { root: fixture.root, asOf: '2026-09-11T00:00:00.000Z' });
    assert.strictEqual(rollback.status, 'ROLLED_BACK');
    assert.deepStrictEqual(fs.readFileSync(fixture.path), fixture.beforeBytes, 'rollback must restore exact bytes');
    assert.strictEqual(repair.verifyPlan(built.plan, { root: fixture.root }).status, 'BEFORE_IMAGE_VERIFIED');
    return { name: 'approval, backup, after-image verification, exact rollback', status: 'PASS' };
  } finally { cleanup(fixture); }
}

function testInputDriftAndAnchorGuards() {
  let fixture = makeFixture();
  try {
    const built = repair.buildPlan({ root: fixture.root, targetSpec: fixture.targetSpec, auditDir: '_audit/A16-C2' });
    const drifted = JSON.parse(fs.readFileSync(fixture.path, 'utf8'));
    drifted.segments[0].start = 99;
    fs.writeFileSync(fixture.path, `${JSON.stringify(drifted, null, 2)}\n`);
    expectCode(() => repair.applyPlan(built.plan, { root: fixture.root, approved: true }), 'INPUT_DRIFT');
  } finally { cleanup(fixture); }
  fixture = makeFixture();
  try {
    const drifted = JSON.parse(fs.readFileSync(fixture.path, 'utf8'));
    drifted.segments[0].text = 'changed source anchor';
    const changed = { ...fixture.targetSpec, expectedBeforeSha256: hash(Buffer.from(`${JSON.stringify(drifted, null, 2)}\n`)) };
    fs.writeFileSync(fixture.path, `${JSON.stringify(drifted, null, 2)}\n`);
    expectCode(() => repair.buildPlan({ root: fixture.root, targetSpec: changed }), 'SOURCE_ANCHOR_MISMATCH');
  } finally { cleanup(fixture); }
  return { name: 'input drift and exact source-anchor rejection', status: 'PASS' };
}

function testAlreadyAppliedAndBackupConflict() {
  const fixture = makeFixture();
  try {
    const built = repair.buildPlan({ root: fixture.root, targetSpec: fixture.targetSpec, auditDir: '_audit/A16-C2' });
    repair.applyPlan(built.plan, { root: fixture.root, approved: true });
    expectCode(() => repair.applyPlan(built.plan, { root: fixture.root, approved: true }), 'INPUT_DRIFT');
    const conflictingBackup = path.join(fixture.root, built.plan.artifacts.backupPath);
    fs.writeFileSync(conflictingBackup, Buffer.from('conflict', 'utf8'));
    expectCode(() => repair.rollbackPlan(built.plan, { root: fixture.root }), 'BACKUP_VERIFY_FAILED');
    fs.writeFileSync(conflictingBackup, fixture.beforeBytes);
    repair.rollbackPlan(built.plan, { root: fixture.root });
    assert.deepStrictEqual(fs.readFileSync(fixture.path), fixture.beforeBytes);
    return { name: 'rerun refuses drift and rollback keeps reviewed backup contract', status: 'PASS' };
  } finally { cleanup(fixture); }
}

const tests = [testExactPlanAndDeterminism, testApplyBackupVerifyAndRollback, testInputDriftAndAnchorGuards, testAlreadyAppliedAndBackupConflict];
const results = [];
for (const test of tests) {
  results.push(test());
}
console.log(JSON.stringify({ schema: 'h2dev.a16-c2.targeted-translation-fixture-results.v1', passed: results.length, failed: 0, results }, null, 2));
