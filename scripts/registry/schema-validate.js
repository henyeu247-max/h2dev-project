/**
 * A1 strict runtime validator for the H2DEV contract profile.
 *
 * This intentionally supports only the keyword subset declared in
 * data/registry/schemas/index.v1.json.  It is paired with the materialised
 * contract files and adds registry semantics (refs, revisions, identity and
 * trust promotion) that a field-only JSON schema cannot express.
 *
 * @module schema-validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_SCHEMA_DIR = path.join(ROOT, 'data', 'registry', 'schemas');

/** @typedef {Record<string, any>} JsonObject */
/** @typedef {{code: string, path: string, message: string}} ContractError */

const STATUS_VALUES = new Set([
  'draft', 'proposed', 'pending', 'active', 'observed', 'unverified',
  'needs_review', 'verified', 'corroborated', 'approved', 'rejected',
  'stale', 'expired', 'blocked', 'ready', 'in_progress', 'complete',
  'failed', 'cancelled', 'tombstoned', 'needs_adapter', 'published',
  'private_candidate', 'archived', 'superseded', 'unknown'
]);

const ENTITY_PREFIXES = Object.freeze({
  source_asset: 'SRC-',
  source_observation: 'OBS-',
  learning_sku: 'LSKU-',
  competitor_channel: 'CH-',
  owned_channel: 'OWN-CH-',
  competitor_video: 'CV-',
  niche: 'NICHE-',
  claim: 'CLM-',
  evidence: 'EVD-',
  niche_decision: 'DEC-',
  production_episode: 'EP-',
  artifact: 'ART-',
  job_run: 'RUN-',
  metric_snapshot: 'MET-',
  relationship: 'REL-',
  deletion_request: 'DEL-',
  policy_snapshot: 'POL-'
});

const ENTITY_TYPES = Object.freeze(Object.keys(ENTITY_PREFIXES));

// Keep this map in lockstep with schema-contracts.js/index.v1.json. Source
// identity intentionally uses the content hash only: alternate locators for
// identical bytes are provenance relations, not a second canonical asset.
const ENTITY_IDENTITY_FIELDS = Object.freeze(Object.assign(Object.create(null), {
  source_asset: ['content_hash.value'],
  source_observation: ['source_ref', 'observed_at', 'observation_key'],
  learning_sku: ['legacy_sku'],
  competitor_channel: ['platform', 'channel_id'],
  owned_channel: ['platform', 'channel_id'],
  competitor_video: ['platform', 'video_id'],
  niche: ['market', 'label', 'format'],
  claim: ['statement', 'scope.market', 'scope.as_of'],
  evidence: ['source_ref', 'source_locator.value', 'checked_at'],
  niche_decision: ['niche_ref', 'market', 'language', 'decided_at'],
  production_episode: ['series', 'brief', 'created_at'],
  artifact: ['parent_ref', 'artifact_type', 'content_hash.value'],
  job_run: ['stage', 'created_at', 'provenance.activity_id'],
  metric_snapshot: ['entity_ref', 'measurement_system', 'metric', 'collected_at'],
  relationship: ['from', 'type', 'to', 'valid_from'],
  deletion_request: ['request_scope.kind', 'received_at', 'owner'],
  policy_snapshot: ['policy_type', 'canonical_url', 'retrieved_at']
}));

const REF_FIELDS = Object.freeze({
  source_observation: { source_ref: ['source_asset', 'source_observation'] },
  learning_sku: {
    media_refs: 'any', document_refs: 'any', transcript_refs: 'any'
  },
  competitor_channel: {
    niche_refs: ['niche'], snapshot_refs: 'any', source_observation_refs: ['source_observation']
  },
  owned_channel: { analytics_refs: ['metric_snapshot'] },
  competitor_video: {
    channel_ref: ['competitor_channel'], metric_refs: ['metric_snapshot'], source_observation_refs: ['source_observation']
  },
  niche: { claim_refs: ['claim'], evidence_refs: ['evidence'] },
  claim: { evidence_refs: ['evidence'], contradicts: ['claim'] },
  evidence: { source_ref: ['source_asset', 'source_observation'] },
  niche_decision: {
    niche_ref: ['niche'], measurement_refs: ['metric_snapshot'], claim_refs: ['claim'], evidence_refs: ['evidence']
  },
  production_episode: {
    channel_ref: ['owned_channel'], source_pack: 'any', decision_ref: ['niche_decision'], claim_refs: ['claim'], rights_refs: ['evidence']
  },
  artifact: { parent_ref: ['production_episode', 'artifact'] },
  job_run: { input_refs: 'any', output_refs: 'any' },
  metric_snapshot: { entity_ref: 'any', source_ref: ['source_asset', 'source_observation'], derivation_refs: 'any' },
  relationship: { from: 'any', to: 'any', evidence_refs: ['evidence'] },
  deletion_request: { cascade_refs: 'any', policy_ref: ['policy_snapshot'] },
  policy_snapshot: { evidence_refs: ['evidence'], source_ref: ['source_asset', 'source_observation'] }
});

