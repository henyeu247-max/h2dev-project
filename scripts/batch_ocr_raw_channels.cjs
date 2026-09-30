// H2DEV Project - Batch OCR Engine for Raw Channels
// Sử dụng Gemini 2.5 Flash Vision đa key để bóc tách 100% dữ liệu chữ trên toàn bộ ảnh raw còn thiếu
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_JSON = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const KEYS_FILE = path.join(ROOT, '_private', 'gemini-api-keys.json');

const keysData = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
const keys = keysData.all_live_keys || [keysData.primary_key || keysData.GEMINI_API_KEY];

const MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest'
];

let roundRobinIdx = 0;

function getEndpoint() {
  const model = MODELS[roundRobinIdx % MODELS.length];
  const key = keys[Math.floor(roundRobinIdx / MODELS.length) % keys.length];
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

async function processImage(imagePath) {
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const base64Img = fs.readFileSync(imagePath).toString('base64');

  const payload = {
    contents: [{
      parts: [
        { text: OCR_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Img } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json"
    }
  };

  let attempts = 0;
  const maxAttempts = MODELS.length * keys.length;

  while (attempts < maxAttempts) {
    const { model, key } = getEndpoint();
    attempts++;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });
      if (res.status === 429) {
        continue;
      }
      if (!res.ok) {
        continue;
      }
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        parsed.scannedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        return { parsed, model };
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

async function main() {
  console.log('========================================================');
  console.log('>>> BẮT ĐẦU CHẠY BATCH OCR ĐA MODEL (3.7 / 3.5 / 2.5-lite)');
  console.log('========================================================\n');

  const rawData = JSON.parse(fs.readFileSync(RAW_JSON, 'utf8'));
  const missing = rawData.records.filter(r => !r.ocr);
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
      console.log(`[${i+1}/${missing.length}] ❌ ${r.id}: Không tìm thấy file ảnh ${r.fileName}`);
      continue;
    }

    process.stdout.write(`[${i+1}/${missing.length}] Đang xử lý ${r.id} (${r.fileName})...\r`);
    const result = await processImage(imgPath);

    if (result && result.parsed) {
      r.ocr = result.parsed;
      successCount++;
      const videoRowsCount = (result.parsed.videoRows || []).length;
      console.log(`[${i+1}/${missing.length}] ✅ ${r.id}: Bóc tách thành công ${videoRowsCount} video rows [${result.model}] (${result.parsed.channelName || r.channel?.handle})`);
    } else {
      console.log(`[${i+1}/${missing.length}] ⚠️ ${r.id}: Không thể bóc tách OCR.`);
    }

    // Save every 2 records
    if (successCount % 2 === 0 || i === missing.length - 1) {
      fs.writeFileSync(RAW_JSON, JSON.stringify(rawData, null, 2), 'utf8');
    }

    // Gentle pacing
    await new Promise(res => setTimeout(res, 1000));
  }

  const totalWithOcr = rawData.records.filter(r => r.ocr).length;
  console.log(`\n========================================================`);
  console.log(`>>> HOÀN TẤT BATCH OCR! ĐÃ BỔ SUNG: ${successCount}/${missing.length} BẢN GHI.`);
  console.log(`>>> TỔNG CỘNG BẢN GHI CÓ OCR HIỆN TẠI: ${totalWithOcr}/${rawData.records.length} (${((Date.now() - t0)/1000).toFixed(1)}s)`);
  console.log(`========================================================\n`);
}

main().catch(console.error);
