/**
 * A1 contract source and deterministic schema materialiser.
 *
 * The files emitted by this module are intentionally a small, documented
 * JSON-Schema-shaped contract profile.  They are not a claim of full
 * JSON-Schema implementation; schema-validate.js is the paired runtime and
 * enforces the supported keyword subset plus the semantic rules listed in the
 * index.  Keeping the source here makes every exported v1 contract reproducible
 * without adding a dependency.
 *
 * @module schema-contracts
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCHEMA_DIR = path.join(ROOT, 'data', 'registry', 'schemas');
const CONTRACT_VERSION = '1';
const PROFILE = 'h2dev-contract-v1';
const SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';

/** @typedef {Record<string, any>} JsonSchema */

const DATE = { type: 'string', format: 'date-time' };
const NULL_OR_DATE = { oneOf: [DATE, { type: 'null' }] };
const NON_EMPTY = { type: 'string', minLength: 1 };
const URL_OR_PATH = { type: 'string', minLength: 1 };
const SHA256 = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const HASH = {
  type: 'object',
  additionalProperties: false,
  required: ['algorithm', 'value'],
  properties: {
    algorithm: { const: 'sha256' },
    value: SHA256
  }
};
const ID = { type: 'string', pattern: '^[A-Z][A-Z0-9]*(?:-[A-Za-z0-9][A-Za-z0-9._-]*)+$' };
const ANY_REF = {
  type: 'string',
  pattern: '^(?:SRC|OBS|LSKU|CH|OWN-CH|CV|NICHE|CLM|EVD|DEC|EP|ART|RUN|MET|REL|POL)-[A-Za-z0-9][A-Za-z0-9._-]*$'
};
const SOURCE_REF = {
  type: 'string',
  pattern: '^(?:SRC|OBS)-[A-Za-z0-9][A-Za-z0-9._-]*$'
};
const EVIDENCE_REF = { type: 'string', pattern: '^EVD-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const CLAIM_REF = { type: 'string', pattern: '^CLM-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const NICHE_REF = { type: 'string', pattern: '^NICHE-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const METRIC_REF = { type: 'string', pattern: '^MET-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const ARTIFACT_REF = { type: 'string', pattern: '^ART-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const EPISODE_REF = { type: 'string', pattern: '^EP-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const JOB_REF = { type: 'string', pattern: '^RUN-[A-Za-z0-9][A-Za-z0-9._-]*$' };
const POLICY_REF = { type: 'string', pattern: '^POL-[A-Za-z0-9][A-Za-z0-9._-]*$' };

const REFERENCE_ARRAY = {
  type: 'array',
  uniqueItems: true,
  items: ANY_REF
};

const STATUS_AXES = {
  type: 'object',
  additionalProperties: false,
  required: ['file_ok', 'analysis_coverage', 'accuracy', 'rights', 'human_review', 'publish_ready'],
  properties: {
    file_ok: { enum: ['unknown', 'not_applicable', 'pending', 'pass', 'fail'] },
    analysis_coverage: { enum: ['unknown', 'not_applicable', 'pending', 'partial', 'complete'] },
    accuracy: { enum: ['unknown', 'not_applicable', 'unverified', 'needs_review', 'corroborated', 'verified', 'rejected'] },
    rights: { enum: ['unknown', 'not_applicable', 'pending', 'owned', 'licensed', 'public_reference', 'cleared', 'prohibited'] },
    human_review: { enum: ['not_started', 'not_applicable', 'pending', 'partial', 'complete', 'approved', 'rejected'] },
    publish_ready: { enum: ['unknown', 'not_applicable', 'blocked', 'pending', 'candidate', 'approved'] }
  }
};

const PROVENANCE = {
  type: 'object',
  additionalProperties: false,
  required: ['activity_id', 'agent', 'method', 'input_hashes', 'generated_by'],
  properties: {
    activity_id: { type: 'string', pattern: '^RUN-[A-Za-z0-9][A-Za-z0-9._-]*$' },
    agent: NON_EMPTY,
    method: { enum: ['direct', 'api', 'mcp', 'human', 'derived', 'import', 'manual'] },
    input_hashes: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' }
    },
    generated_by: { enum: ['human', 'tool', 'model', 'none'] },
    derivation_refs: {
      type: 'array',
      uniqueItems: true,
      items: ANY_REF
    }
  }
};

const RETENTION_POLICY = {
  type: 'object',
  additionalProperties: false,
  required: ['retention_class', 'purge_authority', 'policy_ref'],
  properties: {
    retention_class: {
      enum: [
        'owned_asset',
        'derived_internal',
        'provider_refresh_required',
        'provider_ephemeral_signed_url',
        'credential_or_token',
        'legal_hold'
      ]
    },
    retention_due: NULL_OR_DATE,
    refresh_due: NULL_OR_DATE,
    purge_authority: NON_EMPTY,
    policy_ref: POLICY_REF,
    reason: { type: 'string', minLength: 1 }
  }
};

const RIGHTS_EVIDENCE = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'evidence_refs', 'checked_at', 'reviewer'],
  properties: {
    status: { enum: ['owned', 'licensed', 'public_reference', 'unknown', 'prohibited', 'cleared'] },
    evidence_refs: {
      type: 'array',
      uniqueItems: true,
      items: EVIDENCE_REF
    },
    checked_at: NULL_OR_DATE,
    reviewer: { oneOf: [NON_EMPTY, { type: 'null' }] },
    territory: {
      type: 'array',
      uniqueItems: true,
      items: NON_EMPTY
    },
    derivative_allowed: { type: 'boolean' },
    attribution_required: { type: 'boolean' }
  }
};

