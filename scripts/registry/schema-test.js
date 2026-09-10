/**
 * Focused A1 contract/regression test runner and synthetic fixture materialiser.
 *
 * Usage:
 *   node scripts/registry/schema-test.js          # validate committed fixtures
 *   node scripts/registry/schema-test.js --write  # regenerate fixtures first
 *
 * @module schema-test
 */

const fs = require('fs');
const path = require('path');
const { ENTITY_TYPES, ENTITY_IDENTITY_FIELDS, loadContracts, validateRecord, validateRegistry, stableJson } = require('./schema-validate');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_DIR = path.join(ROOT, 'scripts', 'tests', 'fixtures', 'contracts');
const AT = '2026-09-10T00:00:00.000Z';
const HASH_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HASH_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function envelope(entityType, entityId, options = {}) {
  const generatedBy = options.generated_by || 'human';
  const retentionClass = options.retention_class || 'owned_asset';
  return {
    schema: `h2dev.${entityType}.v1`,
    entity_id: entityId,
    entity_type: entityType,
    revision: options.revision || 1,
    status: options.status || 'active',
    created_at: options.created_at || AT,
    observed_at: options.observed_at || AT,
    supersedes: options.supersedes === undefined ? null : options.supersedes,
    source_refs: options.source_refs || [],
    sensitivity: options.sensitivity || 'internal',
    retention_class: retentionClass,
    provenance: {
      activity_id: options.activity_id || 'RUN-FIXTURE-1',
      agent: 'fixture.a1',
      method: options.method || 'human',
      input_hashes: options.input_hashes || [],
      generated_by: generatedBy
    },
    status_axes: options.status_axes || {
      file_ok: 'pass',
      analysis_coverage: 'complete',
      accuracy: 'unverified',
      rights: 'owned',
      human_review: 'approved',
      publish_ready: 'not_applicable'
    },
    retention_policy: {
      retention_class: retentionClass,
      retention_due: null,
      refresh_due: null,
      purge_authority: 'fixture-owner',
      policy_ref: 'POL-1'
    }
  };
}

function hash(value) {
  return { algorithm: 'sha256', value };
}

function sourceLocator(type, value) {
  return { type, value, canonical: value, path_base: type === 'file_path' ? 'project' : undefined };
}

