'use strict';

/**
 * Public A3 API/CLI facade for the offline append-only registry store.
 *
 * API writes are explicit.  CLI writes additionally require both `--apply`
 * and `--allow-store-write`; without those flags the command is dry-run only.
 * No command seeds a registry or touches a real project store implicitly.
 */

const fs = require('fs');
const path = require('path');

const core = require('./store-core.cjs');
const projectionApi = require('./store-projection.cjs');

const {
  DEFAULT_PROJECT_ROOT,
  RegistryStoreError,
  GENESIS,
  appendTransaction,
  dryRunTransaction,
  readStore,
  recoverStore,
  computeBatchHash,
  cloneJson,
  initializeStore,
} = core;

const {
  projectState,
  diffProjection,
  dryRunProjection,
} = projectionApi;

function createRegistryStore(options = {}) {
  const base = { ...options };
  return Object.freeze({
    initialize(extra = {}) { return initializeStore({ ...base, ...extra }); },
    read(extra = {}) { return readStore({ ...base, ...extra }); },
    append(extra = {}) { return appendTransaction({ ...base, ...extra }); },
    dryRun(extra = {}) { return dryRunTransaction({ ...base, ...extra }); },
    recover(extra = {}) { return recoverStore({ ...base, ...extra }); },
    project(extra = {}) {
      const state = readStore({ ...base, ...extra });
      return projectState(state.records, extra);
    },
  });
}

function appendCompensatingTransaction(options = {}) {
  if (typeof options.reason !== 'string' || options.reason.trim() === '') {
    throw new RegistryStoreError('COMPENSATING_REASON_REQUIRED', 'A compensating transaction requires a non-empty reason');
  }
  if (typeof options.compensatesCommit !== 'string' || !/^[a-f0-9]{64}$/.test(options.compensatesCommit)) {
    throw new RegistryStoreError('COMPENSATES_COMMIT_REQUIRED', 'A compensating transaction requires the exact target commit hash');
  }
  return appendTransaction({ ...options, operation: 'compensate' });
}

// `rollback` is intentionally an alias for a compensating append, never a
// deletion/rewrite of an earlier generation.
function rollback(options = {}) {
  return appendCompensatingTransaction(options);
}

function readJsonInput(file) {
  if (typeof file !== 'string' || file.length === 0) throw new RegistryStoreError('INPUT_PATH_REQUIRED', 'A batch JSON path is required');
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')); } catch (error) {
    throw new RegistryStoreError('INPUT_READ_FAILED', 'Unable to read batch JSON input', { cause: error.code || error.message });
  }
  return parsed;
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function has(args, flag) {
  return args.includes(flag);
}

function helpText() {
  return [
    'Usage:',
    '  node scripts/registry/store-writer.cjs --dry-run --root <project-root> --batch <file> --expected-head <GENESIS|hash> --idempotency-key <key> --batch-hash <sha256>',
    '  node scripts/registry/store-writer.cjs --apply --allow-store-write --root <project-root> --batch <file> --expected-head <GENESIS|hash> --idempotency-key <key> --batch-hash <sha256>',
    '  node scripts/registry/store-writer.cjs --project --root <project-root>',
    '',
    'A non-default root must also pass --allow-synthetic-root.  Apply never seeds a missing batch and never writes a public projection.',
  ].join('\n');
}

function cli(argv = process.argv.slice(2)) {
  const args = [...argv];
  if (has(args, '--help') || has(args, '-h')) {
    process.stdout.write(`${helpText()}\n`);
    return 0;
  }
  const isApply = has(args, '--apply');
  const isDryRun = has(args, '--dry-run') || !isApply;
  const root = valueAfter(args, '--root');
  const rootExplicit = typeof root === 'string' && root.length > 0;
  const allowSyntheticRoot = has(args, '--allow-synthetic-root') || has(args, '--synthetic-root');
  const common = {
    projectRoot: root || DEFAULT_PROJECT_ROOT,
    allowSyntheticRoot,
  };
  try {
    if (isApply) {
      if (!rootExplicit) throw new RegistryStoreError('EXPLICIT_ROOT_REQUIRED', 'CLI apply requires an explicit --root; the default real project root is never selected implicitly');
      if (!has(args, '--allow-store-write') && !has(args, '--permit-store-write')) throw new RegistryStoreError('STORE_PERMISSION_REQUIRED', 'CLI apply requires both --apply and --allow-store-write');
      const batch = readJsonInput(valueAfter(args, '--batch') || valueAfter(args, '--input'));
      const result = appendTransaction({
        ...common,
        allowStoreWrite: true,
        records: batch,
        expectedHead: valueAfter(args, '--expected-head'),
        idempotencyKey: valueAfter(args, '--idempotency-key'),
        batchHash: valueAfter(args, '--batch-hash'),
        recoverStaleLock: has(args, '--recover-stale-lock'),
        reason: valueAfter(args, '--reason'),
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return 0;
    }
    if (has(args, '--project') || (!valueAfter(args, '--batch') && !valueAfter(args, '--input'))) {
      const result = dryRunProjection({ ...common, target: valueAfter(args, '--target') || 'both' });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return 0;
    }
    if (!isDryRun) throw new RegistryStoreError('COMMAND_INVALID', 'Only --dry-run or explicit --apply is supported');
    const batch = readJsonInput(valueAfter(args, '--batch') || valueAfter(args, '--input'));
    const result = dryRunTransaction({
      ...common,
      records: batch,
      expectedHead: valueAfter(args, '--expected-head'),
      idempotencyKey: valueAfter(args, '--idempotency-key'),
      batchHash: valueAfter(args, '--batch-hash'),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.valid ? 0 : 1;
  } catch (error) {
    const output = {
      valid: false,
      error: {
        code: error && error.code ? error.code : 'STORE_RUNTIME_ERROR',
        message: error && error.message ? error.message : String(error),
      },
    };
    process.stderr.write(`${JSON.stringify(output, null, 2)}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = cli();

module.exports = {
  ...core,
  ...projectionApi,
  createRegistryStore,
  appendCompensatingTransaction,
  rollback,
  computeBatchHash,
  cloneJson,
  cli,
  GENESIS,
};
