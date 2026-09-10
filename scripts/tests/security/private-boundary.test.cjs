'use strict';

/**
 * Focused A2 contract tests.  Every filesystem mutation here is confined to
 * disposable roots created by mkdtemp; the helper under test never writes.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const boundaryApi = require('../../security/private-boundary.cjs');
const projectionApi = require('../../registry/store-projection.cjs');

const {
  PrivateBoundaryError,
  assertFilesystemRelativePath,
  assertDescendantPath,
  decodeUrlPathOnce,
  createPrivateBoundary,
  assertPrivateWritePath,
  assertPrivateReadPath,
  validateArtifactPath,
  classifyPublicProjection,
  assertPublicProjection,
  checkProjectionContext,
} = boundaryApi;
const { projectionRecord } = projectionApi;

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-a2-boundary-project-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-a2-boundary-outside-'));
  const registry = path.join(root, '_private', 'registry');
  const ledger = path.join(root, '_private', 'ledger');
  const intake = path.join(root, '_private', 'intake');
  fs.mkdirSync(registry, { recursive: true });
  fs.mkdirSync(ledger, { recursive: true });
  fs.mkdirSync(intake, { recursive: true });
  fs.mkdirSync(path.join(registry, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(registry, 'nested', 'existing.json'), '{"fixture":true}\n', 'utf8');
  fs.writeFileSync(path.join(outside, 'outside.json'), '{"outside":true}\n', 'utf8');
  return { root, outside, registry, ledger, intake };
}

function expectBoundaryError(fn, code, message) {
  assert.throws(fn, error => {
    assert(error instanceof PrivateBoundaryError, `${message}: expected PrivateBoundaryError`);
    assert.strictEqual(error.code, code, `${message}: error code`);
    return true;
  }, message);
}

function run() {
  const fixture = makeFixture();
  const results = [];
  try {
    const boundary = createPrivateBoundary({
      projectRoot: fixture.root,
      allowSyntheticRoot: true,
    });

    const tests = [
      ['explicit synthetic root is required', () => {
        expectBoundaryError(
          () => createPrivateBoundary({ projectRoot: fixture.root }),
          'EXPLICIT_SYNTHETIC_ROOT_REQUIRED',
          'arbitrary fixture roots must not be implicit',
        );
      }],
      ['known valid registry write path passes without writing', () => {
        const target = path.join(fixture.registry, 'nested', 'new.json');
        assert.strictEqual(fs.existsSync(target), false);
        const resolved = assertPrivateWritePath(boundary, 'registry/nested/new.json');
        assert.strictEqual(resolved.namespace, 'registry');
        assert.strictEqual(resolved.exists, false);
        assert.strictEqual(resolved.relativePath, '_private/registry/nested/new.json');
        assert.strictEqual(fs.existsSync(target), false, 'write assertion must not create data');
        assert.strictEqual(validateArtifactPath(boundary, 'registry/nested/another-new.json').exists, false);
      }],
      ['known valid ledger path passes', () => {
        const resolved = assertPrivateWritePath(boundary, '_private/ledger/entry-001.json');
        assert.strictEqual(resolved.namespace, 'ledger');
        assert.strictEqual(resolved.exists, false);
      }],
      ['intake namespace is explicitly allowlisted and remains private', () => {
        const resolved = assertPrivateWritePath(boundary, 'intake/runs/RUN-001/manifest.json', { namespace: 'intake' });
        assert.strictEqual(resolved.namespace, 'intake');
        assert.strictEqual(resolved.relativePath, '_private/intake/runs/RUN-001/manifest.json');
        assert.strictEqual(resolved.exists, false);
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'runs/RUN-001/manifest.json', { namespace: 'Intake' }),
          'CASEFOLD_AMBIGUITY',
          'intake namespace casing must be canonical',
        );
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/runs/RUN-001/manifest.json', { namespace: 'intake' }),
          'PRIVATE_NAMESPACE_MISMATCH',
          'intake caller must not cross into registry',
        );
      }],
      ['existing private read path passes', () => {
        const resolved = assertPrivateReadPath(boundary, 'registry/nested/existing.json');
        assert.strictEqual(resolved.exists, true);
        assert.strictEqual(resolved.operation, 'read');
      }],
      ['missing private read path fails closed', () => {
        expectBoundaryError(
          () => assertPrivateReadPath(boundary, 'registry/nested/missing.json'),
          'ARTIFACT_NOT_FOUND',
          'read assertion must require an existing file',
        );
      }],
      ['outside private namespace fails', () => {
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'data/registry/public/record.json'),
          'PRIVATE_NAMESPACE_REQUIRED',
          'non-private paths must not be writable',
        );
      }],
      ['absolute external path fails', () => {
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, path.join(fixture.outside, 'outside.json')),
          'ABSOLUTE_PATH',
          'external absolute path must be rejected',
        );
      }],
      ['absolute root/descendant contract is strict', () => {
        const inside = path.join(fixture.root, '_private', 'registry', 'nested', 'existing.json');
        assert.strictEqual(assertDescendantPath(fixture.root, inside), inside);
        expectBoundaryError(
          () => assertDescendantPath(fixture.root, fixture.outside),
          'OUTSIDE_ROOT',
          'external absolute descendant must fail',
        );
      }],
      ['UNC and drive-qualified inputs fail', () => {
        expectBoundaryError(
          () => assertFilesystemRelativePath('\\\\server\\share\\outside.json'),
          'ABSOLUTE_PATH',
          'UNC path must be rejected',
        );
        expectBoundaryError(
          () => assertFilesystemRelativePath('C:relative-drive.json'),
          'ABSOLUTE_PATH',
          'drive-qualified path must be rejected',
        );
      }],
      ['traversal segments fail before path resolution', () => {
        for (const value of ['registry/../outside.json', 'registry\\..\\outside.json', 'registry/./entry.json']) {
          expectBoundaryError(
            () => assertPrivateWritePath(boundary, value),
            'TRAVERSAL_SEGMENT',
            `traversal must fail: ${value}`,
          );
        }
      }],
      ['NUL and control characters fail', () => {
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/unsafe\u0000.json'),
          'NUL_BYTE',
          'NUL must be rejected',
        );
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/unsafe\u0001.json'),
          'CONTROL_CHARACTER',
          'control byte must be rejected',
        );
      }],
      ['ADS syntax fails', () => {
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/artifact.json:secret'),
          'ADS_PATH',
          'NTFS alternate data stream must be rejected',
        );
      }],
      ['encoded and double-encoded filesystem paths fail without decoding', () => {
        for (const value of ['registry/%2e%2e/outside.json', 'registry/%252e%252e/outside.json', 'registry/%2fsecret']) {
          expectBoundaryError(
            () => assertPrivateWritePath(boundary, value),
            'ENCODED_PATH',
            `encoded path must fail: ${value}`,
          );
        }
        assert.strictEqual(decodeUrlPathOnce('/private/a%20b'), '/private/a b');
        expectBoundaryError(
          () => decodeUrlPathOnce('/private/%252e%252e'),
          'DOUBLE_DECODE_AMBIGUITY',
          'URL decoder must reject a second decode ambiguity',
        );
      }],
      ['reserved prototype names fail closed', () => {
        for (const name of ['__proto__', 'prototype', 'constructor', 'toString', 'constructor.json']) {
          expectBoundaryError(
            () => assertPrivateWritePath(boundary, `registry/${name}/artifact.json`),
            'RESERVED_PROTOTYPE_SEGMENT',
            `reserved prototype segment must fail: ${name}`,
          );
        }
      }],
      ['Windows device names and normalization ambiguity fail', () => {
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/CON.txt'),
          'WINDOWS_DEVICE_NAME',
          'device name must fail',
        );
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/name. /artifact.json'),
          'WINDOWS_NORMALIZATION_AMBIGUITY',
          'trailing space must fail',
        );
      }],
      ['parent symlink fails', () => {
        const link = path.join(fixture.registry, 'symlink-parent');
        fs.symlinkSync(fixture.outside, link, 'junction');
        assert.strictEqual(fs.lstatSync(link).isSymbolicLink(), true, 'Windows junction must be a reparse link');
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/symlink-parent/new.json'),
          'LINK_ANCESTOR',
          'symlink parent must fail',
        );
      }],
      ['real Windows junction parent fails', () => {
        const junction = path.join(fixture.registry, 'junction-parent');
        fs.symlinkSync(fixture.outside, junction, 'junction');
        assert.strictEqual(fs.lstatSync(junction).isSymbolicLink(), true, 'junction fixture must be link-backed');
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/junction-parent/new.json'),
          'LINK_ANCESTOR',
          'junction parent must fail',
        );
      }],
      ['symlink target directory fails for read and write', () => {
        const link = path.join(fixture.registry, 'link-target-dir');
        fs.symlinkSync(fixture.outside, link, 'junction');
        expectBoundaryError(
          () => assertPrivateWritePath(boundary, 'registry/link-target-dir/new.json'),
          'LINK_ANCESTOR',
          'symlink target directory must fail write assertion',
        );
        expectBoundaryError(
          () => assertPrivateReadPath(boundary, 'registry/link-target-dir/outside.json'),
          'LINK_ANCESTOR',
          'symlink target directory must fail read assertion',
        );
      }],
      ['public projection uses an explicit fail-closed allowlist', () => {
        const safe = classifyPublicProjection({
          sensitivity: 'public',
          schema: 'h2dev-contract-v1',
          entity_id: 'CH-safe',
          entity_type: 'competitor_channel',
          revision: 1,
          status: 'observed',
          title: 'Public fixture',
        }, { path: 'data/registry/public/CH-safe.json' });
        assert.strictEqual(safe.decision, 'ALLOW');
        assert.strictEqual(classifyPublicProjection({ sensitivity: 'restricted' }, { path: 'data/registry/public/a.json' }).decision, 'BLOCK');
        assert.strictEqual(classifyPublicProjection({ sensitivity: 'public' }, { path: 'data/raw/a.json' }).decision, 'BLOCK');
        assert.strictEqual(classifyPublicProjection({ sensitivity: 'public' }, { path: 'data/registry/public' }).reason, 'PUBLIC_ARTIFACT_REQUIRED');
        assert.strictEqual(classifyPublicProjection({ sensitivity: 'public', token: 'never' }, { path: 'data/registry/public/a.json' }).decision, 'BLOCK');
        assert.strictEqual(classifyPublicProjection({ sensitivity: 'public', unknown_field: 'never' }, { path: 'data/registry/public/a.json' }).decision, 'BLOCK');
      }],
      ['public projection validates scalar values and drops nested content', () => {
        const cases = [
          { value: { token: 'SECRET', nested: { transcript: 'PRIVATE' } }, reason: 'SENSITIVE_NESTED_FIELD' },
          { value: ['not', 'a', 'public', 'scalar'], reason: 'ARRAY_VALUE_NOT_ALLOWED' },
          { value: { ordinary: 'object' }, reason: 'NESTED_VALUE_NOT_ALLOWED' },
          { value: 42, reason: 'FIELD_VALUE_TYPE_NOT_ALLOWED' },
        ];
        for (const [index, item] of cases.entries()) {
          const candidate = {
            sensitivity: 'public',
            entity_id: `LSKU-NESTED-${index}`,
            entity_type: 'learning_sku',
            title: item.value,
          };
          const classification = classifyPublicProjection(candidate, {
            path: `data/registry/public/${candidate.entity_id}.json`,
          });
          assert.strictEqual(classification.decision, 'BLOCK', `case ${index} must block`);
          assert.strictEqual(classification.reason, item.reason, `case ${index} reason`);
          assert(!JSON.stringify(classification).includes('SECRET'), 'classification must not echo nested secret');
          assert(!JSON.stringify(classification).includes('PRIVATE'), 'classification must not echo nested private value');

          const projected = projectionRecord(candidate, 'public');
          assert.strictEqual(projected.record, null, `consumer must drop case ${index}`);
          assert(!JSON.stringify(projected).includes('SECRET'), 'projection diagnostics must not echo nested secret');
          assert(!JSON.stringify(projected).includes('PRIVATE'), 'projection diagnostics must not echo nested private value');
        }
      }],
      ['public projection rejects scalar type confusion and prototype keys', () => {
        const invalid = [
          { field: 'revision', value: '1' },
          { field: 'status', value: null },
          { field: 'title', value: true },
          { field: 'title', value: undefined },
        ];
        for (const [index, item] of invalid.entries()) {
          const candidate = {
            sensitivity: 'public',
            entity_id: `LSKU-TYPE-${index}`,
            entity_type: 'learning_sku',
            revision: 1,
            title: 'Safe title',
          };
          Object.defineProperty(candidate, item.field, {
            configurable: true,
            enumerable: true,
            value: item.value,
            writable: true,
          });
          const classification = classifyPublicProjection(candidate, {
            path: `data/registry/public/${candidate.entity_id}.json`,
          });
          assert.strictEqual(classification.decision, 'BLOCK', `type case ${index} must block`);
          assert.strictEqual(classification.reason, 'FIELD_VALUE_TYPE_NOT_ALLOWED', `type case ${index} reason`);
        }

        const prototypeKey = JSON.parse('{"sensitivity":"public","entity_id":"LSKU-PROTO","entity_type":"learning_sku","title":"Safe title","__proto__":"not inherited"}');
        assert(Object.prototype.hasOwnProperty.call(prototypeKey, '__proto__'), 'fixture must have an own prototype key');
        const prototypeClassification = classifyPublicProjection(prototypeKey, {
          path: 'data/registry/public/LSKU-PROTO.json',
        });
        assert.strictEqual(prototypeClassification.decision, 'BLOCK');
        assert.strictEqual(prototypeClassification.reason, 'SENSITIVE_FIELD_NOT_PUBLIC');
      }],
      ['public projection permits benign URLs but blocks schemes, userinfo, signed queries, and encoded variants', () => {
        const base = {
          sensitivity: 'public',
          entity_type: 'competitor_channel',
        };
        const benign = [
          'https://example.test/public',
          'HTTPS://example.test/public?ref=homepage&lang=en',
          'http://example.test/watch?v=abc123',
        ];
        for (const [index, publicUrl] of benign.entries()) {
          const candidate = { ...base, entity_id: `CH-BENIGN-${index}`, public_url: publicUrl };
          const classification = classifyPublicProjection(candidate, {
            path: `data/registry/public/${candidate.entity_id}.json`,
          });
          assert.strictEqual(classification.decision, 'ALLOW', `benign URL ${publicUrl}`);
          const projected = projectionRecord(candidate, 'public');
          assert.deepStrictEqual(projected.record.public_url, publicUrl);
        }

        const blocked = [
          ['https://user:pass@example.test/public', 'PUBLIC_URL_USERINFO_NOT_ALLOWED'],
          ['https://example.test/public?token=SECRET', 'SIGNED_URL_QUERY_NOT_ALLOWED'],
          ['https://example.test/public?%54OKEN=SECRET', 'SIGNED_URL_QUERY_NOT_ALLOWED'],
          ['https://example.test/public?%73ig=SIGNED', 'SIGNED_URL_QUERY_NOT_ALLOWED'],
          ['https://example.test/public?%45xpires=999', 'SIGNED_URL_QUERY_NOT_ALLOWED'],
          ['https://example.test/public?X-Amz-Signature=SIGNED&X-Amz-Expires=999', 'SIGNED_URL_QUERY_NOT_ALLOWED'],
          ['https://example.test/public?%2574oken=SECRET', 'URI_QUERY_ENCODING_AMBIGUOUS'],
          ['javascript:alert(1)', 'PUBLIC_URL_SCHEME_NOT_ALLOWED'],
          ['data:text/plain,SECRET', 'PUBLIC_URL_SCHEME_NOT_ALLOWED'],
          ['ftp://example.test/public', 'PUBLIC_URL_SCHEME_NOT_ALLOWED'],
          ['https%3A%2F%2Fuser%3Apass%40example.test%2F', 'PUBLIC_URL_SCHEME_REQUIRED'],
        ];
        for (const [index, [publicUrl, reason]] of blocked.entries()) {
          const candidate = { ...base, entity_id: `CH-BLOCKED-${index}`, public_url: publicUrl };
          const classification = classifyPublicProjection(candidate, {
            path: `data/registry/public/${candidate.entity_id}.json`,
          });
          assert.strictEqual(classification.decision, 'BLOCK', `blocked URL ${publicUrl}`);
          assert.strictEqual(classification.reason, reason, `blocked URL reason ${publicUrl}`);
          const projected = projectionRecord(candidate, 'public');
          assert.strictEqual(projected.record, null, `consumer must drop ${publicUrl}`);
          assert(!JSON.stringify(projected).includes('SECRET'), 'projection must not echo URL secret');
          assert(!JSON.stringify(projected).includes('?%73ig=SIGNED'), 'projection must not echo URL signature value');
        }
      }],
      ['malicious URI content in an allowed string field is blocked without naive word matching', () => {
        const malicious = [
          { field: 'title', value: 'Open https://user:pass@example.test/public?%73ig=SIGNED' },
          { field: 'title', value: 'Open https%3A%2F%2Fuser%3Apass%40example.test%2F%3Ftoken%3DSECRET' },
          { field: 'title', value: 'javascript:alert(1)' },
        ];
        for (const [index, item] of malicious.entries()) {
          const candidate = {
            sensitivity: 'public', entity_id: `LSKU-URI-${index}`, entity_type: 'learning_sku',
            title: 'Safe title',
          };
          candidate[item.field] = item.value;
          const classification = classifyPublicProjection(candidate, {
            path: `data/registry/public/${candidate.entity_id}.json`,
          });
          assert.strictEqual(classification.decision, 'BLOCK', `malicious URI ${index}`);
          assert(!JSON.stringify(classification).includes('SECRET'), 'URI classification must not echo secret');
          assert.strictEqual(projectionRecord(candidate, 'public').record, null, `consumer must drop URI ${index}`);
        }

        const ordinaryText = classifyPublicProjection({
          sensitivity: 'public', entity_id: 'LSKU-TEXT', entity_type: 'learning_sku',
          title: 'A public token workshop',
          description: 'Discusses signatures and expiry dates as ordinary words.',
        }, { path: 'data/registry/public/LSKU-TEXT.json' });
        assert.strictEqual(ordinaryText.decision, 'ALLOW', 'ordinary words are not treated as secret values');
      }],
      ['public projection errors never echo rejected URL values', () => {
        const rejected = {
          sensitivity: 'public', entity_id: 'CH-NO-ECHO', entity_type: 'competitor_channel',
          public_url: 'https://user:SECRET@example.test/public?token=PRIVATE&sig=SIGNED',
        };
        assert.throws(
          () => assertPublicProjection(rejected, { path: 'data/registry/public/CH-NO-ECHO.json' }),
          error => {
            assert(error instanceof PrivateBoundaryError);
            assert.strictEqual(error.code, 'PUBLIC_PROJECTION_BLOCKED');
            assert(!error.message.includes('SECRET'));
            assert(!error.message.includes('PRIVATE'));
            assert(!JSON.stringify(error).includes('SECRET'));
            assert(!JSON.stringify(error).includes('PRIVATE'));
            assert(!JSON.stringify(error).includes('SIGNED'));
            return true;
          },
        );
      }],
      ['issued boundary descriptors are deeply immutable and forged clones fail', () => {
        assert.strictEqual(Object.isFrozen(boundary), true);
        assert.strictEqual(Object.isFrozen(boundary.privateRoots), true);
        assert.strictEqual(Object.isFrozen(boundary.limitations), true);
        assert.throws(() => { boundary.privateRoots.registry = 'D:\\outside'; }, TypeError);
        const clone = JSON.parse(JSON.stringify(boundary));
        expectBoundaryError(
          () => assertPrivateWritePath(clone, 'registry/forged.json'),
          'BOUNDARY_TYPE',
          'JSON-cloned descriptor must not gain boundary capability',
        );
        const forged = {
          kind: 'h2dev-private-boundary',
          version: 'a2.private-boundary.v1',
          canonicalProjectRoot: fixture.root,
          privateRoots: {
            registry: fixture.registry,
            ledger: fixture.ledger,
            intake: fixture.intake,
          },
        };
        expectBoundaryError(
          () => assertPrivateWritePath(forged, 'registry/forged.json'),
          'BOUNDARY_TYPE',
          'hand-built descriptor must not gain boundary capability',
        );
        const valid = assertPrivateWritePath(boundary, 'registry/valid-after-forgery.json');
        assert.strictEqual(valid.namespace, 'registry');
      }],
      ['origin/auth/version context conflicts fail closed', () => {
        const valid = checkProjectionContext({
          origin: 'public',
          expectedOrigin: 'public',
          auth: 'none',
          expectedAuth: 'none',
          version: 'v1',
          expectedVersion: 'v1',
        });
        assert.strictEqual(valid.decision, 'ALLOW');
        const conflict = checkProjectionContext({
          origin: 'private',
          expectedOrigin: 'public',
          auth: 'none',
          expectedAuth: 'none',
          version: 'v2',
          expectedVersion: 'v1',
        });
        assert.strictEqual(conflict.decision, 'BLOCK');
        assert.deepStrictEqual(conflict.conflicts.map(item => item.field), ['origin', 'version']);
        assert.strictEqual(checkProjectionContext({}).decision, 'BLOCK');
        const unknownAuth = checkProjectionContext({ origin: 'public', auth: 'Bearer secret-token', version: 'v1' });
        assert.strictEqual(unknownAuth.decision, 'BLOCK');
        assert(unknownAuth.conflicts.every(item => item.actual !== 'Bearer secret-token' && item.expected !== 'Bearer secret-token'));
      }],
    ];

    for (const [name, test] of tests) {
      try {
        test();
        results.push({ name, status: 'PASS' });
      } catch (error) {
        results.push({ name, status: 'FAIL', message: error.message, code: error.code });
      }
    }
  } finally {
    // These are disposable synthetic roots only; no project/user files are
    // touched.  Keep cleanup inside the exact mkdtemp paths.
    fs.rmSync(fixture.root, { recursive: true, force: true });
    fs.rmSync(fixture.outside, { recursive: true, force: true });
  }

  const failed = results.filter(result => result.status === 'FAIL');
  const output = {
    schema: 'h2dev.a2.private-boundary.fixture-test-results.v1',
    contract: 'a2.private-boundary.v1',
    scope: 'PASS_CONTRACT_ONLY',
    platform: process.platform,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    tests: results,
    limitations: [
      'single local trusted writer/workspace',
      'not an adversarial-OS proof',
      'validation and open/rename can race; an atomic/no-follow writer primitive remains required for a later A3 implementation',
    ],
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return failed.length ? 1 : 0;
}

if (require.main === module) process.exitCode = run();

module.exports = { makeFixture, run };