function makeValidRegistry() {
  const source = {
    ...envelope('source_asset', 'SRC-1'),
    kind: 'file',
    source_locator: sourceLocator('file_path', 'scripts/tests/fixtures/contracts/source.txt'),
    provider: 'fixture',
    mime: 'text/plain',
    byte_size: 42,
    content_hash: hash(HASH_A),
    acquired_at: AT,
    rights_evidence: {
      status: 'owned',
      evidence_refs: ['EVD-1'],
      checked_at: AT,
      reviewer: 'fixture-reviewer',
      territory: ['WORLD'],
      derivative_allowed: true,
      attribution_required: false
    },
    measurement_system: 'fixture'
  };
  const evidence = {
    ...envelope('evidence', 'EVD-1', { source_refs: ['SRC-1'] }),
    source_ref: 'SRC-1',
    source_locator: sourceLocator('file_path', 'scripts/tests/fixtures/contracts/source.txt#L1-L2'),
    content_hash: hash(HASH_A),
    supporting_excerpt: 'Synthetic source excerpt for deterministic contract tests.',
    independent_group: 'fixture-source',
    quality: 'direct',
    checked_at: AT,
    checked_by: 'fixture-reviewer',
    evidence_kind: 'source_text',
    locator_detail: 'line 1 through line 2'
  };
  const policy = {
    ...envelope('policy_snapshot', 'POL-1', { source_refs: ['SRC-1'] }),
    policy_type: 'fixture-retention',
    canonical_url: 'https://example.invalid/policy/retention',
    retrieved_at: AT,
    effective_from: AT,
    policy_status: 'current',
    recheck_due: '2026-10-10T00:00:00.000Z',
    jurisdiction: 'WORLD',
    requirements: ['Keep a deterministic retention policy reference.'],
    evidence_refs: ['EVD-1'],
    source_ref: 'SRC-1'
  };
  const observation = {
    ...envelope('source_observation', 'OBS-1', { source_refs: ['SRC-1'], method: 'direct' }),
    source_ref: 'SRC-1',
    extracted: { title: 'Synthetic observation', views: 10 },
    method: 'direct',
    confidence: 'high',
    valid_until: '2026-10-10T00:00:00.000Z',
    observation_key: 'fixture-observation-1',
    measurement_system: 'fixture',
    source_locator: sourceLocator('file_path', 'scripts/tests/fixtures/contracts/source.txt#observation')
  };
  const niche = {
    ...envelope('niche', 'NICHE-1', { source_refs: ['SRC-1'] }),
    label: 'Synthetic history',
    market: 'US',
    audience: 'education viewers',
    intent: 'content_driven',
    format: 'long_form',
    policy_class: 'safe',
    claim_refs: ['CLM-1'],
    evidence_refs: ['EVD-1'],
    language: 'en'
  };
  const claim = {
    ...envelope('claim', 'CLM-1', { source_refs: ['SRC-1'], status: 'verified' }),
    statement: 'The fixture source contains a synthetic observation.',
    claim_type: 'fact',
    scope: { market: 'US', as_of: AT, language: 'en' },
    evidence_refs: ['EVD-1'],
    verification_status: 'verified',
    confidence: 'high',
    independence_groups: ['fixture-source'],
    checked_at: AT,
    valid_until: '2026-10-10T00:00:00.000Z',
    reviewer: 'fixture-reviewer',
    contradicts: [],
    origin: 'human',
    verification_basis: 'direct_source',
    public_decision_label: 'CO',
    status_axes: {
      file_ok: 'not_applicable',
      analysis_coverage: 'complete',
      accuracy: 'verified',
      rights: 'public_reference',
      human_review: 'approved',
      publish_ready: 'not_applicable'
    }
  };
  const channel = {
    ...envelope('competitor_channel', 'CH-1', { source_refs: ['SRC-1'] }),
    platform: 'youtube',
    channel_id: 'fixture-channel-1',
    handle: '@fixture-channel',
    market: 'US',
    niche_refs: ['NICHE-1'],
    snapshot_refs: ['OBS-1'],
    source_observation_refs: ['OBS-1'],
    public_url: 'https://www.youtube.com/channel/fixture-channel-1',
    channel_role: 'ordinary'
  };
  const ownedChannel = {
    ...envelope('owned_channel', 'OWN-CH-1', { source_refs: ['SRC-1'], retention_class: 'derived_internal', sensitivity: 'restricted' }),
    platform: 'youtube',
    channel_id: 'fixture-channel-1',
    owner_account_ref: 'owner-account-fixture',
    acl: ['owner', 'architect'],
    consent_scope: ['youtube_owned_analytics'],
    authorization_checked_at: AT,
    revoke_state: 'active',
    analytics_refs: ['MET-1']
  };
  const video = {
    ...envelope('competitor_video', 'CV-1', { source_refs: ['SRC-1'] }),
    platform: 'youtube',
    video_id: 'fixture-video-1',
    channel_ref: 'CH-1',
    title: 'Synthetic competitor video',
    published_at: AT,
    canonical_url: 'https://www.youtube.com/watch?v=fixture-video-1',
    metric_refs: ['MET-1'],
    observed_format: 'long_form',
    source_observation_refs: ['OBS-1'],
    duration_seconds: 120
  };
  const metric = {
    ...envelope('metric_snapshot', 'MET-1', { source_refs: ['SRC-1'] }),
    entity_ref: 'CV-1',
    measurement_system: 'youtube_public_snapshot',
    metric: 'view_count',
    value: 10,
    unit: 'views',
    window: { from: AT, to: '2026-09-10T00:00:00.000Z' },
    market: 'US',
    collected_at: AT,
    source_ref: 'OBS-1',
    is_derived: false,
    derivation_refs: []
  };
  const decision = {
    ...envelope('niche_decision', 'DEC-1', { source_refs: ['SRC-1'] }),
    niche_ref: 'NICHE-1',
    market: 'US',
    language: 'en',
    audience: 'education viewers',
    format: 'long_form',
    measurement_refs: ['MET-1'],
    claim_refs: ['CLM-1'],
    evidence_refs: ['EVD-1'],
    hard_gates: { policy: 'pass', rights: 'pass', evidence: 'pass', cost: 'pass' },
    risk: 'low',
    cost_ceiling: { amount: 0, currency: 'USD', estimate: true },
    decision: 'test',
    rationale: 'Synthetic fixture only; no market conclusion.',
    decided_at: AT,
    reviewer: 'fixture-reviewer',
    measurement_systems: ['youtube_public_snapshot']
  };
  const learning = {
    ...envelope('learning_sku', 'LSKU-1', { source_refs: ['SRC-1'] }),
    legacy_sku: 'VIDEO-FIXTURE-1',
    title: 'Synthetic learning SKU',
    access: 'free',
    media_refs: ['SRC-1'],
    document_refs: ['SRC-1'],
    transcript_refs: ['SRC-1'],
    module_ref: null,
    legacy_path: 'video/VIDEO-FIXTURE-1',
    learning_status: 'unverified'
  };
  const episode = {
    ...envelope('production_episode', 'EP-1', { source_refs: ['SRC-1'], sensitivity: 'restricted', retention_class: 'derived_internal' }),
    channel_ref: 'OWN-CH-1',
    series: 'Synthetic series',
    brief: 'Synthetic episode brief; not for production.',
    language: 'en-US',
    format: 'long_form',
    source_pack: ['LSKU-1', 'SRC-1', 'CLM-1', 'DEC-1'],
    decision_ref: 'DEC-1',
    claim_refs: ['CLM-1'],
    ai_use_decision: 'none',
    realism: 'realistic',
    disclosure_required: false,
    disclosure_applied: false,
    disclosure_basis: null,
    disclosure_reviewer: null,
    disclosure_checked_at: null,
    rights_refs: ['EVD-1'],
    gate_status: { source: 'pass', rights: 'pass', policy: 'pass', qa: 'pending', publish: 'blocked' }
  };
  const artifact = {
    ...envelope('artifact', 'ART-1', { source_refs: ['SRC-1'], sensitivity: 'restricted', retention_class: 'derived_internal' }),
    artifact_type: 'script',
    parent_ref: 'EP-1',
    path_or_uri: 'scripts/tests/fixtures/contracts/synthetic-script.txt',
    content_hash: hash(HASH_B),
    mime: 'text/plain',
    engine: 'fixture',
    prompt: 'Synthetic prompt fixture.',
    rights_evidence: {
      status: 'owned',
      evidence_refs: ['EVD-1'],
      checked_at: AT,
      reviewer: 'fixture-reviewer',
      territory: ['WORLD'],
      derivative_allowed: true,
      attribution_required: false
    },
    qa: { status: 'pass', checked_at: AT, checked_by: 'fixture-reviewer', notes: 'Synthetic fixture passes.' }
  };
  const job = {
    ...envelope('job_run', 'RUN-1', { source_refs: ['SRC-1'], status: 'complete', retention_class: 'derived_internal', activity_id: 'RUN-1' }),
    stage: 'fixture_validation',
    input_refs: ['EP-1'],
    output_refs: ['ART-1'],
    run_status: 'succeeded',
    retry_count: 0,
    duration_ms: 10,
    cost: { amount: 0, currency: 'USD', estimate: true },
    output_probe: { status: 'pass', checked_at: AT, bytes: 42, stream_count: 0 }
  };
  const relation = {
    ...envelope('relationship', 'REL-1', { source_refs: ['SRC-1'] }),
    from: 'LSKU-1',
    type: 'mentions',
    to: 'CH-1',
    evidence_refs: ['EVD-1'],
    confidence: 'medium',
    valid_from: AT,
    valid_until: null
  };
  const tombstone = {
    ...envelope('source_asset', 'SRC-OLD', { status: 'tombstoned' }),
    tombstone: {
      reason: 'Synthetic provider purge test',
      purged_at: AT,
      policy_ref: 'POL-1',
      content_hash: hash(HASH_A),
      payload_purged: true
    }
  };
  const deletionRequest = {
    ...envelope('deletion_request', 'DEL-1', { source_refs: ['SRC-OLD'], status: 'complete', retention_class: 'derived_internal' }),
    request_scope: { kind: 'youtube_user_request', refs: ['SRC-OLD'] },
    received_at: AT,
    due_at: '2026-09-17T00:00:00.000Z',
    owner: 'fixture-owner',
    request_status: 'completed',
    completion_proof: {
      completed_at: AT,
      completed_by: 'fixture-owner',
      evidence_refs: ['EVD-1'],
      notes: 'Synthetic tombstone cascade proof.'
    },
    cascade_refs: ['SRC-OLD'],
    policy_ref: 'POL-1'
  };
  return [
    source, evidence, policy, observation, niche, claim, channel, ownedChannel,
    video, metric, decision, learning, episode, artifact, job, relation, tombstone,
    deletionRequest
  ];
}