const SOURCE_LOCATOR = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'value'],
  properties: {
    type: { enum: ['file_path', 'url', 'platform_id', 'api_endpoint', 'inline'] },
    value: URL_OR_PATH,
    canonical: URL_OR_PATH,
    platform: NON_EMPTY,
    path_base: { enum: ['project', 'absolute', 'external_store', 'provider'] }
  }
};

const COST = {
  type: 'object',
  additionalProperties: false,
  required: ['amount', 'currency'],
  properties: {
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    estimate: { type: 'boolean' }
  }
};

const WINDOW = {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'to'],
  properties: {
    from: DATE,
    to: DATE
  }
};

const COMMON_PROPERTIES = {
  schema: { type: 'string' },
  entity_id: ID,
  entity_type: NON_EMPTY,
  revision: { type: 'integer', minimum: 1 },
  status: {
    enum: [
      'draft', 'proposed', 'pending', 'active', 'observed', 'unverified',
      'needs_review', 'verified', 'corroborated', 'approved', 'rejected',
      'stale', 'expired', 'blocked', 'ready', 'in_progress', 'complete',
      'failed', 'cancelled', 'tombstoned', 'needs_adapter', 'published',
      'private_candidate', 'archived', 'superseded', 'unknown'
    ]
  },
  created_at: DATE,
  observed_at: DATE,
  supersedes: {
    oneOf: [
      { type: 'null' },
      ID,
      {
        type: 'object',
        additionalProperties: false,
        required: ['entity_id', 'revision'],
        properties: { entity_id: ID, revision: { type: 'integer', minimum: 1 } }
      }
    ]
  },
  source_refs: REFERENCE_ARRAY,
  sensitivity: { enum: ['public', 'internal', 'restricted', 'credential', 'personal_data'] },
  retention_class: {
    enum: [
      'owned_asset',
      'derived_internal',
      'provider_refresh_required',
      'provider_ephemeral_signed_url',
      'credential_or_token',
      'legal_hold'
    ]
  },
  provenance: PROVENANCE,
  status_axes: STATUS_AXES,
  retention_policy: RETENTION_POLICY,
  status_history: {
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['from', 'to', 'at', 'by'],
      properties: {
        from: NON_EMPTY,
        to: NON_EMPTY,
        at: DATE,
        by: NON_EMPTY,
        reason: { type: 'string', minLength: 1 }
      }
    }
  },
  tombstone: {
    type: 'object',
    additionalProperties: false,
    required: ['reason', 'purged_at', 'policy_ref'],
    properties: {
      reason: NON_EMPTY,
      purged_at: DATE,
      policy_ref: POLICY_REF,
      content_hash: HASH,
      payload_purged: { const: true }
    }
  }
};

