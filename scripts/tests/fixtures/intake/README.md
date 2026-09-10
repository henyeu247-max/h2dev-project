# A4 intake fixtures

These files are inert synthetic inputs for `scripts/intake-v2.js`.  They are
never copied to a project data tab or served as a public projection.  Text
that resembles an instruction is test data only; the adapter does not execute
or rewrite it.

- `good.json`, `good.txt`, and `good.srt` exercise the bounded local adapters.
- `unsupported.zip` and `unsupported.pdf` exercise preserve-only quarantine.
- `wrongmagic.png`, `zero.txt`, and `invalid-utf8.txt` exercise fail-closed
  input validation.
