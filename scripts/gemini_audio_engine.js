// H2DEV Project - Gemini Audio Intelligence Engine
// Engine A (Primary, <= 15 MB): CLIProxyAPI (:8317) -> gemini-3.8-flash-medium
// Engine B (Fallback / > 15 MB Files API): Direct Google AI Studio (GEMINI_KEYS / GEMINI_API_KEY from .env)
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
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
  return { baseUrl, apiKey: apiKey || 'sk-cli-proxy', model: process.env.CLIPROXY_AUDIO_MODEL || 'gemini-3.8-flash-medium' };
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
  if (out.length === 0) {
    throw new Error(`Khong tim thay GEMINI_KEYS/GEMINI_API_KEY trong ${ENV_PATH} hoac env`);
  }
  return out;
}

function extractJsonObject(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function executeWithKeyRotation(fn) {
  const keys = getApiKeys();
  let lastErr = null;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      return await fn(key);
    } catch (err) {
      lastErr = err;
      console.log(`[KeyRotation] Key #${i + 1} gap loi (${String(err.message || err).slice(0, 60)}), chuyen key fallback...`);
    }
  }
  throw new Error(`Tat ca ${keys.length} keys trong pool deu that bai. Loi cuoi: ${lastErr?.message}`);
}

async function uploadToFilesApi(filePath, mimeType, apiKey) {
  const fileBytes = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  console.log(`[Files API] Bat dau upload file lon: ${fileName} (${(fileBytes.length / (1024 * 1024)).toFixed(2)} MB)...`);

  const initRes = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileBytes.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: fileName } }),
  });

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    const errText = await initRes.text();
    throw new Error(`Khoi tao Files API that bai: ${errText}`);
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileBytes.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileBytes,
  });

  const fileData = await uploadRes.json();
  if (!fileData.file || !fileData.file.uri) {
    throw new Error(`Upload bytes that bai: ${JSON.stringify(fileData)}`);
  }

  console.log(`[Files API] Upload thanh cong, URI: ${fileData.file.uri}`);
  return fileData.file.uri;
}

const DEFAULT_AUDIO_PROMPT = `Bạn là chuyên gia thẩm định âm thanh và đạo diễn âm thanh YouTube Faceless.
Hãy nghe kỹ toàn bộ file âm thanh đính kèm này và xuất kết quả phân tích dạng JSON thuần túy theo schema sau:
{
  "genre_style": "thể loại nhạc và phong cách",
  "mood": "tông cảm xúc chủ đạo",
  "tempo_bpm": "ước tính BPM hoặc Chậm/Vừa/Nhanh",
  "lead_instruments": ["nhạc cụ 1", "nhạc cụ 2"],
  "recommended_youtube_niches": ["ngách 1", "ngách 2"],
  "detected_track_title": "tên bài hát gốc nếu nhận diện được, hoặc để trống",
  "detected_artist": "nghệ sĩ/kênh phát hành gốc nếu biết",
  "copyright_risk": "SAFE (an toàn) / REVIEW (nghi ngờ bản quyền) / COPYRIGHTED",
  "video_editing_placement": "khuyến nghị vị trí dựng: Hook mở màn, Nhạc nền lót xuyên suốt, hay Cao trào"
}`;

async function analyzeViaCliProxy(filePath, ext, customPrompt, options = {}) {
  if (options.useCliProxy === false || process.env.H2DEV_NO_CLIPROXY === '1') return null;
  const format = ext === '.wav' ? 'wav' : (ext === '.mp3' ? 'mp3' : '');
  if (!format) return null;
  const { baseUrl, apiKey, model } = getCliProxyConfig();
  const base64 = fs.readFileSync(filePath).toString('base64');
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.proxyModel || model,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: customPrompt },
              { type: 'input_audio', input_audio: { data: base64, format } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(options.timeoutMs || 60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content;
    if (!rawText) return null;
    const parsed = extractJsonObject(rawText);
    return {
      success: true,
      engine: `cliproxy:${options.proxyModel || model}`,
      fileName: path.basename(filePath),
      elapsedSec: parseFloat(((Date.now() - t0) / 1000).toFixed(2)),
      result: parsed,
    };
  } catch (_) {
    return null;
  }
}

async function analyzeAudio(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File am thanh khong ton tai: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.wav' ? 'audio/wav' : (ext === '.ogg' ? 'audio/ogg' : 'audio/mp3');
  const stats = fs.statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  const customPrompt = options.prompt || DEFAULT_AUDIO_PROMPT;

  // Engine A (Primary for <= 15 MB): CLIProxyAPI
  if (sizeMB <= 15) {
    const proxyRes = await analyzeViaCliProxy(filePath, ext, customPrompt, options);
    if (proxyRes) {
      proxyRes.sizeMB = Math.round(sizeMB * 100) / 100;
      return proxyRes;
    }
  }

  // Engine B (Fallback / > 15 MB): Direct Google AI Studio with key rotation
  const models = options.model ? [options.model] : ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];

  return await executeWithKeyRotation(async (apiKey) => {
    let audioPart;
    if (sizeMB <= 15) {
      const base64 = fs.readFileSync(filePath).toString('base64');
      audioPart = { inlineData: { mimeType, data: base64 } };
    } else {
      const fileUri = await uploadToFilesApi(filePath, mimeType, apiKey);
      audioPart = { fileData: { mimeType, fileUri } };
    }

    const payload = {
      contents: [{ parts: [audioPart, { text: customPrompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    };

    let lastModelErr = null;
    for (const model of models) {
      const t0 = Date.now();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const elapsedSec = ((Date.now() - t0) / 1000).toFixed(2);
      if (data.candidates && data.candidates[0]) {
        const rawText = data.candidates[0].content.parts[0].text;
        const parsed = extractJsonObject(rawText);
        return {
          success: true,
          engine: `direct:${model}`,
          fileName,
          sizeMB: Math.round(sizeMB * 100) / 100,
          elapsedSec: parseFloat(elapsedSec),
          result: parsed,
        };
      }
      lastModelErr = data.error || data;
    }
    throw new Error(`Gemini API error: ${JSON.stringify(lastModelErr)}`);
  });
}

if (require.main === module) {
  const target = process.argv[2] || 'D:/YTB/Nhạc nền/nên.mp3';
  console.log(`=== ANALYZING AUDIO WITH GEMINI: ${path.basename(target)} ===`);
  analyzeAudio(target)
    .then((res) => {
      console.log(`[PASS] [${res.engine}] Hoan tat sau ${res.elapsedSec}s:`);
      console.log(JSON.stringify(res.result, null, 2));
    })
    .catch((err) => {
      console.error('[FAIL]', err.message);
      process.exitCode = 1;
    });
}

module.exports = { analyzeAudio, getApiKeys, getCliProxyConfig, executeWithKeyRotation };
