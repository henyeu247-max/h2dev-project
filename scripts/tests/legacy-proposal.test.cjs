'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const proposal = require('../migration/legacy-proposal.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const AS_OF = '2026-09-11T00:00:00.000Z';
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'legacy-proposal', 'mini-records.json');

function expectCode(fn, code) {
  assert.throws(fn, error => {
    assert.strictEqual(error.code, code, `${error.code}: ${error.message}`);
    return true;
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixtureRecord() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')).records[0];
}

function testProductionAccountingAndBoundary() {
  const result = proposal.buildProposal({ root: PROJECT_ROOT, asOf: AS_OF });
  assert.strictEqual(result.proposalStatus, 'DRY_RUN_ONLY');
  assert.deepStrictEqual(result.summary.accounting.learningTriads, { expected: 132, observed: 132 });
  assert.deepStrictEqual(result.summary.accounting.competitorTranscripts, { expected: 765, observed: 765 });
  assert.deepStrictEqual(result.summary.accounting.competitorUnknownRows, { expected: 28, observed: 28 });
  assert.deepStrictEqual(result.summary.accounting.canonicalRaw, { expected: 83, observed: 83 });
  assert.deepStrictEqual(result.summary.accounting.archivedDuplicateSignals, { expected: 12, observed: 12 });
  assert.deepStrictEqual(result.summary.accounting.mainChannels, { expected: 165, observed: 165 });
  assert.strictEqual(result.summary.accounting.newCanonicalChannelCount, 83);
  assert.strictEqual(result.summary.accounting.archivedDuplicateNewChannelCount, 0);
  assert.strictEqual(result.records.length, 1185);
  assert(result.records.every(record => ['MAPPED', 'EXCLUDED', 'NEEDS_REVIEW'].includes(record.status)));
  assert.strictEqual(result.records.filter(record => record.kind === 'competitor_transcript_unknown' && record.transcript.state === 'UNKNOWN').length, 28);
  assert.strictEqual(result.inputSnapshot.files.filter(file => file.path.toLowerCase().endsWith('.mp4')).length, 0);
  assert.strictEqual(result.records.filter(record => record.kind === 'learning_transcript_triad' && record.moduleJoin.status !== 'EXPLICIT_EXISTING_JOIN').length, 0);
  const repaired = result.records.find(record => record.id === 'CV:RAW-016:5ENYu79XFcI');
  assert(repaired, 'RAW-016 repaired source must be accounted for');
  const repairedTranscript = repaired.sourceRefs.find(ref => ref.path.endsWith('5ENYu79XFcI_transcript.json'));
  assert.strictEqual(repairedTranscript.sha256, 'f0762b3c9a39f5c7f0c35f38efa10964ec50e5c26be71b50188dd7d17f7a24ff');
  const archived = result.records.find(record => record.id === 'CH:RAW-026:ARCHIVED_DUPLICATE');
  assert.strictEqual(archived.status, 'EXCLUDED');
  assert.strictEqual(archived.lineage.duplicateOf, 'CH:RAW-015');
  assert.strictEqual(archived.lineage.countsAsNewChannel, false);
  return { name: 'production N/N accounting, post-repair hash, no MP4 read, duplicate lineage', status: 'PASS', records: result.records.length };
}

function testDeterministicRerunAndUnknownContract() {
  const first = proposal.buildProposal({ root: PROJECT_ROOT, asOf: AS_OF });
  const second = proposal.buildProposal({ root: PROJECT_ROOT, asOf: AS_OF });
  assert.deepStrictEqual(second, first);
  const unknown = first.records.filter(record => record.kind === 'competitor_transcript_unknown');
  assert.strictEqual(unknown.length, 28);
  assert(unknown.every(record => record.status === 'NEEDS_REVIEW' && record.transcript.state === 'UNKNOWN' && /no_speech inference/u.test(record.transcript.reason)));
  return { name: 'deterministic rerun and 28 explicit UNKNOWN rows', status: 'PASS' };
}

function testDuplicateCollisionAndEmptyReferenceGuards() {
  const base = fixtureRecord();
  const duplicate = clone(base);
  expectCode(() => proposal.validateRecords([base, duplicate]), 'DUPLICATE_ID');
  const collision = clone(base);
  collision.id = 'CV:FIXTURE:collision';
  expectCode(() => proposal.validateRecords([base, collision]), 'PATH_COLLISION');
  const empty = clone(base);
  empty.id = 'CV:FIXTURE:empty';
  empty.sourceRefs = [];
  expectCode(() => proposal.validateRecords([empty]), 'EMPTY_REFERENCE');
  return { name: 'duplicate ID, namespace/path collision, empty reference rejection', status: 'PASS' };
}

function testInputDriftRejection() {
  const built = proposal.buildProposal({ root: PROJECT_ROOT, asOf: AS_OF });
  const drifted = clone(built);
  drifted.inputSnapshot.files[0].sha256 = drifted.inputSnapshot.files[0].sha256.replace(/^./u, drifted.inputSnapshot.files[0].sha256[0] === 'a' ? 'b' : 'a');
  drifted.inputSnapshot.sha256 = proposal.snapshotHash(drifted.inputSnapshot.files);
  expectCode(() => proposal.assertInputSnapshot(drifted, { root: PROJECT_ROOT }), 'INPUT_DRIFT');
  return { name: 'input snapshot drift rejects before any proposal write', status: 'PASS' };
}

function testOutputBackupIdempotenceAndConfinement() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-proposal-'));
  try {
    const base = {
      schema: proposal.SCHEMA,
      proposalStatus: 'DRY_RUN_ONLY',
      inputSnapshot: { files: [], sha256: '0'.repeat(64) },
      records: [],
    };
    const output = '_audit/fixture/A5.json';
    const first = proposal.writeProposal(base, { root, output });
    assert.strictEqual(first.status, 'WRITTEN');
    const before = fs.readFileSync(path.join(root, output));
    const identical = proposal.writeProposal(base, { root, output });
    assert.strictEqual(identical.status, 'IDENTICAL_OUTPUT_REUSED');
    assert.deepStrictEqual(fs.readFileSync(path.join(root, output)), before);
    const changed = { ...base, proposalStatus: 'DRY_RUN_ONLY_REVIEWED' };
    const second = proposal.writeProposal(changed, { root, output });
    assert.strictEqual(second.status, 'WRITTEN_WITH_PREVIOUS_BACKUP');
    assert(second.backup && fs.existsSync(path.join(root, second.backup.path)));
    assert.deepStrictEqual(fs.readFileSync(path.join(root, second.backup.path)), before);
    expectCode(() => proposal.writeProposal(base, { root, output: 'public/A5.json' }), 'AUDIT_PATH_REQUIRED');
    return { name: 'audit confinement, existing-output backup, identical rerun no overwrite', status: 'PASS' };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testLinkAncestorReadWriteConfinement() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-link-root-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-link-outside-'));
  try {
    fs.mkdirSync(path.join(root, '_audit'), { recursive: true });
    fs.writeFileSync(path.join(outside, 'source.json'), '{}');
    try {
      fs.symlinkSync(outside, path.join(root, '_audit', 'escape'), 'junction');
    } catch (error) {
      return { name: 'junction ancestor read/write confinement', status: 'SKIP', reason: `junction creation unavailable: ${error.code || error.message}` };
    }
    const minimal = { schema: proposal.SCHEMA, proposalStatus: 'DRY_RUN_ONLY', inputSnapshot: { files: [], sha256: '0'.repeat(64) }, records: [] };
    expectCode(() => proposal.writeProposal(minimal, { root, output: '_audit/escape/write.json' }), 'LINK_ANCESTOR');
    expectCode(() => proposal.fileHash(root, '_audit/escape/source.json', 'junction source'), 'LINK_ANCESTOR');
    assert(!fs.existsSync(path.join(outside, 'write.json')), 'junction guard must prevent external write');
    return { name: 'junction ancestor read/write confinement', status: 'PASS' };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
}

const tests = [
  testProductionAccountingAndBoundary,
  testDeterministicRerunAndUnknownContract,
  testDuplicateCollisionAndEmptyReferenceGuards,
  testInputDriftRejection,
  testOutputBackupIdempotenceAndConfinement,
  testLinkAncestorReadWriteConfinement,
];
const results = tests.map(test => test());
console.log(JSON.stringify({ schema: 'h2dev.a5.legacy-proposal.test-results.v1', ticket: 'A5', asOf: AS_OF, total: results.length, passed: results.length, failed: 0, tests: results }, null, 2));