const STATUS_TRANSITIONS = Object.freeze({
  draft: new Set(['proposed', 'pending', 'blocked', 'rejected', 'tombstoned']),
  proposed: new Set(['pending', 'active', 'in_progress', 'blocked', 'rejected', 'tombstoned']),
  pending: new Set(['active', 'in_progress', 'blocked', 'rejected', 'tombstoned']),
  active: new Set(['observed', 'needs_review', 'verified', 'corroborated', 'approved', 'stale', 'expired', 'superseded', 'blocked', 'tombstoned', 'private_candidate', 'published']),
  observed: new Set(['active', 'needs_review', 'verified', 'corroborated', 'stale', 'expired', 'superseded', 'tombstoned']),
  unverified: new Set(['pending', 'needs_review', 'corroborated', 'verified', 'rejected', 'stale', 'expired', 'tombstoned']),
  needs_review: new Set(['pending', 'active', 'corroborated', 'verified', 'rejected', 'blocked', 'tombstoned']),
  corroborated: new Set(['verified', 'approved', 'stale', 'expired', 'superseded', 'tombstoned']),
  verified: new Set(['approved', 'stale', 'expired', 'superseded', 'tombstoned']),
  approved: new Set(['private_candidate', 'published', 'stale', 'expired', 'superseded', 'tombstoned']),
  ready: new Set(['in_progress', 'active', 'blocked', 'tombstoned']),
  in_progress: new Set(['complete', 'failed', 'cancelled', 'blocked', 'active', 'tombstoned']),
  complete: new Set(['approved', 'private_candidate', 'published', 'stale', 'superseded', 'tombstoned']),
  failed: new Set(['pending', 'in_progress', 'cancelled', 'blocked', 'tombstoned']),
  cancelled: new Set(['pending', 'tombstoned']),
  blocked: new Set(['pending', 'in_progress', 'active', 'rejected', 'tombstoned']),
  private_candidate: new Set(['approved', 'published', 'stale', 'superseded', 'tombstoned']),
  published: new Set(['stale', 'expired', 'superseded', 'tombstoned']),
  stale: new Set(['active', 'expired', 'superseded', 'tombstoned']),
  expired: new Set(['active', 'superseded', 'tombstoned']),
  rejected: new Set(['proposed', 'tombstoned']),
  superseded: new Set(['tombstoned']),
  archived: new Set(['active', 'tombstoned']),
  needs_adapter: new Set(['pending', 'rejected', 'tombstoned']),
  unknown: new Set(['proposed', 'pending', 'needs_review', 'tombstoned']),
  tombstoned: new Set([])
});

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function pushError(errors, code, errorPath, message) {
  errors.push({ code, path: errorPath || '$', message });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Load the versioned exported contracts.  The runtime never silently falls
 * back to in-memory definitions: a missing or malformed schema is an error.
 *
 * @param {string} schemaDir
 * @returns {{index: JsonObject, common: JsonObject, schemas: Map<string, JsonObject>}}
 */
function loadContracts(schemaDir = DEFAULT_SCHEMA_DIR) {
  const indexFile = path.join(schemaDir, 'index.v1.json');
  const commonFile = path.join(schemaDir, 'common.v1.json');
  const index = readJson(indexFile);
  const common = readJson(commonFile);
  if (!index || index.contract_profile !== 'h2dev-contract-v1') {
    throw new Error(`Invalid A1 schema index: ${indexFile}`);
  }
  if (!common || common.contract_profile?.name !== 'h2dev-contract-v1') {
    throw new Error(`Invalid A1 common schema: ${commonFile}`);
  }
  const schemas = new Map();
  for (const entry of index.entities || []) {
    if (!entry || typeof entry.entity_type !== 'string' || typeof entry.file !== 'string') {
      throw new Error(`Invalid A1 schema index entry in ${indexFile}`);
    }
    const file = path.join(schemaDir, entry.file);
    const schema = readJson(file);
    if (!schema || schema.contract_profile?.name !== 'h2dev-contract-v1') {
      throw new Error(`Invalid A1 entity schema: ${file}`);
    }
    schemas.set(entry.entity_type, schema);
  }
  for (const entityType of ENTITY_TYPES) {
    if (!schemas.has(entityType)) throw new Error(`A1 schema missing entity: ${entityType}`);
  }
  return { index, common, schemas };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function typeMatches(value, type) {
  if (type === 'object') return isObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'null') return value === null;
  return true;
}

function resolvePointer(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current = root;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) return null;
    current = current[part];
  }
  return current;
}

function validDate(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = Number(match[7] || 0);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || millisecond > 999) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > monthDays[month - 1]) return false;
  // Date.UTC normalizes years 0..99 to 1900..1999, so setUTCFullYear after
  // constructing an epoch date and verify every component explicitly.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return Number.isFinite(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second &&
    date.getUTCMilliseconds() === millisecond;
}

function validUri(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.hostname);
  } catch (_) {
    return false;
  }
}

/**
 * Validate the supported schema subset. Errors are sorted by path/code by the
 * caller, so this function never relies on object insertion order.
 *
 * @param {unknown} value
 * @param {JsonObject} schema
 * @param {string} errorPath
 * @param {ContractError[]} errors
 * @param {JsonObject} rootSchema
 */