const COMMON_REQUIRED = [
  'schema', 'entity_id', 'entity_type', 'revision', 'status', 'created_at',
  'supersedes', 'source_refs', 'sensitivity', 'retention_class', 'provenance',
  'status_axes', 'retention_policy'
];

const DEFINITIONS = {
  source_asset: {
    file: 'source_asset.v1.json',
    prefix: 'SRC-',
    // A byte-identical source is one canonical asset; alternate locators are
    // represented as relations/observations rather than a second identity.
    identity_fields: ['content_hash.value'],
    required: ['kind', 'source_locator', 'provider', 'mime', 'content_hash', 'acquired_at', 'rights_evidence'],
    properties: {
      kind: { enum: ['file', 'url', 'api_response', 'media', 'video', 'document', 'transcript', 'platform_snapshot', 'inline'] },
      source_locator: SOURCE_LOCATOR,
      provider: NON_EMPTY,
      mime: NON_EMPTY,
      byte_size: { type: 'integer', minimum: 0 },
      content_hash: HASH,
      acquired_at: DATE,
      rights_evidence: RIGHTS_EVIDENCE,
      measurement_system: NON_EMPTY,
      media_duration_seconds: { type: 'number', minimum: 0 }
    }
  },
  source_observation: {
    file: 'source_observation.v1.json',
    prefix: 'OBS-',
    identity_fields: ['source_ref', 'observed_at', 'observation_key'],
    required: ['source_ref', 'observed_at', 'extracted', 'method', 'confidence', 'valid_until'],
    properties: {
      source_ref: SOURCE_REF,
      extracted: { type: 'object', additionalProperties: true },
      method: { enum: ['direct', 'api', 'mcp', 'human', 'derived', 'import', 'manual'] },
      confidence: { enum: ['low', 'medium', 'high'] },
      valid_until: NULL_OR_DATE,
      observation_key: NON_EMPTY,
      measurement_system: NON_EMPTY,
      source_locator: SOURCE_LOCATOR,
      content_hash: HASH
    }
  },
  learning_sku: {
    file: 'learning_sku.v1.json',
    prefix: 'LSKU-',
    identity_fields: ['legacy_sku'],
    required: ['legacy_sku', 'title', 'access', 'media_refs', 'document_refs', 'transcript_refs'],
    properties: {
      legacy_sku: { type: 'string', pattern: '^VIDEO-[A-Za-z0-9][A-Za-z0-9._-]*$' },
      title: NON_EMPTY,
      access: { enum: ['free', 'pro', 'unknown'] },
      media_refs: { type: 'array', uniqueItems: true, items: ANY_REF },
      document_refs: { type: 'array', uniqueItems: true, items: ANY_REF },
      transcript_refs: { type: 'array', uniqueItems: true, items: ANY_REF },
      module_ref: { oneOf: [NON_EMPTY, { type: 'null' }] },
      legacy_path: URL_OR_PATH,
      learning_status: { enum: ['unverified', 'needs_review', 'reviewed', 'approved'] }
    }
  },
  competitor_channel: {
    file: 'competitor_channel.v1.json',
    prefix: 'CH-',
    identity_fields: ['platform', 'channel_id'],
    required: ['platform', 'channel_id', 'handle', 'market', 'niche_refs', 'snapshot_refs'],
    properties: {
      platform: NON_EMPTY,
      channel_id: NON_EMPTY,
      handle: NON_EMPTY,
      market: NON_EMPTY,
      niche_refs: { type: 'array', uniqueItems: true, items: NICHE_REF },
      snapshot_refs: { type: 'array', uniqueItems: true, items: { oneOf: [ANY_REF] } },
      source_observation_refs: { type: 'array', uniqueItems: true, items: { oneOf: [SOURCE_REF] } },
      public_url: { type: 'string', format: 'uri' },
      channel_role: { enum: ['incumbent', 'breakout', 'ordinary', 'failed', 'unknown'] }
    }
  },
  owned_channel: {
    file: 'owned_channel.v1.json',
    prefix: 'OWN-CH-',
    identity_fields: ['platform', 'channel_id'],
    required: ['platform', 'channel_id', 'owner_account_ref', 'acl', 'consent_scope', 'authorization_checked_at', 'revoke_state'],
    properties: {
      platform: NON_EMPTY,
      channel_id: NON_EMPTY,
      owner_account_ref: NON_EMPTY,
      acl: { type: 'array', minItems: 1, uniqueItems: true, items: NON_EMPTY },
      consent_scope: { type: 'array', minItems: 1, uniqueItems: true, items: NON_EMPTY },
      authorization_checked_at: DATE,
      revoke_state: { enum: ['not_requested', 'active', 'revoked', 'unknown'] },
      analytics_refs: { type: 'array', uniqueItems: true, items: METRIC_REF },
      public_url: { type: 'string', format: 'uri' }
    }
  },
  competitor_video: {
    file: 'competitor_video.v1.json',
    prefix: 'CV-',
    identity_fields: ['platform', 'video_id'],
    required: ['platform', 'video_id', 'channel_ref', 'title', 'published_at', 'canonical_url', 'metric_refs', 'observed_format'],
    properties: {
      platform: NON_EMPTY,
      video_id: NON_EMPTY,
      channel_ref: { type: 'string', pattern: '^CH-[A-Za-z0-9][A-Za-z0-9._-]*$' },
      title: NON_EMPTY,
      published_at: DATE,
      canonical_url: { type: 'string', format: 'uri' },
      metric_refs: { type: 'array', uniqueItems: true, items: METRIC_REF },
      observed_format: NON_EMPTY,
      source_observation_refs: { type: 'array', uniqueItems: true, items: { oneOf: [SOURCE_REF] } },
      duration_seconds: { type: 'number', minimum: 0 }
    }
  },
  niche: {
    file: 'niche.v1.json',
    prefix: 'NICHE-',
    identity_fields: ['market', 'label', 'format'],
    required: ['label', 'market', 'audience', 'intent', 'format', 'policy_class', 'claim_refs', 'evidence_refs'],
    properties: {
      label: NON_EMPTY,
      market: NON_EMPTY,
      audience: NON_EMPTY,
      intent: { enum: ['seo_driven', 'content_driven', 'retention_driven', 'mixed', 'unknown'] },
      format: NON_EMPTY,
      policy_class: { enum: ['safe', 'caution', 'restricted', 'blocked', 'unknown'] },
      claim_refs: { type: 'array', uniqueItems: true, items: CLAIM_REF },
      evidence_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      language: NON_EMPTY
    }
  },
  claim: {
    file: 'claim.v1.json',
    prefix: 'CLM-',
    identity_fields: ['statement', 'scope.market', 'scope.as_of'],
    required: ['statement', 'claim_type', 'scope', 'evidence_refs', 'verification_status', 'confidence', 'independence_groups', 'checked_at', 'valid_until', 'reviewer', 'contradicts', 'origin'],
    properties: {
      statement: NON_EMPTY,
      claim_type: { enum: ['fact', 'estimate', 'inference', 'policy', 'creative'] },
      scope: {
        type: 'object',
        additionalProperties: false,
        required: ['market', 'as_of'],
        properties: {
          market: NON_EMPTY,
          language: NON_EMPTY,
          audience: NON_EMPTY,
          as_of: DATE,
          window: { oneOf: [WINDOW, NON_EMPTY] }
        }
      },
      evidence_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      verification_status: { enum: ['unverified', 'pending', 'corroborated', 'verified', 'disputed', 'rejected', 'stale', 'expired'] },
      confidence: { enum: ['low', 'medium', 'high'] },
      independence_groups: { type: 'array', minItems: 1, uniqueItems: true, items: NON_EMPTY },
      checked_at: NULL_OR_DATE,
      valid_until: NULL_OR_DATE,
      reviewer: { oneOf: [NON_EMPTY, { type: 'null' }] },
      contradicts: { type: 'array', uniqueItems: true, items: CLAIM_REF },
      origin: { enum: ['observed', 'human', 'derived', 'generated'] },
      verification_basis: { enum: ['direct_source', 'independent_human_review', 'corroborated_sources', 'not_verified'] },
      public_decision_label: { enum: ['CO', 'KHONG', 'KHONG-VERIFY'] }
    }
  },
  evidence: {
    file: 'evidence.v1.json',
    prefix: 'EVD-',
    identity_fields: ['source_ref', 'source_locator.value', 'checked_at'],
    required: ['source_ref', 'source_locator', 'content_hash', 'independent_group', 'quality', 'checked_at', 'checked_by', 'evidence_kind'],
    properties: {
      source_ref: SOURCE_REF,
      source_locator: SOURCE_LOCATOR,
      content_hash: HASH,
      supporting_excerpt: { type: 'string', minLength: 1 },
      independent_group: NON_EMPTY,
      quality: { enum: ['direct', 'official', 'secondary', 'tool_estimate', 'generated', 'unknown'] },
      checked_at: DATE,
      checked_by: NON_EMPTY,
      evidence_kind: { enum: ['source_text', 'source_metadata', 'measurement', 'policy', 'rights', 'qa', 'human_review'] },
      locator_detail: NON_EMPTY
    }
  },
  niche_decision: {
    file: 'niche_decision.v1.json',
    prefix: 'DEC-',
    identity_fields: ['niche_ref', 'market', 'language', 'decided_at'],
    required: ['niche_ref', 'market', 'language', 'audience', 'format', 'measurement_refs', 'claim_refs', 'evidence_refs', 'hard_gates', 'risk', 'decision', 'rationale', 'decided_at', 'reviewer'],
    properties: {
      niche_ref: NICHE_REF,
      market: NON_EMPTY,
      language: NON_EMPTY,
      audience: NON_EMPTY,
      format: NON_EMPTY,
      measurement_refs: { type: 'array', uniqueItems: true, items: METRIC_REF },
      claim_refs: { type: 'array', uniqueItems: true, items: CLAIM_REF },
      evidence_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      hard_gates: {
        type: 'object',
        additionalProperties: false,
        required: ['policy', 'rights', 'evidence', 'cost'],
        properties: {
          policy: { enum: ['pass', 'fail', 'needs_review'] },
          rights: { enum: ['pass', 'fail', 'needs_review'] },
          evidence: { enum: ['pass', 'fail', 'needs_review'] },
          cost: { enum: ['pass', 'fail', 'needs_review'] }
        }
      },
      risk: { enum: ['low', 'medium', 'high', 'blocked', 'unknown'] },
      cost_ceiling: COST,
      decision: { enum: ['prioritize', 'test', 'watchlist', 'hold', 'reject'] },
      rationale: NON_EMPTY,
      decided_at: DATE,
      reviewer: NON_EMPTY,
      measurement_systems: { type: 'array', uniqueItems: true, items: NON_EMPTY }
    }
  },
  production_episode: {
    file: 'production_episode.v1.json',
    prefix: 'EP-',
    identity_fields: ['series', 'brief', 'created_at'],
    required: ['channel_ref', 'series', 'brief', 'language', 'format', 'source_pack', 'claim_refs', 'ai_use_decision', 'realism', 'disclosure_required', 'disclosure_applied', 'gate_status'],
    properties: {
      channel_ref: { type: 'string', pattern: '^OWN-CH-[A-Za-z0-9][A-Za-z0-9._-]*$' },
      series: NON_EMPTY,
      brief: NON_EMPTY,
      language: { type: 'string', pattern: '^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$' },
      format: NON_EMPTY,
      source_pack: { type: 'array', uniqueItems: true, items: ANY_REF },
      decision_ref: { oneOf: [NON_EMPTY, { type: 'null' }] },
      claim_refs: { type: 'array', uniqueItems: true, items: CLAIM_REF },
      ai_use_decision: { enum: ['none', 'assistive', 'generative', 'mixed'] },
      realism: { enum: ['realistic', 'non_realistic'] },
      disclosure_required: { type: 'boolean' },
      disclosure_applied: { type: 'boolean' },
      disclosure_basis: { oneOf: [NON_EMPTY, { type: 'null' }] },
      disclosure_reviewer: { oneOf: [NON_EMPTY, { type: 'null' }] },
      disclosure_checked_at: NULL_OR_DATE,
      rights_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      gate_status: {
        type: 'object',
        additionalProperties: false,
        required: ['source', 'rights', 'policy', 'qa', 'publish'],
        properties: {
          source: { enum: ['pending', 'pass', 'fail', 'needs_review'] },
          rights: { enum: ['pending', 'pass', 'fail', 'needs_review'] },
          policy: { enum: ['pending', 'pass', 'fail', 'needs_review'] },
          qa: { enum: ['pending', 'pass', 'fail', 'needs_review'] },
          publish: { enum: ['blocked', 'private_candidate', 'approved', 'published'] }
        }
      }
    }
  },
  artifact: {
    file: 'artifact.v1.json',
    prefix: 'ART-',
    identity_fields: ['parent_ref', 'artifact_type', 'content_hash.value'],
    required: ['artifact_type', 'parent_ref', 'path_or_uri', 'content_hash', 'mime', 'engine', 'rights_evidence', 'qa'],
    properties: {
      artifact_type: { enum: ['script', 'audio', 'image', 'clip', 'mp4', 'subtitle', 'thumb', 'publish_pack'] },
      parent_ref: { oneOf: [EPISODE_REF, ARTIFACT_REF] },
      path_or_uri: URL_OR_PATH,
      content_hash: HASH,
      mime: NON_EMPTY,
      engine: NON_EMPTY,
      prompt: { type: 'string', minLength: 1 },
      rights_evidence: RIGHTS_EVIDENCE,
      qa: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'checked_at', 'checked_by'],
        properties: {
          status: { enum: ['unknown', 'pending', 'pass', 'fail', 'needs_review'] },
          checked_at: NULL_OR_DATE,
          checked_by: { oneOf: [NON_EMPTY, { type: 'null' }] },
          notes: { type: 'string', minLength: 1 }
        }
      }
    }
  },
  job_run: {
    file: 'job_run.v1.json',
    prefix: 'RUN-',
    identity_fields: ['stage', 'created_at', 'provenance.activity_id'],
    required: ['stage', 'input_refs', 'output_refs', 'run_status', 'retry_count', 'duration_ms', 'cost', 'output_probe'],
    properties: {
      stage: NON_EMPTY,
      input_refs: REFERENCE_ARRAY,
      output_refs: REFERENCE_ARRAY,
      run_status: { enum: ['queued', 'running', 'succeeded', 'failed', 'cancelled', 'blocked'] },
      retry_count: { type: 'integer', minimum: 0 },
      duration_ms: { type: 'integer', minimum: 0 },
      cost: COST,
      error: { type: 'string', minLength: 1 },
      output_probe: {
        type: 'object',
        additionalProperties: false,
        required: ['status'],
        properties: {
          status: { enum: ['not_run', 'pass', 'fail'] },
          checked_at: NULL_OR_DATE,
          stream_count: { type: 'integer', minimum: 0 },
          bytes: { type: 'integer', minimum: 0 },
          notes: { type: 'string', minLength: 1 }
        }
      }
    }
  },
  metric_snapshot: {
    file: 'metric_snapshot.v1.json',
    prefix: 'MET-',
    identity_fields: ['entity_ref', 'measurement_system', 'metric', 'collected_at'],
    required: ['entity_ref', 'measurement_system', 'metric', 'value', 'window', 'market', 'collected_at', 'source_ref', 'is_derived'],
    properties: {
      entity_ref: ANY_REF,
      measurement_system: NON_EMPTY,
      metric: NON_EMPTY,
      value: { type: 'number' },
      unit: NON_EMPTY,
      window: WINDOW,
      market: NON_EMPTY,
      collected_at: DATE,
      source_ref: SOURCE_REF,
      is_derived: { type: 'boolean' },
      derivation_refs: { type: 'array', uniqueItems: true, items: ANY_REF },
      estimate: { type: 'boolean' }
    }
  },
  relationship: {
    file: 'relationship.v1.json',
    prefix: 'REL-',
    identity_fields: ['from', 'type', 'to', 'valid_from'],
    required: ['from', 'type', 'to', 'evidence_refs', 'confidence', 'valid_from', 'valid_until'],
    properties: {
      from: ANY_REF,
      type: { enum: ['mentions', 'references', 'derived_from', 'supports', 'contradicts', 'belongs_to', 'published_on', 'produces', 'uses', 'measured_by', 'targets', 'supersedes', 'has_artifact', 'has_job', 'part_of', 'observed_on', 'candidate_for', 'about'] },
      to: ANY_REF,
      evidence_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      confidence: { enum: ['low', 'medium', 'high'] },
      valid_from: DATE,
      valid_until: NULL_OR_DATE
    }
  },
  deletion_request: {
    file: 'deletion_request.v1.json',
    prefix: 'DEL-',
    identity_fields: ['request_scope.kind', 'received_at', 'owner'],
    required: ['request_scope', 'received_at', 'due_at', 'owner', 'request_status', 'completion_proof', 'cascade_refs', 'policy_ref'],
    properties: {
      request_scope: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'refs'],
        properties: {
          kind: { enum: ['youtube_user_request', 'provider_revoke', 'legal', 'internal'] },
          refs: { type: 'array', minItems: 1, uniqueItems: true, items: ANY_REF }
        }
      },
      received_at: DATE,
      due_at: DATE,
      owner: NON_EMPTY,
      request_status: { enum: ['received', 'processing', 'completed', 'blocked', 'rejected'] },
      completion_proof: {
        oneOf: [
          { type: 'null' },
          {
            type: 'object',
            additionalProperties: false,
            required: ['completed_at', 'completed_by', 'evidence_refs'],
            properties: {
              completed_at: DATE,
              completed_by: NON_EMPTY,
              evidence_refs: { type: 'array', minItems: 1, uniqueItems: true, items: EVIDENCE_REF },
              notes: { type: 'string', minLength: 1 }
            }
          }
        ]
      },
      cascade_refs: { type: 'array', minItems: 1, uniqueItems: true, items: ANY_REF },
      policy_ref: POLICY_REF
    }
  },
  policy_snapshot: {
    file: 'policy_snapshot.v1.json',
    prefix: 'POL-',
    identity_fields: ['policy_type', 'canonical_url', 'retrieved_at'],
    required: ['policy_type', 'canonical_url', 'retrieved_at', 'effective_from', 'policy_status', 'recheck_due', 'jurisdiction', 'requirements', 'evidence_refs'],
    properties: {
      policy_type: NON_EMPTY,
      canonical_url: { type: 'string', format: 'uri' },
      retrieved_at: DATE,
      effective_from: DATE,
      policy_status: { enum: ['current', 'announced_future', 'superseded', 'expired', 'draft'] },
      recheck_due: DATE,
      jurisdiction: NON_EMPTY,
      requirements: { type: 'array', minItems: 1, items: NON_EMPTY },
      evidence_refs: { type: 'array', uniqueItems: true, items: EVIDENCE_REF },
      source_ref: SOURCE_REF
    }
  }
};

