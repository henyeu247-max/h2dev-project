'use strict';

/**
 * A4 synthetic intake tests.  Every source and destination root is a fresh
 * temporary fixture.  The real project private registry/ledger and all
 * public/data paths are asserted untouched.
 */

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const intake = require('../intake-v2.js');
const adapters = require('../adapters/index.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'intake');
const AUDIT_ROOT = path.join(PROJECT_ROOT, '_audit', '20260910-campaign-wave3', 'A4');
const CLI = path.join(PROJECT_ROOT, 'scripts', 'intake-v2.js');

const FIXED_AS_OF = '2026-09-10T00:00:00.000Z';

function makeRoot(label = 'run') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `h2dev-a4-${label}-`));
  const input = path.join(root, 'input');
  fs.mkdirSync(input, { recursive: true });
  return { root, input };
}

function copyFixtures(input, names) {
  for (const name of names) fs.copyFileSync(path.join(FIXTURE_ROOT, name), path.join(input, name));
}

function expectCode(fn, codes) {
  const expected = new Set(Array.isArray(codes) ? codes : [codes]);
  assert.throws(fn, error => {
    assert(expected.has(error.code), `expected ${[...expected].join('/')} but got ${error.code}`);
    return true;
  });
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function runCli(args) {
  return childProcess.spawnSync(process.execPath, [CLI, ...args], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function runCliAsync(args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(process.execPath, [CLI, ...args], {
      cwd: PROJECT_ROOT,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status, signal) => resolve({ status, signal, stdout, stderr }));
  });
}

function runDirectories(root) {
  const runs = path.join(root, '_private', 'intake', 'runs');
  if (!fs.existsSync(runs)) return [];
  return fs.readdirSync(runs, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function selectedAllInputs(root) {
  const names = ['good.json', 'good.txt', 'good.srt', 'unsupported.zip', 'unsupported.pdf', 'wrongmagic.png', 'zero.txt', 'invalid-utf8.txt'];
  copyFixtures(root.input, names);
  return names;
}

async function run() {
  fs.mkdirSync(AUDIT_ROOT, { recursive: true });
  const results = [];
  const ownedRoots = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
    } catch (error) {
      results.push({ name, status: 'FAIL', code: error.code, message: error.message });
    }
  };

  await test('adapter registry is explicit and preserve-only adapters have no execution capability', () => {
    const listed = adapters.listAdapters();
    assert.strictEqual(adapters.REGISTRY_FORMAT, 'h2dev.intake-adapter-registry.v1');
    assert(listed.some(item => item.adapter === 'json'));
    assert(listed.some(item => item.adapter === 'srt'));
    assert(listed.some(item => item.adapter === 'unsupported-archive'));
    assert(listed.filter(item => item.adapter.startsWith('unsupported')).every(item => item.capabilities.includes('preserve-only')));
    assert(!JSON.stringify(listed).match(/ocr|transcrib|execute|macro/i));
  });

  await test('dry-run discovery is deterministic, bounded, and non-mutating', () => {
    const root = makeRoot('dry-run'); ownedRoots.push(root.root);
    selectedAllInputs(root);
    const first = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
    const second = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
    assert.deepStrictEqual(second, first);
    assert.strictEqual(first.no_writes, true);
    assert.strictEqual(first.records.length, 8);
    assert.strictEqual(fs.existsSync(path.join(root.root, '_private')), false);
    assert(!JSON.stringify(first).includes('Ignore this prompt-like text'));
    const byName = new Map(first.records.map(record => [record.source.relative_path, record]));
    assert.strictEqual(byName.get('good.json').status, 'NEEDS_REVIEW');
    assert.strictEqual(byName.get('good.txt').status, 'NEEDS_REVIEW');
    assert.strictEqual(byName.get('good.srt').status, 'NEEDS_REVIEW');
    assert.strictEqual(byName.get('unsupported.zip').status, 'NEEDS_ADAPTER');
    assert.strictEqual(byName.get('unsupported.pdf').status, 'NEEDS_ADAPTER');
    assert.strictEqual(byName.get('wrongmagic.png').reason, 'MIME_MISMATCH');
    assert.strictEqual(byName.get('zero.txt').reason, 'ZERO_BYTE_INPUT');
    assert.strictEqual(byName.get('invalid-utf8.txt').reason, 'INVALID_UTF8');
    for (const record of first.records) {
      assert.strictEqual(record.sensitivity, 'restricted');
      assert.strictEqual(record.rights.status, 'UNKNOWN');
      assert.strictEqual(record.retention.status, 'UNKNOWN');
      assert(record.provenance && record.provenance.source_locator);
      assert(record.as_of);
    }
  });

  await test('CLI defaults to dry-run and requires synthetic root plus explicit apply permission', () => {
    const root = makeRoot('cli-gate'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json']);
    const dry = runCli(['--root', root.root, '--allow-synthetic-root', '--input', 'input', '--as-of', FIXED_AS_OF]);
    assert.strictEqual(dry.status, 0, dry.stderr);
    const dryResult = JSON.parse(dry.stdout);
    assert.strictEqual(dryResult.mode, 'DRY_RUN');
    assert.strictEqual(fs.existsSync(path.join(root.root, '_private')), false);
    const denied = runCli(['--apply', '--root', root.root, '--allow-synthetic-root', '--input', 'input']);
    assert.strictEqual(denied.status, 2);
    assert.strictEqual(JSON.parse(denied.stderr).error.code, 'APPLY_REQUIRED');
    assert(!denied.stderr.includes(root.root));
  });

  await test('explicit apply quarantines all readable bytes, records unknown gates, and never initializes A3', () => {
    const root = makeRoot('apply'); ownedRoots.push(root.root);
    const names = selectedAllInputs(root);
    const beforeRegistry = fs.existsSync(path.join(PROJECT_ROOT, '_private', 'registry'));
    const beforeLedger = fs.existsSync(path.join(PROJECT_ROOT, '_private', 'ledger'));
    const result = intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'a4-apply', asOf: FIXED_AS_OF });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.status, 'COMPLETE');
    assert.strictEqual(result.registry_commit, false);
    assert.strictEqual(result.no_public_write, true);
    assert.strictEqual(result.records.length, names.length);
    const runRoot = path.join(root.root, result.manifest_path.replaceAll('/', path.sep).replace(/\\manifest\.json$/, ''));
    const manifest = readJson(path.join(root.root, result.manifest_path));
    const checkpoint = readJson(path.join(root.root, result.checkpoint_path));
    const hashManifest = readJson(path.join(root.root, result.hash_manifest_path));
    assert.strictEqual(manifest.state, 'COMPLETE');
    assert.strictEqual(checkpoint.state, 'COMPLETE');
    assert.strictEqual(hashManifest.no_fuzzy_merge, true);
    assert.strictEqual(manifest.records.every(record => record.copied === Boolean(record.content_hash)), true);
    assert.strictEqual(fs.readdirSync(path.join(runRoot, 'quarantine')).length, 8);
    for (const name of ['unsupported.zip', 'unsupported.pdf']) {
      const record = result.records.find(item => item.source.relative_path === name);
      assert.strictEqual(record.status, 'NEEDS_ADAPTER');
      assert.strictEqual(record.quarantine.source_preserved, true);
    }
    assert(!JSON.stringify(manifest).includes('Ignore this prompt-like text'));
    assert(!fs.existsSync(path.join(root.root, '_private', 'registry')));
    assert(!fs.existsSync(path.join(root.root, '_private', 'ledger')));
    assert.strictEqual(fs.existsSync(path.join(PROJECT_ROOT, '_private', 'registry')), beforeRegistry);
    assert.strictEqual(fs.existsSync(path.join(PROJECT_ROOT, '_private', 'ledger')), beforeLedger);
    assert(!fs.existsSync(path.join(root.root, 'data', 'registry', 'public')));
  });

  await test('exact hash duplicates are candidates only; no fuzzy merge or overwrite', () => {
    const root = makeRoot('duplicates'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.txt']);
    fs.copyFileSync(path.join(root.input, 'good.txt'), path.join(root.input, 'copy.txt'));
    const plan = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
    assert.strictEqual(plan.duplicate_candidates.length, 1);
    assert.strictEqual(plan.duplicate_candidates[0].merge, 'NEVER_AUTOMATIC');
    assert.strictEqual(plan.duplicate_candidates[0].intake_ids.length, 2);
    const result = intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'duplicates', asOf: FIXED_AS_OF });
    assert.strictEqual(result.status, 'COMPLETE');
    assert.strictEqual(result.records.length, 2);
    assert.strictEqual(fs.readdirSync(path.join(root.root, '_private', 'intake', 'runs', result.run_id, 'quarantine')).length, 2);
  });

  await test('same idempotency key is idempotent, different key creates a distinct run, and hash drift is rejected', () => {
    const root = makeRoot('idempotency'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json', 'good.txt']);
    const options = { projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'same-key', asOf: FIXED_AS_OF };
    const first = intake.applyIntake(options);
    const filesAfterFirst = fs.readdirSync(path.join(root.root, '_private', 'intake', 'runs', first.run_id)).sort();
    const same = intake.applyIntake(options);
    assert.strictEqual(same.idempotent, true);
    assert.strictEqual(same.run_id, first.run_id);
    assert.deepStrictEqual(runDirectories(root.root), [first.run_id]);
    assert.deepStrictEqual(fs.readdirSync(path.join(root.root, '_private', 'intake', 'runs', first.run_id)).sort(), filesAfterFirst);
    const different = intake.applyIntake({ ...options, idempotencyKey: 'different-key' });
    assert.strictEqual(different.idempotent, false);
    assert.notStrictEqual(different.run_id, first.run_id);
    fs.appendFileSync(path.join(root.input, 'good.txt'), '\nsource drift');
    expectCode(() => intake.applyIntake(options), 'IDEMPOTENCY_KEY_CONFLICT');
  });

  await test('global idempotency lock prevents two child processes with one key from creating two manifests', async () => {
    const root = makeRoot('global-lock'); ownedRoots.push(root.root);
    const otherInput = path.join(root.root, 'other-input');
    fs.mkdirSync(otherInput, { recursive: true });
    copyFixtures(root.input, ['good.json']);
    copyFixtures(otherInput, ['good.txt']);
    const common = ['--apply', '--allow-intake-write', '--root', root.root, '--allow-synthetic-root', '--idempotency-key', 'global-race-key', '--as-of', FIXED_AS_OF];
    const [first, second] = await Promise.all([
      runCliAsync([...common, '--input', 'input']),
      runCliAsync([...common, '--input', 'other-input']),
    ]);
    const runs = runDirectories(root.root);
    const results = [first, second];
    assert.strictEqual(results.filter(item => item.status === 0).length, 1, JSON.stringify(results));
    const rejected = results.find(item => item.status !== 0);
    assert(rejected, JSON.stringify(results));
    const error = JSON.parse(rejected.stderr);
    assert(['INTAKE_LOCK_HELD', 'IDEMPOTENCY_KEY_CONFLICT'].includes(error.error.code), rejected.stderr);
    assert.strictEqual(runs.length, 1, JSON.stringify(runs));
    assert.strictEqual(fs.readdirSync(path.join(root.root, '_private', 'intake', 'runs', runs[0])).filter(name => name === 'manifest.json').length, 1);
  });

  await test('interrupted copy resumes from checkpoint and detects a tampered destination', () => {
    const root = makeRoot('resume'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json', 'good.txt', 'good.srt']);
    const options = { projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'resume-key', asOf: FIXED_AS_OF };
    let interrupted;
    try { intake.applyIntake({ ...options, failAfterCopies: 1 }); } catch (error) { interrupted = error; }
    assert(interrupted && interrupted.result, 'interruption must return a machine-readable resumable result');
    assert.strictEqual(interrupted.result.status, 'INTERRUPTED');
    const checkpointPath = path.join(root.root, interrupted.result.checkpoint_path);
    const checkpoint = readJson(checkpointPath);
    assert.deepStrictEqual(checkpoint.copied_indexes, [0]);
    const firstRecord = interrupted.result.records[0];
    const target = path.join(root.root, '_private', 'intake', firstRecord.quarantine.relative_path);
    fs.writeFileSync(target, 'tampered', 'utf8');
    expectCode(() => intake.applyIntake(options), 'DESTINATION_HASH_MISMATCH');
    // Restore the interrupted run's target only inside the synthetic root so
    // the following resume assertion exercises the actual checkpoint path.
    fs.copyFileSync(path.join(root.input, firstRecord.source.relative_path), target);
    const resumed = intake.applyIntake(options);
    assert.strictEqual(resumed.status, 'COMPLETE');
    assert.strictEqual(resumed.resumed, true);
    assert.strictEqual(readJson(checkpointPath).state, 'COMPLETE');
    // A manifest/checkpoint pair is only idempotent when both sides are
    // complete.  Simulate a crash between those metadata commits and require
    // a recovery pass rather than a false idempotent success.
    const incompleteCheckpoint = readJson(checkpointPath);
    incompleteCheckpoint.state = 'IN_PROGRESS';
    fs.writeFileSync(checkpointPath, `${JSON.stringify(incompleteCheckpoint)}\n`, 'utf8');
    const recoveredMetadata = intake.applyIntake(options);
    assert.strictEqual(recoveredMetadata.idempotent, false);
    assert.strictEqual(recoveredMetadata.resumed, true);
    assert.strictEqual(readJson(checkpointPath).state, 'COMPLETE');
  });

  await test('path traversal and junction ancestors fail closed without quarantine writes', () => {
    const root = makeRoot('path'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json']);
    expectCode(() => intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: '../escape' }), 'PATH_TRAVERSAL');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-a4-outside-'));
    const link = path.join(root.input, 'link');
    try {
      fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
      const plan = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
      const linkRecord = plan.records.find(record => record.source.relative_path === 'link');
      assert(linkRecord);
      assert.strictEqual(linkRecord.status, 'REJECTED');
      assert.strictEqual(linkRecord.reason, 'PATH_LINK');
      const result = intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'junction', asOf: FIXED_AS_OF });
      assert.strictEqual(result.no_writes, true);
      assert.strictEqual(fs.existsSync(path.join(root.root, '_private')), false);
    } finally {
      try { fs.rmSync(link, { recursive: true, force: true }); } catch (_) { /* synthetic fixture cleanup */ }
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  await test('per-run exclusive lock rejects a concurrent same-key writer without interleaving metadata', () => {
    const root = makeRoot('lock'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json']);
    const plan = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', idempotencyKey: 'locked-key', asOf: FIXED_AS_OF });
    const runRoot = path.join(root.root, '_private', 'intake', 'runs', plan.run_id, 'quarantine');
    fs.mkdirSync(runRoot, { recursive: true });
    fs.writeFileSync(path.join(path.dirname(runRoot), 'intake.lock'), '{"format":"h2dev.intake-lock.v1","pid":1}\n', 'utf8');
    expectCode(() => intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'locked-key', asOf: FIXED_AS_OF }), 'INTAKE_LOCK_HELD');
    assert.strictEqual(fs.existsSync(path.join(path.dirname(runRoot), 'manifest.json')), false);
  });

  await test('project-root recursion and oversized inputs are explicit and never falsely marked copied', () => {
    const root = makeRoot('limits'); ownedRoots.push(root.root);
    fs.writeFileSync(path.join(root.input, 'oversized.txt'), 'this fixture exceeds eight bytes', 'utf8');
    expectCode(() => intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: '.' }), 'INPUT_PRIVATE_RECURSION');
    const result = intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', maxBytes: 8, apply: true, allowIntakeWrite: true, idempotencyKey: 'oversized', asOf: FIXED_AS_OF });
    assert.strictEqual(result.status, 'COMPLETE');
    assert.strictEqual(result.records[0].reason, 'INPUT_TOO_LARGE');
    assert.strictEqual(result.records[0].quarantine.copied, false);
    assert.strictEqual(result.records[0].quarantine.processed, true);
    const manifest = readJson(path.join(root.root, result.manifest_path));
    assert.strictEqual(manifest.records[0].copied, false);
    assert.strictEqual(manifest.records[0].processed, true);
    assert.strictEqual(fs.readdirSync(path.join(root.root, '_private', 'intake', 'runs', result.run_id, 'quarantine')).length, 0);
  });

  await test('partial-file markers are rejected but preserved byte-for-byte in quarantine', () => {
    const root = makeRoot('partial'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['partial.partial']);
    const plan = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
    assert.strictEqual(plan.records[0].reason, 'PARTIAL_INPUT');
    const result = intake.applyIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', apply: true, allowIntakeWrite: true, idempotencyKey: 'partial', asOf: FIXED_AS_OF });
    assert.strictEqual(result.records[0].status, 'REJECTED');
    assert.strictEqual(result.records[0].quarantine.source_preserved, true);
  });

  await test('registry promotion is a separate proposal and performs no A3 commit', () => {
    const root = makeRoot('proposal'); ownedRoots.push(root.root);
    copyFixtures(root.input, ['good.json']);
    const plan = intake.planIntake({ projectRoot: root.root, allowSyntheticRoot: true, inputRoot: 'input', asOf: FIXED_AS_OF });
    const proposal = intake.createRegistryPromotionProposal(plan);
    assert.strictEqual(proposal.status, 'PROPOSAL_ONLY');
    assert.strictEqual(proposal.a3_store_validation, 'NOT_RUN');
    assert.strictEqual(proposal.registry_commit, false);
    assert.strictEqual(proposal.public_projection, false);
    assert.strictEqual(fs.existsSync(path.join(root.root, '_private')), false);
  });

  const failed = results.filter(item => item.status === 'FAIL');
  const output = {
    schema: 'h2dev.a4.intake-v2.test-results.v1',
    ticket: 'A4',
    contract: 'h2dev.private-intake.v1',
    generatedAt: new Date().toISOString(),
    projectRoot: PROJECT_ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    tests: results,
    limitations: [
      'synthetic local fixture projects only',
      'single local trusted writer/workspace',
      'not an adversarial-OS proof',
      'validation and copy can race on a local filesystem',
      'no A3 registry validation/commit, public projection, provider, network, OCR, transcription, macro or archive extraction',
    ],
  };
  fs.mkdirSync(AUDIT_ROOT, { recursive: true });
  fs.writeFileSync(path.join(AUDIT_ROOT, 'A4-TEST-RESULTS.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  for (const root of ownedRoots) {
    try { fs.rmSync(root, { recursive: true, force: true }); } catch (_) { /* synthetic fixture cleanup */ }
  }
  return failed.length ? 1 : 0;
}

if (require.main === module) run().then(code => { process.exitCode = code; });

module.exports = { run, makeRoot };
