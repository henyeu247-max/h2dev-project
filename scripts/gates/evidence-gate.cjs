'use strict';

/**
 * A6 — deterministic claim/evidence/freshness gate.
 *
 * This module is intentionally an audit-only consumer.  It never writes a
 * registry, ledger, data-tabs file, public projection, or source artifact.
 * Reader reports are treated as data: their text is copied into the queue but
 * is never evaluated as instructions.  The importer performs structural
 * anchor checks (ranges, JSON pointers, file bytes and chunk coverage); it does
 * not perform a new semantic read or external/provider lookup.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const GATE_SCHEMA = 'h2dev.a6.evidence-gate.v1';
const IMPORT_SCHEMA = 'h2dev.a6.t01-import.v1';
const CLAIM_SCHEMA = 'h2dev.a6.claim.v1';
const RESULT_SCHEMA = 'h2dev.a6.evidence-gate-result.v1';
const HASH_RE = /^[a-f0-9]{64}$/;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;
const EVIDENCE_KINDS = new Set(['fact', 'estimate', 'inference', 'policy', 'creative']);
const RELATIONS = new Set(['supports', 'contradicts']);
const SOURCE_STATUSES = new Set(['source_supported', 'ambiguous', 'generated_or_unsupported', 'needs_external_evidence']);
const SAFE_FLAGS = new Set(['PASS', 'VERIFIED', 'CLEARED', 'OK', 'NOT_APPLICABLE']);
const GENERATED_ROLES = new Set(['model', 'summary', 'course', 'generated', 'ai_summary', 'llm']);
const GENERIC_CLAIM_RE = /\b(?:rpm|public\s+score|retention(?:\s+rate)?|success\s+guarantee|guaranteed\s+success|algorithm\s+(?:will\s+)?learn)\b/i;
const NO_SPEECH_RE = /\b(?:no\s+(?:speech|audio|sound)|no[- ]speech|silence|silent|transcript(?:ion)?\s+(?:is\s+)?absent)\b/i;

const DEFAULT_DIVERSE = '_audit/20260910-t01-s1/readers/reader-diverse/READER-DIVERSE-AUDIT.json';
const DEFAULT_LONG = '_audit/20260910-t01-s1/readers/reader-long/READER-REPORT.json';
const DEFAULT_MANIFEST = '_audit/20260910-t01-s1/TARGET-MANIFEST.json';
const APPROVED_MANIFEST_SHA256 = 'f979e3c9af202adc5abedf2ddc3627fda7c0fe428f6747c183cd372e52580020';

class EvidenceGateError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'EvidenceGateError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new EvidenceGateError(code, message, details);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stableJson(value, location = '$', seen = new WeakSet()) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('INVALID_TYPE', `Non-finite number at ${location}`);
    return JSON.stringify(value);
  }
  if (!isPlainObject(value) && !Array.isArray(value)) fail('INVALID_TYPE', `Unsupported value at ${location}`);
  if (seen.has(value)) fail('INVALID_TYPE', `Cyclic value at ${location}`);
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = `[${value.map((item, index) => stableJson(item, `${location}[${index}]`, seen)).join(',')}]`;
  } else {
    result = `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key], `${location}.${key}`, seen)}`).join(',')}}`;
  }
  seen.delete(value);
  return result;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashFile(file) {
  return sha256(fs.readFileSync(file));
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeIso(value, errors, field, { allowNull = false, importer = false } = {}) {
  if (value === null && allowNull) return null;
  if (typeof value !== 'string') {
    errors.push(`${field}:DATE_TYPE`);
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/);
  if (!match) {
    errors.push(`${field}:DATE_FORMAT`);
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millis = Number((match[7] || '0').padEnd(3, '0').slice(0, 3));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millis));
  if (!Number.isFinite(date.getTime())
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date.getUTCHours() !== hour
    || date.getUTCMinutes() !== minute
    || date.getUTCSeconds() !== second
    || date.getUTCMilliseconds() !== millis) {
    errors.push(`${field}:DATE_CALENDAR`);
    return null;
  }
  const canonical = date.toISOString();
  if (!importer && value !== canonical) errors.push(`${field}:DATE_NOT_CANONICAL`);
  return canonical;
}

function requireAsOf(value) {
  const errors = [];
  const normalized = normalizeIso(value, errors, 'as_of');
  if (errors.length) fail('AS_OF_INVALID', 'A6 requires a canonical UTC as-of timestamp', { errors });
  return normalized;
}

function normalizeHash(value, errors, field) {
  if (!isPlainObject(value) || value.algorithm !== 'sha256' || typeof value.value !== 'string' || !HASH_RE.test(value.value)) {
    errors.push(`${field}:HASH_REF_INVALID`);
    return null;
  }
  return { algorithm: 'sha256', value: value.value };
}

function normalizeWindow(value, errors, field = 'validity_window') {
  if (!isPlainObject(value)) {
    errors.push(`${field}:WINDOW_REQUIRED`);
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'starts_at') || !Object.prototype.hasOwnProperty.call(value, 'ends_at')) {
    errors.push(`${field}:WINDOW_REQUIRED`);
    return null;
  }
  const startErrors = [];
  const endErrors = [];
  const startsAt = normalizeIso(value.starts_at, startErrors, `${field}.starts_at`);
  const endsAt = normalizeIso(value.ends_at, endErrors, `${field}.ends_at`, { allowNull: true });
  errors.push(...startErrors, ...endErrors);
  if (startsAt && endsAt && startsAt > endsAt) errors.push(`${field}:WINDOW_ORDER`);
  return { starts_at: startsAt, ends_at: endsAt };
}

function normalizeLocator(value, errors, field = 'locator') {
  if (!isPlainObject(value) || typeof value.type !== 'string') {
    errors.push(`${field}:LOCATOR_REQUIRED`);
    return null;
  }
  if (value.type === 'segments') {
    const start = value.segment_start;
    const end = value.segment_end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start) errors.push(`${field}:SEGMENT_RANGE_INVALID`);
    if (value.index_base !== 0 || value.inclusive !== true) errors.push(`${field}:SEGMENT_CONVENTION_INVALID`);
    return { type: 'segments', segment_start: start, segment_end: end, index_base: 0, inclusive: true };
  }
  if (value.type === 'json_pointer') {
    if (typeof value.pointer !== 'string' || (value.pointer !== '' && !value.pointer.startsWith('/'))) errors.push(`${field}:JSON_POINTER_INVALID`);
    return { type: 'json_pointer', pointer: value.pointer };
  }
  if (value.type === 'section' || value.type === 'text') {
    if (typeof value.value !== 'string' || value.value.trim() === '') errors.push(`${field}:SECTION_INVALID`);
    return { type: value.type, value: value.value };
  }
  errors.push(`${field}:LOCATOR_TYPE_INVALID`);
  return { type: value.type };
}

function normalizeRelative(value, errors, field) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0') || /[\u0000-\u001f\u007f]/.test(value)) {
    errors.push(`${field}:SOURCE_PATH_INVALID`);
    return null;
  }
  const normalized = value.replaceAll('\\', '/');
  if (normalized.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || normalized.split('/').includes('..')) {
    errors.push(`${field}:SOURCE_PATH_OUTSIDE_ROOT`);
    return null;
  }
  return normalized;
}

function normalizeSource(raw, errors, field = 'source') {
  if (!isPlainObject(raw)) {
    errors.push(`${field}:SOURCE_REQUIRED`);
    return null;
  }
  const sourcePath = normalizeRelative(raw.source_path || raw.path, errors, `${field}.source_path`);
  const sourceHash = normalizeHash(raw.source_hash || raw.hash, errors, `${field}.source_hash`);
  const origin = typeof raw.source_origin === 'string' && raw.source_origin ? raw.source_origin : null;
  const group = typeof raw.independence_group === 'string' && raw.independence_group ? raw.independence_group : null;
  if (!origin) errors.push(`${field}:SOURCE_ORIGIN_REQUIRED`);
  if (!group) errors.push(`${field}:INDEPENDENCE_GROUP_REQUIRED`);
  const copyId = raw.source_copy_id === undefined ? null : raw.source_copy_id;
  if (copyId !== null && (typeof copyId !== 'string' || copyId.length === 0)) errors.push(`${field}:SOURCE_COPY_INVALID`);
  const role = raw.source_role || raw.role || 'primary';
  if (typeof role !== 'string' || role.length === 0) errors.push(`${field}:SOURCE_ROLE_INVALID`);
  return {
    source_path: sourcePath,
    source_hash: sourceHash,
    source_origin: origin,
    source_copy_id: copyId,
    independence_group: group,
    source_role: role,
    source_id: typeof raw.source_id === 'string' ? raw.source_id : null,
  };
}

function normalizeFlags(value) {
  const input = isPlainObject(value) ? value : {};
  const pick = key => typeof input[key] === 'string' && input[key] ? input[key] : 'UNKNOWN';
  return {
    rights: pick('rights'),
    translation: pick('translation'),
    identity: pick('identity'),
    timebase: pick('timebase'),
  };
}

function flagsHaveUnresolved(flags) {
  return Object.values(flags).some(value => !SAFE_FLAGS.has(value));
}

/**
 * Return every stable identity token carried by a source.  These are
 * deliberately not a priority-ordered fallback: a copied source may have a
 * different origin while retaining the same hash, and a copy chain may join
 * two otherwise different origins.  Callers collapse these tokens with a
 * union-find so identity is transitive (A shares a hash with B, B shares a
 * copy id with C => A/B/C are one independent source).
 */
