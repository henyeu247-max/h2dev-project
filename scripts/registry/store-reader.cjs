'use strict';

// Small named reader facade kept separate from the writer so callers can make
// the no-write intent explicit in code review.
const core = require('./store-core.cjs');

module.exports = {
  STORE_FORMAT: core.STORE_FORMAT,
  GENESIS: core.GENESIS,
  RegistryStoreError: core.RegistryStoreError,
  makeContext: core.makeContext,
  // Explicit write-side bootstrap is exported here for callers that want to
  // provision a synthetic store before invoking any writer API; readStore and
  // loadState themselves remain non-provisioning.
  initializeStore: core.initializeStore,
  loadState: core.loadState,
  readStore: core.readStore,
  recoverStore: core.recoverStore,
};