function validateSchemaValue(value, schema, errorPath, errors, rootSchema = schema) {
  if (!schema || typeof schema !== 'object') {
    pushError(errors, 'SCHEMA_DEFINITION_INVALID', errorPath, 'Schema node is not an object');
    return;
  }
  if (schema.$ref) {
    const target = resolvePointer(rootSchema, schema.$ref);
    if (!target) {
      pushError(errors, 'SCHEMA_REF_INVALID', errorPath, `Unresolved schema ref ${schema.$ref}`);
      return;
    }
    validateSchemaValue(value, target, errorPath, errors, rootSchema);
    return;
  }
  if (schema.oneOf) {
    const matches = [];
    for (const branch of schema.oneOf) {
      const branchErrors = [];
      validateSchemaValue(value, branch, errorPath, branchErrors, rootSchema);
      if (branchErrors.length === 0) matches.push(branch);
    }
    if (matches.length !== 1) {
      pushError(errors, 'SCHEMA_ONE_OF', errorPath, `Expected exactly one matching schema branch, got ${matches.length}`);
      return;
    }
    validateSchemaValue(value, matches[0], errorPath, errors, rootSchema);
    return;
  }
  if (schema.allOf) {
    for (const branch of schema.allOf) validateSchemaValue(value, branch, errorPath, errors, rootSchema);
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'const') && stableJson(value) !== stableJson(schema.const)) {
    pushError(errors, 'SCHEMA_CONST', errorPath, `Expected constant ${JSON.stringify(schema.const)}`);
  }
  if (schema.type && !typeMatches(value, schema.type)) {
    pushError(errors, 'SCHEMA_TYPE', errorPath, `Expected ${schema.type}`);
    return;
  }
  if (schema.enum && !schema.enum.some(item => stableJson(item) === stableJson(value))) {
    pushError(errors, 'SCHEMA_ENUM', errorPath, `Value is not in enum`);
  }
  if (schema.pattern && typeof value === 'string' && !(new RegExp(schema.pattern)).test(value)) {
    pushError(errors, 'SCHEMA_PATTERN', errorPath, `String does not match ${schema.pattern}`);
  }
  if (schema.format === 'date-time' && !validDate(value)) {
    pushError(errors, 'SCHEMA_FORMAT_DATE_TIME', errorPath, 'Expected canonical UTC date-time');
  }
  if (schema.format === 'uri' && !validUri(value)) {
    pushError(errors, 'SCHEMA_FORMAT_URI', errorPath, 'Expected absolute URI');
  }
  if (schema.minLength !== undefined && typeof value === 'string' && value.length < schema.minLength) {
    pushError(errors, 'SCHEMA_MIN_LENGTH', errorPath, `String length must be >= ${schema.minLength}`);
  }
  if (schema.minimum !== undefined && typeof value === 'number' && value < schema.minimum) {
    pushError(errors, 'SCHEMA_MINIMUM', errorPath, `Number must be >= ${schema.minimum}`);
  }
  if (schema.minItems !== undefined && Array.isArray(value) && value.length < schema.minItems) {
    pushError(errors, 'SCHEMA_MIN_ITEMS', errorPath, `Array length must be >= ${schema.minItems}`);
  }
  if (schema.uniqueItems && Array.isArray(value)) {
    const seen = new Set();
    for (const item of value) {
      const key = stableJson(item);
      if (seen.has(key)) pushError(errors, 'SCHEMA_UNIQUE_ITEMS', errorPath, 'Array items must be unique');
      seen.add(key);
    }
  }
  if (isObject(value)) {
    const keys = Object.keys(value);
    for (const required of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        pushError(errors, 'SCHEMA_REQUIRED', `${errorPath}.${required}`, `Missing required property ${required}`);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of keys) {
        if (!schema.properties || !Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          pushError(errors, 'SCHEMA_ADDITIONAL_PROPERTY', `${errorPath}.${key}`, 'Additional property is not allowed');
        }
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateSchemaValue(value[key], childSchema, `${errorPath}.${key}`, errors, rootSchema);
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateSchemaValue(item, schema.items, `${errorPath}[${index}]`, errors, rootSchema));
  }
}

function getPath(value, dottedPath) {
  let current = value;
  for (const part of dottedPath.split('.')) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = current[part];
  }
  return current;
}

function idHasPrefix(id, prefix) {
  return typeof id === 'string' && id.startsWith(prefix) && id.length > prefix.length;
}

function entityTypeForId(id) {
  if (typeof id !== 'string') return null;
  return ENTITY_TYPES.find(type => idHasPrefix(id, ENTITY_PREFIXES[type])) || null;
}

function parseRef(ref) {
  return typeof ref === 'string' ? ref : null;
}

function canonicalErrorSort(a, b) {
  return a.path.localeCompare(b.path) || a.code.localeCompare(b.code) || a.message.localeCompare(b.message);
}

function latestById(records) {
  const latest = new Map();
  for (const record of records) {
    if (!isObject(record) || typeof record.entity_id !== 'string') continue;
    const previous = latest.get(record.entity_id);
    if (!previous || (Number.isInteger(record.revision) && record.revision > previous.revision)) latest.set(record.entity_id, record);
  }
  return latest;
}