function invalidCases(valid) {
  const byId = id => valid.find(item => item.entity_id === id);
  const cases = [];
  const provenance = clone(valid);
  byIdFrom(provenance, 'SRC-1').source_locator.value = HASH_A;
  cases.push({ file: 'invalid-provenance-separation.json', records: provenance, expect_codes: ['PROVENANCE_SEPARATION'] });

  const trust = clone(valid);
  const generatedClaim = trust.find(item => item.entity_id === 'CLM-1');
  generatedClaim.origin = 'generated';
  generatedClaim.provenance.generated_by = 'model';
  generatedClaim.verification_status = 'verified';
  generatedClaim.status_axes.accuracy = 'verified';
  cases.push({ file: 'invalid-trust-promotion.json', records: trust, expect_codes: ['TRUST_PROMOTION_BLOCKED'] });

  const missing = clone(valid);
  byIdFrom(missing, 'CV-1').channel_ref = 'CH-MISSING';
  cases.push({ file: 'invalid-missing-reference.json', records: missing, expect_codes: ['REFERENCE_NOT_FOUND'] });

  const cycle = clone(valid).filter(item => !['POL-1'].includes(item.entity_id));
  const policyA = clone(byId('POL-1'));
  policyA.entity_id = 'POL-CYCLE';
  policyA.revision = 1;
  policyA.canonical_url = 'https://example.invalid/policy/a';
  policyA.supersedes = { entity_id: 'POL-CYCLE', revision: 2 };
  const policyB = clone(byId('POL-1'));
  policyB.entity_id = 'POL-CYCLE';
  policyB.revision = 2;
  policyB.canonical_url = 'https://example.invalid/policy/b';
  policyB.supersedes = { entity_id: 'POL-CYCLE', revision: 1 };
  cycle.push(policyA, policyB);
  cases.push({ file: 'invalid-supersedes-cycle.json', records: cycle, expect_codes: ['SUPERSEDES_CYCLE'] });

  const missingSupersedes = clone(valid);
  const policyRevision = clone(byId('POL-1'));
  policyRevision.revision = 2;
  policyRevision.entity_id = 'POL-REVISION-2';
  policyRevision.canonical_url = 'https://example.invalid/policy/revision-2';
  policyRevision.supersedes = { entity_id: 'POL-REVISION-2', revision: 1 };
  missingSupersedes.push(policyRevision);
  cases.push({ file: 'invalid-supersedes-missing.json', records: missingSupersedes, expect_codes: ['SUPERSEDES_NOT_FOUND'] });

  const namespace = clone(valid);
  byIdFrom(namespace, 'LSKU-1').entity_id = 'CV-LSKU-1';
  cases.push({ file: 'invalid-namespace-collision.json', records: namespace, expect_codes: ['ID_PREFIX_ENTITY_MISMATCH'] });

  // Prototype/inherited-key entity types must fail closed without allowing
  // identity-field lookup to call methods on Object.prototype values.
  for (const entityType of ['constructor', 'hasOwnProperty', 'toString', '__proto__', 'prototype']) {
    const inheritedKey = clone(valid);
    byIdFrom(inheritedKey, 'SRC-1').entity_type = entityType;
    cases.push({ file: `invalid-entity-type-${entityType}.json`, records: inheritedKey, expect_codes: ['UNKNOWN_ENTITY_TYPE'] });
  }

  const wrongEntityTypeValues = clone(valid);
  byIdFrom(wrongEntityTypeValues, 'SRC-1').entity_type = null;
  byIdFrom(wrongEntityTypeValues, 'EVD-1').entity_type = 42;
  byIdFrom(wrongEntityTypeValues, 'OBS-1').entity_type = ['source_observation'];
  byIdFrom(wrongEntityTypeValues, 'NICHE-1').entity_type = { value: 'niche' };
  cases.push({ file: 'invalid-entity-type-wrong-values.json', records: wrongEntityTypeValues, expect_codes: ['UNKNOWN_ENTITY_TYPE'] });

  const duplicate = clone(valid);
  duplicate.push(clone(byId('SRC-1')));
  cases.push({ file: 'invalid-duplicate-revision.json', records: duplicate, expect_codes: ['DUPLICATE_ID_REVISION'] });

  const axes = clone(valid);
  delete byIdFrom(axes, 'CLM-1').status_axes.accuracy;
  cases.push({ file: 'invalid-status-axis.json', records: axes, expect_codes: ['SCHEMA_REQUIRED'] });

  const estimate = clone(valid);
  const estimateClaim = byIdFrom(estimate, 'CLM-1');
  estimateClaim.claim_type = 'estimate';
  cases.push({ file: 'invalid-estimate-verified.json', records: estimate, expect_codes: ['TRUST_PROMOTION_BLOCKED'] });

  const rights = clone(valid);
  const rightsSource = byIdFrom(rights, 'SRC-1');
  rightsSource.sensitivity = 'public';
  rightsSource.rights_evidence.status = 'unknown';
  rightsSource.retention_class = 'derived_internal';
  rightsSource.retention_policy.retention_class = 'owned_asset';
  cases.push({ file: 'invalid-rights-retention.json', records: rights, expect_codes: ['PUBLIC_RIGHTS_UNCLEAR', 'RETENTION_SEPARATION'] });

  const deletion = clone(valid);
  const request = byIdFrom(deletion, 'DEL-1');
  request.due_at = '2026-09-16T00:00:00.000Z';
  cases.push({ file: 'invalid-deletion-sla.json', records: deletion, expect_codes: ['DELETION_DUE_DATE'] });

  // Independent-review reproductions: each remains a committed regression so
  // a future contract change cannot silently reopen a P1 finding.
  const orphanDerivation = clone(valid);
  byIdFrom(orphanDerivation, 'SRC-1').provenance.derivation_refs = ['SRC-NOT-THERE'];
  cases.push({ file: 'invalid-review-orphan-derivation.json', records: orphanDerivation, expect_codes: ['REFERENCE_NOT_FOUND'] });

  const crossSupersedes = clone(valid);
  const crossRevision = clone(byId('POL-1'));
  crossRevision.entity_id = 'POL-REV2';
  crossRevision.revision = 2;
  crossRevision.canonical_url = 'https://example.invalid/policy/rev2';
  crossRevision.supersedes = 'POL-1';
  crossSupersedes.push(crossRevision);
  cases.push({ file: 'invalid-review-cross-entity-supersedes.json', records: crossSupersedes, expect_codes: ['SUPERSEDES_IDENTITY'] });

  const futureSupersedes = clone(valid);
  const otherRevision1 = clone(byId('POL-1'));
  otherRevision1.entity_id = 'POL-OTHER';
  otherRevision1.canonical_url = 'https://example.invalid/policy/other';
  const otherRevision5 = clone(otherRevision1);
  otherRevision5.revision = 5;
  otherRevision5.canonical_url = 'https://example.invalid/policy/other5';
  otherRevision5.supersedes = { entity_id: 'POL-OTHER', revision: 1 };
  const futureCross = clone(byId('POL-1'));
  futureCross.entity_id = 'POL-NEW';
  futureCross.revision = 2;
  futureCross.canonical_url = 'https://example.invalid/policy/new';
  futureCross.supersedes = { entity_id: 'POL-OTHER', revision: 5 };
  futureSupersedes.push(otherRevision1, otherRevision5, futureCross);
  cases.push({ file: 'invalid-review-future-cross-entity-supersedes.json', records: futureSupersedes, expect_codes: ['SUPERSEDES_IDENTITY'] });

  const publishedArtifact = clone(valid);
  const published = byIdFrom(publishedArtifact, 'ART-1');
  published.status = 'published';
  published.status_axes.file_ok = 'fail';
  published.status_axes.rights = 'unknown';
  published.status_axes.human_review = 'not_started';
  published.status_axes.publish_ready = 'approved';
  published.rights_evidence.status = 'unknown';
  published.rights_evidence.evidence_refs = [];
  published.rights_evidence.checked_at = null;
  published.rights_evidence.reviewer = null;
  published.qa.status = 'fail';
  cases.push({ file: 'invalid-review-published-unknown-rights.json', records: publishedArtifact, expect_codes: ['PROMOTION_GATE_FAILED'] });

  const publishedEpisode = clone(valid);
  const episodePromotion = byIdFrom(publishedEpisode, 'EP-1');
  episodePromotion.status = 'published';
  episodePromotion.status_axes.file_ok = 'fail';
  episodePromotion.status_axes.analysis_coverage = 'unknown';
  episodePromotion.status_axes.rights = 'unknown';
  episodePromotion.status_axes.human_review = 'not_started';
  episodePromotion.status_axes.publish_ready = 'approved';
  episodePromotion.gate_status = { source: 'fail', rights: 'fail', policy: 'fail', qa: 'fail', publish: 'published' };
  cases.push({ file: 'invalid-review-published-episode-gates.json', records: publishedEpisode, expect_codes: ['PROMOTION_GATE_FAILED'] });

  const envelopeMismatch = clone(valid);
  const mismatchedClaim = byIdFrom(envelopeMismatch, 'CLM-1');
  mismatchedClaim.status = 'verified';
  mismatchedClaim.verification_status = 'unverified';
  cases.push({ file: 'invalid-review-claim-envelope-mismatch.json', records: envelopeMismatch, expect_codes: ['STATUS_VERIFICATION_MISMATCH'] });

  const malformedRights = clone(valid);
  const clearedWithoutRefs = byIdFrom(malformedRights, 'ART-1');
  clearedWithoutRefs.rights_evidence.status = 'cleared';
  delete clearedWithoutRefs.rights_evidence.evidence_refs;
  cases.push({ file: 'invalid-review-malformed-rights.json', records: malformedRights, expect_codes: ['SCHEMA_REQUIRED'] });

  const malformedJob = clone(valid);
  const missingJobOutputs = byIdFrom(malformedJob, 'RUN-1');
  delete missingJobOutputs.output_refs;
  delete missingJobOutputs.output_probe;
  cases.push({ file: 'invalid-review-malformed-job.json', records: malformedJob, expect_codes: ['SCHEMA_REQUIRED', 'JOB_OUTPUT_PROBE_REQUIRED'] });

  const invalidCalendar = clone(valid);
  byIdFrom(invalidCalendar, 'SRC-1').created_at = '2026-02-30T00:00:00.000Z';
  cases.push({ file: 'invalid-review-calendar-date.json', records: invalidCalendar, expect_codes: ['SCHEMA_FORMAT_DATE_TIME'] });

  const distinctLocator = clone(valid);
  const sourceCopy = clone(byId('SRC-1'));
  sourceCopy.entity_id = 'SRC-2';
  sourceCopy.source_locator.value = 'scripts/tests/fixtures/contracts/other.txt';
  sourceCopy.source_locator.canonical = 'scripts/tests/fixtures/contracts/other.txt';
  distinctLocator.push(sourceCopy);
  cases.push({ file: 'invalid-review-source-hash-identity.json', records: distinctLocator, expect_codes: ['IDENTITY_COLLISION'] });
  return cases;
}

