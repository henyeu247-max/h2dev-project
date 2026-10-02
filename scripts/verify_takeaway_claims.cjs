// H2DEV - verify_takeaway_claims.cjs
// THU THAP BANG CHUNG cho SO LIEU trong key_takeaways (khung hinh video + OCR + loi thoai).
// Tool KHONG phan quyet dung/sai: khop so tu dong da chung minh cho PASS gia (xem numberVariants).
// Nguoi kiem doc screen_text_sample trong _audit/takeaway-claims/<SKU>.json de ket luan.
//
// Vi sao can: audit_videos_v2 co S6 = "ty le neo takeaway/transcript thap". Kiem tay cho thay
// phan lon so lieu KHONG nam trong loi thoai vi tac gia DOC tren man hinh (vidIQ, YouTube Studio,
// trang kenh) chu khong noi ra. Chi doc transcript thi khong ket luan duoc dung/sai.
//
// Cach lam (moi SKU):
//   1. Lay moc giay tu transcript.json (moi 20s 1 khung + moi cau co "kenh/view/sub/doanh thu").
//   2. ffmpeg trich khung hinh 1280px.
//   3. Gemini vision OCR tung khung -> gom toan bo chu/so tren man hinh.
//   4. Voi tung so trong takeaway: tim trong (a) loi thoai (b) OCR man hinh.
//   5. Ghi bang chung vao _audit/takeaway-claims/<SKU>.json (co khung + text OCR de nguoi kiem lai).
//
// Dung:  node scripts/verify_takeaway_claims.cjs VIDEO-458892 [VIDEO-...]
//        node scripts/verify_takeaway_claims.cjs --queue   (moi SKU S6 dang open)
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FFMPEG = 'D:\\Linly-Dubbing\\bin\\ffmpeg.exe';
const OUT = path.join(ROOT, '_audit', 'takeaway-claims');
// Cau hinh 9Router (OpenAI-compatible). Doc tu _private/9router.json (gitignore) — KHONG ghi key vao code.
// Fallback: bien moi truong NINE_ROUTER_API_KEY / NINE_ROUTER_BASE_URL.
const NR_FILE = path.join(ROOT, '_private', '9router.json');
const NR = fs.existsSync(NR_FILE) ? JSON.parse(fs.readFileSync(NR_FILE, 'utf8').replace(/^\uFEFF/, '')) : {};
const NR_BASE = (process.env.NINE_ROUTER_BASE_URL || NR.base_url || 'http://127.0.0.1:20128/v1').replace(/\/+$/, '');
const NR_KEY = NR.api_key || process.env.NINE_ROUTER_API_KEY;
if (!NR_KEY) throw new Error('Thieu key 9Router: tao _private/9router.json {base_url, api_key} hoac dat NINE_ROUTER_API_KEY');
// Do thuc 2026-09-30 qua 9Router: Combo-Gemini-3.6-flash va 3.7-flash doc dung chu tren khung.
// Combo-Gemini-3.5-flash tra HTTP 200 nhung noi dung la THONG BAO LOI ("Gemini 3.5 Flash is no longer
// available...") -> da lam nhiem 52 khung cache. KHONG dung 3.5; va moi phan hoi phai qua looksLikeRouterError.
const MODELS = (NR.ocr_models || ['Combo-Gemini-3.6-flash', 'Combo-Gemini-3.7-flash', 'Combo-Memory-Extract'])
  .filter(m => !/3\.5-flash(?!-lite)/i.test(m));
// 9Router voi request CO ANH: ten model sai van tra 200 va am tham chuyen sang model khac (do that
// 2026-09-30: model khong ton tai -> minimax-m3 / mimo-v2.6-flash). Doi chieu model thuc su phuc vu.
const SERVED = Object.assign({
  'Combo-Gemini-3.6-flash': ['gemini-3.6-flash'],
  'Combo-Gemini-3.7-flash': ['gemini-3.7-flash'],
  'Combo-Memory-Extract': ['north-mini-code', 'gpt-oss-120b', 'gemini-3.5-flash-lite', 'gpt-4o-mini'],
}, NR.served_map || {});
const servedOk = (model, served) => !served || (SERVED[model] || [model.split('/').pop()])
  .some(a => served.toLowerCase().includes(a.toLowerCase()));

// Phan hoi 200 nhung la thong bao cua router/nha cung cap, KHONG phai chu tren man hinh.
const ROUTER_ERROR_RE = /(no longer available|please switch to|antigravity|model .* (not found|unavailable)|quota exceeded|rate limit|upgrade your plan)/i;
const looksLikeRouterError = t => ROUTER_ERROR_RE.test(String(t || '').slice(0, 400));
// Model loi (5xx/404/timeout) bi cach ly 5 phut -> khong phi thoi gian thu lai lien tuc.
const benched = new Map();
const isBenched = id => (benched.get(id) || 0) > Date.now();
const bench = id => benched.set(id, Date.now() + 5 * 60 * 1000);

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const digits = s => String(s).replace(/[^\d]/g, '');

