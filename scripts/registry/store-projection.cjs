'use strict';

/**
 * Deterministic classification-only projections for the A3 offline store.
 *
 * These functions return proposed payloads and diffs only.  They never write
 * `data/registry/public`, legacy files, or any other projection target.  The
 * public projection is intentionally narrower than the canonical contract;
 * unknown, private, provider, credential, and token fields are dropped by an
 * explicit allowlist and no returned field means that a human approved
 * publication.
 */

const boundaryApi = require('../security/private-boundary.cjs');
const core = require('./store-core.cjs');
const { types: utilTypes } = require('util');

const { classifyPublicProjection } = boundaryApi;
const { stableJson, sha256 } = core;

const COMMON_PUBLIC_FIELDS = Object.freeze([
  'schema',
  'entity_id',
  'entity_type',
  'revision',
  'status',
  'sensitivity',
  'created_at',
  'observed_at',
]);

const PUBLIC_FIELDS = Object.freeze({
  source_asset: [],
  source_observation: [],
  learning_sku: ['title'],
  competitor_channel: ['market', 'public_url'],
  owned_channel: [],
  competitor_video: ['title', 'canonical_url'],
  niche: ['label', 'market', 'language', 'format'],
  claim: [],
  evidence: [],
  niche_decision: ['market', 'language', 'format'],
  production_episode: ['language', 'format'],
  artifact: [],
  job_run: [],
  metric_snapshot: ['market'],
  relationship: [],
  deletion_request: [],
  policy_snapshot: [],
});

const LEGACY_FIELDS = Object.freeze({
  source_asset: ['kind', 'mime', 'byte_size'],
  source_observation: ['observed_at', 'observation_key', 'confidence'],
  learning_sku: ['legacy_sku', 'title', 'access', 'module_ref', 'legacy_path'],
  competitor_channel: ['handle', 'market', 'channel_role', 'public_url'],
  owned_channel: ['platform', 'channel_id'],
  competitor_video: ['title', 'published_at', 'canonical_url', 'observed_format', 'duration_seconds'],
  niche: ['label', 'market', 'language', 'format', 'policy_class'],
  claim: ['statement', 'claim_type', 'scope', 'verification_status', 'confidence'],
  evidence: ['source_locator', 'independent_group', 'quality', 'checked_at', 'evidence_kind'],
  niche_decision: ['market', 'language', 'audience', 'format', 'decision', 'risk'],
  production_episode: ['series', 'language', 'format', 'ai_use_decision', 'disclosure_required', 'disclosure_applied'],
  artifact: ['artifact_type', 'path_or_uri', 'mime', 'engine', 'qa'],
  job_run: ['stage', 'run_status', 'retry_count', 'duration_ms', 'output_probe'],
  metric_snapshot: ['measurement_system', 'metric', 'value', 'unit', 'window', 'market', 'collected_at'],
  relationship: ['from', 'type', 'to', 'valid_from', 'valid_until'],
  deletion_request: ['request_scope', 'received_at', 'due_at', 'owner', 'request_status'],
  policy_snapshot: ['policy_type', 'canonical_url', 'retrieved_at', 'status'],
});

const BLOCKED_FIELD_PATTERN = /(?:token|secret|credential|authorization|api[_-]?key|private[_-]?key|password|raw|transcript|provider|rights_evidence|retention_policy|owner_account_ref|access_token|refresh_token)/i;

const hasOwn = Object.prototype.hasOwnProperty;

function isInputProxy(value) {
  try {
    return utilTypes.isProxy(value);
  } catch (_) {
    // A revoked or otherwise uninspectable proxy is not safe input.  The
    // caller will fail closed without trying to read it.
    return true;
  }
}

function safeOwnKeys(value) {
  if (isInputProxy(value)) return { ok: false, reason: 'PROXY_VALUE_NOT_ALLOWED' };
  try {
    return { ok: true, keys: Reflect.ownKeys(value) };
  } catch (_) {
    return { ok: false, reason: 'VALUE_KEYS_NOT_READABLE' };
  }
}