function targetKeyForSupersedes(record, recordsByKey, recordsById, errors) {
  const pointer = record.supersedes;
  if (pointer === null || pointer === undefined) return null;
  let entityId;
  let revision;
  if (typeof pointer === 'string') {
    entityId = pointer;
    if (entityId !== record.entity_id) {
      pushError(errors, 'SUPERSEDES_IDENTITY', '$.supersedes', 'supersedes must target an older revision of the same entity_id');
      return null;
    }
    const candidates = (recordsById.get(entityId) || []).filter(item => item.revision < record.revision);
    if (candidates.length) revision = Math.max(...candidates.map(item => item.revision));
  } else if (isObject(pointer)) {
    entityId = pointer.entity_id;
    revision = pointer.revision;
  }
  if (!entityId || !Number.isInteger(revision)) {
    pushError(errors, 'SUPERSEDES_NOT_FOUND', '$.supersedes', 'supersedes must identify an existing prior revision');
    return null;
  }
  if (entityId !== record.entity_id) {
    pushError(errors, 'SUPERSEDES_IDENTITY', '$.supersedes', 'supersedes must target an older revision of the same entity_id');
    return null;
  }
  const targetKey = `${entityId}@${revision}`;
  const target = recordsByKey.get(targetKey);
  if (!target) {
    pushError(errors, 'SUPERSEDES_NOT_FOUND', '$.supersedes', `No record for ${targetKey}`);
    return null;
  }
  if (target.entity_type !== record.entity_type) {
    pushError(errors, 'SUPERSEDES_ENTITY_TYPE', '$.supersedes', 'supersedes target must have the same entity_type');
  }
  if (entityId === record.entity_id && revision >= record.revision) {
    pushError(errors, 'SUPERSEDES_REVISION_ORDER', '$.supersedes', 'A revision may only supersede an older revision of itself');
  }
  return targetKey;
}

function detectSupersedesCycles(records, recordsByKey, recordsById, errors) {
  const graph = new Map();
  for (const record of records) {
    if (!isObject(record) || typeof record.entity_id !== 'string' || !Number.isInteger(record.revision)) continue;
    const key = `${record.entity_id}@${record.revision}`;
    const localErrors = [];
    const target = targetKeyForSupersedes(record, recordsByKey, recordsById, localErrors);
    errors.push(...localErrors);
    if (target) graph.set(key, target);
  }
  const state = new Map();
  const stack = [];
  function visit(key) {
    const currentState = state.get(key) || 0;
    if (currentState === 1) {
      const start = stack.indexOf(key);
      const cycle = [...stack.slice(start), key].join(' -> ');
      pushError(errors, 'SUPERSEDES_CYCLE', '$.supersedes', `Supersedes cycle: ${cycle}`);
      return;
    }
    if (currentState === 2) return;
    state.set(key, 1);
    stack.push(key);
    const target = graph.get(key);
    if (target) visit(target);
    stack.pop();
    state.set(key, 2);
  }
  for (const key of graph.keys()) visit(key);
}

function validateStatusHistory(record, errors) {
  if (!Array.isArray(record.status_history)) return;
  let previous = null;
  for (let index = 0; index < record.status_history.length; index += 1) {
    const item = record.status_history[index];
    const p = `$.status_history[${index}]`;
    if (!isObject(item)) continue;
    if (!STATUS_VALUES.has(item.from) || !STATUS_VALUES.has(item.to)) {
      pushError(errors, 'STATUS_TRANSITION_INVALID', p, 'Status history contains an unknown status');
      continue;
    }
    if (previous && item.from !== previous.to) {
      pushError(errors, 'STATUS_TRANSITION_INVALID', p, 'Status history must be contiguous');
    }
    const allowed = STATUS_TRANSITIONS[item.from] || new Set();
    if (!allowed.has(item.to) && item.from !== item.to) {
      pushError(errors, 'STATUS_TRANSITION_INVALID', p, `${item.from} cannot transition to ${item.to}`);
    }
    previous = item;
  }
  if (previous && previous.to !== record.status) {
    pushError(errors, 'STATUS_TRANSITION_INVALID', '$.status_history', 'Final history status must equal record.status');
  }
}