function evidenceIdentityTokens(source) {
  if (!source) return [];
  const tokens = [];
  if (source.source_origin) tokens.push(`origin:${source.source_origin}`);
  if (source.source_copy_id) tokens.push(`copy:${source.source_copy_id}`);
  if (source.source_hash && source.source_hash.value) tokens.push(`hash:${source.source_hash.value}`);
  return unique(tokens);
}

function collapseEvidenceIdentities(entries) {
  const parent = new Map();
  const rank = new Map();
  const find = token => {
    if (!parent.has(token)) {
      parent.set(token, token);
      rank.set(token, 0);
      return token;
    }
    let current = token;
    while (parent.get(current) !== current) current = parent.get(current);
    let cursor = token;
    while (parent.get(cursor) !== cursor) {
      const next = parent.get(cursor);
      parent.set(cursor, current);
      cursor = next;
    }
    return current;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    const leftRank = rank.get(leftRoot) || 0;
    const rightRank = rank.get(rightRoot) || 0;
    if (leftRank < rightRank) parent.set(leftRoot, rightRoot);
    else if (leftRank > rightRank) parent.set(rightRoot, leftRoot);
    else {
      // Lexicographic tie-breaking keeps output deterministic across runs.
      if (leftRoot <= rightRoot) {
        parent.set(rightRoot, leftRoot);
        rank.set(leftRoot, leftRank + 1);
      } else {
        parent.set(leftRoot, rightRoot);
        rank.set(rightRoot, rightRank + 1);
      }
    }
  };
  const entryTokens = entries.map(entry => evidenceIdentityTokens(entry.source));
  for (const tokens of entryTokens) {
    for (const token of tokens) find(token);
    for (let index = 1; index < tokens.length; index += 1) union(tokens[0], tokens[index]);
  }
  // First connect all entries.  A shared token is the transitive edge between
  // copies, even when the two entries do not share origin or copy id.
  const firstByToken = new Map();
  entryTokens.forEach(tokens => {
    for (const token of tokens) {
      const first = firstByToken.get(token);
      if (first !== undefined) union(token, first);
      else firstByToken.set(token, token);
    }
  });
  const componentFor = entry => {
    const tokens = evidenceIdentityTokens(entry.source);
    if (!tokens.length) return `path:${entry.source && entry.source.source_path ? entry.source.source_path : ''}`;
    return find(tokens[0]);
  };
  return entries.map(entry => ({ entry, component: componentFor(entry) }));
}

function representativeGroups(collapsedEntries) {
  const groups = new Map();
  for (const { entry, component } of collapsedEntries) {
    const group = entry.source && entry.source.independence_group;
    if (!group) continue;
    const previous = groups.get(component);
    if (previous === undefined || group < previous) groups.set(component, group);
  }
  return new Set(groups.values());
}

function claimText(claim) {
  return [claim.text, claim.claim, claim.assertion, claim.topic].filter(value => typeof value === 'string').join(' ');
}

function classifyEvidenceKind(value, errors, field = 'evidence_kind') {
  if (typeof value !== 'string' || !EVIDENCE_KINDS.has(value)) {
    errors.push(`${field}:EVIDENCE_KIND_INVALID`);
    return null;
  }
  return value;
}

function claimEvidenceInput(claim, extraEvidence = []) {
  const own = Array.isArray(claim.evidence)
    ? claim.evidence
    : (Array.isArray(claim.sources) ? claim.sources : (claim.source ? [claim.source] : []));
  return [...own, ...extraEvidence];
}

const NON_VERIFIABLE_KINDS = new Set(['estimate', 'inference', 'creative']);
const REVIEW_ATTESTATION_STATUSES = new Set(['VERIFIED', 'verified', 'PASS', 'pass']);

/**
 * Human review is an explicit, separately supplied trust boundary.  A claim
 * field or a JSON flag is not enough: callers must provide a validator
 * function from their review system and an attestation that names this claim
 * and every corroborating evidence row.  The offline importer never supplies
 * either, so its rows can only remain queued/corroborated candidates.
 */
function validateReviewAttestation(raw, claimId, asOf, supportEntries, options = {}) {
  if (raw === undefined) return { present: false, valid: false, reasons: [] };
  const errors = [];
  if (!isPlainObject(raw)) errors.push('REVIEW_ATTESTATION_OBJECT_REQUIRED');
  if (typeof options.reviewAttestationValidator !== 'function') {
    errors.push('REVIEW_ATTESTATION_VALIDATOR_REQUIRED');
  } else {
    try {
      if (options.reviewAttestationValidator(raw) !== true) errors.push('REVIEW_ATTESTATION_NOT_VALIDATED');
    } catch (_) {
      errors.push('REVIEW_ATTESTATION_VALIDATOR_FAILED');
    }
  }
  if (isPlainObject(raw)) {
    if (raw.claim_id !== claimId) errors.push('REVIEW_ATTESTATION_CLAIM_MISMATCH');
    if (typeof raw.reviewer !== 'string' || raw.reviewer.trim() === '') errors.push('REVIEW_ATTESTATION_REVIEWER_REQUIRED');
    if (!REVIEW_ATTESTATION_STATUSES.has(raw.status)) errors.push('REVIEW_ATTESTATION_STATUS_INVALID');
    if (raw.basis !== 'independent_human_review') errors.push('REVIEW_ATTESTATION_BASIS_INVALID');
    const checkedErrors = [];
    const checkedAt = normalizeIso(raw.checked_at, checkedErrors, 'review_attestation.checked_at');
    errors.push(...checkedErrors);
    if (checkedAt && checkedAt > asOf) errors.push('REVIEW_ATTESTATION_FUTURE');
    if (!Array.isArray(raw.evidence_refs) || raw.evidence_refs.length === 0) {
      errors.push('REVIEW_ATTESTATION_EVIDENCE_REQUIRED');
    } else {
      const refs = raw.evidence_refs;
      if (refs.some(ref => !Number.isSafeInteger(ref) || ref < 0)) errors.push('REVIEW_ATTESTATION_EVIDENCE_REF_INVALID');
      const expected = supportEntries.map(entry => entry.index).sort((a, b) => a - b);
      const actual = [...new Set(refs)].sort((a, b) => a - b);
      if (actual.length !== refs.length || actual.length !== expected.length || actual.some((ref, index) => ref !== expected[index])) {
        errors.push('REVIEW_ATTESTATION_EVIDENCE_SCOPE_MISMATCH');
      }
    }
    if (errors.length === 0) {
      return {
        present: true,
        valid: true,
        value: {
          claim_id: claimId,
          reviewer: raw.reviewer.trim(),
          status: 'VERIFIED',
          basis: 'independent_human_review',
          checked_at: normalizeIso(raw.checked_at, [], 'review_attestation.checked_at'),
          evidence_refs: [...raw.evidence_refs].sort((a, b) => a - b),
        },
        reasons: [],
      };
    }
  }
  return { present: true, valid: false, value: null, reasons: unique(errors) };
}