function safePrototype(value, kind) {
  if (isInputProxy(value)) return { ok: false, reason: 'PROXY_VALUE_NOT_ALLOWED' };
  let prototype;
  try {
    prototype = Object.getPrototypeOf(value);
  } catch (_) {
    return { ok: false, reason: 'VALUE_PROTOTYPE_NOT_READABLE' };
  }
  const allowed = kind === 'array'
    ? prototype === Array.prototype
    : prototype === Object.prototype || prototype === null;
  return allowed
    ? { ok: true, prototype }
    : { ok: false, reason: 'VALUE_PROTOTYPE_NOT_ALLOWED' };
}

function hasCustomToJSON(value, prototype) {
  try {
    if (Object.getOwnPropertyDescriptor(value, 'toJSON')) return true;
    if (prototype && Object.getOwnPropertyDescriptor(prototype, 'toJSON')) return true;
    if (prototype === Array.prototype && Object.getOwnPropertyDescriptor(Object.prototype, 'toJSON')) return true;
  } catch (_) {
    return true;
  }
  return false;
}

function ownDataDescriptor(value, key) {
  if (isInputProxy(value)) return { ok: false, reason: 'PROXY_VALUE_NOT_ALLOWED' };
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(value, key);
  } catch (_) {
    return { ok: false, reason: 'VALUE_DESCRIPTOR_NOT_READABLE' };
  }
  if (!descriptor) return { ok: true, present: false };
  if (!hasOwn.call(descriptor, 'value')) return { ok: false, reason: 'VALUE_ACCESSOR_NOT_ALLOWED' };
  return { ok: true, present: true, descriptor };
}

function defineData(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

/**
 * Validate and copy JSON-shaped data without invoking input getters or
 * toJSON hooks.  The original descriptor values remain available to the
 * classifier; this copy is only used for the returned dry-run payload.
 */
function safeCopyValue(value, seen = new WeakSet()) {
  if (value === null) return { ok: true, copy: null };
  if (typeof value === 'string' || typeof value === 'boolean') return { ok: true, copy: value };
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { ok: true, copy: value }
      : { ok: false, reason: 'NON_FINITE_VALUE' };
  }
  if (value === undefined) return { ok: false, reason: 'UNDEFINED_VALUE_NOT_ALLOWED' };
  if (typeof value !== 'object') return { ok: false, reason: 'VALUE_TYPE_NOT_ALLOWED' };
  if (isInputProxy(value)) return { ok: false, reason: 'PROXY_VALUE_NOT_ALLOWED' };

  const kind = Array.isArray(value) ? 'array' : 'object';
  const prototypeResult = safePrototype(value, kind);
  if (!prototypeResult.ok) return prototypeResult;
  if (hasCustomToJSON(value, prototypeResult.prototype)) return { ok: false, reason: 'VALUE_TOJSON_NOT_ALLOWED' };
  if (seen.has(value)) return { ok: false, reason: 'VALUE_CYCLE_NOT_ALLOWED' };

  const keysResult = safeOwnKeys(value);
  if (!keysResult.ok) return keysResult;
  const descriptors = new Map();
  for (const key of keysResult.keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch (_) {
      return { ok: false, reason: 'VALUE_DESCRIPTOR_NOT_READABLE' };
    }
    if (!descriptor || !hasOwn.call(descriptor, 'value')) {
      return { ok: false, reason: 'VALUE_ACCESSOR_NOT_ALLOWED' };
    }
    descriptors.set(key, descriptor);
  }

  seen.add(value);
  try {
    if (kind === 'array') {
      const lengthDescriptor = descriptors.get('length');
      const length = lengthDescriptor && lengthDescriptor.value;
      if (!lengthDescriptor || !Number.isSafeInteger(length) || length < 0) {
        return { ok: false, reason: 'ARRAY_LENGTH_NOT_ALLOWED' };
      }
      const copy = new Array(length);
      // JSON arrays have a data descriptor for every index that is read.  Do
      // not reproduce JSON.stringify's hole/undefined coercions here.
      for (let index = 0; index < length; index += 1) {
        const key = String(index);
        const descriptor = descriptors.get(key);
        if (!descriptor || !hasOwn.call(descriptor, 'value')) {
          return { ok: false, reason: 'ARRAY_HOLE_NOT_ALLOWED' };
        }
        const nested = safeCopyValue(descriptor.value, seen);
        if (!nested.ok) return nested;
        defineData(copy, key, nested.copy);
      }
      return { ok: true, copy };
    }

    const copy = {};
    for (const key of keysResult.keys) {
      if (typeof key !== 'string') continue;
      const descriptor = descriptors.get(key);
      if (!descriptor.enumerable) continue;
      const nested = safeCopyValue(descriptor.value, seen);
      if (!nested.ok) return nested;
      defineData(copy, key, nested.copy);
    }
    return { ok: true, copy };
  } finally {
    seen.delete(value);
  }
}

