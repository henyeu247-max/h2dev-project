# A3 offline registry store

`store-writer.cjs` is a small CommonJS API/CLI for an **offline synthetic
registry only**. It consumes the hash-frozen A1 contracts through
`schema-validate.js` and calls the A2 `private-boundary.cjs` helper for every
private artifact path. It does not import legacy data, call a provider, touch
`data-tabs`, or publish a public projection.

## Commit model

The store uses two private namespaces:

```text
_private/registry/generations/generation-<sequence>-<sha256>.json
_private/registry/staging/txn-<random>.json
_private/ledger/commits.ndjson
```

Each accepted transaction is validated against the complete existing history
plus the complete new batch. A full-history generation is written immutably,
then one hash-chained journal line is appended and fsynced. The journal line is
the commit point. A crash before that line leaves an orphan generation/stage
artifact that recovery reports but never replays or overwrites; a crash after
the line is acknowledged by an idempotent retry. Old generations and journal
lines are never deleted or rewritten. Logical rollback is a compensating append
(`rollback`/`appendCompensatingTransaction`) with a reason and target commit.

Every append requires:

- `expectedHead` (CAS; `GENESIS` for an empty store);
- a non-empty `idempotencyKey`; and
- `batchHash = computeBatchHash(records)`.

Retries with the same key and hash return the original commit. Reusing a key
for a different batch is a conflict. New revisions must be exact latest+1,
must supersede the latest same-id/same-type revision, and retain the canonical
identity tuple from the A1 index. References resolve against the full history
by default; `referencePolicy: 'visible_latest'` additionally rejects a latest
tombstone reference. A tombstone reactivation requires an explicit policy
reference and `allowTombstoneReactivation: true`.

## API example (synthetic root)

```js
const store = require('./store-writer.cjs');
const records = require('../tests/fixtures/registry-store/valid-batch.json').records;
const root = '.../synthetic-project-root';
const batchHash = store.computeBatchHash(records);

// First use is an explicit write-side bootstrap. It validates the root and
// private ancestor paths before and after creating only _private/registry and
// _private/ledger (plus their store subdirectories).
store.initializeStore({ projectRoot: root, allowSyntheticRoot: true });

store.appendTransaction({
  projectRoot: root,
  allowSyntheticRoot: true,
  records,
  expectedHead: store.GENESIS,
  idempotencyKey: 'fixture-transaction-1',
  batchHash,
});
```

`readStore`, `loadState`, `recoverStore`, and dry-run APIs never provision a
missing private namespace. On a fresh allowed synthetic root they return a
planned-empty `status: 'UNINITIALIZED'` state; a partial or linked namespace
fails closed. `initializeStore` is idempotent and is also invoked explicitly
by an authorized append on first use. The real project root still requires
`allowStoreWrite: true` for both initialization and append.

The real project root requires `allowStoreWrite: true` at the API boundary.
The CLI is stricter: apply requires an explicit `--root`, `--apply`, and
`--allow-store-write`; a non-default root also requires
`--allow-synthetic-root`. Without apply flags the CLI only reads or dry-runs.

```text
node scripts/registry/store-writer.cjs --dry-run --root <root> --batch <json> \
  --expected-head GENESIS --idempotency-key fixture-1 --batch-hash <sha256>
node scripts/registry/store-writer.cjs --apply --allow-store-write --root <root> \
  --batch <json> --expected-head GENESIS --idempotency-key fixture-1 --batch-hash <sha256>
```

## Projection safety

`projectState`, `dryRunProjection`, `projection`, and `diffProjection` return
deterministic proposed public/legacy payloads only. Public fields are a second
allowlist aligned to A2 and omit sensitive/provider/token/raw fields. The
result is marked `NOT_CLAIMED`; no field means public approval and no command
writes `data/registry/public` or legacy files.

The implementation and tests are a local trusted-writer/workspace contract,
not an adversarial-OS or race-free filesystem proof. On Windows, directory
metadata fsync is unavailable; file and journal contents are fsynced.
