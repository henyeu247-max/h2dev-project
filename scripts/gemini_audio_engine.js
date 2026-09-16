// H2DEV Project - Gemini Audio Intelligence Engine (Official API)
// Ho tro phan tich am thanh moi dung luong (tu file ngan vai KB toi file dai 1-2 tieng 2GB).
// Co che:
// - File <= 15 MB: Su dung inlineData base64 (sieu nhanh, 5-10 giay).
// - File > 15 MB: Su dung Google Files API (upload truc tiep, khong bi tran RAM).
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KEYS_FILE = path.join(ROOT, '_private', 'gemini-api-keys.json');

function getApiKeys() {
  if (process.env.GEMINI_KEYS) {
    return process.env.GEMINI_KEYS.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (fs.existsSync(KEYS_FILE)) {
    const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    if (data.all_live_keys && Array.isArray(data.all_live_keys)) return data.all_live_keys;
    if (data.primary_key) return [data.primary_key, ...(data.fallback_keys || [])];
    if (data.GEMINI_API_KEY) return [data.GEMINI_API_KEY];
  }
  throw new Error(`Khong tim thay GEMINI_KEYS tai ${KEYS_FILE} hoac env`);
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
      console.log(`[KeyRotation] Key #${i + 1} gap loi (${err.message.slice(0, 60)}), chuyen key fallback...`);
    }
  }
  throw new Error(`Tat ca ${keys.length} keys trong pool deu that bai. Loi cuoi: ${lastErr?.message}`);
}

async function uploadToFilesApi(filePath, mimeType, apiKey) {
  const fileBytes = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  console.log(`[Files API] Bat dau upload file lon: ${fileName} (${(fileBytes.length / (1024 * 1024)).toFixed(2)} MB)...`);
  
  // 1. Khoi tao resumable upload session
  const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
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

  // 2. Upload byte du lieu
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

async function analyzeAudio(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File am thanh khong ton tai: ${filePath}`);
  }

  return await executeWithKeyRotation(async (apiKey) => {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.wav' ? 'audio/wav' : 'audio/mp3';
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    const model = options.model || 'gemini-2.5-flash';
    const customPrompt = options.prompt || `Bạn là chuyên gia thẩm định âm thanh và đạo diễn âm thanh YouTube Faceless.
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

    let audioPart;
    if (sizeMB <= 15) {
      const base64 = fs.readFileSync(filePath).toString('base64');
      audioPart = {
        inlineData: {
          mimeType,
          data: base64,
        },
      };
    } else {
      const fileUri = await uploadToFilesApi(filePath, mimeType, apiKey);
      audioPart = {
        fileData: {
          mimeType,
          fileUri,
        },
      };
    }

    const payload = {
      contents: [
        {
          parts: [
            audioPart,
            { text: customPrompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const t0 = Date.now();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const elapsedSec = ((Date.now() - t0) / 1000).toFixed(2);

    if (data.candidates && data.candidates[0]) {
      const rawText = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        fileName,
        sizeMB: Math.round(sizeMB * 100) / 100,
        elapsedSec: parseFloat(elapsedSec),
        result: parsed,
      };
    } else {
      throw new Error(`Gemini API error: ${JSON.stringify(data.error || data)}`);
    }
  });
}

// Chay truc tiep tu command line
if (require.main === module) {
  const target = process.argv[2] || 'D:/YTB/Nhạc nền/nên.mp3';
  console.log(`=== ANALYZING AUDIO WITH GEMINI: ${path.basename(target)} ===`);
  analyzeAudio(target)
    .then(res => {
      console.log(`[PASS] Hoan tat sau ${res.elapsedSec}s:`);
      console.log(JSON.stringify(res.result, null, 2));
    })
    .catch(err => {
      console.error('[FAIL]', err.message);
      process.exitCode = 1;
    });
}

module.exports = { analyzeAudio, getApiKeys, executeWithKeyRotation };