function inspectRecord(record) {
  if (isInputProxy(record)) return { ok: false, reason: 'RECORD_PROXY_NOT_ALLOWED' };
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { ok: false, reason: 'RECORD_NOT_OBJECT' };
  const prototypeResult = safePrototype(record, 'object');
  if (!prototypeResult.ok) return { ok: false, reason: 'RECORD_PROTOTYPE_NOT_ALLOWED' };
  if (hasCustomToJSON(record, prototypeResult.prototype)) return { ok: false, reason: 'RECORD_TOJSON_NOT_ALLOWED' };
  const keysResult = safeOwnKeys(record);
  if (!keysResult.ok) return { ok: false, reason: 'RECORD_KEYS_NOT_READABLE' };
  const descriptors = new Map();
  const enumerableKeys = [];
  for (const key of keysResult.keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(record, key);
    } catch (_) {
      return { ok: false, reason: 'RECORD_DESCRIPTOR_NOT_READABLE' };
    }
    if (!descriptor || !hasOwn.call(descriptor, 'value')) {
      return { ok: false, reason: 'RECORD_ACCESSOR_NOT_ALLOWED' };
    }
    descriptors.set(key, descriptor);
    if (descriptor.enumerable && typeof key === 'string') enumerableKeys.push(key);
  }
  return { ok: true, descriptors, enumerableKeys };
}

function safeRecordIdentifier(record) {
  if (!record || typeof record !== 'object' || isInputProxy(record) || Array.isArray(record)) return undefined;
  const result = ownDataDescriptor(record, 'entity_id');
  if (!result.ok || !result.present || typeof result.descriptor.value !== 'string') return undefined;
  return result.descriptor.value;
}

function safeRecordRevision(record) {
  if (!record || typeof record !== 'object' || isInputProxy(record) || Array.isArray(record)) return 0;
  const result = ownDataDescriptor(record, 'revision');
  if (!result.ok || !result.present || typeof result.descriptor.value !== 'number' || !Number.isFinite(result.descriptor.value)) return 0;
  return result.descriptor.value;
}

function projectionRecords(value) {
  if (isInputProxy(value)) return null;
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const result = ownDataDescriptor(value, 'records');
  if (!result.ok || !result.present || !Array.isArray(result.descriptor.value) || isInputProxy(result.descriptor.value)) return null;
  return result.descriptor.value;
}

function projectionEntries(records) {
  const lengthDescriptor = Object.getOwnPropertyDescriptor(records, 'length');
  if (!lengthDescriptor || !hasOwn.call(lengthDescriptor, 'value') || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) return null;
  const entries = [];
  for (let index = 0; index < lengthDescriptor.value; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(records, String(index));
    if (!descriptor) {
      entries.push({ record: undefined, id: '', revision: 0, index });
    } else if (!hasOwn.call(descriptor, 'value')) {
      entries.push({ record: undefined, id: '', revision: 0, index, dropped: { reason: 'RECORD_ACCESSOR_NOT_ALLOWED' } });
    } else {
      entries.push({ record: descriptor.value, id: safeRecordIdentifier(descriptor.value) || '', revision: safeRecordRevision(descriptor.value), index });
    }
  }
  return entries;
}

