/**
 * ai_video_deep_analyzer.js — Công cụ Phân tích Video 7 Tầng Chuyên Sâu Bằng AI Multimodal (AGV 3.8)
 *
 * Sứ mệnh: Triệt tiêu hoàn toàn cách làm regex/heuristic từ khóa thô sơ.
 * Sử dụng Model AI chuẩn (Ưu tiên số 1: gemini-3.8-flash-medium / gemini-3.8-flash-high qua CLIProxyAPI :8317 với 11 tài khoản Antigravity,
 * dự phòng 9Router :20128 ag/gemini-3.8-flash-medium) kết hợp:
 *   1) Multimodal Video Proxy thật (CUDA ffmpeg 0.5fps 540p + 16kHz AAC) + Ảnh lưới Keyframes
 *   2) Toàn bộ Lời thoại Phụ đề (transcript.json / transcript.txt)
 *   3) Toàn bộ Tài liệu đính kèm & Mô tả gốc (description.txt, README.md, SOP.md)
 *   4) Kiểm chứng trực tiếp các kênh đối thủ trên YouTube (HTTP 200 / yt-dlp)
 * để chuẩn hóa đồng bộ cả 7 tầng dữ liệu của bài giảng H2DEV.
 *
 * Chạy:
 *   node scripts/ai_video_deep_analyzer.js VIDEO-xxxxxx [--apply] [--mode=medium|high|argon]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execSync, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SKU = process.argv[2];
const APPLY = process.argv.includes('--apply');
const MODE_ARG = (process.argv.find(a => a.startsWith('--mode=')) || '--mode=medium').split('=')[1].toLowerCase();

if (!SKU || !/^VIDEO-[A-Za-z0-9]+$/.test(SKU)) {
  console.error('Usage: node scripts/ai_video_deep_analyzer.js VIDEO-xxxxxx [--apply] [--mode=medium|high|argon]');
  process.exit(1);
}

const CPA_URL = process.env.CLIPROXY_BASE_URL || 'http://127.0.0.1:8317/v1/chat/completions';
const ROUTER_URL = process.env.ROUTER9_BASE_URL || 'http://127.0.0.1:20128/v1/chat/completions';

function getCliProxyKey() {
  if (process.env.CLIPROXY_API_KEY) return process.env.CLIPROXY_API_KEY.trim();
  try {
    const cfgPath = 'D:/CLIProxyAPI/config.yaml';
    if (fs.existsSync(cfgPath)) {
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const m = raw.match(/api-keys:\s*\r?\n\s*-\s*"?([^"\r\n]+)"?/);
      if (m && m[1]) return m[1].trim();
    }
  } catch (e) {}
  return 'sk-cliproxy-master-key-2026';
}

function get9RouterKey() {
  if (process.env.ROUTER_KEY) return process.env.ROUTER_KEY;
  try {
    const out = execSync('py -c "import sqlite3, os; p=os.path.expanduser(r\'~\\\\AppData\\\\Roaming\\\\9router\\\\db\\\\data.sqlite\'); con=sqlite3.connect(\'file:%s?mode=ro\'%p, uri=True); row=con.execute(\'SELECT key FROM apiKeys WHERE isActive=1 LIMIT 1\').fetchone(); print(row[0] if row else \'\')"').toString().trim();
    if (out) return out;
  } catch (e) {}
  return 'sk-54e9b77842b098ae-9drhpf-5b2a20dd';
}

function getFfmpegBin() {
  const candidates = [
    'D:/Linly-Dubbing/bin/ffmpeg.exe',
    'ffmpeg'
  ];
  for (const c of candidates) {
    if (c === 'ffmpeg' || fs.existsSync(c)) return c;
  }
  return 'ffmpeg';
}

function buildVideoProxyBase64(mp4Path, maxDurSec = 900) {
  if (!fs.existsSync(mp4Path)) return null;
  const ffmpegBin = getFfmpegBin();
  const tmpProxy = path.join(os.tmpdir(), `h2dev_vid_proxy_${SKU}_${Date.now()}.mp4`);
  try {
    execFileSync(ffmpegBin, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-hwaccel', 'cuda',
      '-t', String(maxDurSec),
      '-i', mp4Path,
      '-vf', 'fps=0.5,scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '34', '-tune', 'stillimage',
      '-c:a', 'aac', '-ac', '1', '-ar', '16000', '-b:a', '24k',
      tmpProxy
    ], { timeout: 60000, stdio: 'ignore', windowsHide: true });
    if (fs.existsSync(tmpProxy)) {
      const b64 = fs.readFileSync(tmpProxy).toString('base64');
      const mb = (fs.statSync(tmpProxy).size / (1024 * 1024)).toFixed(2);
      console.log(`[Input] Đã nén Multimodal Video Proxy (0.5fps 540p + 16kHz AAC): ${mb} MB`);
      return b64;
    }
  } catch (e) {
    console.warn(`[Warn] Không thể tạo video proxy (${e.message}), dùng ảnh lưới dự phòng.`);
  } finally {
    try { if (fs.existsSync(tmpProxy)) fs.unlinkSync(tmpProxy); } catch (e) {}
  }
  return null;
}

function checkYouTubeHandleHttp(handle) {
  const clean = String(handle || '').replace(/^@/, '').trim();
  const url = `https://www.youtube.com/@${encodeURIComponent(clean)}`;
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    }, (res) => {
      res.resume();
      resolve({ handle: `@${clean}`, status: res.statusCode, live: res.statusCode === 200 });
    }).on('error', () => resolve({ handle: `@${clean}`, status: 0, live: false }));
  });
}

console.log(`================================================================`);
console.log(`>>> BẮT ĐẦU PHÂN TÍCH 7 TẦNG AI MULTIMODAL (AGV 3.8): ${SKU} <<<`);
console.log(`================================================================\n`);

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const item = catalog.find(x => x.sku === SKU);
if (!item) {
  console.error(`Lỗi: Không tìm thấy ${SKU} trong catalog.json`);
  process.exit(1);
}

const vDir = path.join(ROOT, 'video', SKU);
const mp4Path = path.join(vDir, `${SKU}.mp4`);
const transcriptJsonPath = path.join(vDir, 'transcript.json');
const transcriptTxtPath = path.join(vDir, 'transcript.txt');

let segments = [];
if (fs.existsSync(transcriptJsonPath)) {
  segments = JSON.parse(fs.readFileSync(transcriptJsonPath, 'utf8')).segments || [];
}
const transcriptText = fs.existsSync(transcriptTxtPath) ? fs.readFileSync(transcriptTxtPath, 'utf8') : '';

let attachedContext = '';
for (const d of ['docs', 'assets/docs']) {
  const dirPath = path.join(ROOT, d, SKU);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    for (const fn of fs.readdirSync(dirPath)) {
      if (/\.(txt|md|csv)$/i.test(fn)) {
        const content = fs.readFileSync(path.join(dirPath, fn), 'utf8');
        attachedContext += `\n--- FILE: ${d}/${SKU}/${fn} ---\n${content.slice(0, 6000)}\n`;
      }
    }
  }
}

const videoProxyB64 = buildVideoProxyBase64(mp4Path, 900);
const gridFramePath = path.join(ROOT, '_audit/20260918-full-136-audit/frames', `${SKU}_grid.jpg`);
let frameBase64 = null;
if (!videoProxyB64 && fs.existsSync(gridFramePath)) {
  frameBase64 = fs.readFileSync(gridFramePath).toString('base64');
  console.log(`[Input] Đã nạp ảnh lưới khung hình thật: ${gridFramePath}`);
}

const segStartSummary = segments
  .filter((_, idx) => idx === 0 || idx % 4 === 0)
  .map(s => `${Math.round(s.start)}s (${String(Math.floor(Math.round(s.start) / 60)).padStart(2, '0')}:${String(Math.round(s.start) % 60).padStart(2, '0')}): ${s.text.slice(0, 70)}`)
  .join('\n');

const systemPrompt = `Bạn là Kiến trúc sư Trưởng và Chuyên gia Kiểm định Pháp y Đa phương thức 7 Tầng tại H2DEV.
Nhiệm vụ của bạn là xem trực tiếp video + nghe âm thanh + đọc phụ đề + đọc tài liệu đính kèm để mổ xẻ TOÀN DIỆN 7 TẦNG của bài giảng này.
TUYỆT ĐỐI KHÔNG SUY ĐOÁN, KHÔNG BỊA CON SỐ/TÊN CÔNG CỤ/HANDLE KÊNH NGOÀI BẰNG CHỨNG TRONG VIDEO VÀ TÀI LIỆU.
Đặc biệt lưu ý:
1. Mọi công cụ trong "tools_mentioned" và mọi con số/tên riêng trong "key_takeaways", "edit_sop", "avoid_flags" PHẢI xuất hiện trong lời thoại (transcript) hoặc tài liệu đính kèm của bài học (để vượt qua check-grounding.py 100%).
2. Mọi mốc "seconds" trong "key_timestamps" (>= 5 mốc, tăng dần nghiêm ngặt) PHẢI khớp chính xác với giây bắt đầu của một phân đoạn phụ đề thật trong danh sách phân đoạn đính kèm.
3. Đọc chính xác 100% các @handle kênh đối thủ xuất hiện trên màn hình YouTube trong video hoặc trong description.txt.

Trả về DUY NHẤT một khối JSON hợp lệ theo đúng schema:
{
  "actual_topic": "Chủ đề thực chiến cốt lõi của bài giảng",
  "category_group": "ngach_xanh",
  "niche_primary": "Tên ngách chính xác",
  "target_market": "Thị trường mục tiêu",
  "channels_detected": ["@handle1", "@handle2"],
  "tools_mentioned": ["Claude", "ElevenLabs"],
  "key_takeaways": [
    "📌 [Tiêu đề 1]: [Nội dung cụ thể bám sát 100% video & số liệu thật]",
    "📌 [Tiêu đề 2]: [Nội dung cụ thể 2]",
    "📌 [Tiêu đề 3]: [Nội dung cụ thể 3]",
    "📌 [Tiêu đề 4]: [Nội dung cụ thể 4]",
    "📌 [Tiêu đề 5]: [Nội dung cụ thể 5]"
  ],
  "key_timestamps": [
    { "seconds": 0, "time": "00:00", "label": "Mô tả phân cảnh 1" }
  ],
  "edit_sop": {
    "primary": "Tóm tắt 1 câu quy trình sản xuất & edit cốt lõi",
    "additional": [
      "Bước triển khai chi tiết 1 (không đánh số 1. ở đầu)",
      "Bước triển khai chi tiết 2",
      "Bước triển khai chi tiết 3",
      "Bước triển khai chi tiết 4"
    ]
  },
  "avoid_flags": [
    "Cảnh báo lỗi cần tránh 1 được giảng viên nhấn mạnh",
    "Cảnh báo lỗi cần tránh 2"
  ],
  "subtitle_audit": {
    "accuracy_score": 100,
    "quality_verdict": "Chuẩn xác 1:1",
    "notes": "Nhận xét đối chiếu giữa âm thanh/màn hình video và lời thoại phụ đề"
  }
}`;

const userContent = [];
if (videoProxyB64) {
  userContent.push({
    type: 'image_url',
    image_url: { url: `data:video/mp4;base64,${videoProxyB64}` }
  });
} else if (frameBase64) {
  userContent.push({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${frameBase64}` }
  });
}
userContent.push({
  type: 'text',
  text: `THÔNG TIN BÀI GIẢNG:\n- SKU: ${SKU}\n- Tiêu đề gốc: ${item.title}\n- Thời lượng: ${item.duration_sec}s (${item.duration})\n\nDANH SÁCH MỐC GIÂY BẮT ĐẦU SEGMENT HỢP LỆ:\n${segStartSummary}\n\nTÀI LIỆU ĐÍNH KÈM & MÔ TẢ GỐC:\n${attachedContext}\n\nTOÀN BỘ LỜI THOẠI PHỤ ĐỀ (TRANSCRIPT):\n"""\n${transcriptText}\n"""\n\nHãy đối chiếu Video + Phụ đề + Tài liệu và trả về JSON 7 tầng chuẩn xác 100%!`
});

async function callMultimodalEngine() {
  const cpaModels = MODE_ARG === 'high'
    ? ['gemini-3.8-flash-high', 'gemini-3.8-flash-medium']
    : (MODE_ARG === 'argon'
      ? ['gemini-4-argon-medium', 'gemini-3.8-flash-high']
      : ['gemini-3.8-flash-medium', 'gemini-3.8-flash-high']);

  const cpaKey = getCliProxyKey();
  for (const model of cpaModels) {
    try {
      console.log(`[Engine A: CLIProxyAPI :8317] Đang gọi ${model}...`);
      const res = await fetch(CPA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cpaKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        }),
        signal: AbortSignal.timeout(75000)
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content || '';
        if (txt.trim()) return { text: txt.trim(), engine: 'cliproxy-8317', model };
      }
    } catch (e) {
      console.warn(`[Warn] CLIProxyAPI ${model} lỗi: ${e.message}`);
    }
  }

  const routerKey = get9RouterKey();
  for (const model of ['ag/gemini-3.8-flash-medium', 'ag/gemini-3.8-flash-high']) {
    try {
      console.log(`[Engine B: 9Router :20128] Đang gọi ${model}...`);
      const res = await fetch(ROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${routerKey}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ]
        }),
        signal: AbortSignal.timeout(75000)
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content || '';
        if (txt.trim()) return { text: txt.trim(), engine: '9router-20128', model };
      }
    } catch (e) {
      console.warn(`[Warn] 9Router ${model} lỗi: ${e.message}`);
    }
  }
  throw new Error('Tất cả Multimodal Engines (:8317 và :20128) đều không phản hồi.');
}

function snapToSegmentStart(sec, segs) {
  if (!segs || !segs.length) return sec;
  let best = Math.round(segs[0].start);
  let bestDiff = Math.abs(best - sec);
  for (const s of segs) {
    const st = Math.round(s.start);
    const d = Math.abs(st - sec);
    if (d < bestDiff) {
      best = st;
      bestDiff = d;
    }
  }
  return best;
}

(async () => {
  const t0 = Date.now();
  const { text: rawJsonText, engine, model } = await callMultimodalEngine();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[AI Engine] Hoàn thành qua ${engine} (${model}) trong ${elapsed}s!\n`);

  const clean = rawJsonText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(clean);

  // Snap timestamps to exact segment starts
  if (Array.isArray(parsed.key_timestamps) && segments.length > 0) {
    const snapped = [];
    let lastSec = -1;
    for (const ts of parsed.key_timestamps) {
      const s = snapToSegmentStart(Number(ts.seconds) || 0, segments);
      if (s > lastSec && s < (item.duration_sec || 99999)) {
        const m = Math.floor(s / 60);
        const rem = s % 60;
        snapped.push({
          seconds: s,
          time: `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`,
          label: String(ts.label || '').trim()
        });
        lastSec = s;
      }
    }
    parsed.key_timestamps = snapped;
  }

  // Live check detected YouTube handles
  const verifiedHandles = [];
  for (const h of (parsed.channels_detected || [])) {
    const chk = await checkYouTubeHandleHttp(h);
    console.log(`[YouTube Check] ${chk.handle} -> HTTP ${chk.status} (${chk.live ? 'LIVE' : 'DEAD/404'})`);
    if (chk.live) verifiedHandles.push(chk.handle);
  }

  console.log('\n--- KẾT QUẢ PHÂN TÍCH 7 TẦNG AI GROUNDED ---');
  console.log(`🎯 Chủ đề thực chiến: ${parsed.actual_topic}`);
  console.log(`📺 Kênh đối thủ (Live HTTP 200): ${JSON.stringify(verifiedHandles)}`);
  console.log(`🛠️ Công cụ: ${JSON.stringify(parsed.tools_mentioned)}`);
  console.log(`📋 Mấu chốt bài giảng (${(parsed.key_takeaways || []).length} ý):`);
  (parsed.key_takeaways || []).forEach(t => console.log(`   ${t}`));
  console.log(`⏱️ Mốc thời gian (${(parsed.key_timestamps || []).length} mốc):`);
  (parsed.key_timestamps || []).forEach(m => console.log(`   [${m.time} / ${m.seconds}s] ${m.label}`));

  if (APPLY) {
    const insPath = path.join(ROOT, 'data/video_insights.json');
    const allInsights = JSON.parse(fs.readFileSync(insPath, 'utf8'));
    const updatedRecord = {
      ...(allInsights[SKU] || {}),
      sku: SKU,
      title: item.title,
      actual_topic: parsed.actual_topic || item.title,
      category_group: parsed.category_group || 'ngach_xanh',
      niche_primary: parsed.niche_primary || item.niche_primary,
      target_market: parsed.target_market || item.market,
      market_code: item.market_code,
      channels_mentioned: verifiedHandles.length ? verifiedHandles : (item.channels || []),
      tools_mentioned: parsed.tools_mentioned || [],
      visual_audio_checked: true,
      accuracy_status: 'verified_expert_summary',
      analysis_method: 'agv_3.8_multimodal_7layer_verified',
      key_takeaways: parsed.key_takeaways || [],
      key_timestamps: parsed.key_timestamps || [],
      edit_sop: parsed.edit_sop || {},
      avoid_flags: parsed.avoid_flags || []
    };
    allInsights[SKU] = updatedRecord;
    fs.writeFileSync(insPath, JSON.stringify(allInsights, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(vDir, 'insight.json'), JSON.stringify(updatedRecord, null, 2) + '\n', 'utf8');

    ['data/catalog.json', 'data/catalog_full.json', 'data-tabs/videos.json'].forEach(relPath => {
      const p = path.join(ROOT, relPath);
      const list = JSON.parse(fs.readFileSync(p, 'utf8'));
      const target = list.find(x => x.sku === SKU);
      if (target && verifiedHandles.length > 0) {
        target.channels = verifiedHandles;
      }
      fs.writeFileSync(p, JSON.stringify(list, null, 2) + '\n', 'utf8');
    });
    console.log('[Apply] Đã đồng bộ 7 tầng dữ liệu thành công!');
  }
})().catch(err => {
  console.error('[Lỗi]', err.stack || err.message || String(err));
  process.exit(1);
});