const ENTITY_TYPES = Object.keys(DEFINITIONS);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function schemaFor(entityType, definition) {
  const schema = {
    $schema: SCHEMA_DRAFT,
    $id: `h2dev://schema/${definition.file}`,
    title: `H2DEV ${entityType} contract v${CONTRACT_VERSION}`,
    description: 'Strict A1 contract. Runtime semantics are enforced by schema-validate.js; this is not a full JSON-Schema implementation.',
    contract_profile: {
      name: PROFILE,
      version: CONTRACT_VERSION,
      runtime: 'scripts/registry/schema-validate.js',
      supported_keywords: ['type', 'required', 'properties', 'additionalProperties', 'items', 'enum', 'const', 'pattern', 'format', 'minLength', 'minItems', 'minimum', 'oneOf', 'uniqueItems']
    },
    type: 'object',
    additionalProperties: false,
    required: [...COMMON_REQUIRED, ...definition.required],
    properties: {
      ...clone(COMMON_PROPERTIES),
      ...clone(definition.properties),
      schema: { const: `h2dev.${entityType}.v${CONTRACT_VERSION}` },
      entity_type: { const: entityType },
      entity_id: { type: 'string', pattern: `^${definition.prefix.replace('-', '\\-')}[A-Za-z0-9][A-Za-z0-9._-]*$` }
    }
  };
  return schema;
}