const OCR_PROMPT = 'Trich NGUYEN VAN moi chu va con so nhin thay tren man hinh (ten kenh, @handle, so nguoi dang ky, so video, luot xem, VPH, doanh thu, ngay thang, tieu de video). Chi tra ve van ban tho, moi dong 1 muc. Khong suy doan, khong giai thich.';

// 9Router co the tra JSON thuong HOAC luong SSE ("data: {...}") du stream=false (da gap 2026-09-30).
function parseChatText(raw) {
  const t = raw.trim();
  parseChatText.served = (t.match(/"model"\s*:\s*"([^"]+)"/) || [])[1] || '';
  if (t.startsWith('{')) {
    const j = JSON.parse(t);
    return j.choices?.[0]?.message?.content || '';
  }
  let out = '';
  for (const line of t.split(/\r?\n/)) {
    const s = line.trim();
    if (!s.startsWith('data:')) continue;
    const payload = s.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const j = JSON.parse(payload);
      out += j.choices?.[0]?.delta?.content || j.choices?.[0]?.message?.content || '';
    } catch (e) { /* bo dong hong */ }
  }
  return out;
}

async function ocr(pngPath) {
  const data = fs.readFileSync(pngPath).toString('base64');
  const body = JSON.stringify({
    model: '', temperature: 0, max_tokens: 1500, stream: false,
    messages: [{ role: 'user', content: [
      { type: 'text', text: OCR_PROMPT },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,' + data } }
    ] }]
  });
  for (let round = 0; round < 2; round++) {
    for (const model of MODELS) {
      if (isBenched(model)) continue;
      try {
        const res = await fetch(NR_BASE + '/chat/completions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + NR_KEY, 'Content-Type': 'application/json' },
          body: body.replace('"model":""', '"model":' + JSON.stringify(model)),
          signal: AbortSignal.timeout(60000)
        });
        if (!res.ok) { if (res.status >= 500 || res.status === 404) bench(model); continue; }
        const text = parseChatText(await res.text());
        const served = parseChatText.served;
        if (looksLikeRouterError(text)) { bench(model); continue; }
        if (!servedOk(model, served)) { bench(model); continue; }
        if (text.trim()) return { model, served, text };
      } catch (e) { bench(model); }
    }
  }
  return { model: null, text: '' };
}

function pickSeconds(segs, duration) {
  const set = new Set();
  const KEYW = /(kenh|view|sub|dang ky|doanh thu|thu nhap|video|tuoi|ngay|thang|luot xem|phan tich|vidiq|studio)/;
  for (const s of segs) if (KEYW.test(fold(s.text))) set.add(Math.floor(s.start + 2));
  for (let t = 5; t < duration; t += 20) set.add(t);
  // gioi han 60 khung / video, uu tien deu tren toan video
  const arr = [...set].filter(t => t < duration - 1).sort((a, b) => a - b);
  if (arr.length <= 60) return arr;
  const step = arr.length / 60;
  return Array.from({ length: 60 }, (_, i) => arr[Math.floor(i * step)]);
}

// KHOP SO: CHI khop NGUYEN VEN chuoi chu so (bo dau . ,). KHONG lam tron, KHONG cat so 0 cuoi,
// KHONG doi don vi K/M/N. Do that 2026-09-30 tren VIDEO-458892: ban co bien the lam tron cho
// "104,170.06" khop "104 luot xem", "2.4" khop "28,924", "60" khop "60 N luot xem" -> PASS GIA.
// => Ket qua "on_screen" chi la GOI Y vi tri; phan quyet dung/sai phai do nguoi doc
//    screen_text (OCR) cua dung khung do. Tool KHONG tu ket luan so dung.
function numberVariants(raw) {
  return [digits(raw)].filter(s => s.length >= 2);
}

function numberTokens(text) {
  const out = new Set();
  for (const m of String(text).match(/\d[\d.,]*\d|\d/g) || []) {
    const d = digits(m);
    if (d) out.add(d);
  }
  return out;
}

const tokenHit = (vars, tokens) => vars.some(v => tokens.has(v));