function validateTrustAndAxes(record, errors) {
  const axes = record.status_axes;
  if (!isObject(axes)) return;
  if (record.status === 'verified' && axes.accuracy !== 'verified') {
    pushError(errors, 'STATUS_AXIS_MISMATCH', '$.status_axes.accuracy', 'status=verified requires accuracy=verified; axes remain independent otherwise');
  }
  const generated = record.provenance && ['model', 'tool'].includes(record.provenance.generated_by);
  if (generated && (record.status === 'verified' || axes.accuracy === 'verified')) {
    pushError(errors, 'TRUST_PROMOTION_BLOCKED', '$.provenance.generated_by', 'Generated/model/tool output cannot be promoted to verified in A1');
  }
  if (record.entity_type === 'claim') {
    if (record.status === 'verified' && record.verification_status !== 'verified') {
      pushError(errors, 'STATUS_VERIFICATION_MISMATCH', '$.verification_status', 'Envelope status=verified requires verification_status=verified');
    }
    if (record.verification_status === 'verified' && record.status !== 'verified') {
      pushError(errors, 'STATUS_VERIFICATION_MISMATCH', '$.status', 'verification_status=verified requires envelope status=verified');
    }
    if (['estimate', 'inference', 'creative'].includes(record.claim_type) && record.verification_status === 'verified') {
      pushError(errors, 'TRUST_PROMOTION_BLOCKED', '$.verification_status', 'Estimate, inference, and creative claims cannot be verified by this contract');
    }
    if (record.origin === 'generated' && record.verification_status === 'verified') {
      pushError(errors, 'TRUST_PROMOTION_BLOCKED', '$.origin', 'Generated claims cannot be verified by this contract');
    }
    if (record.verification_status === 'verified') {
      if (!Array.isArray(record.evidence_refs) || record.evidence_refs.length === 0) {
        pushError(errors, 'VERIFICATION_EVIDENCE_REQUIRED', '$.evidence_refs', 'Verified claim requires evidence_refs');
      }
      if (!record.reviewer || !record.checked_at) {
        pushError(errors, 'VERIFICATION_REVIEW_REQUIRED', '$.reviewer', 'Verified claim requires reviewer and checked_at');
      }
      if (!['fact', 'policy'].includes(record.claim_type)) {
        pushError(errors, 'TRUST_PROMOTION_BLOCKED', '$.claim_type', 'Only fact or policy claims may be verified');
      }
      if (!['pass', 'not_applicable'].includes(axes.file_ok)) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.file_ok', 'Verified claim requires file_ok=pass or not_applicable');
      }
      if (['unknown', 'prohibited'].includes(axes.rights)) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.rights', 'Verified claim cannot have unknown or prohibited rights');
      }
      if (!['approved', 'complete'].includes(axes.human_review)) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.human_review', 'Verified claim requires completed human review');
      }
    }
  }
  if (record.entity_type === 'artifact') {
    const publishing = record.status === 'published' || axes.publish_ready === 'approved';
    if (publishing) {
      if (axes.file_ok !== 'pass') pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.file_ok', 'Artifact promotion requires file_ok=pass');
      if (['unknown', 'prohibited'].includes(axes.rights)) pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.rights', 'Artifact promotion requires cleared rights');
      if (!['approved', 'complete'].includes(axes.human_review)) pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.human_review', 'Artifact promotion requires completed human review');
      const rights = record.rights_evidence;
      if (!isObject(rights) || ['unknown', 'prohibited'].includes(rights.status) || !Array.isArray(rights.evidence_refs) || rights.evidence_refs.length === 0 || !rights.reviewer || !rights.checked_at) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.rights_evidence', 'Artifact promotion requires rights evidence, reviewer, check time, and refs');
      }
      if (!isObject(record.qa) || record.qa.status !== 'pass' || !record.qa.checked_at || !record.qa.checked_by) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.qa', 'Artifact promotion requires a passing QA record with reviewer and check time');
      }
    }
    if (record.status === 'published' && axes.publish_ready !== 'approved') {
      pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.publish_ready', 'Published artifact requires publish_ready=approved');
    }
  }
  if (record.entity_type === 'production_episode') {
    const gate = record.gate_status;
    const publishing = record.status === 'published' || axes.publish_ready === 'approved' || (isObject(gate) && gate.publish === 'published');
    if (publishing) {
      if (!isObject(gate) || gate.source !== 'pass' || gate.rights !== 'pass' || gate.policy !== 'pass' || gate.qa !== 'pass') {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.gate_status', 'Episode promotion requires source, rights, policy, and QA gates to pass');
      }
      if (record.status === 'published' && (!isObject(gate) || gate.publish !== 'published')) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.gate_status.publish', 'Published episode requires gate_status.publish=published');
      }
      if (record.status === 'published' && axes.publish_ready !== 'approved') {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes.publish_ready', 'Published episode requires publish_ready=approved');
      }
      if (axes.file_ok !== 'pass' || ['unknown', 'prohibited'].includes(axes.rights) || !['approved', 'complete'].includes(axes.human_review)) {
        pushError(errors, 'PROMOTION_GATE_FAILED', '$.status_axes', 'Published episode requires file, rights, and human-review axes to pass');
      }
    }
  }
  if (record.entity_type === 'metric_snapshot' && record.estimate === true && record.status === 'verified') {
    pushError(errors, 'TRUST_PROMOTION_BLOCKED', '$.estimate', 'Estimated metrics cannot be verified by this contract');
  }
}

function validateProvenanceSeparation(record, errors) {
  const locator = record.source_locator;
  const hash = record.content_hash;
  if (locator && hash && isObject(locator) && isObject(hash)) {
    if (locator.value === hash.value || locator.canonical === hash.value) {
      pushError(errors, 'PROVENANCE_SEPARATION', '$.source_locator', 'source_locator must not contain the content_hash value');
    }
  }
  if (isObject(record.retention_policy) && record.retention_policy.retention_class !== record.retention_class) {
    pushError(errors, 'RETENTION_SEPARATION', '$.retention_policy.retention_class', 'Nested retention class must match envelope retention_class');
  }
  if (record.entity_type === 'source_asset' || record.entity_type === 'artifact') {
    const rights = record.rights_evidence;
    if (!isObject(rights)) return;
    if (rights.status === 'cleared' && Array.isArray(rights.evidence_refs) && rights.evidence_refs.length === 0) {
      pushError(errors, 'RIGHTS_EVIDENCE_REQUIRED', '$.rights_evidence.evidence_refs', 'Cleared rights require evidence references');
    }
    if (record.sensitivity === 'public' && ['unknown', 'prohibited'].includes(rights.status)) {
      pushError(errors, 'PUBLIC_RIGHTS_UNCLEAR', '$.rights_evidence.status', 'Public record cannot have unknown or prohibited rights');
    }
    if (rights.status !== 'unknown' && (!rights.reviewer || !rights.checked_at)) {
      pushError(errors, 'RIGHTS_REVIEW_REQUIRED', '$.rights_evidence', 'Non-unknown rights require reviewer and checked_at');
    }
  }
  const retention = record.retention_policy;
  if (isObject(retention) && ['provider_refresh_required', 'provider_ephemeral_signed_url'].includes(record.retention_class) && !retention.refresh_due && !retention.retention_due) {
    pushError(errors, 'RETENTION_DUE_REQUIRED', '$.retention_policy', 'Provider-retained data requires refresh_due or retention_due');
  }
}