function ownSafeValue(recordInfo, field) {
  const descriptor = recordInfo.descriptors.get(field);
  if (!descriptor) return { present: false };
  if (!hasOwn.call(descriptor, 'value')) return { present: true, ok: false, reason: 'FIELD_ACCESSOR_NOT_ALLOWED' };
  if (descriptor.value === undefined) return { present: true, ok: true, original: undefined, copy: undefined };
  const copied = safeCopyValue(descriptor.value);
  if (!copied.ok) return { present: true, ok: false, reason: copied.reason };
  return { present: true, ok: true, original: descriptor.value, copy: copied.copy };
}

function projectionRecord(record, target, options = {}) {
  const recordInfo = inspectRecord(record);
  if (!recordInfo.ok) {
    const detail = { reason: recordInfo.reason };
    const entityId = safeRecordIdentifier(record);
    if (typeof entityId === 'string') detail.entity_id = entityId;
    return { record: null, dropped: [detail] };
  }
  const entityIdDescriptor = recordInfo.descriptors.get('entity_id');
  const entityId = entityIdDescriptor && entityIdDescriptor.value;
  const entityTypeDescriptor = recordInfo.descriptors.get('entity_type');
  const entityType = entityTypeDescriptor && entityTypeDescriptor.value;
  const sensitivityDescriptor = recordInfo.descriptors.get('sensitivity');
  const sensitivity = sensitivityDescriptor && sensitivityDescriptor.value;
  const statusDescriptor = recordInfo.descriptors.get('status');
  const status = statusDescriptor && statusDescriptor.value;
  const isPublic = target === 'public';
  const publicFields = typeof entityType === 'string' && hasOwn.call(PUBLIC_FIELDS, entityType) ? PUBLIC_FIELDS[entityType] : [];
  const legacyFields = typeof entityType === 'string' && hasOwn.call(LEGACY_FIELDS, entityType) ? LEGACY_FIELDS[entityType] : [];
  const allowlist = isPublic
    ? COMMON_PUBLIC_FIELDS.concat(publicFields)
    : COMMON_PUBLIC_FIELDS.concat(legacyFields);
  const dropped = [];
  if (isPublic && sensitivity !== 'public') return { record: null, dropped: [{ entity_id: typeof entityId === 'string' ? entityId : undefined, reason: 'SENSITIVITY_NOT_PUBLIC' }] };
  if (status === 'tombstoned') return { record: null, dropped: [{ entity_id: typeof entityId === 'string' ? entityId : undefined, reason: 'TOMBSTONED' }] };
  const proposed = {};
  const proposedForClassification = {};
  for (const field of allowlist) {
    if (BLOCKED_FIELD_PATTERN.test(field)) {
      dropped.push({ entity_id: typeof entityId === 'string' ? entityId : undefined, field, reason: 'FIELD_BLOCKED' });
      continue;
    }
    const value = ownSafeValue(recordInfo, field);
    if (!value.present) continue;
    if (!value.ok) {
      return {
        record: null,
        dropped: dropped.concat([{ entity_id: typeof entityId === 'string' ? entityId : undefined, field, reason: value.reason }]),
      };
    }
    if (value.original === undefined) continue;
    defineData(proposed, field, value.copy);
    defineData(proposedForClassification, field, value.original);
  }
  // Keep the field set strictly allowlisted.  This records exclusions for
  // audit without returning the excluded value itself.
  for (const field of recordInfo.enumerableKeys) {
    if (!allowlist.includes(field)) dropped.push({ entity_id: typeof entityId === 'string' ? entityId : undefined, field, reason: BLOCKED_FIELD_PATTERN.test(field) ? 'FIELD_BLOCKED' : 'FIELD_NOT_ALLOWLISTED' });
  }
  if (isPublic) {
    const classification = classifyPublicProjection(proposedForClassification, {
      path: `data/registry/public/${typeof entityId === 'string' ? entityId : ''}.json`,
    });
    if (classification.decision !== 'ALLOW') {
      return {
        record: null,
        dropped: dropped.concat([{ entity_id: typeof entityId === 'string' ? entityId : undefined, reason: classification.reason, field: classification.field }]),
      };
    }
  }
  return { record: proposed, dropped };
}