function evaluateClaim(claim, options = {}) {
  const asOf = requireAsOf(options.asOf);
  if (!isPlainObject(claim)) {
    return {
      schema: CLAIM_SCHEMA,
      claim_id: null,
      gate_status: 'NEEDS_REVIEW',
      source_supported: false,
      verified_fact: false,
      reasons: ['CLAIM_OBJECT_REQUIRED'],
      counterevidence: [],
      evidence: [],
      use_cases: { research: 'BLOCKED', release: 'BLOCKED' },
    };
  }
  const errors = [];
  const claimId = typeof claim.claim_id === 'string' ? claim.claim_id : (typeof claim.reader_claim_id === 'string' ? claim.reader_claim_id : null);
  if (!claimId) errors.push('CLAIM_ID_REQUIRED');
  const sourceStatus = claim.source_status || null;
  if (sourceStatus !== null && !SOURCE_STATUSES.has(sourceStatus)) errors.push('SOURCE_STATUS_INVALID');
  const sourceSupported = claim.source_supported === true || sourceStatus === 'source_supported';
  const evidenceKind = classifyEvidenceKind(claim.evidence_kind, errors);
  const observedErrors = [];
  const observedAt = normalizeIso(claim.observed_at, observedErrors, 'observed_at');
  errors.push(...observedErrors);
  const windowErrors = [];
  const validityWindow = normalizeWindow(claim.validity_window, windowErrors);
  errors.push(...windowErrors);
  const locatorErrors = [];
  const primaryLocator = normalizeLocator(claim.locator, locatorErrors);
  errors.push(...locatorErrors);
  const rawEvidence = claimEvidenceInput(claim, Array.isArray(options.extraEvidence) ? options.extraEvidence : []);
  if (rawEvidence.length === 0) errors.push('NO_EVIDENCE');
  const evidence = [];
  const supportingGroups = new Set();
  const counterGroups = new Set();
  const activeSupport = [];
  const activeCounter = [];
  const timingStates = [];

  rawEvidence.forEach((raw, index) => {
    const itemErrors = [];
    if (!isPlainObject(raw)) {
      itemErrors.push(`evidence[${index}]:EVIDENCE_OBJECT_REQUIRED`);
      evidence.push({ index, relation: null, eligible: false, status: 'NEEDS_REVIEW', reasons: itemErrors });
      return;
    }
    const relation = raw.relation || 'supports';
    if (!RELATIONS.has(relation)) itemErrors.push(`evidence[${index}]:RELATION_INVALID`);
    const itemKind = classifyEvidenceKind(raw.evidence_kind || raw.kind || evidenceKind, itemErrors, `evidence[${index}].evidence_kind`);
    const source = normalizeSource(raw.source || raw, itemErrors, `evidence[${index}].source`);
    const itemObservedErrors = [];
    const itemObservedAt = normalizeIso(raw.observed_at || observedAt, itemObservedErrors, `evidence[${index}].observed_at`);
    itemErrors.push(...itemObservedErrors);
    const itemWindowErrors = [];
    const itemWindow = normalizeWindow(raw.validity_window || validityWindow, itemWindowErrors, `evidence[${index}].validity_window`);
    itemErrors.push(...itemWindowErrors);
    const itemLocatorErrors = [];
    const itemLocator = normalizeLocator(raw.locator || primaryLocator, itemLocatorErrors, `evidence[${index}].locator`);
    itemErrors.push(...itemLocatorErrors);
    const freshness = raw.freshness || claim.freshness;
    let maxAgeDays = null;
    if (freshness !== undefined) {
      if (!isPlainObject(freshness) || !Number.isSafeInteger(freshness.max_age_days) || freshness.max_age_days < 0) itemErrors.push(`evidence[${index}]:FRESHNESS_INVALID`);
      else maxAgeDays = freshness.max_age_days;
    }
    const states = [];
    if (itemObservedAt && itemObservedAt > asOf) states.push('FUTURE');
    if (itemWindow && itemWindow.starts_at && asOf < itemWindow.starts_at) states.push('FUTURE');
    if (itemWindow && itemWindow.ends_at && asOf > itemWindow.ends_at) states.push('EXPIRED');
    if (maxAgeDays !== null && itemObservedAt) {
      const ageDays = (Date.parse(asOf) - Date.parse(itemObservedAt)) / 86400000;
      if (ageDays > maxAgeDays) states.push('STALE');
    }
    const policyStatus = String(raw.policy_status || raw.status || '').toLowerCase();
    if (itemKind === 'policy' && policyStatus === 'announced' && itemWindow && itemWindow.starts_at > asOf) states.push('POLICY_NOT_CURRENT');
    const role = source && String(source.source_role).toLowerCase();
    if (GENERATED_ROLES.has(role)) states.push('GENERATED_SOURCE');
    const temporalState = unique(states);
    timingStates.push(...temporalState);
    if (itemErrors.length) {
      errors.push(...itemErrors);
    }
    const eligible = Boolean(itemErrors.length === 0 && temporalState.length === 0 && source && source.source_hash && source.independence_group);
    if (eligible && relation === 'supports') {
      activeSupport.push({ source, itemKind, index });
    }
    if (eligible && relation === 'contradicts') {
      activeCounter.push({ source, itemKind, index });
    }
    evidence.push({
      index,
      relation: RELATIONS.has(relation) ? relation : null,
      evidence_kind: itemKind,
      source,
      observed_at: itemObservedAt,
      validity_window: itemWindow,
      locator: itemLocator,
      independence_group: source ? source.independence_group : null,
      source_role: source ? source.source_role : null,
      temporal_states: temporalState,
      eligible,
      status: itemErrors.length ? 'NEEDS_REVIEW' : (temporalState.length ? temporalState[0] : 'CURRENT'),
      reasons: unique(itemErrors),
    });
  });

  // Collapse copied/duplicated source identities transitively.  Counting
  // source_origin alone would let a hash-preserving copy appear independent;
  // counting raw groups would let copy chains inflate corroboration.
  const collapsedSupport = collapseEvidenceIdentities(activeSupport);
  const collapsedCounter = collapseEvidenceIdentities(activeCounter);
  for (const group of representativeGroups(collapsedSupport)) supportingGroups.add(group);
  for (const group of representativeGroups(collapsedCounter)) counterGroups.add(group);

  const reasons = [...errors];
  const text = claimText(claim);
  const reviewAttestation = validateReviewAttestation(
    options.reviewAttestation,
    claimId,
    asOf,
    activeSupport,
    options,
  );
  if (reviewAttestation.present && !reviewAttestation.valid) reasons.push(...reviewAttestation.reasons);
  if (claim.review_attestation !== undefined && options.reviewAttestation === undefined) {
    reasons.push('REVIEW_ATTESTATION_MUST_BE_SEPARATE');
  }
  if (claim.verified_fact === true) reasons.push('VERIFIED_FACT_CANNOT_BE_FORCED');
  if (GENERIC_CLAIM_RE.test(text)) reasons.push('GENERIC_METRIC_OR_GUARANTEE_REQUIRES_REVIEW');
  if (NO_SPEECH_RE.test(text) || claim.no_speech === true || claim.has_transcript === false) reasons.push('NO_SPEECH_NOT_INFERRED');
  if (sourceStatus === 'generated_or_unsupported') reasons.push('GENERATED_CLAIM_NOT_SELF_VERIFYING');
  if (sourceStatus === 'ambiguous') reasons.push('AMBIGUOUS_SOURCE_CLAIM');
  if (sourceStatus === 'needs_external_evidence') reasons.push('EXTERNAL_EVIDENCE_REQUIRED');
  const classificationStatus = SOURCE_STATUSES.has(claim.classification) ? claim.classification : null;
  if (classificationStatus === 'generated_or_unsupported' || claim.origin === 'generated') reasons.push('GENERATED_CLAIM_NOT_SELF_VERIFYING');
  if (classificationStatus === 'ambiguous') reasons.push('AMBIGUOUS_SOURCE_CLAIM');
  if (classificationStatus === 'needs_external_evidence') reasons.push('EXTERNAL_EVIDENCE_REQUIRED');
  if (classificationStatus && sourceStatus && classificationStatus !== sourceStatus) reasons.push('SOURCE_STATUS_CONFLICT');
  if (timingStates.includes('POLICY_NOT_CURRENT')) reasons.push('POLICY_FUTURE_NOT_CURRENT');
  if (timingStates.includes('FUTURE')) reasons.push('EVIDENCE_FUTURE_NOT_CURRENT');
  if (timingStates.includes('GENERATED_SOURCE') && activeSupport.length === 0) reasons.push('MODEL_SUMMARY_COURSE_NOT_VERIFIABLE');
  if (supportingGroups.size < 2 && activeSupport.length > 0) reasons.push('INSUFFICIENT_INDEPENDENCE');
  if (sourceSupported && activeSupport.length === 0) reasons.push('SOURCE_SUPPORTED_ONLY_NOT_VERIFIED');

  const blockedSourceStatus = [sourceStatus, classificationStatus].some(status => status !== null && status !== 'source_supported')
    || claim.origin === 'generated';
  const nonVerifiableSupport = activeSupport.some(item => NON_VERIFIABLE_KINDS.has(item.itemKind));
  if (nonVerifiableSupport) reasons.push('NON_FACT_EVIDENCE_NOT_VERIFIABLE');
  const currentCorroboration = errors.length === 0
    && activeSupport.length > 0
    && supportingGroups.size >= 2
    && claim.verified_fact !== true
    && !blockedSourceStatus
    && !nonVerifiableSupport
    && !timingStates.some(state => ['FUTURE', 'EXPIRED', 'STALE', 'POLICY_NOT_CURRENT', 'GENERATED_SOURCE'].includes(state))
    && !GENERIC_CLAIM_RE.test(text)
    && !NO_SPEECH_RE.test(text)
    && claim.has_transcript !== false
    && !NON_VERIFIABLE_KINDS.has(evidenceKind);

  const hasConflict = activeSupport.length > 0 && activeCounter.length > 0;
  let gateStatus = 'NEEDS_REVIEW';
  let verifiedFact = false;
  if (hasConflict) {
    gateStatus = 'DISPUTED';
    reasons.push('COUNTEREVIDENCE_CONFLICT');
  } else if (timingStates.includes('EXPIRED') && activeSupport.length === 0) {
    gateStatus = 'EXPIRED';
    reasons.push('EVIDENCE_EXPIRED');
  } else if (timingStates.includes('STALE') && activeSupport.length === 0) {
    gateStatus = 'STALE';
    reasons.push('EVIDENCE_STALE');
  } else if (currentCorroboration) {
    if (reviewAttestation.valid) {
      gateStatus = 'VERIFIED_FACT';
      verifiedFact = true;
    } else {
      gateStatus = 'CORROBORATED_CANDIDATE';
      reasons.push('REVIEW_ATTESTATION_REQUIRED');
    }
  }
  const flags = normalizeFlags(claim.flags);
  const useCases = {
    research: gateStatus === 'VERIFIED_FACT' && !flagsHaveUnresolved(flags) ? 'ALLOW' : 'CONDITIONAL',
    // A6 is not a release approval.  Even a separately reviewed fact may not
    // turn JSON flags into release authorization without a downstream release
    // gate, so release remains blocked here by design.
    release: 'BLOCKED',
  };
  if (gateStatus === 'NEEDS_REVIEW' && errors.length) useCases.research = 'CONDITIONAL';
  return {
    ...claim,
    schema: CLAIM_SCHEMA,
    claim_id: claimId,
    evidence_kind: evidenceKind,
    source_status: sourceStatus,
    source_supported: sourceSupported,
    verified_fact: verifiedFact,
    gate_status: gateStatus,
    as_of: asOf,
    flags,
    use_cases: useCases,
    independence: {
      supporting_groups: [...supportingGroups].sort(),
      counterevidence_groups: [...counterGroups].sort(),
      supporting_group_count: supportingGroups.size,
      counterevidence_group_count: counterGroups.size,
    },
    evidence,
    counterevidence: evidence.filter(item => item.relation === 'contradicts'),
    reasons: unique(reasons),
    review_attestation: reviewAttestation.present
      ? { status: reviewAttestation.valid ? 'VALIDATED' : 'NEEDS_REVIEW', reasons: reviewAttestation.reasons, value: reviewAttestation.value }
      : null,
    market_fact_verification: 'NOT_PERFORMED',
  };
}