function validateEntitySemantics(record, errors) {
  if (!isObject(record)) return;
  const expectedPrefix = ENTITY_PREFIXES[record.entity_type];
  if (!expectedPrefix) {
    pushError(errors, 'UNKNOWN_ENTITY_TYPE', '$.entity_type', `Unsupported entity_type ${record.entity_type}`);
    return;
  }
  if (!idHasPrefix(record.entity_id, expectedPrefix)) {
    pushError(errors, 'ID_PREFIX_ENTITY_MISMATCH', '$.entity_id', `${record.entity_type} requires ${expectedPrefix} identity`);
  }
  if (record.schema !== `h2dev.${record.entity_type}.v1`) {
    pushError(errors, 'SCHEMA_VERSION_MISMATCH', '$.schema', 'schema must match entity_type and v1');
  }
  if (record.status === 'tombstoned') {
    if (!isObject(record.tombstone)) pushError(errors, 'TOMBSTONE_REQUIRED', '$.tombstone', 'tombstoned records require a tombstone object');
    return;
  }
  if (record.entity_type === 'owned_channel' && !['restricted', 'credential', 'personal_data'].includes(record.sensitivity)) {
    pushError(errors, 'OWNED_CHANNEL_SENSITIVITY', '$.sensitivity', 'owned_channel must be restricted, credential, or personal_data');
  }
  if (record.entity_type === 'production_episode') {
    if (['generative', 'mixed'].includes(record.ai_use_decision) && record.disclosure_required && !record.disclosure_applied) {
      pushError(errors, 'DISCLOSURE_REQUIRED', '$.disclosure_applied', 'Generative/mixed episode with disclosure_required must apply disclosure');
    }
    if (record.disclosure_applied && (!record.disclosure_basis || !record.disclosure_reviewer || !record.disclosure_checked_at)) {
      pushError(errors, 'DISCLOSURE_REVIEW_REQUIRED', '$.disclosure_basis', 'Applied disclosure requires basis, reviewer, and checked_at');
    }
  }
  if (record.entity_type === 'job_run') {
    if (record.run_status === 'succeeded' && (!Array.isArray(record.output_refs) || record.output_refs.length === 0 || !isObject(record.output_probe) || record.output_probe.status !== 'pass')) {
      pushError(errors, 'JOB_OUTPUT_PROBE_REQUIRED', '$.output_probe.status', 'Succeeded job requires output refs and a passing output probe');
    }
    if (record.run_status === 'failed' && !record.error) {
      pushError(errors, 'JOB_ERROR_REQUIRED', '$.error', 'Failed job requires a deterministic error');
    }
  }
  if (record.entity_type === 'deletion_request' && record.request_status === 'completed' && record.status !== 'complete') {
    pushError(errors, 'DELETION_STATUS_MISMATCH', '$.status', 'Completed deletion request must use envelope status=complete');
  }
  if (record.entity_type === 'metric_snapshot') {
    if (/(cross[-_ ]source|blend|composite|custom)/i.test(record.measurement_system)) {
      pushError(errors, 'DERIVED_METRIC_FORBIDDEN', '$.measurement_system', 'Cross-source/blended/custom metrics are not part of A1');
    }
    if (record.is_derived && Array.isArray(record.derivation_refs) && record.derivation_refs.length > 1) {
      pushError(errors, 'DERIVED_METRIC_FORBIDDEN', '$.derivation_refs', 'A1 does not allow derived metrics over multiple source refs');
    }
  }
  if (record.entity_type === 'relationship' && record.from === record.to) {
    pushError(errors, 'RELATION_SELF', '$.to', 'Relationship endpoints must be distinct');
  }
  if (record.revision > 1 && (record.supersedes === null || record.supersedes === undefined)) {
    pushError(errors, 'REVISION_SUPERSEDES_REQUIRED', '$.supersedes', 'Revision greater than 1 requires supersedes');
  }
  if (record.revision === 1 && record.supersedes !== null && record.supersedes !== undefined) {
    pushError(errors, 'REVISION_SUPERSEDES_FORBIDDEN', '$.supersedes', 'Revision 1 cannot supersede another revision');
  }
}