function projection(records, target = 'public', options = {}) {
  if (isInputProxy(records) || !Array.isArray(records)) throw new TypeError('Projection input must be records[]');
  if (!['public', 'legacy'].includes(target)) throw new TypeError('Projection target must be public or legacy');
  const output = [];
  const dropped = [];
  const entries = projectionEntries(records);
  if (!entries) {
    throw new TypeError('Projection input must be records[]');
  }
  const sorted = entries.sort((left, right) => {
    if (left.id !== right.id) return left.id < right.id ? -1 : 1;
    if (left.revision !== right.revision) return left.revision - right.revision;
    return left.index - right.index;
  });
  for (const entry of sorted) {
    const item = entry.dropped
      ? { record: null, dropped: [entry.dropped] }
      : projectionRecord(entry.record, target, options);
    if (item.record) output.push(item.record);
    dropped.push(...item.dropped);
  }
  return {
    target,
    dryRun: true,
    publicationApproval: 'NOT_CLAIMED',
    records: output,
    dropped,
    hash: sha256(output),
  };
}

function projectState(records, options = {}) {
  const target = options.target || 'both';
  const result = { dryRun: true, publicationApproval: 'NOT_CLAIMED' };
  if (target === 'public' || target === 'both') result.public = projection(records, 'public', options);
  if (target === 'legacy' || target === 'both') result.legacy = projection(records, 'legacy', options);
  return result;
}

function projectionMap(value) {
  const records = projectionRecords(value);
  const map = new Map();
  if (!records) return map;
  const entries = projectionEntries(records);
  if (!entries) return map;
  for (const entry of entries) {
    if (entry.dropped || !entry.record) continue;
    const id = safeRecordIdentifier(entry.record);
    if (typeof id !== 'string') continue;
    const copied = safeCopyValue(entry.record);
    if (copied.ok) map.set(id, copied.copy);
  }
  return map;
}

function diffProjection(before, after) {
  const left = projectionMap(before);
  const right = projectionMap(after);
  const added = [];
  const changed = [];
  const removed = [];
  for (const [id, record] of right.entries()) {
    if (!left.has(id)) added.push(record);
    else if (stableJson(left.get(id)) !== stableJson(record)) changed.push({ before: left.get(id), after: record });
  }
  for (const [id, record] of left.entries()) if (!right.has(id)) removed.push(record);
  return {
    added: added.sort((a, b) => a.entity_id.localeCompare(b.entity_id)),
    changed: changed.sort((a, b) => a.after.entity_id.localeCompare(b.after.entity_id)),
    removed: removed.sort((a, b) => a.entity_id.localeCompare(b.entity_id)),
    hash: sha256({ added, changed, removed }),
  };
}

function dryRunProjection(options = {}) {
  const state = core.readStore(options);
  const proposed = options.records
    ? projectState(options.records, options)
    : projectState(state.records, options);
  return {
    dryRun: true,
    status: state.status,
    initialized: state.initialized,
    headHash: state.headHash,
    sequence: state.sequence,
    schemaFingerprint: state.schemaFingerprint,
    ...proposed,
  };
}

module.exports = {
  COMMON_PUBLIC_FIELDS,
  PUBLIC_FIELDS,
  LEGACY_FIELDS,
  projectionRecord,
  projection,
  projectState,
  diffProjection,
  dryRunProjection,
};