function evaluateLedger(claims, evidence = [], options = {}) {
  const asOf = requireAsOf(options.asOf);
  if (!Array.isArray(claims)) fail('CLAIMS_REQUIRED', 'A6 requires a claims array');
  if (!Array.isArray(evidence)) fail('EVIDENCE_ARRAY_REQUIRED', 'A6 evidence must be an array');
  const extraByClaim = new Map();
  for (const item of evidence) {
    if (!isPlainObject(item) || typeof item.claim_id !== 'string') continue;
    if (!extraByClaim.has(item.claim_id)) extraByClaim.set(item.claim_id, []);
    extraByClaim.get(item.claim_id).push(item);
  }
  const evaluated = claims.map(claim => {
    const id = isPlainObject(claim) ? (claim.claim_id || claim.reader_claim_id) : null;
    let reviewAttestation = options.reviewAttestation;
    if (isPlainObject(options.reviewAttestations) && id && Object.prototype.hasOwnProperty.call(options.reviewAttestations, id)) {
      reviewAttestation = options.reviewAttestations[id];
    } else if (Array.isArray(options.reviewAttestations)) {
      reviewAttestation = options.reviewAttestations.find(item => isPlainObject(item) && item.claim_id === id);
    }
    return evaluateClaim(claim, {
      asOf,
      extraEvidence: extraByClaim.get(id) || [],
      reviewAttestation,
      reviewAttestationValidator: options.reviewAttestationValidator,
    });
  });
  const byState = {};
  const bySourceStatus = {};
  for (const claim of evaluated) {
    byState[claim.gate_status] = (byState[claim.gate_status] || 0) + 1;
    const status = claim.source_status || 'missing';
    bySourceStatus[status] = (bySourceStatus[status] || 0) + 1;
  }
  return {
    schema: RESULT_SCHEMA,
    contract: GATE_SCHEMA,
    ticket: 'A6',
    as_of: asOf,
    status: evaluated.every(claim => claim.gate_status === 'VERIFIED_FACT') ? 'PASS_FACT_GATE' : 'NEEDS_REVIEW',
    counts: {
      total: evaluated.length,
      verified_fact: evaluated.filter(claim => claim.verified_fact).length,
      source_supported: evaluated.filter(claim => claim.source_supported).length,
      by_state: Object.fromEntries(Object.entries(byState).sort(([a], [b]) => a.localeCompare(b))),
      by_source_status: Object.fromEntries(Object.entries(bySourceStatus).sort(([a], [b]) => a.localeCompare(b))),
    },
    claims: evaluated,
    external_fact_verification: 'NOT_PERFORMED',
    market_fact_verification: 'NOT_PERFORMED',
    no_public_score: true,
    no_rpm_or_retention_score: true,
    no_success_guarantee: true,
    no_writes: true,
    audit_only: true,
    input_hash: sha256(stableJson({ as_of: asOf, claims, evidence })),
  };
}

function resolveInside(root, relative, field = 'path') {
  const errors = [];
  const normalized = normalizeRelative(relative, errors, field);
  if (errors.length) fail('PATH_OUTSIDE_ROOT', `Invalid ${field}`, { errors });
  const rootAbs = path.resolve(root);
  const candidate = path.resolve(rootAbs, normalized);
  const rel = path.relative(rootAbs, candidate);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) fail('PATH_OUTSIDE_ROOT', `${field} must remain below project root`, { field });
  return candidate;
}

function assertNoLinkAncestors(root, candidate, field = 'path') {
  const rootAbs = path.resolve(root);
  const candidateAbs = path.resolve(candidate);
  const relative = path.relative(rootAbs, candidateAbs);
  if (relative.startsWith('..') || path.isAbsolute(relative)) fail('PATH_OUTSIDE_ROOT', `${field} must remain below project root`);
  const segments = relative ? relative.split(path.sep) : [];
  let current = rootAbs;
  const roots = [rootAbs];
  for (const segment of segments) {
    current = path.join(current, segment);
    roots.push(current);
  }
  for (const item of roots) {
    let stats;
    try { stats = fs.lstatSync(item); } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      fail('PATH_LINK', `${field} ancestor could not be inspected`);
    }
    if (stats.isSymbolicLink()) fail('PATH_LINK', `${field} contains a symbolic-link ancestor`);
    // On Windows junctions/reparse points may not report as symbolic links.
    // A realpath mismatch is a conservative fail-closed signal.
    try {
      const real = fs.realpathSync.native(item);
      if (path.resolve(real).toLowerCase() !== path.resolve(item).toLowerCase()) fail('PATH_LINK', `${field} contains a junction/reparse ancestor`);
    } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      fail('PATH_LINK', `${field} ancestor could not be resolved`);
    }
  }
}

function safeMkdirs(directory, root, field = 'output') {
  const rootAbs = path.resolve(root);
  const targetAbs = path.resolve(directory);
  const relative = path.relative(rootAbs, targetAbs);
  if (relative.startsWith('..') || path.isAbsolute(relative)) fail('PATH_OUTSIDE_ROOT', `${field} directory must remain below project root`);
  const segments = relative ? relative.split(path.sep) : [];
  let current = rootAbs;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stats;
    try { stats = fs.lstatSync(current); } catch (error) {
      if (!error || error.code !== 'ENOENT') fail('PATH_LINK', `${field} directory could not be inspected`);
      try { fs.mkdirSync(current); } catch (mkdirError) {
        if (!mkdirError || mkdirError.code !== 'EEXIST') fail('OUTPUT_WRITE_FAILED', `${field} directory could not be created`);
      }
      stats = fs.lstatSync(current);
    }
    if (!stats.isDirectory() || stats.isSymbolicLink()) fail('PATH_LINK', `${field} directory is not a safe directory`);
    assertNoLinkAncestors(rootAbs, current, field);
  }
}

