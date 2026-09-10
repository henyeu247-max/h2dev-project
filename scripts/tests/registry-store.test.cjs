'use strict';

/**
 * A3 offline writer regression suite.  All stores are synthetic roots below
 * this test's own campaign audit directory; no project data, public projection,
 * catalog, transcript, provider, or credential file is touched.
 */

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const writer = require('../registry/store-writer.cjs');
const { makeValidRegistry } = require('../registry/schema-test.js');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const AUDIT_ROOT = path.join(PROJECT_ROOT, '_audit', '20260910-campaign-wave2', 'A3');
const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'registry-store');
const RUN_ROOT = path.join(AUDIT_ROOT, `test-run-${process.pid}-${Date.now()}`);
const CHILD_WRITER = path.join(PROJECT_ROOT, 'scripts', 'registry', 'store-writer.cjs');
const CHILD_FIXTURE = path.join(PROJECT_ROOT, 'scripts', 'registry', 'schema-test.js');
const CHILD_CODE = `
const s=require(${JSON.stringify(CHILD_WRITER)});
const f=require(${JSON.stringify(CHILD_FIXTURE)});
const path=require('path');
const root=process.argv[1];
const key=process.argv[2];
const records=f.makeValidRegistry().filter(x=>['SRC-1','EVD-1','POL-1'].includes(x.entity_id));
try {
  const result=s.appendTransaction({projectRoot:root,allowSyntheticRoot:true,records,expectedHead:'GENESIS',idempotencyKey:key,batchHash:s.computeBatchHash(records)});
  process.stdout.write(JSON.stringify({ok:true,result})+'\\n');
} catch (error) {
  process.stdout.write(JSON.stringify({ok:false,code:error.code,message:error.message})+'\\n');
  process.exitCode=1;
}
`;

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function fixtureBatch() {
  const file = path.join(FIXTURE_ROOT, 'valid-batch.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).records;
}

function options(root, extra = {}) {
  return { projectRoot: root, allowSyntheticRoot: true, ...extra };
}

function makeRoot(name) {
  const root = path.join(RUN_ROOT, name);
  fs.mkdirSync(root, { recursive: true });
  // Provisioning is explicit and write-side.  This keeps every historical
  // writer test honest about the A2 private-root precondition while leaving
  // read-only fresh-root behavior covered separately below.
  writer.initializeStore(options(root));
  return root;
}

function makeBareRoot(name) {
  const root = path.join(RUN_ROOT, name);
  fs.mkdirSync(root, { recursive: true });
  return root;
}

function append(root, records, key, head = 'GENESIS', extra = {}) {
  return writer.appendTransaction(options(root, {
    records,
    expectedHead: head,
    idempotencyKey: key,
    batchHash: writer.computeBatchHash(records),
    ...extra,
  }));
}

function expectCode(fn, codes) {
  const expected = new Set(Array.isArray(codes) ? codes : [codes]);
  assert.throws(fn, error => {
    assert(expected.has(error.code), `expected ${[...expected].join('/')} but received ${error.code}: ${error.message}`);
    return true;
  });
}

function runChild(root, key) {
  return new Promise(resolve => {
    const child = childProcess.spawn(process.execPath, ['-e', CHILD_CODE, root, key], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => {
      const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || '{}';
      let result;
      try { result = JSON.parse(line); } catch (_) { result = { ok: false, code: 'CHILD_OUTPUT_INVALID', message: `${stdout}${stderr}` }; }
      resolve({ code, result, stdout, stderr });
    });
  });
}

async function run() {
  fs.mkdirSync(AUDIT_ROOT, { recursive: true });
  fs.mkdirSync(RUN_ROOT, { recursive: true });
  const results = [];
  const recordTest = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
    } catch (error) {
      results.push({ name, status: 'FAIL', code: error.code, message: error.message });
    }
  };

  const full = fixtureBatch();

  await recordTest('fresh read is planned-empty; initialization is explicit and idempotent', () => {
    const root = makeBareRoot('fresh-initialization');
    const before = writer.readStore(options(root));
    assert.strictEqual(before.initialized, false);
    assert.strictEqual(before.status, 'UNINITIALIZED');
    assert.strictEqual(before.sequence, 0);
    assert.strictEqual(fs.existsSync(path.join(root, '_private')), false);
    assert.strictEqual(writer.loadState(writer.makeContext(options(root))).status, 'UNINITIALIZED');
    const dryRun = writer.dryRunTransaction(options(root, {
      records: full,
      expectedHead: 'GENESIS',
      idempotencyKey: 'fresh-read-only-dry-run',
      batchHash: writer.computeBatchHash(full),
    }));
    assert.strictEqual(dryRun.status, 'UNINITIALIZED');
    assert.strictEqual(writer.dryRunProjection(options(root)).status, 'UNINITIALIZED');
    assert.strictEqual(writer.recoverStore(options(root)).status, 'UNINITIALIZED');
    assert.strictEqual(fs.existsSync(path.join(root, '_private')), false, 'read-only APIs must not provision the private store');

    const first = writer.initializeStore(options(root));
    assert.strictEqual(first.initialized, true);
    assert.strictEqual(first.idempotent, false);
    assert.strictEqual(first.status, 'INITIALIZED');
    assert(fs.existsSync(path.join(root, '_private', 'registry')));
    assert(fs.existsSync(path.join(root, '_private', 'ledger')));

    const second = writer.initializeStore(options(root));
    assert.strictEqual(second.initialized, true);
    assert.strictEqual(second.idempotent, true);
    assert.deepStrictEqual(second.directories, first.directories);
    assert.strictEqual(writer.readStore(options(root)).status, 'INITIALIZED');
  });

  await recordTest('malformed append and dry-run batches reject every entry without state or idempotency changes', () => {
    const malformed = [
      ['non-object', ['not-a-record']],
      ['null', [null]],
      ['missing-type', [(() => { const record = clone(full[0]); delete record.entity_type; return record; })()]],
      ['missing-revision', [(() => { const record = clone(full[0]); delete record.revision; return record; })()]],
      ['mixed-valid-invalid', [clone(full[0]), null]],
    ];
    const snapshot = (storeRoot, state) => ({
      status: state.status,
      initialized: state.initialized,
      headHash: state.headHash,
      generationHash: state.generationHash,
      sequence: state.sequence,
      journalHash: state.journalHash,
      journalBytes: state.journalBytes,
      commits: state.commits,
      generationFiles: fs.readdirSync(path.join(storeRoot, '_private', 'registry', 'generations')).sort(),
    });

    const appendRoot = makeRoot('malformed-append');
    const base = append(appendRoot, full, 'malformed-base');
    const baseline = snapshot(appendRoot, writer.readStore(options(appendRoot)));
    for (const [label, batch] of malformed) {
      const key = `malformed-append-${label}`;
      expectCode(() => append(appendRoot, batch, key, base.headHash), 'BATCH_VALIDATION_FAILED');
      const after = writer.readStore(options(appendRoot));
      assert.deepStrictEqual(snapshot(appendRoot, after), baseline, `${label} changed committed state`);
      assert(!after.commits.some(commit => commit.idempotencyKey === key), `${label} reserved an idempotency key`);
    }
    const appendReuseRoot = makeBareRoot('malformed-append-key-reuse');
    const appendReuseKey = 'malformed-then-valid-reuse';
    expectCode(() => append(appendReuseRoot, [null], appendReuseKey), 'BATCH_VALIDATION_FAILED');
    assert.strictEqual(fs.existsSync(path.join(appendReuseRoot, '_private')), false, 'malformed append must not initialize a store');
    const appendReuse = append(appendReuseRoot, full, appendReuseKey);
    assert.strictEqual(appendReuse.recordsTotal, 18);

    const dryRoot = makeRoot('malformed-dry-run');
    append(dryRoot, full, 'malformed-dry-base');
    const dryBaseline = snapshot(dryRoot, writer.readStore(options(dryRoot)));
    for (const [label, batch] of malformed) {
      const key = `malformed-dry-${label}`;
      const result = writer.dryRunTransaction(options(dryRoot, {
        records: batch,
        expectedHead: dryBaseline.headHash,
        idempotencyKey: key,
        batchHash: writer.computeBatchHash(batch),
      }));
      assert.strictEqual(result.valid, false, `${label} dry-run unexpectedly validated`);
      assert.strictEqual(result.wouldCommit, false, `${label} dry-run proposed a commit`);
      assert(result.errors.length > 0, `${label} dry-run returned no validation errors`);
      const after = writer.readStore(options(dryRoot));
      assert.deepStrictEqual(snapshot(dryRoot, after), dryBaseline, `${label} dry-run changed committed state`);
      assert(!after.commits.some(commit => commit.idempotencyKey === key), `${label} dry-run reserved an idempotency key`);
    }
    const dryReuseRoot = makeBareRoot('malformed-dry-run-key-reuse');
    const dryReuseKey = 'malformed-dry-then-valid-reuse';
    const malformedDry = writer.dryRunTransaction(options(dryReuseRoot, {
      records: [null],
      expectedHead: 'GENESIS',
      idempotencyKey: dryReuseKey,
      batchHash: writer.computeBatchHash([null]),
    }));
    assert.strictEqual(malformedDry.valid, false);
    assert.strictEqual(fs.existsSync(path.join(dryReuseRoot, '_private')), false, 'malformed dry-run must not initialize a store');
    const dryReuse = append(dryReuseRoot, full, dryReuseKey);
    assert.strictEqual(dryReuse.recordsTotal, 18);
  });

  await recordTest('valid control batch persists all 18 fixture records', () => {
    const root = makeRoot('valid-control-18');
    const result = append(root, full, 'valid-control-18');
    assert.strictEqual(result.recordsAdded, 18);
    assert.strictEqual(result.recordsTotal, 18);
    const state = writer.readStore(options(root));
    assert.strictEqual(state.records.length, 18);
    assert.deepStrictEqual(state.records.map(record => record.entity_id).sort(), full.map(record => record.entity_id).sort());
  });

  await recordTest('valid batch dry-run validates complete full history before writes', () => {
    const root = makeRoot('valid-dry-run');
    const hash = writer.computeBatchHash(full);
    const result = writer.dryRunTransaction(options(root, {
      records: full,
      expectedHead: 'GENESIS',
      idempotencyKey: 'valid-dry-run',
      batchHash: hash,
    }));
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.wouldCommit, true);
    assert.strictEqual(writer.readStore(options(root)).sequence, 0);
  });

  await recordTest('invalid synthetic fixture rejects dangling reference and prototype key', () => {
    const unknown = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'invalid-unknown-ref.json'), 'utf8')).records;
    const root = makeRoot('invalid-reference');
    const result = writer.dryRunTransaction(options(root, {
      records: unknown,
      expectedHead: 'GENESIS',
      idempotencyKey: 'invalid-reference',
      batchHash: writer.computeBatchHash(unknown),
    }));
    assert.strictEqual(result.valid, false);
    assert(result.errors.some(error => error.code === 'REFERENCE_NOT_FOUND'));
    const prototype = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'invalid-prototype-key.json'), 'utf8')).records;
    assert.throws(() => writer.computeBatchHash(prototype), error => error.code === 'PROTOTYPE_PATH_REJECTED');
  });

  await recordTest('append is immutable, hash chained, and idempotent', () => {
    const root = makeRoot('idempotence');
    const first = append(root, full, 'idem-1');
    const again = append(root, full, 'idem-1', 'GENESIS');
    assert.strictEqual(again.idempotent, true);
    assert.strictEqual(again.commitHash, first.commitHash);
    assert.strictEqual(writer.readStore(options(root)).sequence, 1);
    expectCode(() => append(root, full.slice(0, 1), 'idem-1'), 'IDEMPOTENCY_CONFLICT');
    expectCode(() => writer.appendTransaction(options(root, {
      records: full,
      expectedHead: 'GENESIS',
      idempotencyKey: 'bad-hash',
      batchHash: '0'.repeat(64),
    })), 'BATCH_HASH_MISMATCH');
  });

  await recordTest('exact latest+1 and explicit same-id supersedes guards', () => {
    const root = makeRoot('revision-guards');
    const first = append(root, full, 'rev-base');
    const original = full.find(record => record.entity_id === 'CLM-1');
    const revision2 = clone(original);
    revision2.revision = 2;
    revision2.supersedes = { entity_id: 'CLM-1', revision: 1 };
    revision2.status = 'needs_review';
    revision2.verification_status = 'unverified';
    const second = append(root, [revision2], 'rev-2', first.headHash);
    assert.strictEqual(second.sequence, 2);
    const skipped = clone(revision2);
    skipped.revision = 4;
    skipped.supersedes = { entity_id: 'CLM-1', revision: 3 };
    expectCode(() => append(root, [skipped], 'rev-skip', second.headHash), 'REVISION_NOT_LATEST_PLUS_ONE');
    const wrongTarget = clone(revision2);
    wrongTarget.revision = 3;
    wrongTarget.supersedes = { entity_id: 'POL-1', revision: 1 };
    expectCode(() => append(root, [wrongTarget], 'rev-wrong-target', second.headHash), 'SUPERSEDES_LATEST_REQUIRED');
  });

  await recordTest('canonical identity tuple is immutable across revisions', () => {
    const root = makeRoot('identity-guard');
    const first = append(root, full, 'identity-base');
    const original = full.find(record => record.entity_id === 'CLM-1');
    const changed = clone(original);
    changed.revision = 2;
    changed.supersedes = { entity_id: 'CLM-1', revision: 1 };
    changed.statement = 'Synthetic identity mutation must fail';
    expectCode(() => append(root, [changed], 'identity-change', first.headHash), 'IDENTITY_IMMUTABLE');
  });

  await recordTest('full-history tombstone references are explicit and visible-latest rejects them', () => {
    const root = makeRoot('tombstone-policy');
    const first = append(root, full, 'tombstone-base');
    const relation = clone(full.find(record => record.entity_id === 'REL-1'));
    relation.entity_id = 'REL-TOMBSTONE';
    relation.from = 'SRC-OLD';
    relation.to = 'CH-1';
    const fullHistory = append(root, [relation], 'tombstone-full-history', first.headHash);
    assert.strictEqual(fullHistory.committed, true);
    const rootVisible = makeRoot('tombstone-visible-latest');
    const baseVisible = append(rootVisible, full, 'tombstone-visible-base');
    expectCode(() => append(rootVisible, [relation], 'tombstone-visible', baseVisible.headHash, { referencePolicy: 'visible_latest' }), 'REFERENCE_TOMBSTONED');
  });

  await recordTest('tombstone reactivation requires explicit policy', () => {
    const root = makeRoot('tombstone-reactivation');
    const first = append(root, full, 'reactivation-base');
    const original = full.find(record => record.entity_id === 'SRC-1');
    const resurrected = clone(original);
    resurrected.entity_id = 'SRC-OLD';
    resurrected.revision = 2;
    resurrected.supersedes = { entity_id: 'SRC-OLD', revision: 1 };
    resurrected.content_hash = { algorithm: 'sha256', value: 'c'.repeat(64) };
    resurrected.source_locator.value = 'scripts/tests/fixtures/registry-store/reactivated.txt';
    resurrected.source_locator.canonical = resurrected.source_locator.value;
    resurrected.status = 'active';
    expectCode(() => append(root, [resurrected], 'reactivation-no-policy', first.headHash), 'TOMBSTONE_REACTIVATION_POLICY_REQUIRED');
    const allowed = append(root, [resurrected], 'reactivation-with-policy', first.headHash, {
      allowTombstoneReactivation: true,
      reactivationPolicyRef: 'POL-1',
    });
    assert.strictEqual(allowed.committed, true);
  });

  await recordTest('tampered generation and journal fail closed', () => {
    const generationRoot = makeRoot('tampered-generation');
    append(generationRoot, full, 'tamper-generation');
    const generationDir = path.join(generationRoot, '_private', 'registry', 'generations');
    const generationFile = fs.readdirSync(generationDir).find(name => name.endsWith('.json') && name.startsWith('generation-'));
    const generationPath = path.join(generationDir, generationFile);
    fs.appendFileSync(generationPath, 'tampered\n', 'utf8');
    expectCode(() => writer.readStore(options(generationRoot)), ['GENERATION_HASH_MISMATCH', 'GENERATION_CORRUPT', 'GENERATION_MISSING_OR_CORRUPT']);

    const journalRoot = makeRoot('tampered-journal');
    append(journalRoot, full, 'tamper-journal');
    fs.appendFileSync(path.join(journalRoot, '_private', 'ledger', 'commits.ndjson'), '{"tampered":true}\n', 'utf8');
    expectCode(() => writer.readStore(options(journalRoot)), ['JOURNAL_SHAPE', 'JOURNAL_CORRUPT']);
  });

  await recordTest('staging crash before commit preserves old head; after commit retry acknowledges', () => {
    const beforeRoot = makeRoot('crash-before-commit');
    const batch = full.slice(0, 3);
    const hash = writer.computeBatchHash(batch);
    expectCode(() => writer.appendTransaction(options(beforeRoot, {
      records: batch,
      expectedHead: 'GENESIS',
      idempotencyKey: 'crash-before',
      batchHash: hash,
      failpoint: 'beforeCommit',
    })), 'CRASH_BEFORE_COMMIT');
    const before = writer.readStore(options(beforeRoot));
    assert.strictEqual(before.headHash, 'GENESIS');
    assert(writer.recoverStore(options(beforeRoot)).staged.some(item => item.committed === false));
    const committed = append(beforeRoot, batch, 'crash-before', 'GENESIS');
    assert.strictEqual(committed.idempotent, false);

    const afterRoot = makeRoot('crash-after-commit');
    expectCode(() => writer.appendTransaction(options(afterRoot, {
      records: batch,
      expectedHead: 'GENESIS',
      idempotencyKey: 'crash-after',
      batchHash: hash,
      failpoint: 'afterCommit',
    })), 'CRASH_AFTER_COMMIT');
    const after = writer.readStore(options(afterRoot));
    assert.strictEqual(after.sequence, 1);
    const retry = append(afterRoot, batch, 'crash-after', 'GENESIS');
    assert.strictEqual(retry.idempotent, true);
  });

  await recordTest('failed validation preserves the previous head and journal hash', () => {
    const root = makeRoot('failed-write');
    const first = append(root, full, 'failed-base');
    const before = writer.readStore(options(root));
    const bad = clone(full.find(record => record.entity_id === 'CV-1'));
    bad.entity_id = 'CV-BAD';
    bad.video_id = 'bad';
    bad.channel_ref = 'CH-NOT-FOUND';
    expectCode(() => append(root, [bad], 'failed-batch', first.headHash), 'BATCH_VALIDATION_FAILED');
    const after = writer.readStore(options(root));
    assert.strictEqual(after.headHash, before.headHash);
    assert.strictEqual(after.journalHash, before.journalHash);
    assert.strictEqual(after.sequence, before.sequence);
  });

  await recordTest('public and legacy projections are dry-run allowlisted and deterministic', () => {
    const root = makeRoot('projection');
    append(root, full, 'projection-base');
    const records = clone(full);
    const channel = records.find(record => record.entity_id === 'CH-1');
    channel.sensitivity = 'public';
    const proposed = writer.projectState(records, { target: 'both' });
    assert.strictEqual(proposed.dryRun, true);
    assert(proposed.public.records.some(record => record.entity_id === 'CH-1'));
    assert(!JSON.stringify(proposed.public).match(/provider|token|secret|credential|raw|transcript/i));
    assert(proposed.legacy.records.some(record => record.entity_id === 'LSKU-1'));
    const diff = writer.diffProjection([], proposed.legacy);
    assert(diff.added.length > 0);
    assert.strictEqual(writer.dryRunProjection(options(root)).dryRun, true);
    assert.strictEqual(fs.existsSync(path.join(PROJECT_ROOT, 'data', 'registry', 'public')), false, 'projection test must not create public output');
  });

  await recordTest('projection rejects accessors and custom toJSON without invoking input code', () => {
    const getterRecord = clone(full.find(record => record.entity_id === 'CH-1'));
    getterRecord.sensitivity = 'public';
    let getterReads = 0;
    Object.defineProperty(getterRecord, 'public_url', {
      configurable: true,
      enumerable: true,
      get() {
        getterReads += 1;
        return 'https://example.test/should-not-be-read';
      },
    });
    const getterProjection = writer.projectState([getterRecord], { target: 'public' });
    assert.strictEqual(getterReads, 0);
    assert.strictEqual(getterProjection.public.records.length, 0);

    const nestedGetterRecord = clone(full.find(record => record.entity_id === 'ART-1'));
    let nestedGetterReads = 0;
    Object.defineProperty(nestedGetterRecord.qa, 'notes', {
      configurable: true,
      enumerable: true,
      get() {
        nestedGetterReads += 1;
        return 'https://example.test/should-not-be-read';
      },
    });
    const nestedGetterProjection = writer.projectState([nestedGetterRecord], { target: 'legacy' });
    assert.strictEqual(nestedGetterReads, 0);
    assert.strictEqual(nestedGetterProjection.legacy.records.length, 0);

    const jsonRecord = clone(full.find(record => record.entity_id === 'LSKU-1'));
    jsonRecord.sensitivity = 'public';
    let toJsonCalls = 0;
    jsonRecord.title = {
      toJSON() {
        toJsonCalls += 1;
        return 'unsafe value transformed into a scalar';
      },
    };
    const jsonProjection = writer.projectState([jsonRecord], { target: 'public' });
    assert.strictEqual(toJsonCalls, 0);
    assert.strictEqual(jsonProjection.public.records.length, 0);
  });

  await recordTest('real child-process concurrent CAS has one winner and one conflict', async () => {
    const root = makeRoot('concurrent-cas');
    const [left, right] = await Promise.all([runChild(root, 'cas-left'), runChild(root, 'cas-right')]);
    const outcomes = [left.result, right.result];
    assert.strictEqual(outcomes.filter(item => item.ok).length, 1, JSON.stringify([left, right]));
    const loserCodes = outcomes.filter(item => !item.ok).map(item => item.code);
    assert(loserCodes.some(code => ['LOCK_HELD', 'EXPECTED_HEAD_MISMATCH', 'LOCK_STALE'].includes(code)), JSON.stringify([left, right]));
    assert.strictEqual(writer.readStore(options(root)).sequence, 1);
  });

  await recordTest('live lock is never auto-stolen; explicit dead-owner recovery is separate', () => {
    const root = makeRoot('lock-safety');
    const lockDir = path.join(root, '_private', 'ledger');
    fs.mkdirSync(lockDir, { recursive: true });
    const lockPath = path.join(lockDir, 'registry.lock');
    fs.writeFileSync(lockPath, JSON.stringify({ format: 'h2dev.registry-writer-lock.v1', pid: process.pid, token: 'live' }) + '\n', 'utf8');
    expectCode(() => append(root, full.slice(0, 3), 'live-lock'), 'LOCK_HELD');
    fs.writeFileSync(lockPath, JSON.stringify({ format: 'h2dev.registry-writer-lock.v1', pid: 99999999, token: 'dead' }) + '\n', 'utf8');
    expectCode(() => append(root, full.slice(0, 3), 'stale-lock'), 'LOCK_STALE');
    const recovered = append(root, full.slice(0, 3), 'recovered-lock', 'GENESIS', { recoverStaleLock: true });
    assert.strictEqual(recovered.committed, true);
  });

  await recordTest('junction/private-path boundary rejects writes outside owned private roots', () => {
    const root = makeBareRoot('junction-boundary');
    const outside = makeBareRoot('junction-outside');
    const privateRoot = path.join(root, '_private');
    fs.mkdirSync(privateRoot, { recursive: true });
    const registry = path.join(privateRoot, 'registry');
    fs.symlinkSync(outside, registry, 'junction');
    expectCode(() => append(root, full.slice(0, 3), 'junction-write'), ['LINK_ANCESTOR', 'LINK_TARGET', 'FILESYSTEM_INSPECTION_FAILED']);
    assert.strictEqual(fs.existsSync(path.join(root, '_private', 'ledger')), false, 'failed initialization must not create a sibling namespace');
  });

  await recordTest('parent junction and lexical escape reject initialization without creation', () => {
    const root = makeBareRoot('parent-junction-boundary');
    const outside = makeBareRoot('parent-junction-outside');
    const context = writer.makeContext(options(root));
    expectCode(() => writer.safePrivatePath(context, '_private/registry/../escape.json', 'write'), 'TRAVERSAL_SEGMENT');
    assert.strictEqual(fs.existsSync(path.join(root, '_private')), false);
    fs.symlinkSync(outside, path.join(root, '_private'), 'junction');
    expectCode(() => writer.initializeStore(options(root)), ['LINK_ANCESTOR', 'LINK_TARGET', 'FILESYSTEM_INSPECTION_FAILED']);
    assert.strictEqual(fs.existsSync(path.join(root, '_private', 'registry')), false);
    assert.strictEqual(fs.existsSync(path.join(root, '_private', 'ledger')), false);
  });

  const failed = results.filter(item => item.status === 'FAIL');
  const output = {
    schema: 'h2dev.a3.registry-store.test-results.v1',
    ticket: 'A3',
    contract: 'h2dev.registry-store.v1',
    generatedAt: new Date().toISOString(),
    projectRoot: PROJECT_ROOT,
    syntheticRoot: RUN_ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    tests: results,
    limitations: [
      'single local trusted writer/workspace',
      'not an adversarial-OS proof',
      'validation and open/rename can race on a local filesystem',
      'no public projection or real project store write was performed',
    ],
  };
  fs.writeFileSync(path.join(AUDIT_ROOT, 'A3-TEST-RESULTS.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return failed.length ? 1 : 0;
}

async function main() {
  let code = 1;
  try { code = await run(); }
  finally {
    // RUN_ROOT is created exclusively by this test and is never a user data
    // path.  Do not broaden cleanup to any parent or existing project store.
    if (path.basename(RUN_ROOT).startsWith(`test-run-${process.pid}-`)) {
      try { fs.rmSync(RUN_ROOT, { recursive: true, force: true }); } catch (_) { /* report already emitted */ }
    }
  }
  process.exitCode = code;
}

if (require.main === module) main();

module.exports = { run, fixtureBatch, makeRoot };