function byIdFrom(records, entityId) {
  const record = records.find(item => item.entity_id === entityId);
  if (!record) throw new Error(`Fixture record missing ${entityId}`);
  return record;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeFixtures() {
  const valid = makeValidRegistry();
  writeJson(path.join(FIXTURE_DIR, 'valid-registry.json'), valid);
  for (const item of invalidCases(valid)) writeJson(path.join(FIXTURE_DIR, item.file), item.records);
  writeJson(path.join(FIXTURE_DIR, 'manifest.json'), {
    profile: 'h2dev-contract-v1',
    version: '1',
    valid: [{ file: 'valid-registry.json', expect_codes: [] }],
    invalid: invalidCases(valid).map(item => ({ file: item.file, expect_codes: item.expect_codes }))
  });
}

function runTests() {
  const contracts = loadContracts();
  const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'manifest.json'), 'utf8'));
  if (manifest.profile !== 'h2dev-contract-v1' || manifest.version !== '1') throw new Error('Fixture manifest profile/version mismatch');
  const failures = [];
  const validRecords = [];
  const runOne = item => {
    const data = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, item.file), 'utf8'));
    const first = validateRegistry(data, { contracts });
    const second = validateRegistry(data, { contracts });
    if (stableJson(first.errors) !== stableJson(second.errors)) failures.push(`${item.file}: nondeterministic errors`);
    const codes = new Set(first.errors.map(error => error.code));
    if (item.expect_codes.length === 0) {
      if (!first.valid) failures.push(`${item.file}: expected valid, got ${first.errors.map(error => error.code).join(',')}`);
    } else {
      if (first.valid) failures.push(`${item.file}: expected invalid`);
      for (const code of item.expect_codes) if (!codes.has(code)) failures.push(`${item.file}: missing expected code ${code}`);
    }
    return data;
  };
  for (const item of manifest.valid || []) {
    const data = runOne(item);
    const records = Array.isArray(data) ? data : (data && Array.isArray(data.records) ? data.records : []);
    validRecords.push(...records);
  }
  for (const item of manifest.invalid || []) runOne(item);
  const indexTypes = contracts.index.entities.map(entity => entity.entity_type).sort();
  if (stableJson(indexTypes) !== stableJson([...ENTITY_TYPES].sort())) failures.push('schema index entity set mismatch');
  const validTypes = [...new Set(validRecords.map(record => record && record.entity_type).filter(Boolean))].sort();
  if (stableJson(validTypes) !== stableJson([...ENTITY_TYPES].sort())) failures.push('valid fixture entity set mismatch');
  for (const record of validRecords) {
    const result = validateRecord(record, { contracts });
    if (!result.valid) failures.push(`valid fixture ${record && record.entity_id}: individual validation failed (${result.errors.map(error => error.code).join(',')})`);
  }
  const indexedIdentityFields = new Map(contracts.index.entities.map(entity => [entity.entity_type, entity.identity_fields]));
  for (const entityType of ENTITY_TYPES) {
    const expected = ENTITY_IDENTITY_FIELDS[entityType] || [];
    const actual = indexedIdentityFields.get(entityType);
    if (stableJson(actual) !== stableJson(expected)) failures.push(`schema index identity_fields mismatch for ${entityType}`);
  }
  if (failures.length) {
    process.stderr.write(`${failures.join('\n')}\n`);
    return { valid: false, failures };
  }
  process.stdout.write(`A1 schema regression PASS: ${(manifest.valid || []).length} valid + ${(manifest.invalid || []).length} invalid fixtures; deterministic\n`);
  return { valid: true, failures: [] };
}

if (require.main === module) {
  if (process.argv.includes('--write')) writeFixtures();
  process.exitCode = runTests().valid ? 0 : 1;
}

module.exports = { makeValidRegistry, invalidCases, writeFixtures, runTests };
