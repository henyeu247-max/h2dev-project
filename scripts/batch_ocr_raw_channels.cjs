// H2DEV Project - Batch OCR Engine for Raw Channels
// Engine A (Primary): CLIProxyAPI (:8317) -> gemini-3.8-flash-medium
// Engine B (Fallback): Direct Google AI Studio (GEMINI_KEYS / GEMINI_API_KEY from .env)
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const RAW_JSON = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const LEGACY_KEYS_FILE = path.join(ROOT, '_private', 'gemini-api-keys.json');
const CLIPROXY_CFG_PATH = 'D:/CLIProxyAPI/config.yaml';

function loadDotEnv(envPath = ENV_PATH) {
  if (!fs.existsSync(envPath)) return;
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
      return;
    }
  } catch (_) {}
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if (v.length >= 2 && ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))) {
        v = v.slice(1, -1);
      }
      if (k && !(k in process.env)) process.env[k] = v;
    }
  } catch (_) {}
}

loadDotEnv();

function getCliProxyConfig() {
  const baseUrl = String(process.env.CLIPROXY_BASE_URL || 'http://127.0.0.1:8317/v1').replace(/\/+$/, '');
  let apiKey = String(process.env.CLIPROXY_API_KEY || '').trim();
  if (!apiKey && fs.existsSync(CLIPROXY_CFG_PATH)) {
    try {
      const raw = fs.readFileSync(CLIPROXY_CFG_PATH, 'utf8');
      const m = raw.match(/api-keys:\s*\r?\n\s*-\s*"?([^"\r\n]+)"?/);
      if (m && m[1]) apiKey = m[1].trim();
    } catch (_) {}
  }
  return { baseUrl, apiKey: apiKey || 'sk-cli-proxy', model: process.env.CLIPROXY_VISION_MODEL || 'gemini-3.8-flash-medium' };
}

function getApiKeys() {
  loadDotEnv();
  const seen = new Set();
  const out = [];
  const push = (val) => {
    const s = String(val || '').trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  if (process.env.GEMINI_KEYS) {
    for (const k of String(process.env.GEMINI_KEYS).split(',')) push(k);
  }
  if (process.env.GEMINI_API_KEY) {
    for (const k of String(process.env.GEMINI_API_KEY).split(',')) push(k);
  }
  if (out.length === 0 && fs.existsSync(LEGACY_KEYS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LEGACY_KEYS_FILE, 'utf8'));
      for (const k of data.all_live_keys || []) push(k);
      push(data.primary_key);
      for (const k of data.fallback_keys || []) push(k);
      push(data.GEMINI_API_KEY);
    } catch (_) {}
  }
  return out;
}

const DIRECT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite'
];

function extractJsonObject(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

let roundRobinIdx = 0;

function getEndpoint(keys) {
  const model = DIRECT_MODELS[roundRobinIdx % DIRECT_MODELS.length];
  const key = keys[Math.floor(roundRobinIdx / DIRECT_MODELS.length) % keys.length];
  roundRobinIdx++;
  return { model, key };
}

const OCR_PROMPT = `Trích xuất toàn bộ dữ liệu chữ (OCR) trên ảnh chụp màn hình kênh YouTube này. Trả về đúng định dạng JSON không bọc markdown:
{
  "channelName": string,
  "handle": string,
  "subsText": string,
  "subsNumber": number,
  "videoCountText": string,
  "videoCountNumber": number,
  "monetized": "yes" | "no" | "unknown",
  "videoRows": [
    {
      "thumbText": string or null,
      "duration": string,
      "title": string,
      "viewsText": string,
      "age": string,
      "vph": string,
      "outlier": string
    }
  ]
}`;

async function processViaCliProxy(mimeType, base64Img) {
  if (process.env.H2DEV_NO_CLIPROXY === '1') return null;
  const { baseUrl, apiKey, model } = getCliProxyConfig();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Img}` } }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) return null;
    const parsed = extractJsonObject(rawText);
    parsed.scannedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return { parsed, model: `cliproxy:${model}` };
  } catch (_) {
    return null;
  }
}

async function processImage(imagePath) {
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const base64Img = fs.readFileSync(imagePath).toString('base64');

  // Engine A: CLIProxyAPI
  const proxyResult = await processViaCliProxy(mimeType, base64Img);
  if (proxyResult) return proxyResult;

  // Engine B: Direct Google AI Studio (GEMINI_KEYS / GEMINI_API_KEY)
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('Khong tim thay GEMINI_KEYS/GEMINI_API_KEY trong .env');
  }

  const payload = {
    contents: [{
      parts: [
        { text: OCR_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Img } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json'
    }
  };

  let attempts = 0;
  const maxAttempts = DIRECT_MODELS.length * keys.length;

  while (attempts < maxAttempts) {
    const { model, key } = getEndpoint(keys);
    attempts++;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = extractJsonObject(rawText);
        parsed.scannedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        return { parsed, model };
      }
    } catch (_) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
}

async function main() {
  const keys = getApiKeys();
  console.log('========================================================');
  console.log(`>>> BATCH OCR ENGINE READY (CLIProxy primary + ${keys.length} direct Gemini keys)`);
  console.log('========================================================\n');

  const rawData = JSON.parse(fs.readFileSync(RAW_JSON, 'utf8'));
  const missing = rawData.records.filter((r) => !r.ocr);
  console.log(`Tìm thấy ${missing.length} bản ghi chưa có dữ liệu OCR.\n`);

  if (missing.length === 0) {
    console.log('100% bản ghi đã có OCR! Không cần chạy thêm.');
    return;
  }

  let successCount = 0;
  const t0 = Date.now();

  for (let i = 0; i < missing.length; i++) {
    const r = missing[i];
    const p1 = path.join(ROOT, 'assets/raw-kenh', r.fileName);
    const p2 = path.join(ROOT, 'raw-kenh-goc', r.fileName);
    const imgPath = fs.existsSync(p1) ? p1 : (fs.existsSync(p2) ? p2 : null);

    if (!imgPath) {
      console.log(`[${i + 1}/${missing.length}] ❌ ${r.id}: Không tìm thấy file ảnh ${r.fileName}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${missing.length}] Đang xử lý ${r.id} (${r.fileName})...\r`);
    const result = await processImage(imgPath);

    if (result && result.parsed) {
      r.ocr = result.parsed;
      successCount++;
      const videoRowsCount = (result.parsed.videoRows || []).length;
      console.log(`[${i + 1}/${missing.length}] ✅ ${r.id}: Bóc tách thành công ${videoRowsCount} video rows [${result.model}] (${result.parsed.channelName || r.channel?.handle})`);
    } else {
      console.log(`[${i + 1}/${missing.length}] ⚠️ ${r.id}: Không thể bóc tách OCR.`);
    }

    if (successCount % 2 === 0 || i === missing.length - 1) {
      fs.writeFileSync(RAW_JSON, JSON.stringify(rawData, null, 2), 'utf8');
    }

    await new Promise((res) => setTimeout(res, 1000));
  }

  const totalWithOcr = rawData.records.filter((r) => r.ocr).length;
  console.log(`\n========================================================`);
  console.log(`>>> HOÀN TẤT BATCH OCR! ĐÃ BỔ SUNG: ${successCount}/${missing.length} BẢN GHI.`);
  console.log(`>>> TỔNG CỘNG BẢN GHI CÓ OCR HIỆN TẠI: ${totalWithOcr}/${rawData.records.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  console.log(`========================================================\n`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { getApiKeys, getCliProxyConfig, extractJsonObject, processImage };
