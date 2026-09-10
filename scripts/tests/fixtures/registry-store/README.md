# A3 offline registry-store fixtures

These records are synthetic only. They are not imported from `data-tabs`, the
catalog, transcripts, provider responses, or a live store. Tests copy/read
these JSON fixtures and create disposable roots under
`_audit/20260910-campaign-wave2/A3/`.

- `valid-batch.json`: all contract entity types plus an explicit tombstone.
- `invalid-unknown-ref.json`: a dangling competitor-channel reference.
- `invalid-prototype-key.json`: a reserved prototype key in nested data.