function addCalendarDays(value, days) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function validateDeletionRequest(record, recordsById, errors) {
  if (record.entity_type !== 'deletion_request') return;
  for (const [index, ref] of (Array.isArray(record.request_scope?.refs) ? record.request_scope.refs : []).entries()) {
    validateReference(ref, 'any', `$.request_scope.refs[${index}]`, recordsById, errors);
  }
  if (record.request_scope?.kind === 'youtube_user_request' && record.received_at && record.due_at) {
    const expected = addCalendarDays(record.received_at, 7);
    if (expected !== record.due_at) {
      pushError(errors, 'DELETION_DUE_DATE', '$.due_at', 'youtube_user_request due_at must equal received_at plus 7 calendar days');
    }
  }
  if (record.request_status === 'completed') {
    if (!isObject(record.completion_proof)) {
      pushError(errors, 'DELETION_COMPLETION_PROOF', '$.completion_proof', 'Completed deletion request requires completion_proof');
    }
    for (const [index, ref] of (Array.isArray(record.cascade_refs) ? record.cascade_refs : []).entries()) {
      const target = recordsById.get(ref);
      if (!target || !target.some(item => item.status === 'tombstoned')) {
        pushError(errors, 'DELETION_CASCADE_INCOMPLETE', `$.cascade_refs[${index}]`, `Cascade ref ${ref} must resolve to a tombstone before completion`);
      }
    }
  }
}

function validateRecord(record, options = {}) {
  const contracts = options.contracts || loadContracts(options.schemaDir || DEFAULT_SCHEMA_DIR);
  const errors = [];
  if (!isObject(record)) {
    pushError(errors, 'RECORD_TYPE', '$', 'Record must be a JSON object');
    return { valid: false, errors };
  }
  try {
    const entityType = record.entity_type;
    const schema = contracts.schemas.get(entityType);
    if (!schema) {
      pushError(errors, 'UNKNOWN_ENTITY_TYPE', '$.entity_type', `Unsupported entity_type ${entityType}`);
    } else {
      const schemaToUse = record.status === 'tombstoned' ? contracts.common : schema;
      validateSchemaValue(record, schemaToUse, '$', errors, schemaToUse);
    }
    validateEntitySemantics(record, errors);
    validateStatusHistory(record, errors);
    validateTrustAndAxes(record, errors);
    validateProvenanceSeparation(record, errors);
  } catch (error) {
    pushError(errors, 'VALIDATION_RUNTIME_ERROR', '$', `Validator rejected malformed record without throwing: ${error.message}`);
  }
  errors.sort(canonicalErrorSort);
  return { valid: errors.length === 0, errors };
}

function valuesForIdentity(record, fields) {
  return Array.isArray(fields) ? fields.map(field => getPath(record, field)) : [];
}

function validateReference(ref, allowedTypes, pathName, recordsById, errors) {
  const id = parseRef(ref);
  if (!id || !recordsById.has(id)) {
    pushError(errors, 'REFERENCE_NOT_FOUND', pathName, `Reference ${String(ref)} does not resolve to a record or tombstone`);
    return;
  }
  if (allowedTypes !== 'any') {
    const targetTypes = new Set(allowedTypes);
    const targetType = recordsById.get(id)[0].entity_type;
    if (!targetTypes.has(targetType)) {
      pushError(errors, 'REFERENCE_NAMESPACE', pathName, `Reference ${id} must target ${[...targetTypes].join('|')}`);
    }
  }
}

function validateRecordReferences(record, recordsById, errors) {
  if (Array.isArray(record.source_refs)) {
    for (const [index, ref] of record.source_refs.entries()) {
      validateReference(ref, ['source_asset', 'source_observation'], `$.source_refs[${index}]`, recordsById, errors);
    }
  }
  if (isObject(record.provenance) && Array.isArray(record.provenance.derivation_refs)) {
    for (const [index, ref] of record.provenance.derivation_refs.entries()) {
      validateReference(ref, 'any', `$.provenance.derivation_refs[${index}]`, recordsById, errors);
    }
  }
  const specs = REF_FIELDS[record.entity_type] || {};
  for (const [field, allowedTypes] of Object.entries(specs)) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) continue;
    const value = record[field];
    if (Array.isArray(value)) {
      value.forEach((ref, index) => validateReference(ref, allowedTypes, `$.${field}[${index}]`, recordsById, errors));
    } else {
      validateReference(value, allowedTypes, `$.${field}`, recordsById, errors);
    }
  }
  if (isObject(record.retention_policy)) {
    validateReference(record.retention_policy.policy_ref, ['policy_snapshot'], '$.retention_policy.policy_ref', recordsById, errors);
  }
  if (isObject(record.tombstone)) {
    validateReference(record.tombstone.policy_ref, ['policy_snapshot'], '$.tombstone.policy_ref', recordsById, errors);
  }
  if (isObject(record.rights_evidence)) {
    for (const [index, ref] of (Array.isArray(record.rights_evidence.evidence_refs) ? record.rights_evidence.evidence_refs : []).entries()) {
      validateReference(ref, ['evidence'], `$.rights_evidence.evidence_refs[${index}]`, recordsById, errors);
    }
  }
  if (isObject(record.completion_proof)) {
    for (const [index, ref] of (Array.isArray(record.completion_proof.evidence_refs) ? record.completion_proof.evidence_refs : []).entries()) {
      validateReference(ref, ['evidence'], `$.completion_proof.evidence_refs[${index}]`, recordsById, errors);
    }
  }
}