function buildIndex() {
  return {
    contract_family: 'h2dev-registry',
    contract_profile: PROFILE,
    version: CONTRACT_VERSION,
    generated_by: 'scripts/registry/schema-contracts.js',
    runtime_validator: 'scripts/registry/schema-validate.js',
    supported_keywords: ['type', 'required', 'properties', 'additionalProperties', 'items', 'enum', 'const', 'pattern', 'format', 'minLength', 'minItems', 'minimum', 'oneOf', 'uniqueItems'],
    semantic_rules: [
      'A1-ID-PREFIX-ENTITY-MATCH',
      'A1-REVISION-SUPERSEDES',
      'A1-REFERENCE-RESOLUTION',
      'A1-IDENTITY-COLLISION',
      'A1-PROVENANCE-SEPARATION',
      'A1-RIGHTS-RETENTION-SEPARATION',
      'A1-STATUS-AXES-INDEPENDENT',
      'A1-TRUST-PROMOTION-BLOCK'
    ],
    entities: ENTITY_TYPES.map(entityType => {
      const definition = DEFINITIONS[entityType];
      return {
        entity_type: entityType,
        schema: `h2dev.${entityType}.v${CONTRACT_VERSION}`,
        file: definition.file,
        id_prefix: definition.prefix,
        identity_fields: definition.identity_fields
      };
    })
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeContracts() {
  fs.mkdirSync(SCHEMA_DIR, { recursive: true });
  writeJson(path.join(SCHEMA_DIR, 'common.v1.json'), {
    $schema: SCHEMA_DRAFT,
    $id: 'h2dev://schema/common.v1.json',
    title: 'H2DEV common envelope v1',
    description: 'Shared strict envelope and independent status/provenance/retention shapes for the custom H2DEV contract profile.',
    contract_profile: {
      name: PROFILE,
      version: CONTRACT_VERSION,
      runtime: 'scripts/registry/schema-validate.js',
      supported_keywords: ['type', 'required', 'properties', 'additionalProperties', 'items', 'enum', 'const', 'pattern', 'format', 'minLength', 'minItems', 'minimum', 'oneOf', 'uniqueItems']
    },
    type: 'object',
    additionalProperties: false,
    required: COMMON_REQUIRED,
    properties: COMMON_PROPERTIES
  });
  for (const entityType of ENTITY_TYPES) {
    writeJson(path.join(SCHEMA_DIR, DEFINITIONS[entityType].file), schemaFor(entityType, DEFINITIONS[entityType]));
  }
  writeJson(path.join(SCHEMA_DIR, 'index.v1.json'), buildIndex());
  return {
    schemaDir: SCHEMA_DIR,
    files: ['common.v1.json', 'index.v1.json', ...ENTITY_TYPES.map(type => DEFINITIONS[type].file)]
  };
}

if (require.main === module) {
  const result = writeContracts();
  process.stdout.write(`Wrote ${result.files.length} A1 contract files to ${result.schemaDir}\n`);
}

module.exports = {
  CONTRACT_VERSION,
  PROFILE,
  SCHEMA_DIR,
  ENTITY_TYPES,
  DEFINITIONS,
  buildIndex,
  schemaFor,
  writeContracts
};