async function verifySku(sku, insights, catalog) {
  const row = catalog.find(v => v.sku === sku);
  const tj = readJson(path.join(ROOT, 'video', sku, 'transcript.json'));
  const segs = tj.segments || tj;
  const transcript = fs.readFileSync(path.join(ROOT, 'video', sku, 'transcript.txt'), 'utf8');
  const tTokens = numberTokens(transcript);
  const duration = row.duration_sec || (segs.length ? segs[segs.length - 1].end : 0);
  const frameDir = path.join(OUT, sku);
  fs.mkdirSync(frameDir, { recursive: true });

  const secs = pickSeconds(segs, duration);
  const frames = [];
  for (const s of secs) {
    const png = path.join(frameDir, `f_${String(s).padStart(5, '0')}.png`);
    if (!fs.existsSync(png)) {
      try {
        execFileSync(FFMPEG, ['-v', 'error', '-y', '-ss', String(s), '-i', path.join(ROOT, row.file),
          '-frames:v', '1', '-vf', 'scale=1280:-1', png], { stdio: 'ignore' });
      } catch (e) { continue; }
    }
    if (fs.existsSync(png)) frames.push({ sec: s, png });
  }

  // OCR cache theo khung (chay lai khong ton request)
  const cachePath = path.join(frameDir, 'ocr.json');
  const cache = fs.existsSync(cachePath) ? readJson(cachePath) : {};
  for (const [s, v] of Object.entries(cache)) if (!v.text || looksLikeRouterError(v.text)) delete cache[s];
  const queue = frames.filter(f => !cache[f.sec]);
  const CONC = 4;
  for (let i = 0; i < queue.length; i += CONC) {
    const batch = queue.slice(i, i + CONC);
    const res = await Promise.all(batch.map(f => ocr(f.png)));
    // Chi luu khung OCR thanh cong: khung rong se duoc thu lai o lan chay sau.
    batch.forEach((f, k) => { if (res[k].text) cache[f.sec] = res[k]; });
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
    process.stderr.write(`  ${sku} ocr ${Object.keys(cache).length}/${frames.length}\n`);
  }
  const screenBySec = frames.map(f => ({ sec: f.sec, text: (cache[f.sec] || {}).text || '' }));
  screenBySec.forEach(x => { x.tokens = numberTokens(x.text); });

  const takeaways = (insights[sku] || {}).key_takeaways || [];
  const claims = [];
  takeaways.forEach((t, idx) => {
    const nums = (t.match(/\d[\d.,]*\d|\d/g) || []).filter(m => digits(m).length >= 2);
    for (const m of nums) {
      const vars = numberVariants(m);
      const inTranscript = tokenHit(vars, tTokens);
      const hitSec = screenBySec.find(x => tokenHit(vars, x.tokens));
      claims.push({
        takeaway: idx + 1, value: m,
        in_transcript: inTranscript,
        on_screen: Boolean(hitSec),
        screen_sec: hitSec ? hitSec.sec : null,
      });
    }
  });
  const unverified = claims.filter(c => !c.in_transcript && !c.on_screen);
  const report = {
    sku, generated_at: new Date().toISOString(),
    frames_checked: frames.length, frames_ocr_ok: screenBySec.filter(x => x.text).length,
    claims_total: claims.length,
    claims_in_transcript: claims.filter(c => c.in_transcript).length,
    claims_on_screen_only: claims.filter(c => !c.in_transcript && c.on_screen).length,
    claims_unverified: unverified.length,
    claims, unverified,
    // TOAN BO van ban OCR (khong cat) de nguoi kiem doi chieu tung so.
    screen_text_sample: screenBySec.filter(x => x.text).map(x => ({ sec: x.sec, text: x.text }))
  };
  fs.writeFileSync(path.join(OUT, `${sku}.json`), JSON.stringify(report, null, 1));
  return report;
}

(async () => {
  const insights = readJson(path.join(ROOT, 'data', 'video_insights.json'));
  const catalog = readJson(path.join(ROOT, 'data', 'catalog.json'));
  let skus = process.argv.slice(2).filter(a => a.startsWith('VIDEO-'));
  if (process.argv.includes('--queue')) {
    // Lay tu bao cao audit MOI NHAT (khong dung queue: queue co the cu hon du lieu).
    const rep = readJson(path.join(ROOT, '_audit', '20260918-full-136-audit', 'report.json'));
    skus = rep.videos.filter(v => (v.review_flags || []).some(f => f.startsWith('S6'))).map(v => v.sku);
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const sku of skus) {
    const r = await verifySku(sku, insights, catalog);
    console.log(`${sku} khung=${r.frames_checked} ocr=${r.frames_ocr_ok} | so=${r.claims_total} loi_thoai=${r.claims_in_transcript} man_hinh=${r.claims_on_screen_only} CHUA_XAC_MINH=${r.claims_unverified}`
      + (r.unverified.length ? '  -> ' + r.unverified.map(u => `[${u.takeaway}]${u.value}`).join(' ') : ''));
  }
})();
