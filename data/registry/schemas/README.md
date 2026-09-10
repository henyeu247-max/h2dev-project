# H2DEV registry contracts — `h2dev-contract-v1`

This directory contains the **versioned A1 contract exports**. The contracts
cover the canonical entities named by the plan: source asset and observation,
learning SKU, competitor and owned channel, competitor video, niche, claim,
evidence, niche decision, production episode, artifact, job run, metric
snapshot, relationship, deletion request, and policy snapshot.

## Runtime boundary

`scripts/registry/schema-validate.js` is the paired validator. It intentionally
implements a declared subset of JSON Schema (`type`, `required`, `properties`,
`additionalProperties`, `items`, `enum`, `const`, `pattern`, `format`, length /
minimum constraints, `oneOf`, and `uniqueItems`) plus registry semantics:

- canonical ID prefix/namespace must match `entity_type`;
- duplicate `entity_id@revision`, non-monotonic revision, missing or cyclic
  `supersedes`, and canonical identity collisions fail deterministically;
- references must resolve to a record or explicit tombstone and cross-namespace
  reference types are rejected;
- `source_locator`, `content_hash`, `rights_evidence`, and `retention_policy`
  are separate fields;
- `file_ok`, `analysis_coverage`, `accuracy`, `rights`, `human_review`, and
  `publish_ready` remain independent status axes;
- generated/tool/model output, estimates, inferences, and creative claims
  cannot be promoted to verified; verified claims require evidence and review;
- provider/user deletion requests enforce the documented seven-calendar-day
  YouTube user-request deadline and completed cascade tombstones.

This is **not a full JSON Schema implementation**. Do not use the exports with
an unrelated validator and infer support for keywords not listed in
`index.v1.json`. Re-materialise the JSON exports with:

```text
node scripts/registry/schema-contracts.js
```

The generated files are checked by deterministic valid/invalid synthetic
fixtures:

```text
node scripts/registry/schema-test.js --write
node scripts/registry/schema-test.js
```

No A1 command writes `data-tabs`, imports legacy data, runs a provider call, or
acts as an A3 registry writer.