function writeAuditOutput(root, outputPath, result) {
  const output = resolveInside(root, outputPath, 'output_path');
  const auditRoot = resolveInside(root, '_audit', 'audit_root');
  assertNoLinkAncestors(root, auditRoot, 'audit_root');
  assertNoLinkAncestors(root, output, 'output_path');
  const relativeToAudit = path.relative(auditRoot, output);
  if (!relativeToAudit || relativeToAudit.startsWith('..') || path.isAbsolute(relativeToAudit)) fail('OUTPUT_NOT_AUDIT', 'A6 output must remain below _audit');
  const normalizedOutput = outputPath.replaceAll('\\', '/');
  safeMkdirs(path.dirname(output), auditRoot, 'output_path');
  assertNoLinkAncestors(auditRoot, output, 'output_path');
  const content = `${stableJson(result)}\n`;
  const contentHash = sha256(content);
  const existingStats = (() => { try { return fs.lstatSync(output); } catch (error) { if (error && error.code === 'ENOENT') return null; fail('OUTPUT_WRITE_FAILED', 'A6 output could not be inspected'); } })();
  if (existingStats && (existingStats.isSymbolicLink() || !existingStats.isFile())) fail('OUTPUT_WRITE_FAILED', 'A6 output must be a regular file');
  if (existingStats) {
    const previous = fs.readFileSync(output);
    if (previous.toString('utf8') === content) {
      return { path: normalizedOutput, bytes: previous.length, sha256: sha256(previous), written: false, backup_path: null };
    }
    const backupPrefix = `${output}.previous-${sha256(previous).slice(0, 16)}`;
    let backup = backupPrefix;
    let suffix = 1;
    while (fs.existsSync(backup)) backup = `${backupPrefix}-${suffix++}`;
    fs.copyFileSync(output, backup, fs.constants.COPYFILE_EXCL);
    assertNoLinkAncestors(auditRoot, backup, 'output_backup');
    const backupRelative = path.relative(root, backup).replaceAll('\\', '/');
    const temp = `${output}.partial-${process.pid}-${Date.now()}`;
    try {
      fs.writeFileSync(temp, content, 'utf8');
      try { fs.renameSync(temp, output); } catch (error) {
        if (!error || !['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
        fs.writeFileSync(output, content, 'utf8');
        try { fs.unlinkSync(temp); } catch (_) { /* retain no history in output path */ }
      }
    } catch (error) {
      try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* best effort */ }
      fail('OUTPUT_WRITE_FAILED', 'A6 audit output could not be written');
    }
    return { path: normalizedOutput, bytes: Buffer.byteLength(content), sha256: contentHash, written: true, backup_path: backupRelative };
  }
  const temp = `${output}.partial-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temp, content, 'utf8');
    fs.renameSync(temp, output);
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* best effort */ }
    fail('OUTPUT_WRITE_FAILED', 'A6 audit output could not be written');
  }
  return { path: normalizedOutput, bytes: Buffer.byteLength(content), sha256: contentHash, written: true, backup_path: null };
}

function collectManifestFiles(manifest) {
  const files = new Map();
  const add = (entry, targetKey, role) => {
    if (!isPlainObject(entry)) return;
    const file = isPlainObject(entry.file) ? entry.file : entry;
    const sourcePath = typeof file.relativePath === 'string' ? file.relativePath : (typeof file.path === 'string' ? file.path : null);
    const sourceHash = typeof file.sha256 === 'string' ? file.sha256 : null;
    const bytes = Number.isSafeInteger(file.bytes) ? file.bytes : null;
    if (!sourcePath || !sourceHash || !HASH_RE.test(sourceHash)) return;
    const normalized = sourcePath.replaceAll('\\', '/');
    const current = files.get(normalized);
    if (current && (current.sha256 !== sourceHash || (current.bytes !== null && bytes !== null && current.bytes !== bytes))) fail('MANIFEST_SOURCE_CONFLICT', 'Approved manifest contains conflicting source identities', { sourcePath: normalized });
    files.set(normalized, { path: normalized, sha256: sourceHash, bytes, targetKey: targetKey || null, role: role || 'manifest' });
  };
  for (const target of Array.isArray(manifest.targets) ? manifest.targets : []) {
    if (!isPlainObject(target)) continue;
    add(target.source, target.targetKey, 'selected_target_source');
    add(target.sourceAtLock, target.targetKey, 'selected_target_source');
    if (target.ledgerRow) add({ relativePath: target.ledgerRow.sourcePath, sha256: target.ledgerRow.sourceSha256, bytes: target.ledgerRow.bytes }, target.targetKey, 'ledger_source');
    const context = target.pairedContext;
    for (const ref of context && Array.isArray(context.metadataRefs) ? context.metadataRefs : []) {
      add(ref, target.targetKey, ref && ref.role);
      for (const nested of ref && Array.isArray(ref.refs) ? ref.refs : []) add(nested, target.targetKey, ref.role);
    }
    add(context && context.summaryRef, target.targetKey, 'summary_context');
  }
  return files;
}

function loadApprovedManifest(root, options = {}) {
  const manifestRelative = (options.manifestPath || DEFAULT_MANIFEST).replaceAll('\\', '/');
  if (manifestRelative !== DEFAULT_MANIFEST) fail('MANIFEST_PATH_NOT_APPROVED', 'A6 only accepts the locked T01 manifest path');
  const expectedHash = options.manifestSha256 || APPROVED_MANIFEST_SHA256;
  if (typeof expectedHash !== 'string' || !HASH_RE.test(expectedHash) || expectedHash !== APPROVED_MANIFEST_SHA256) fail('MANIFEST_HASH_NOT_APPROVED', 'A6 only accepts the approved locked T01 manifest hash');
  const file = resolveInside(root, manifestRelative, 'manifest_path');
  assertNoLinkAncestors(root, file, 'manifest_path');
  let value;
  try { value = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { fail('MANIFEST_INVALID', 'The locked T01 manifest could not be read as JSON'); }
  if (!isPlainObject(value) || value.schema !== 'h2dev.t01-s1.preflight-target-manifest.v1' || value.runId !== 'T01-S1-20260910-01' || value.status !== 'LOCKED_PREFLIGHT_READY') fail('MANIFEST_INVALID', 'The T01 manifest is not the approved locked revision');
  const actualHash = hashFile(file);
  if (actualHash !== expectedHash) fail('MANIFEST_HASH_MISMATCH', 'The locked T01 manifest hash drifted', { expectedHash, actualHash });
  const files = collectManifestFiles(value);
  if (files.size === 0 || !Array.isArray(value.targets) || value.targets.length !== 8) fail('MANIFEST_INVALID', 'The locked T01 manifest has no exact approved target sources');
  const targets = new Map();
  for (const target of value.targets) if (target && typeof target.targetKey === 'string') targets.set(target.targetKey, target);
  return { relative: manifestRelative, file, value, sha256: actualHash, bytes: fs.statSync(file).size, files, targets };
}

function readJsonFile(root, relative, field) {
  const file = resolveInside(root, relative, field);
  assertNoLinkAncestors(root, file, field);
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!isPlainObject(value)) fail('READER_INPUT_INVALID', `${field} must contain an object`);
    return { file, relative: relative.replaceAll('\\', '/'), value, sha256: hashFile(file), bytes: fs.statSync(file).size };
  } catch (error) {
    if (error instanceof EvidenceGateError) throw error;
    fail('READER_INPUT_INVALID', `${field} could not be read as JSON`);
  }
}

function parseSegmentRanges(rawLocator, identityMode = false) {
  const result = [];
  const errors = [];
  const matches = [...String(rawLocator || '').matchAll(/\[([^\]]+)\]/g)];
  for (const match of matches) {
    const values = match[1].split(',').map(value => value.trim()).filter(Boolean);
    if (!values.every(value => /^\d+$/.test(value))) {
      errors.push('SEGMENT_ANCHOR_NON_NUMERIC');
      continue;
    }
    const numbers = values.map(Number);
    if (identityMode) {
      numbers.forEach(number => result.push({ segment_start: number, segment_end: number }));
    } else if (numbers.length === 1) {
      result.push({ segment_start: numbers[0], segment_end: numbers[0] });
    } else if (numbers.length === 2) {
      result.push({ segment_start: numbers[0], segment_end: numbers[1] });
    } else {
      // Reader locators such as "[32,35,37]" enumerate individual segments;
      // preserve each anchor rather than guessing a range or dropping it.
      numbers.forEach(number => result.push({ segment_start: number, segment_end: number }));
    }
  }
  return { ranges: result, errors };
}

function targetVideoId(targetKey, sourcePath) {
  const slash = String(targetKey || '').split('/');
  if (slash.length > 1) return slash[1];
  if (String(targetKey || '').startsWith('VIDEO-')) return targetKey;
  return path.posix.basename(sourcePath).replace(/_transcript\.json$/i, '');
}

function rawFolderFromTranscript(sourcePath) {
  return path.posix.dirname(path.posix.dirname(sourcePath));
}

function sourceLocator(type, raw, ranges) {
  if (type === 'transcript') {
    const first = ranges[0] || null;
    return first ? { type: 'segments', segment_start: first.segment_start, segment_end: first.segment_end, index_base: 0, inclusive: true } : { type: 'text', value: raw };
  }
  if (type === 'top-videos') {
    const pointer = String(raw).match(/(\/videos\/\d+)/i);
    return { type: 'json_pointer', pointer: pointer ? pointer[1] : '' };
  }
  return { type: 'section', value: String(raw) };
}

function inferDiverseSources(claim, target) {
  const raw = String(claim.locator || '');
  const lower = raw.toLowerCase();
  const sourcePath = String(target.sourcePath || target.source_path).replaceAll('\\', '/');
  const folder = rawFolderFromTranscript(sourcePath);
  const videoId = targetVideoId(target.targetKey, sourcePath);
  const sources = [];
  const rangesInfo = parseSegmentRanges(raw, /exact\s+identity/i.test(raw));
  if (lower.includes('transcript')) {
    sources.push({ type: 'transcript', path: sourcePath, ranges: rangesInfo.ranges, parseErrors: rangesInfo.errors });
  }
  const docMatch = raw.match(/(docs\/[A-Za-z0-9._~\-/]+(?:README\.md|description\.html))/i);
  if (docMatch) sources.push({ type: 'document', path: docMatch[1].replaceAll('\\', '/') });
  else if (/\bREADME\b/i.test(raw) && sourcePath.startsWith('video/')) sources.push({ type: 'document', path: `docs/${videoId}/README.md` });
  const summaryMatch = raw.match(/([A-Za-z0-9_-]+_summary_vi\.md)/i);
  if (summaryMatch || lower.includes('summary')) sources.push({ type: 'summary', path: `${folder}/transcripts/${summaryMatch ? summaryMatch[1] : `${videoId}_summary_vi.md`}` });
  if (lower.includes('top-videos')) sources.push({ type: 'top-videos', path: `${folder}/top-videos.json` });
  if (lower.includes('channel-profile')) sources.push({ type: 'channel-profile', path: `${folder}/channel-profile.json` });
  if (!sources.length) sources.push({ type: 'transcript', path: sourcePath, ranges: rangesInfo.ranges, parseErrors: rangesInfo.errors });
  return { sources, raw, rangesErrors: rangesInfo.errors };
}

function chunkManifestFor(root, reader) {
  const relative = `_audit/20260910-t01-s1/readers/${reader}/chunks/MANIFEST.json`;
  const file = resolveInside(root, relative, 'chunk_manifest');
  if (!fs.existsSync(file)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { file, relative, value };
  } catch (_) {
    return null;
  }
}

function validateTranscriptAnchor(root, reader, targetKey, sourceFile, ranges, expectedSegmentCount) {
  const errors = [];
  let source;
  try { source = JSON.parse(fs.readFileSync(sourceFile, 'utf8')); } catch (_) { errors.push('TRANSCRIPT_JSON_INVALID'); }
  const segments = source && Array.isArray(source.segments) ? source.segments : [];
  if (!segments.length) errors.push('TRANSCRIPT_SEGMENTS_MISSING');
  const actualCount = segments.length;
  if (Number.isSafeInteger(expectedSegmentCount) && actualCount !== expectedSegmentCount) errors.push('SEGMENT_COUNT_MISMATCH');
  const manifest = chunkManifestFor(root, reader);
  const chunks = manifest && Array.isArray(manifest.value.chunks)
    ? manifest.value.chunks.filter(item => item && item.targetKey === targetKey)
    : [];
  if (!chunks.length) errors.push('CHUNK_MANIFEST_TARGET_MISSING');
  const checkedChunks = new Set();
  for (const range of ranges) {
    if (!Number.isSafeInteger(range.segment_start) || !Number.isSafeInteger(range.segment_end) || range.segment_start < 0 || range.segment_end >= actualCount || range.segment_end < range.segment_start) {
      errors.push('SEGMENT_ANCHOR_OUT_OF_RANGE');
      continue;
    }
    const covering = chunks
      .filter(item => item.endSegmentIndex >= range.segment_start && item.startSegmentIndex <= range.segment_end)
      .sort((left, right) => left.startSegmentIndex - right.startSegmentIndex);
    let cursor = range.segment_start;
    const coveredChunks = [];
    for (const chunk of covering) {
      if (chunk.startSegmentIndex > cursor) break;
      if (chunk.endSegmentIndex >= cursor) {
        coveredChunks.push(chunk);
        cursor = chunk.endSegmentIndex + 1;
        if (cursor > range.segment_end) break;
      }
    }
    if (cursor <= range.segment_end) {
      errors.push('SEGMENT_ANCHOR_NOT_IN_CHUNK');
      continue;
    }
    for (const chunk of coveredChunks) {
      checkedChunks.add(chunk.path);
      const chunkFile = resolveInside(root, chunk.path, 'chunk_path');
      try {
        if (fs.statSync(chunkFile).size !== chunk.bytes) errors.push('CHUNK_BYTES_MISMATCH');
      } catch (_) {
        errors.push('CHUNK_FILE_MISSING');
      }
    }
  }
  if (!ranges.length) errors.push('SEGMENT_LOCATOR_REQUIRED');
  return {
    status: errors.length ? 'NEEDS_REVIEW' : 'PASS',
    errors: unique(errors),
    segment_count: actualCount,
    ranges: ranges.map(range => ({ ...range, index_base: 0, inclusive: true })),
    chunk_paths: [...checkedChunks].sort(),
  };
}

function resolveJsonPointer(value, pointer) {
  if (pointer === '') return value;
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) return undefined;
  let current = value;
  for (const token of pointer.slice(1).split('/').map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'))) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, token)) return undefined;
    current = current[token];
  }
  return current;
}

function validateSourceAnchor(root, reader, targetKey, sourcePath, sourceType, locator, ranges, expectedSegmentCount) {
  const errors = [];
  const file = resolveInside(root, sourcePath, 'source_path');
  if (!fs.existsSync(file)) return { status: 'NEEDS_REVIEW', errors: ['SOURCE_FILE_MISSING'] };
  if (sourceType === 'transcript') return validateTranscriptAnchor(root, reader, targetKey, file, ranges, expectedSegmentCount);
  if (sourceType === 'top-videos' || sourceType === 'channel-profile') {
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (locator.type === 'json_pointer' && resolveJsonPointer(value, locator.pointer) === undefined) errors.push('JSON_POINTER_MISSING');
    } catch (_) {
      errors.push('SOURCE_JSON_INVALID');
    }
  } else if (locator.type !== 'section' && locator.type !== 'text') {
    errors.push('NON_TRANSCRIPT_LOCATOR_INVALID');
  }
  if (fs.statSync(file).size === 0) errors.push('SOURCE_FILE_EMPTY');
  return { status: errors.length ? 'NEEDS_REVIEW' : 'PASS', errors: unique(errors) };
}

function materializeSource(root, reader, targetKey, target, rawSource, rawLocator, observedAt, evidenceKind, approved = null) {
  const errors = [...(rawSource.parseErrors || [])];
  const sourcePath = rawSource.path.replaceAll('\\', '/');
  let actualHash = null;
  let bytes = null;
  let exists = false;
  try {
    const file = resolveInside(root, sourcePath, 'source_path');
    assertNoLinkAncestors(root, file, 'source_path');
    exists = fs.existsSync(file);
    if (exists) {
      actualHash = hashFile(file);
      bytes = fs.statSync(file).size;
    } else errors.push('SOURCE_FILE_MISSING');
    const locator = sourceLocator(rawSource.type, rawLocator, rawSource.ranges || []);
    const anchor = validateSourceAnchor(root, reader, targetKey, sourcePath, rawSource.type, locator, rawSource.ranges || [], target.segmentCount);
    errors.push(...(anchor.errors || []));
    const expectedHash = approved && typeof approved.sha256 === 'string'
      ? approved.sha256
      : (rawSource.type === 'transcript' && typeof target.sourceSha256 === 'string' ? target.sourceSha256 : null);
    if (expectedHash && actualHash !== expectedHash) errors.push('SOURCE_HASH_MISMATCH');
    if (approved && Number.isSafeInteger(approved.bytes) && bytes !== approved.bytes) errors.push('SOURCE_BYTES_MISMATCH');
    return {
      relation: 'supports',
      evidence_kind: evidenceKind,
      source_path: sourcePath,
      source_hash: actualHash ? { algorithm: 'sha256', value: actualHash } : null,
      source_origin: `T01:${targetKey}`,
      source_copy_id: `T01:${targetKey}:${sourcePath}`,
      independence_group: `T01:${targetKey}`,
      source_role: rawSource.type === 'summary' ? 'summary' : 'primary',
      source_id: `${reader}:${targetKey}:${sourcePath}`,
      observed_at: observedAt,
      validity_window: { starts_at: observedAt, ends_at: null },
      locator,
      anchor_validation: { ...anchor, actual_hash: actualHash, expected_hash: expectedHash, bytes, exists },
      import_errors: unique(errors),
    };
  } catch (error) {
    if (error instanceof EvidenceGateError) errors.push(error.code);
    else errors.push('SOURCE_INSPECTION_FAILED');
    return {
      relation: 'supports', evidence_kind: evidenceKind, source_path: sourcePath, source_hash: actualHash ? { algorithm: 'sha256', value: actualHash } : null,
      source_origin: `T01:${targetKey}`, source_copy_id: `T01:${targetKey}:${sourcePath}`, independence_group: `T01:${targetKey}`,
      source_role: rawSource.type === 'summary' ? 'summary' : 'primary', source_id: `${reader}:${targetKey}:${sourcePath}`,
      observed_at: observedAt, validity_window: { starts_at: observedAt, ends_at: null }, locator: sourceLocator(rawSource.type, rawLocator, rawSource.ranges || []),
      anchor_validation: { status: 'NEEDS_REVIEW', errors: unique(errors) }, import_errors: unique(errors),
    };
  }
}

function reportTargetMap(report) {
  const result = new Map();
  if (Array.isArray(report.targets)) for (const target of report.targets) if (isPlainObject(target) && typeof target.targetKey === 'string') result.set(target.targetKey, target);
  return result;
}

function targetFromLong(report) {
  return {
    targetKey: report.scope.targetKey,
    sourcePath: report.scope.sourcePath,
    sourceSha256: report.scope.sourceSha256,
    sourceBytes: report.scope.sourceBytes,
    segmentCount: report.scope.segmentCount,
    languageAlignment: report.languageAlignment,
    timestamp: report.metadataDelta,
    rightsAndProvenance: { status: 'UNKNOWN' },
  };
}

function targetManifestErrors(target, approvedTarget) {
  const errors = [];
  if (!approvedTarget || !isPlainObject(approvedTarget.source)) return ['TARGET_NOT_APPROVED_BY_T01_MANIFEST'];
  const source = approvedTarget.source;
  const reportPath = String(target.sourcePath || target.source_path || '').replaceAll('\\', '/');
  if (reportPath !== String(source.relativePath || '').replaceAll('\\', '/')) errors.push('TARGET_SOURCE_PATH_MISMATCH');
  if (target.sourceSha256 !== undefined && target.sourceSha256 !== source.sha256) errors.push('TARGET_SOURCE_HASH_MISMATCH');
  if (target.sourceBytes !== undefined && Number(target.sourceBytes) !== Number(source.bytes)) errors.push('TARGET_SOURCE_BYTES_MISMATCH');
  if (target.segmentCount !== undefined && approvedTarget.ledgerRow && Number(target.segmentCount) !== Number(approvedTarget.ledgerRow.segmentCount)) errors.push('TARGET_SEGMENT_COUNT_MISMATCH');
  return errors;
}

function importedClaim(root, reader, reportMeta, target, rawClaim, sourceStatus, sourceKind, observedAt, sources, extra = {}) {
  const claimId = `${reader}:${rawClaim.id}`;
  const anchorErrors = [...(target.manifestErrors || []), ...sources.flatMap(source => source.import_errors || [])];
  const reportRelative = reportMeta.relative;
  const flags = {
    rights: target.rightsAndProvenance && target.rightsAndProvenance.rightsVerified === true ? 'VERIFIED' : 'UNKNOWN',
    translation: target.languageAlignment && target.languageAlignment.alignmentStatus === 'PASS' ? 'PASS' : 'NEEDS_REVIEW',
    identity: sourceStatus === 'source_supported' ? 'NEEDS_REVIEW' : 'NEEDS_REVIEW',
    timebase: 'NEEDS_REVIEW',
  };
  return {
    schema: CLAIM_SCHEMA,
    claim_id: claimId,
    reader_claim_id: rawClaim.id,
    reader,
    target_key: target.targetKey,
    text: rawClaim.claim || rawClaim.topic || rawClaim.id,
    topic: rawClaim.topic || null,
    source_status: sourceStatus,
    source_supported: sourceStatus === 'source_supported',
    verified_fact: false,
    evidence_kind: sourceKind,
    observed_at: observedAt,
    validity_window: { starts_at: observedAt, ends_at: null },
    locator: sources[0] ? sources[0].locator : null,
    flags,
    source_excerpt: rawClaim.exactSourceSnippet || null,
    source_translation_excerpt: rawClaim.exactTranslationSnippet || null,
    reader_report: { path: reportRelative, sha256: reportMeta.sha256, bytes: reportMeta.bytes },
    classification: rawClaim.classification || sourceStatus,
    import_status: anchorErrors.length ? 'NEEDS_REVIEW' : 'IMPORTED_STRUCTURAL_PASS',
    import_errors: unique(anchorErrors),
    sources,
    ...extra,
  };
}

function importReviewedClaims(options = {}) {
  const root = path.resolve(options.projectRoot || process.cwd());
  const asOf = requireAsOf(options.asOf);
  const approvedManifest = loadApprovedManifest(root, options);
  const diverseRelative = options.diversePath || DEFAULT_DIVERSE;
  const longRelative = options.longPath || DEFAULT_LONG;
  if (diverseRelative.replaceAll('\\', '/') !== DEFAULT_DIVERSE || longRelative.replaceAll('\\', '/') !== DEFAULT_LONG) fail('READER_PATH_NOT_APPROVED', 'A6 only accepts the reviewed T01 reader report paths');
  const diverseMeta = readJsonFile(root, diverseRelative, 'reader-diverse');
  const longMeta = readJsonFile(root, longRelative, 'reader-long');
  const claims = [];
  const categoryOrder = ['source_supported', 'ambiguous', 'generated_or_unsupported', 'needs_external_evidence'];
  const kindFor = status => status === 'generated_or_unsupported' ? 'inference' : 'fact';
  const diverseTargets = reportTargetMap(diverseMeta.value);
  const diverseObserved = normalizeIso(diverseMeta.value.recordedAtUtc, [], 'reader-diverse.recordedAtUtc', { importer: true });
  if (!diverseObserved) fail('READER_DATE_INVALID', 'reader-diverse has no valid recorded date');
  for (const status of categoryOrder) {
    const rows = diverseMeta.value.claimLedger && Array.isArray(diverseMeta.value.claimLedger[status]) ? diverseMeta.value.claimLedger[status] : [];
    for (const rawClaim of rows) {
      if (!isPlainObject(rawClaim) || typeof rawClaim.id !== 'string') continue;
      const target = diverseTargets.get(rawClaim.targetKey);
      if (!target) {
        claims.push(importedClaim(root, 'reader-diverse', diverseMeta, { targetKey: rawClaim.targetKey, sourcePath: '', segmentCount: 0, manifestErrors: ['TARGET_MISSING'] }, rawClaim, status, kindFor(status), diverseObserved, []));
        continue;
      }
      const approvedTarget = approvedManifest.targets.get(target.targetKey);
      const targetWithManifest = { ...target, manifestErrors: targetManifestErrors(target, approvedTarget) };
      const inferred = inferDiverseSources(rawClaim, targetWithManifest);
      const sources = inferred.sources.map(source => {
        const approved = approvedManifest.files.get(source.path.replaceAll('\\', '/'));
        const approvedForTarget = approved && approved.targetKey && approved.targetKey !== target.targetKey
          && approved.role === 'selected_target_source' ? null : approved;
        const material = approvedForTarget
          ? materializeSource(root, 'reader-diverse', target.targetKey, targetWithManifest, source, inferred.raw, diverseObserved, kindFor(status), approvedForTarget)
          : {
            relation: 'supports', evidence_kind: kindFor(status), source_path: source.path.replaceAll('\\', '/'), source_hash: null,
            source_origin: `T01:${target.targetKey}`, source_copy_id: `T01:${target.targetKey}:${source.path.replaceAll('\\', '/')}`,
            independence_group: `T01:${target.targetKey}`, source_role: source.type === 'summary' ? 'summary' : 'primary',
            source_id: `reader-diverse:${target.targetKey}:${source.path.replaceAll('\\', '/')}`, observed_at: diverseObserved,
            validity_window: { starts_at: diverseObserved, ends_at: null }, locator: sourceLocator(source.type, inferred.raw, source.ranges || []),
            anchor_validation: { status: 'NEEDS_REVIEW', errors: [approved ? 'SOURCE_TARGET_MISMATCH' : 'SOURCE_NOT_APPROVED_BY_T01_MANIFEST'] }, import_errors: [approved ? 'SOURCE_TARGET_MISMATCH' : 'SOURCE_NOT_APPROVED_BY_T01_MANIFEST'],
          };
        return { ...material, locator: sourceLocator(source.type, inferred.raw, source.ranges || []) };
      });
      claims.push(importedClaim(root, 'reader-diverse', diverseMeta, targetWithManifest, rawClaim, status, kindFor(status), diverseObserved, sources));
    }
  }
  const longReport = longMeta.value;
  const longTargetRaw = targetFromLong(longReport);
  const longTarget = { ...longTargetRaw, manifestErrors: targetManifestErrors(longTargetRaw, approvedManifest.targets.get(longTargetRaw.targetKey)) };
  const longObserved = normalizeIso(longReport.generatedAtUtc, [], 'reader-long.generatedAtUtc', { importer: true });
  if (!longObserved) fail('READER_DATE_INVALID', 'reader-long has no valid generated date');
  for (const rawClaim of Array.isArray(longReport.materialClaimLedger) ? longReport.materialClaimLedger : []) {
    if (!isPlainObject(rawClaim) || typeof rawClaim.id !== 'string') continue;
    const locator = rawClaim.locator;
    const ranges = locator && Number.isSafeInteger(locator.segmentStart) && Number.isSafeInteger(locator.segmentEnd)
      ? [{ segment_start: locator.segmentStart, segment_end: locator.segmentEnd }]
      : [];
    const sourcePath = String(longTarget.sourcePath || '').replaceAll('\\', '/');
    const approved = approvedManifest.files.get(sourcePath);
    const approvedForTarget = approved && approved.targetKey && approved.targetKey !== longTarget.targetKey && approved.role === 'selected_target_source' ? null : approved;
    const source = approvedForTarget
      ? materializeSource(root, 'reader-long', longTarget.targetKey, longTarget, { type: 'transcript', path: sourcePath, ranges, parseErrors: [] }, rawClaim.topic || rawClaim.id, longObserved, kindFor(rawClaim.classification), approvedForTarget)
      : {
        relation: 'supports', evidence_kind: kindFor(rawClaim.classification), source_path: sourcePath, source_hash: null,
        source_origin: `T01:${longTarget.targetKey}`, source_copy_id: `T01:${longTarget.targetKey}:${sourcePath}`, independence_group: `T01:${longTarget.targetKey}`,
        source_role: 'primary', source_id: `reader-long:${longTarget.targetKey}:${sourcePath}`, observed_at: longObserved,
        validity_window: { starts_at: longObserved, ends_at: null }, locator: { type: 'segments', segment_start: ranges[0] ? ranges[0].segment_start : 0, segment_end: ranges[0] ? ranges[0].segment_end : 0, index_base: 0, inclusive: true },
        anchor_validation: { status: 'NEEDS_REVIEW', errors: [approved ? 'SOURCE_TARGET_MISMATCH' : 'SOURCE_NOT_APPROVED_BY_T01_MANIFEST'] }, import_errors: [approved ? 'SOURCE_TARGET_MISMATCH' : 'SOURCE_NOT_APPROVED_BY_T01_MANIFEST'],
      };
    const sourceStatus = SOURCE_STATUSES.has(rawClaim.classification) ? rawClaim.classification : 'needs_external_evidence';
    claims.push(importedClaim(root, 'reader-long', longMeta, longTarget, rawClaim, sourceStatus, kindFor(sourceStatus), longObserved, [source], {
      locator: locator && isPlainObject(locator) ? { type: 'segments', segment_start: locator.segmentStart, segment_end: locator.segmentEnd, index_base: 0, inclusive: true } : null,
    }));
  }
  const qualifiedIds = claims.map(claim => claim.claim_id);
  const duplicateIds = qualifiedIds.filter((id, index) => qualifiedIds.indexOf(id) !== index);
  const expectedByReader = { 'reader-diverse': categoryOrder.reduce((sum, status) => sum + ((diverseMeta.value.claimLedger && Array.isArray(diverseMeta.value.claimLedger[status])) ? diverseMeta.value.claimLedger[status].length : 0), 0), 'reader-long': Array.isArray(longReport.materialClaimLedger) ? longReport.materialClaimLedger.length : 0 };
  const expectedTotal = expectedByReader['reader-diverse'] + expectedByReader['reader-long'];
  const importedByReader = claims.reduce((out, claim) => { out[claim.reader] = (out[claim.reader] || 0) + 1; return out; }, {});
  const expectedIds = [];
  for (const status of categoryOrder) for (const claim of (diverseMeta.value.claimLedger && Array.isArray(diverseMeta.value.claimLedger[status]) ? diverseMeta.value.claimLedger[status] : [])) if (claim && claim.id) expectedIds.push(`reader-diverse:${claim.id}`);
  for (const claim of (Array.isArray(longReport.materialClaimLedger) ? longReport.materialClaimLedger : [])) if (claim && claim.id) expectedIds.push(`reader-long:${claim.id}`);
  const importedIdSet = new Set(qualifiedIds);
  const expectedIdSet = new Set(expectedIds);
  const missingIds = expectedIds.filter(id => !importedIdSet.has(id));
  const unexpectedIds = qualifiedIds.filter(id => !expectedIdSet.has(id));
  const classificationCounts = {};
  for (const claim of claims) classificationCounts[claim.source_status] = (classificationCounts[claim.source_status] || 0) + 1;
  const sourceHashes = [];
  for (const claim of claims) for (const source of claim.sources || []) if (source.source_hash) sourceHashes.push({ path: source.source_path, sha256: source.source_hash.value });
  const reconciliation = {
    expected_total: expectedTotal,
    imported_total: claims.length,
    unique_total: importedIdSet.size,
    expected_by_reader: expectedByReader,
    imported_by_reader: importedByReader,
    expected_ids_count: expectedIdSet.size,
    missing_reader_claim_ids: missingIds,
    unexpected_reader_claim_ids: unexpectedIds,
    duplicate_reader_claim_ids: unique(duplicateIds).sort(),
    classification_counts: Object.fromEntries(Object.entries(classificationCounts).sort(([a], [b]) => a.localeCompare(b))),
    count_preserving: expectedTotal === claims.length && importedIdSet.size === expectedIdSet.size && missingIds.length === 0 && unexpectedIds.length === 0 && duplicateIds.length === 0,
  };
  return {
    schema: IMPORT_SCHEMA,
    ticket: 'A6',
    as_of: asOf,
    mode: 'AUDIT_ONLY_IMPORT',
    claims,
    reconciliation,
    source_hashes: sourceHashes.sort((a, b) => a.path.localeCompare(b.path) || a.sha256.localeCompare(b.sha256)),
    reader_reports: [
      { reader: 'reader-diverse', path: diverseMeta.relative, sha256: diverseMeta.sha256, bytes: diverseMeta.bytes },
      { reader: 'reader-long', path: longMeta.relative, sha256: longMeta.sha256, bytes: longMeta.bytes },
    ],
    approved_manifest: { path: approvedManifest.relative, sha256: approvedManifest.sha256, bytes: approvedManifest.bytes },
    external_fact_verification: 'NOT_PERFORMED',
    market_fact_verification: 'NOT_PERFORMED',
    no_writes: true,
    audit_only: true,
    input_hash: sha256(stableJson({ as_of: asOf, diverse: diverseMeta.sha256, long: longMeta.sha256, claims })),
  };
}

function run(options = {}) {
  const asOf = requireAsOf(options.asOf);
  const imported = importReviewedClaims({ ...options, asOf });
  const gate = evaluateLedger(imported.claims, [], { asOf });
  const result = {
    ...gate,
    importer: {
      schema: imported.schema,
      mode: imported.mode,
      reconciliation: imported.reconciliation,
      reader_reports: imported.reader_reports,
      source_hashes: imported.source_hashes,
      approved_manifest: imported.approved_manifest,
    },
    current_96_claim_outcomes: {
      total: imported.claims.length,
      gate_status: gate.status,
      verified_fact: gate.counts.verified_fact,
      market_facts_verified: false,
      note: 'Imported reviewed claims are source-grounded queue records only; no external market/fact verification was performed.',
    },
    no_writes: true,
    audit_only: true,
  };
  if (options.outputPath) {
    const root = path.resolve(options.projectRoot || process.cwd());
    const outputPath = options.outputPath.replaceAll('\\', '/');
    const output = resolveInside(root, outputPath, 'output_path');
    const auditRoot = path.resolve(root, '_audit');
    const relative = path.relative(auditRoot, output);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) fail('OUTPUT_NOT_AUDIT', 'A6 output must remain below _audit');
    assertNoLinkAncestors(root, output, 'output_path');
    // Compare against the content that would truthfully describe a write.  A
    // deterministic rerun with the same bytes does not rewrite history.
    const existing = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : null;
    result.output_path = outputPath;
    const writeCandidate = { ...result, no_writes: false, output_written: true };
    const candidateContent = `${stableJson(writeCandidate)}\n`;
    if (existing !== null && existing === candidateContent) {
      result.no_writes = true;
      result.output_written = false;
      result.output = { path: outputPath, bytes: Buffer.byteLength(existing), sha256: sha256(existing), written: false, backup_path: null };
    } else {
      result.no_writes = false;
      result.output_written = true;
      const outputInfo = writeAuditOutput(root, outputPath, result);
      result.output = outputInfo;
    }
  }
  return result;
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function cli(argv = process.argv.slice(2)) {
  try {
    if (argv.includes('--help') || argv.includes('-h')) {
      process.stdout.write('A6 audit-only evidence gate\n  node scripts/gates/evidence-gate.cjs --project-root <root> --as-of <UTC> --output <_audit/path>\n');
      return 0;
    }
    const root = valueAfter(argv, '--project-root') || valueAfter(argv, '--root');
    if (!root) fail('PROJECT_ROOT_REQUIRED', 'A6 requires an explicit project root');
    const asOf = valueAfter(argv, '--as-of');
    const output = valueAfter(argv, '--output');
    if (!output) fail('OUTPUT_REQUIRED', 'A6 requires an audit output path');
    const result = run({
      projectRoot: root,
      asOf,
      outputPath: output,
      diversePath: valueAfter(argv, '--diverse'),
      longPath: valueAfter(argv, '--long'),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    const output = { schema: RESULT_SCHEMA, ticket: 'A6', status: 'ERROR', error: { code: error.code || 'A6_RUNTIME_ERROR', message: error instanceof EvidenceGateError ? error.message : 'A6 evidence gate failed' }, no_writes: true, audit_only: true };
    process.stderr.write(`${JSON.stringify(output, null, 2)}\n`);
    return 2;
  }
}

module.exports = {
  GATE_SCHEMA,
  IMPORT_SCHEMA,
  CLAIM_SCHEMA,
  RESULT_SCHEMA,
  EVIDENCE_KINDS: Object.freeze([...EVIDENCE_KINDS]),
  EvidenceGateError,
  evaluateClaim,
  evaluateLedger,
  importReviewedClaims,
  run,
  cli,
};

if (require.main === module) process.exitCode = cli();