function validateIdentityCollisions(records, errors) {
  const byEntityRevision = new Map();
  const byEntityId = new Map();
  const byIdentity = new Map();
  for (const record of records) {
    if (!isObject(record)) continue;
    const id = record.entity_id;
    const revision = record.revision;
    if (typeof id !== 'string' || !Number.isInteger(revision)) continue;
    const revisionKey = `${id}@${revision}`;
    if (byEntityRevision.has(revisionKey)) {
      pushError(errors, 'DUPLICATE_ID_REVISION', `$.records[${records.indexOf(record)}].entity_id`, `Duplicate entity_id/revision ${revisionKey}`);
    } else {
      byEntityRevision.set(revisionKey, record);
    }
    const previousType = byEntityId.get(id);
    if (previousType && previousType !== record.entity_type) {
      pushError(errors, 'IDENTITY_COLLISION', '$.records', `${id} is used by multiple entity types`);
    } else if (!previousType) {
      byEntityId.set(id, record.entity_type);
    }
    const definition = optionsIdentityFields(record.entity_type);
    if (Array.isArray(definition) && definition.length) {
      const values = valuesForIdentity(record, definition);
      if (values.every(value => value !== undefined && value !== null && value !== '')) {
        const identityKey = `${record.entity_type}|${stableJson(values)}`;
        const previous = byIdentity.get(identityKey);
        if (previous && previous.entity_id !== id) {
          pushError(errors, 'IDENTITY_COLLISION', '$.records', `${record.entity_type} canonical identity collides with ${previous.entity_id}`);
        } else if (!previous) {
          byIdentity.set(identityKey, record);
        }
      }
    }
  }
  return { byEntityRevision, byEntityId };
}

function optionsIdentityFields(entityType) {
  if (typeof entityType !== 'string' || !Object.prototype.hasOwnProperty.call(ENTITY_IDENTITY_FIELDS, entityType)) return [];
  const fields = ENTITY_IDENTITY_FIELDS[entityType];
  return Array.isArray(fields) ? fields : [];
}

function validateRegistry(input, options = {}) {
  const contracts = options.contracts || loadContracts(options.schemaDir || DEFAULT_SCHEMA_DIR);
  const records = Array.isArray(input) ? input : (isObject(input) && Array.isArray(input.records) ? input.records : null);
  const errors = [];
  if (!records) {
    pushError(errors, 'REGISTRY_TYPE', '$', 'Registry must be an array or an object with records[]');
    return { valid: false, errors, records: [] };
  }
  records.forEach((record, index) => {
    const result = validateRecord(record, { contracts });
    for (const error of result.errors) {
      errors.push({ ...error, path: error.path === '$' ? `$.records[${index}]` : `$.records[${index}]${error.path.slice(1)}` });
    }
  });
  const { byEntityRevision, byEntityId } = validateIdentityCollisions(records, errors);
  const revisionsById = new Map();
  for (const [key, record] of byEntityRevision.entries()) {
    if (!revisionsById.has(record.entity_id)) revisionsById.set(record.entity_id, []);
    revisionsById.get(record.entity_id).push(record);
  }
  for (const [id, revisions] of revisionsById.entries()) {
    revisions.sort((a, b) => a.revision - b.revision);
    for (let index = 1; index < revisions.length; index += 1) {
      if (revisions[index].revision <= revisions[index - 1].revision) {
        pushError(errors, 'REVISION_NOT_MONOTONIC', '$.records', `Revisions for ${id} are not strictly increasing`);
      }
    }
  }
  const recordsByKey = byEntityRevision;
  detectSupersedesCycles(records, recordsByKey, revisionsById, errors);
  const recordsById = new Map();
  for (const record of records) {
    if (!isObject(record) || typeof record.entity_id !== 'string') continue;
    if (!recordsById.has(record.entity_id)) recordsById.set(record.entity_id, []);
    recordsById.get(record.entity_id).push(record);
  }
  for (const record of records) {
    if (isObject(record)) validateRecordReferences(record, recordsById, errors);
    if (isObject(record)) validateDeletionRequest(record, recordsById, errors);
  }
  errors.sort(canonicalErrorSort);
  return { valid: errors.length === 0, errors, records };
}

function parseInput(file) {
  return readJson(file);
}

function main(argv = process.argv.slice(2)) {
  const args = [...argv];
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('Usage: node scripts/registry/schema-validate.js <registry.json|record.json> [--record]\n');
    return 0;
  }
  const file = args.find(item => !item.startsWith('-'));
  if (!file) {
    process.stderr.write('Missing JSON input path\n');
    return 2;
  }
  let input;
  try {
    input = parseInput(path.resolve(process.cwd(), file));
  } catch (error) {
    process.stderr.write(`Input error: ${error.message}\n`);
    return 2;
  }
  let result;
  try {
    result = args.includes('--record') ? validateRecord(input) : validateRegistry(input);
  } catch (error) {
    process.stderr.write(`Contract runtime error: ${error.message}\n`);
    return 2;
  }
  process.stdout.write(`${JSON.stringify({ valid: result.valid, error_count: result.errors.length, errors: result.errors }, null, 2)}\n`);
  return result.valid ? 0 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = {
  DEFAULT_SCHEMA_DIR,
  ENTITY_PREFIXES,
  ENTITY_TYPES,
  ENTITY_IDENTITY_FIELDS,
  STATUS_VALUES,
  loadContracts,
  validateSchemaValue,
  validateRecord,
  validateRegistry,
  stableJson,
  main
};
