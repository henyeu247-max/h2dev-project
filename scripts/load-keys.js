/**
 * load-keys.js — đọc API key từ H2DEV-Project/.env (web block → an toàn).
 * Nguồn key DUY NHẤT cho scripts (trends-rotate.js, mcp-help.js).
 * Không dependency. Tự động fallback linh hoạt nếu chưa cấu hình đủ key.
 *
 * Usage:
 *   const { loadKeys, getRequiredKey } = require('./load-keys');
 *   const { TRENDS_KEYS, VIDIQ_KEY, EXA_KEY, JINA_KEY } = loadKeys();
 */
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '..', '.env');

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  const text = fs.readFileSync(file, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadKeys(options = {}) {
  const env = Object.assign({}, parseEnv(ENV_PATH), process.env);
  const TRENDS_KEYS = (env.TRENDS_KEYS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const VIDIQ_KEY = env.VIDIQ_KEY || '';
  const EXA_KEY = env.EXA_KEY || '';
  const JINA_KEY = env.JINA_KEY || '';
  const MCP_POOL_API_KEY = env.MCP_POOL_API_KEY || 'mcp-pool-2026-secure-key';

  if (options.required && Array.isArray(options.required)) {
    const missing = [];
    if (options.required.includes('TRENDS_KEYS') && !TRENDS_KEYS.length) missing.push('TRENDS_KEYS');
    if (options.required.includes('VIDIQ_KEY') && !VIDIQ_KEY) missing.push('VIDIQ_KEY');
    if (options.required.includes('EXA_KEY') && !EXA_KEY) missing.push('EXA_KEY');
    if (options.required.includes('JINA_KEY') && !JINA_KEY) missing.push('JINA_KEY');
    if (options.required.includes('MCP_POOL_API_KEY') && !MCP_POOL_API_KEY) missing.push('MCP_POOL_API_KEY');
    if (missing.length) {
      console.error(`.env thiếu key: ${missing.join(', ')}`);
      console.error('→ Vui lòng điền key vào ' + ENV_PATH);
      process.exit(1);
    }
  }

  return { TRENDS_KEYS, VIDIQ_KEY, EXA_KEY, JINA_KEY, MCP_POOL_API_KEY, hasEnv: fs.existsSync(ENV_PATH) };
}

function getRequiredKey(keyName) {
  const keys = loadKeys();
  if (keyName === 'TRENDS_KEYS') {
    if (!keys.TRENDS_KEYS || !keys.TRENDS_KEYS.length) {
      console.error('Chưa có TRENDS_KEYS trong .env');
      process.exit(1);
    }
    return keys.TRENDS_KEYS;
  }
  if (!keys[keyName]) {
    console.error(`Chưa có ${keyName} trong .env`);
    process.exit(1);
  }
  return keys[keyName];
}

module.exports = { loadKeys, getRequiredKey, ENV_PATH };
