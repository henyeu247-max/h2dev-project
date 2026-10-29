'use strict';
/**
 * sync_worker.js — Worker Thread cho đồng bộ đồ thị & Master DB nền (0ms block HTTP main thread)
 */

const path = require('path');
const childProcess = require('child_process');
const { parentPort, workerData } = require('worker_threads');
const _origEmitWarningSw = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
  return _origEmitWarningSw.call(process, w, ...rest);
};

const MASTER_BUILD_TIMEOUT_MS = 90000;

function runWorkerSync(opts = {}) {
  const fullMarkdown = Boolean(opts.fullMarkdown);
  const rebuildMaster = Boolean(opts.rebuildMaster);

  if (rebuildMaster) {
    try {
      childProcess.execFileSync(
        process.execPath,
        ['--no-warnings=ExperimentalWarning', path.join(__dirname, 'build_master_db.js')],
        {
          timeout: MASTER_BUILD_TIMEOUT_MS,
          maxBuffer: 16 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );
    } catch (execErr) {
      const stderrStr = execErr && execErr.stderr ? String(execErr.stderr).trim().slice(-500) : '';
      throw new Error(`build_master_db failed: ${execErr.message}${stderrStr ? ' | stderr: ' + stderrStr : ''}`);
    }
  }

  const { buildKnowledgeAndInfraGraph } = require('./build_knowledge_vault_graph');
  const stats = buildKnowledgeAndInfraGraph({
    skipVaultMarkdown: !fullMarkdown,
    silent: true
  });

  return { ok: true, stats, rebuildMaster };
}

if (parentPort) {
  let posted = false;
  const safePost = (payload) => {
    if (posted) return;
    try {
      parentPort.postMessage(payload);
      posted = true;
    } catch (postErr) {
      try {
        parentPort.postMessage({ ok: false, error: `postMessage error: ${postErr && postErr.message ? postErr.message : 'serialize failed'}` });
        posted = true;
      } catch (_) {}
    }
  };
  try {
    const res = runWorkerSync(workerData || {});
    safePost(res);
  } catch (err) {
    safePost({
      ok: false,
      error: err && err.message ? err.message : String(err),
      stack: err && err.stack ? String(err.stack).slice(0, 600) : ''
    });
  }
}

module.exports = { runWorkerSync };
