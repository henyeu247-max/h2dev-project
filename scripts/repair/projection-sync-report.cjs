#!/usr/bin/env node
'use strict';

/* Deterministic A16-P dry-run/audit artifact writer.  It never applies a plan. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const sync = require('./projection-sync.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_REL = '_audit/20260910-campaign-wave1/A16-P';
const AS_OF = process.argv[2] || null;

function fileHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function runOfficialRegression(planId, asOf) {
  const testScript = path.join(ROOT, 'scripts', 'tests', 'projection-sync.test.cjs');
  const codePath = path.join(ROOT, 'scripts', 'repair', 'projection-sync.cjs');
  const testCodeHash = fileHash(testScript);
  const implementationHash = fileHash(codePath);
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    stdout = childProcess.execFileSync(process.execPath, [testScript], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, A16P_TEST_ASOF: asOf },
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    exitCode = Number.isInteger(error.status) ? error.status : 1;
    stdout = String(error.stdout || '');
    stderr = String(error.stderr || '');
  }
  let result = null;
  try { result = JSON.parse(stdout.trim()); } catch (_) { result = { schema: 'h2dev.a16p.projection-sync-tests.v1', ok: false, parseError: true }; }
  const live = result && Array.isArray(result.tests) ? result.tests.find((item) => item && item.name && item.name.startsWith('live corpus dry-run contract')) : null;
  if (exitCode !== 0 || !result.ok || !live || live.planId !== planId) {
    throw new sync.ProjectionSyncError('REGRESSION_BINDING_FAILED', 'Official regression did not PASS against the generated plan/code hashes', {
      exitCode,
      planId,
      livePlanId: live && live.planId,
      result,
      stderr: stderr.slice(-4000),
      implementationHash,
      testCodeHash,
    });
  }
  return {
    schema: 'h2dev.a16p.projection-sync-tests-bound.v1',
    ok: true,
    planId,
    asOf,
    implementationHash,
    testCodeHash,
    run: {
      command: [process.execPath, 'scripts/tests/projection-sync.test.cjs'],
      cwd: ROOT,
      binding: crypto.createHash('sha256').update(`${planId}\n${asOf}\n${implementationHash}\n${testCodeHash}`).digest('hex'),
    },
    result,
  };
}

if (!AS_OF) {
  console.error('Usage: node scripts/repair/projection-sync-report.cjs <explicit-asof-ISO>');
  process.exitCode = 2;
} else {
  try {
    const result = sync.buildPlan({ root: ROOT, asOf: AS_OF });
    const artifacts = sync.writePlanArtifacts(result);
    const tests = runOfficialRegression(result.plan.planId, AS_OF);
    sync.writeAuditArtifact(ROOT, `${OUT_REL}/projection-sync-tests.json`, `${JSON.stringify(tests, null, 2)}\n`);
    const report = {
      schema: 'h2dev.a16p.projection-sync-audit.v1',
      asOf: AS_OF,
      planId: result.plan.planId,
      status: result.plan.targetFiles.length ? 'DRY_RUN_CHANGES_ONLY' : 'NO_CHANGES',
      authority: 'data-tabs/raw-kenh-mau.json (read-only canonical authority)',
      apply: { authorized: false, reason: 'A16-P prepare/test/dry-run gate; apply requires reviewed plan and explicit campaign release' },
      stats: result.plan.totals,
      relevantFileCount: result.plan.files.length,
      targetFileCount: result.plan.targetFiles.length,
      pointerCount: result.plan.targetFiles.reduce((total, file) => total + file.pointers.length, 0),
      exactFiles: result.plan.files,
      exactWritableTargets: result.plan.targetFiles,
      guards: result.plan.guards,
      artifacts,
      tests,
    };
    const lines = [
      '# A16-P projection-sync dry-run audit',
      '',
      `- **asOf:** ${AS_OF}`,
      `- **planId:** ${result.plan.planId}`,
      '- **status:** DRY_RUN_CHANGES_ONLY (no live apply performed)',
      `- **authority:** ${report.authority}`,
      `- **relevant files hashed:** ${report.relevantFileCount}`,
      `- **writable target files:** ${report.targetFileCount}`,
      `- **writable JSON pointers:** ${report.pointerCount}`,
      '',
      '## Deterministic corpus stats',
      '',
      '| Measure | Value |',
      '|---|---:|',
      ...Object.entries(report.stats).filter(([, value]) => typeof value !== 'object').map(([key, value]) => `| ${key} | ${value} |`),
      `| summary reference styles | ${JSON.stringify(report.stats.referenceStyles)} |`,
      '',
      '## Exact writable file/pointer manifest',
      '',
      'The following is the complete pointer-level diff. `before` and `after` are the reviewed values; all other fields in each JSON document are preserved.',
      '',
    ];
    for (const file of result.plan.targetFiles) {
      lines.push(`### \`${file.path}\` (${file.role}; ${file.id})`);
      lines.push('');
      for (const change of file.pointers) lines.push(`- \`${change.pointer}\`: \`${JSON.stringify(change.before)}\` → \`${JSON.stringify(change.after)}\``);
      lines.push('');
    }
    lines.push(
      '## Safety guards',
      '',
      '- Canonical raw, transcript JSON, and Vietnamese summaries are read-only inputs.',
      '- Summary references are mixed but resolving (folder-relative/project-prefixed); no path rewrite is planned.',
      '- `hasTranscript=false` rows remain unknown; no no-speech inference is made.',
      '- YPP remains `NOT_VERIFIED`; no income calculation is performed.',
      '- RAW-091 handle, evaluatedAt, historical/OCR dates and observations, estimates, public-verification labels, and unrelated fields are preserved/out of scope; latestUploadDate/daysSinceLatest are copied only from consensus snapshots.',
      '- Apply remains gated and was not run against the live corpus.',
      '- Monetization status/badge/advisory labels are out of scope and remain preserved; no all-metadata parity is claimed.',
      '',
      `Full exact hashes and pointer objects: \`${OUT_REL}/${path.basename(artifacts.planPath)}\` and \`${OUT_REL}/A16-P-DRY-RUN.json\`.`,
      '',
      `Regression artifact: \`${OUT_REL}/projection-sync-tests.json\` (PASS; bound to planId ${tests.planId}, implementation ${tests.implementationHash}, test ${tests.testCodeHash}).`,
      '',
    );
    sync.writeAuditArtifact(ROOT, `${OUT_REL}/A16-P-DRY-RUN.md`, `${lines.join('\n')}\n`);
    sync.writeAuditArtifact(ROOT, `${OUT_REL}/A16-P-DRY-RUN.json`, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ schema: report.schema, ok: true, planId: report.planId, stats: report.stats, relevantFileCount: report.relevantFileCount, targetFileCount: report.targetFileCount, pointerCount: report.pointerCount, markdown: `${OUT_REL}/A16-P-DRY-RUN.md`, json: `${OUT_REL}/A16-P-DRY-RUN.json`, plan: artifacts.planPath, diff: artifacts.diffPath }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ schema: 'h2dev.a16p.projection-sync-audit.v1', ok: false, error: { code: error.code || 'REPORT_FAILED', message: error.message, details: error.details } }, null, 2));
    process.exitCode = 1;
  }
}
