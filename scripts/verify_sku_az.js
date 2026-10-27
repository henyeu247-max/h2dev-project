#!/usr/bin/env node
/**
 * verify_sku_az.js — Gate Kiểm Định Cứng 10 Cổng A-Z (Chuẩn 7 Lớp H2DEV Gold Standard)
 * Chạy: node scripts/verify_sku_az.js VIDEO-xxxxxx [VIDEO-yyyyyy ...]
 *
 * 10 Cổng Bắt Buộc (Bất kỳ cổng nào lỗi -> FAIL LOUD & exit(1)):
 *   [Gate 1] Media & 3-Point CUDA GPU NVDEC Stream Integrity (MP4 tồn tại, >1MB, video+audio, giải mã h264_cuvid 3 điểm)
 *   [Gate 2] Thumbnail & Playback trên DOM (#pv phát MP4 thật, poster hợp lệ)
 *   [Gate 3] Độ phủ Phụ đề & Chống thủng lỗ (3 file .json/.srt/.txt khớp 1-1, silence.json CUDA GPU, 0 khoảng trống >=10s có tiếng nói, 0 segment sập 30s)
 *   [Gate 4] Chống Nén chữ, Ảo giác & Lỗi ASR trên DOM #transcriptList (0 dòng rớt nguyên âm, 0 câu ảo giác Whisper, 0 từ sai ASR)
 *   [Gate 5] Grounding 100% Công cụ & Chống Slop (Mọi tool trong tools_mentioned có mặt trong transcript/visual, 0 câu slop template)
 *   [Gate 6] Mốc thời gian & Tua thật trên Player (Mọi mốc < duration, tăng dần nghiêm ngặt, khớp giây bắt đầu segment thật, click tua nhảy đúng currentTime)
 *   [Gate 7] Chuẩn Định dạng UI DOM Insight (Takeaways >= 4, SOP >= 3, Avoid >= 2, không đánh số kép "1. " trong <ul> SOP)
 *   [Gate 8] Hồ sơ README.md & Đọc trực tiếp Tài liệu trên Player (docs/<SKU>/README.md >= 500B, #pdocs hiển thị >= 2 tài liệu, bấm "Đọc trực tiếp" mở #docModal)
 *   [Gate 9] Đồng bộ 7 Lớp Từ Ngoài Vào Trong (videos_huan.json, catalog_huan.json, modules_huan.json có đủ contentNiche, market, published_at, seq, docs, channels & #pchannels hiển thị khi có kênh mẫu)
 *   [Gate 10] Chụp ảnh Nghiệm thu Full-Page & Xuất biên bản kiểm định
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function checkUrlHttp200(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 5) return resolve({ status: 0, error: 'Too many redirects' });
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          const u = new URL(url);
          loc = `${u.protocol}//${u.host}${loc}`;
        }
        res.resume();
        checkUrlHttp200(loc, redirects + 1).then(resolve);
        return;
      }
      res.resume();
      resolve({ status: res.statusCode });
    }).on('error', e => resolve({ status: 0, error: e.message }));
  });
}

const ROOT = path.resolve(__dirname, '..');
const SILENCE_PATH = path.join(ROOT, '_audit', '20260918-full-136-audit', 'silence.json');
const VOWELS = new Set('aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ'.split(''));

const BAD_SUB_PATTERNS = [
  'C b c th nh',
  'ch l c ch l',
  'trong những video tiếp theo',
  'trong các video tiếp theo',
  'trong các bản thân của mình',
  'tập trung vào những điều mà',
  'tìm ra những bài tập khác của mình',
  'tìm ra những thông tin đáng nhớ',
  'tạo ra những kết quả đáng chú ý',
  'subscribe cho kênh',
  'Ghiền Mì Gõ',
  'La La School',
  'TabMathLow',
  'TabMaslow',
  'Thát Mát Lâu',
  'TAP Maslow',
  'SocialBlaid',
  'chatGVT',
  '1up10',
  '1Op10',
  '1o10',
  '1 ọp 10',
  '1 đọc 10',
  'một ập 10',
  'DRIVE 100',
  'VitaeQui',
  'RVM',
  'RBM',
  'YutoToto',
  'luật FAIL',
  'Nguyên tắc FAIL',
  'Fairview',
  'sám đen',
  'Sám đen',
  'sám trắng',
  'Sám trắng',
  '[Khoảng lặng thao tác',
  '[Thao tác thực hành',
  '[Đoạn nói nhanh',
  'cơn này',
  'Cơn này',
  'bộ cây',
  'cây này là',
  'ngắt nhỏ',
  'cái nách',
  'tỷ lợi',
  'danh thu',
  'họp hình',
  'hộp hình',
  'đa mỹ',
  'xương không',
  'hòn hậu',
  'cờ lon',
  'cầu lon',
  'mặt kiếm tiền',
  'mặc kiếm tiền',
  'chỉ số viền',
  'tạo thâm',
  'cái thâm',
  'Đa Mỹ',
  'tỉ lợi',
  'trước lý',
  'trích lý',
  'trực lý',
  'mô tẻ',
  'đe số',
  'sao chip',
  'trình diệt',
  'trần diệt',
  'xuất khí',
  'người dè',
  'rỡ mờ',
  'câu lợi',
  'xem que',
  'nghe que',
  'Hãy đăng ký kênh để nhận thêm nhiều video mới',
  'mua mèo xong',
  'cơ này',
  'Cơ này',
  'cái cân',
  'tí lỡ',
  'Tí lỡ',
  'phổ lốt',
  'phở lốt',
  'đồ đam mê',
  'đồ ra me',
  'tri cập',
  'bút xúc',
  'Edict',
  'lực 5G',
  'Điết rất là',
  'chỉnh châu',
  'ghiên ra',
  /\bghen ra\b/i,
  /\bRea\b/,
  'hồ ké',
  'view ngõ',
  'tập khán giả',
  'lẹt đẹp',
  'dạng triệu'
];

const UNBRACKETED_ACTION_RES = [
  /\[/,
  /\]/,
  /^\s*Thực hành\b.*:/i,
  /\(mốc \d/i,
  /\(tiếp mốc/i,
  /\(tiếp tục thao tác/i,
  /^\s*Phần \d+\s*—/i,
  /^\s*Hoàn thiện:/i
];

const SLOP_TEMPLATE_PHRASES = [
  'chưa có phụ đề lời thoại bóc tách sẵn',
  'Tập trung tối đa vào chỉ số Audience Retention (AVD > 45%)',
  'Nắm vững các khái niệm và nguyên lý nền tảng được hướng dẫn trong bài học.',
  'Đang chờ bóc tách từ bản ghi video gốc'
];

function isCompressed(text) {
  const toks = text.trim().split(/\s+/).filter(t => /[a-zA-ZÀ-ỹ]/.test(t));
  if (toks.length < 6) return false;
  const short = toks.filter(t => t.length <= 2).length / toks.length;
  const novowel = toks.filter(t => ![...t.toLowerCase()].some(c => VOWELS.has(c))).length / toks.length;
  return (short >= 0.70 && novowel >= 0.35) || novowel >= 0.45;
}

function silentShare(start, end, regions) {
  if (end <= start) return 1.0;
  let covered = 0;
  for (const r of (regions || [])) {
    const a = Math.max(start, r.start || 0);
    const b = Math.min(end, r.end || 0);
    if (b > a) covered += (b - a);
  }
  return covered / (end - start);
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function verifyOneSku(browser, sku, trackCtx) {
  const { track, globalCatalog, globalVideos, globalModules, insAll, shotSubdir } = trackCtx;
  console.log(`\n======================================================================`);
  console.log(`>>> KIỂM ĐỊNH 10 CỔNG A-Z (CHUẨN 7 LỚP H2DEV - TRACK: ${track.toUpperCase()}) CHO SKU: ${sku}`);
  console.log(`======================================================================`);

  const errors = [];
  const vDir = path.join(ROOT, 'video', sku);
  const mp4Cand = path.join(vDir, `${sku}.mp4`);
  const webmCand = path.join(vDir, `${sku}.webm`);
  const mp4Path = fs.existsSync(mp4Cand) ? mp4Cand : (fs.existsSync(webmCand) ? webmCand : mp4Cand);
  const jsonPath = path.join(vDir, 'transcript.json');
  const srtPath = path.join(vDir, 'transcript.srt');
  const txtPath = path.join(vDir, 'transcript.txt');
  const readmePath = path.join(ROOT, 'docs', sku, 'README.md');

  // ---------------- GATE 1: MEDIA & STREAM INTEGRITY ----------------
  let realDur = 0;
  let videoCodec = '';
  let audioCodec = '';
  if (!fs.existsSync(mp4Path) || fs.statSync(mp4Path).size < 1000000) {
    errors.push(`[Gate 1] Thiếu file MP4/WEBM hoặc dung lượng < 1MB: ${mp4Path}`);
  } else {
    try {
      const out = execSync(`ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height -of json "${mp4Path}"`).toString();
      const probe = JSON.parse(out);
      realDur = parseFloat(probe.format?.duration || '0');
      const vStream = (probe.streams || []).find(s => s.codec_type === 'video');
      const aStream = (probe.streams || []).find(s => s.codec_type === 'audio');
      videoCodec = vStream?.codec_name || '';
      audioCodec = aStream?.codec_name || '';
      if (!vStream || !aStream) errors.push(`[Gate 1] Media thiếu luồng video (${Boolean(vStream)}) hoặc audio (${Boolean(aStream)})`);
      const startT = 1;
      const midT = Math.max(1, Math.floor(realDur / 2));
      const endT = Math.max(1, Math.floor(realDur - 3));
      const cuvidFlag = videoCodec === 'h264' ? '-hwaccel cuda -c:v h264_cuvid' : (videoCodec === 'vp9' ? '-hwaccel cuda -c:v vp9_cuvid' : (videoCodec === 'vp8' ? '-hwaccel cuda -c:v vp8_cuvid' : '-hwaccel cuda'));
      for (const pt of [startT, midT, endT]) {
        const hwDecodeCmd = `D:\\Linly-Dubbing\\bin\\ffmpeg.exe -hide_banner -v error ${cuvidFlag} -ss ${pt} -t 1 -i "${mp4Path}" -f null -`;
        try {
          execSync(hwDecodeCmd, { stdio: 'pipe' });
        } catch (hwErr) {
          errors.push(`[Gate 1] Giải mã phần cứng GPU NVDEC (${videoCodec}) thất bại tại mốc ${pt}s!`);
          break;
        }
      }
      console.log(`[PASS Gate 1] Media & 3-Point CUDA GPU NVDEC Decode OK: ${(fs.statSync(mp4Path).size / 1048576).toFixed(2)} MB | ${videoCodec}/${audioCodec} | Thời lượng thật: ${realDur.toFixed(2)}s`);
    } catch (e) {
      errors.push(`[Gate 1] Lỗi ffprobe: ${e.message}`);
    }
  }

  // ---------------- GATE 3: ĐỘ PHỦ PHỤ ĐỀ & CHỐNG THỦNG LỖ ----------------
  let trData = null;
  let segs = [];
  let isSilentVideo = false;
  if (!fs.existsSync(jsonPath) || !fs.existsSync(srtPath) || !fs.existsSync(txtPath)) {
    errors.push(`[Gate 3] Thiếu 1 trong 3 file phụ đề (.json/.srt/.txt)`);
  } else {
    trData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    segs = trData.segments || [];
    isSilentVideo = Boolean(trData.silent_video === true);
    const txtLines = fs.readFileSync(txtPath, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
    const srtBlocks = (fs.readFileSync(srtPath, 'utf8').match(/-->/g) || []).length;
    if (segs.length !== txtLines.length || segs.length !== srtBlocks) {
      errors.push(`[Gate 3] Lệch số dòng giữa JSON (${segs.length}), SRT (${srtBlocks}), TXT (${txtLines.length})`);
    }
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const keys = Object.keys(s).sort().join(',');
      if (keys !== 'end,end_time,id,start,start_time,text' || typeof s.id !== 'number') {
        errors.push(`[Gate 3] Segment #${i + 1} thiếu hoặc thừa schema 6 trường chuẩn (id, start, end, start_time, end_time, text): [${keys}]`);
        break;
      }
      if ((s.end - s.start) >= 14.0) {
        errors.push(`[Gate 3] Segment #${s.id} dài >= 14.0s (${(s.end - s.start).toFixed(2)}s): "${s.text}"`);
      }
      if (i > 0 && s.start < segs[i - 1].end - 0.01) {
        errors.push(`[Gate 3] Segment #${s.id} chồng lấp thời gian với segment trước (${s.start} < ${segs[i - 1].end})`);
      }
      if (i > 0 && String(s.text || '').trim() === String(segs[i - 1].text || '').trim()) {
        errors.push(`[Gate 3] Segment #${s.id} trùng lặp nguyên văn liên tiếp với segment trước: "${s.text}"`);
      }
      if (i > 0) {
        const curTxt = norm(s.text || '');
        const prevTxt = norm(segs[i - 1].text || '');
        const minLen = Math.min(curTxt.length, prevTxt.length);
        const maxLen = Math.max(curTxt.length, prevTxt.length);
        let commonPrefix = 0;
        while (commonPrefix < minLen && curTxt[commonPrefix] === prevTxt[commonPrefix]) commonPrefix++;
        const shortDur = Math.min((s.end || 0) - (s.start || 0), (segs[i - 1].end || 0) - (segs[i - 1].start || 0));
        if (maxLen >= 18 && (commonPrefix / maxLen) >= 0.65 && shortDur < 0.6) {
          errors.push(`[Gate 3] Segment #${s.id} nghi ngờ nhân đôi bản ASR thô/sửa với segment trước: "${segs[i - 1].text}" vs "${s.text}"`);
        }
      }
      for (const rx of UNBRACKETED_ACTION_RES) {
        if (rx.test(String(s.text || ''))) {
          errors.push(`[Gate 3] Segment #${s.id} chứa nhãn giả / mô tả hành động cấm (${rx}): "${s.text}"`);
          break;
        }
      }
      if (txtLines[i] && /^\s*\[?\d{1,2}:\d{2}/.test(txtLines[i])) {
        errors.push(`[Gate 3] Dòng #${i + 1} trong transcript.txt còn prefix [MM:SS]: "${txtLines[i]}"`);
        break;
      }
    }

    let silRegions = [];
    const localSilPath = path.join(vDir, 'silence.json');
    if (fs.existsSync(localSilPath)) {
      const silLocal = JSON.parse(fs.readFileSync(localSilPath, 'utf8'));
      silRegions = silLocal.silence_regions || [];
    } else if (fs.existsSync(SILENCE_PATH)) {
      const silAll = JSON.parse(fs.readFileSync(SILENCE_PATH, 'utf8')).videos || {};
      if (!silAll[sku]) {
        errors.push(`[Gate 3] Chưa chạy silence_scan.py cho ${sku}`);
      } else {
        silRegions = silAll[sku].silence_regions || [];
      }
    } else {
      errors.push(`[Gate 3] Chưa chạy silence_scan.py cho ${sku}`);
    }

    for (let i = 1; i < silRegions.length; i++) {
      if ((silRegions[i].start || 0) < (silRegions[i - 1].end || 0) - 0.001) {
        errors.push(`[Gate 3] Vùng silence.json #${i + 1} chồng lấp với vùng trước (${silRegions[i].start} < ${silRegions[i - 1].end})`);
        break;
      }
    }

    let prevEnd = 0;
    const allBounds = [...segs, { start: realDur, end: realDur, text: '' }];
    for (const s of allBounds) {
      const gap = (s.start || 0) - prevEnd;
      if (gap >= 10.0 && silentShare(prevEnd, s.start, silRegions) < 0.8) {
        errors.push(`[Gate 3] Thủng lỗ phụ đề ${gap.toFixed(1)}s tại [${prevEnd.toFixed(1)}s -> ${s.start.toFixed(1)}s] khi audio có tiếng nói!`);
      }
      prevEnd = Math.max(prevEnd, s.end || 0);
    }

    for (const s of segs) {
      const dur = (s.end || 0) - (s.start || 0);
      if (dur >= 14.0) {
        const sil = silentShare(s.start, s.end, silRegions);
        const talk = dur * (1 - sil);
        const wps = (s.text || '').trim().split(/\s+/).length / Math.max(1, talk);
        if (talk >= 10.0 && wps < 1.3) {
          errors.push(`[Gate 3] Segment sập cửa sổ 30s tại [${s.start}s -> ${s.end}s] (${dur.toFixed(1)}s nhưng chỉ có ${wps.toFixed(2)} từ/s): "${s.text}"`);
        }
      }
    }
    if (!errors.some(e => e.startsWith('[Gate 3]'))) {
      console.log(`[PASS Gate 3] Phụ đề phủ kín 100%: ${segs.length} phân đoạn khớp 1-1 (.json/.srt/.txt), 0 lỗ thủng!`);
    }
  }

  // ---------------- KIỂM TRA TRÊN TRÌNH DUYỆT PLAYWRIGHT ----------------
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const url = `http://127.0.0.1:8899/player.html?sku=${sku}&track=${track}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('#insightEditSop', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // ---------------- GATE 2: THUMBNAIL & PLAYBACK TRÊN DOM ----------------
  const domMedia = await page.evaluate(async () => {
    const v = document.getElementById('pv');
    if (!v) return { ok: false, reason: 'Không tìm thấy thẻ #pv' };
    let playOk = false;
    try {
      await v.play();
      playOk = !v.paused;
    } catch (e) {}
    return {
      ok: Boolean(v.currentSrc && v.poster && playOk),
      src: v.currentSrc,
      poster: v.poster,
      duration: v.duration,
      playOk
    };
  });
  if (!domMedia.ok || (!domMedia.src.toLowerCase().includes(`${sku.toLowerCase()}.mp4`) && !domMedia.src.toLowerCase().includes(`${sku.toLowerCase()}.webm`))) {
    errors.push(`[Gate 2] Player không phát được MP4/WEBM hoặc thiếu poster: ${JSON.stringify(domMedia)}`);
  } else {
    console.log(`[PASS Gate 2] Player DOM phát Media & Poster chuẩn: ${domMedia.poster}`);
  }

  // ---------------- GATE 4: QUÉT TỪNG DÒNG PHỤ ĐỀ TRÊN DOM ----------------
  const trLines = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#transcriptList .transcript-line')).map(el => ({
      seek: Number(el.getAttribute('data-seek')),
      time: el.querySelector('.transcript-time')?.innerText.trim() || '',
      text: el.querySelector('.transcript-text')?.innerText.trim() || ''
    }));
  });
  if (trLines.length !== segs.length || (!isSilentVideo && trLines.length === 0)) {
    errors.push(`[Gate 4] Số dòng phụ đề trên DOM (${trLines.length}) không khớp transcript.json (${segs.length})`);
  }
  for (const line of trLines) {
    if (isCompressed(line.text)) {
      errors.push(`[Gate 4] Phát hiện dòng nén chữ (rớt nguyên âm) tại [${line.time}]: "${line.text}"`);
    }
    for (const rx of UNBRACKETED_ACTION_RES) {
      if (rx.test(line.text)) {
        errors.push(`[Gate 4] Phát hiện nhãn giả / dấu ngoặc vuông (${rx}) tại [${line.time}]: "${line.text}"`);
        break;
      }
    }
    for (const pat of BAD_SUB_PATTERNS) {
      const matched = pat instanceof RegExp ? pat.test(line.text) : line.text.includes(pat);
      if (matched) {
        errors.push(`[Gate 4] Phát hiện mẫu ảo giác / lỗi ASR "${pat}" tại [${line.time}]: "${line.text}"`);
      }
    }
    if (/(?:^|\s)từ khó(?:\s|$|[.,!?])/i.test(line.text)) {
      errors.push(`[Gate 4] Phát hiện lỗi ASR "từ khó" (từ khóa) tại [${line.time}]: "${line.text}"`);
    }
    if (/(?:^|\s)gách(?:\s|$|[.,!?])/i.test(line.text)) {
      errors.push(`[Gate 4] Phát hiện lỗi ASR "gách" (ngách) tại [${line.time}]: "${line.text}"`);
    }
  }
  if (!errors.some(e => e.startsWith('[Gate 4]'))) {
    console.log(`[PASS Gate 4] Đã quét ${trLines.length}/${trLines.length} dòng phụ đề trên UI: 0 nén chữ, 0 ảo giác, 0 lỗi ASR!`);
  }

  // ---------------- GATE 5: GROUNDING 100% CÔNG CỤ, CON SỐ & CHỐNG SLOP ----------------
  const localInsPath = path.join(vDir, 'insight.json');
  const ins = fs.existsSync(localInsPath)
    ? JSON.parse(fs.readFileSync(localInsPath, 'utf8'))
    : (insAll[sku] || {});
  const readmeText = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  const insBlob = JSON.stringify([
    ins.title,
    ins.actual_topic,
    ins.summary,
    ins.key_takeaways,
    ins.edit_sop,
    ins.sop_steps,
    ins.avoid_flags
  ]);
  const corpusNorm = ' ' + norm(segs.map(s => s.text).join(' ') + ' ' + insBlob + ' ' + readmeText) + ' ';

  for (const tool of (ins.tools_mentioned || [])) {
    const tNorm = norm(tool).replace(/\s+com$/, '');
    if (!corpusNorm.includes(tNorm)) {
      errors.push(`[Gate 5] Công cụ "${tool}" trong tools_mentioned KHÔNG xuất hiện trong lời thoại/hồ sơ của video!`);
    }
  }
  const bodyText = await page.evaluate(() => document.body.innerText);
  for (const slop of SLOP_TEMPLATE_PHRASES) {
    if (bodyText.includes(slop)) {
      errors.push(`[Gate 5] Phát hiện chuỗi Slop Template trên UI: "${slop}"`);
    }
  }
  if (!errors.some(e => e.startsWith('[Gate 5]'))) {
    console.log(`[PASS Gate 5] Grounding 100%: Tất cả ${ins.tools_mentioned?.length || 0} công cụ (${(ins.tools_mentioned || []).join(', ')}) đều có mặt trong lời thoại/visual!`);
  }

  // ---------------- GATE 6: MỐC THỜI GIAN & TUA THẬT ----------------
  const timestamps = ins.key_timestamps || [];
  if (timestamps.length < 5) {
    errors.push(`[Gate 6] Số lượng key_timestamps quá ít (${timestamps.length} < 5)`);
  }
  let prevSec = -1;
  for (const ts of timestamps) {
    if (ts.seconds <= prevSec) {
      errors.push(`[Gate 6] Mốc thời gian ${ts.time} (${ts.seconds}s) không tăng dần nghiêm ngặt (<= ${prevSec}s)`);
    }
    prevSec = ts.seconds;
    const m = Math.floor(ts.seconds / 60);
    const sRem = ts.seconds % 60;
    const expectedTime1 = `${String(m).padStart(2, '0')}:${String(sRem).padStart(2, '0')}`;
    const expectedTime2 = `${m}:${String(sRem).padStart(2, '0')}`;
    if (ts.time !== expectedTime1 && ts.time !== expectedTime2) {
      errors.push(`[Gate 6] Chuỗi time "${ts.time}" lệch toán học với seconds=${ts.seconds} (kỳ vọng ${expectedTime1})`);
    }
    if (ts.seconds < 0 || ts.seconds >= realDur) {
      errors.push(`[Gate 6] Mốc thời gian ${ts.time} (${ts.seconds}s) vượt quá thời lượng video (${realDur}s)`);
    }
    if (!Number.isInteger(ts.seconds)) {
      errors.push(`[Gate 6] Mốc thời gian ${ts.time} có seconds=${ts.seconds} không phải số nguyên (int)!`);
    }
    const matchedSeg = isSilentVideo || segs.some(s => Math.abs(s.start - ts.seconds) <= 0.05);
    if (!matchedSeg && ts.seconds > 0) {
      errors.push(`[Gate 6] Mốc thời gian ${ts.time} (${ts.seconds}s) lệch > 0.05s so với giây bắt đầu của phân đoạn phụ đề!`);
    }
    if (/[\[\]]/.test(String(ts.label || ''))) {
      errors.push(`[Gate 6] Nhãn mốc thời gian ${ts.time} chứa ngoặc vuông cấm: "${ts.label}"`);
    }
  }
  if (timestamps.length > 2) {
    const target = timestamps[2].seconds;
    await page.evaluate((sec) => {
      const btn = document.querySelector(`#insightTimeline button[data-seek="${sec}"]`);
      if (btn) btn.click();
    }, target);
    await page.waitForTimeout(600);
    const curT = await page.evaluate(() => Math.round(document.getElementById('pv')?.currentTime || -1));
    if (Math.abs(curT - target) > 2) {
      errors.push(`[Gate 6] Bấm nút tua đến ${target}s nhưng video.currentTime = ${curT}s`);
    }
  }
  if (!errors.some(e => e.startsWith('[Gate 6]'))) {
    console.log(`[PASS Gate 6] ${timestamps.length} mốc thời gian khớp chính xác phân đoạn thật & bấm tua nhạy 100%!`);
  }

  // ---------------- GATE 7: ĐỊNH DẠNG UI DOM & ĐỘ ĐẦY ĐỦ INSIGHT ----------------
  const takeawaysCount = (ins.key_takeaways || []).length;
  const avoidCount = (ins.avoid_flags || []).length;
  const sopItems = await page.evaluate(() => Array.from(document.querySelectorAll('#insightEditSop li')).map(li => li.innerText.trim()));
  const sopHeaderText = await page.evaluate(() => {
    const el = document.querySelector('#insightEditSop > div');
    return el ? el.innerText.trim() : '';
  });
  const sopHeaderMatch = /Quy trình\s+(\d+)\s+bước/i.exec(sopHeaderText);
  if (sopHeaderMatch && Number(sopHeaderMatch[1]) !== sopItems.length) {
    errors.push(`[Gate 7] Tiêu đề SOP ghi "${sopHeaderMatch[0]}" nhưng danh sách <li> thực tế có ${sopItems.length} bước`);
  }
  if (!ins.actual_topic || ins.actual_topic.trim().length < 15) {
    errors.push(`[Gate 7] Thiếu hoặc quá ngắn trường actual_topic trong insight.json`);
  }
  if (takeawaysCount < 4) {
    errors.push(`[Gate 7] Số lượng key_takeaways quá ít (${takeawaysCount} < 4)`);
  }
  if (sopItems.length < 3) {
    errors.push(`[Gate 7] Số lượng bước edit_sop trên DOM quá ít (${sopItems.length} < 3)`);
  }
  if (avoidCount < 2) {
    errors.push(`[Gate 7] Số lượng avoid_flags quá ít (${avoidCount} < 2)`);
  }
  for (const item of sopItems) {
    if (/^\d+\./.test(item)) {
      errors.push(`[Gate 7] Bước SOP bị đánh số thừa "${item.slice(0, 25)}..." bên trong danh sách <ul>`);
    }
    if (item.length < 40 || /^(primary|additional|trim_start|trim_end|emphasis|b_roll|voice|visual|music|subtitles|trim|speed_bgm|sub|footage|captions|pacing|music_sfx|avoid|cuts)$/i.test(item)) {
      errors.push(`[Gate 7] Bước SOP trên DOM quá ngắn (<40 ký tự) hoặc là tên khóa dict lỗi: "${item}"`);
    }
  }
  if (!errors.some(e => e.startsWith('[Gate 7]'))) {
    console.log(`[PASS Gate 7] Định dạng UI DOM sạch (Takeaways: ${takeawaysCount}, SOP: ${sopItems.length}, Avoid: ${avoidCount}).`);
  }

  // ---------------- GATE 8: HỒ SƠ README.MD & ĐỌC TRỰC TIẾP TÀI LIỆU (#PDOCS / #DOCMODAL) ----------------
  if (!fs.existsSync(readmePath) || fs.statSync(readmePath).size < 500) {
    errors.push(`[Gate 8] Thiếu hoặc quá ngắn file hồ sơ bài học docs/${sku}/README.md`);
  }
  const docUiCheck = await page.evaluate(async () => {
    const pdocs = document.getElementById('pdocs');
    const pdocsVisible = Boolean(pdocs && !pdocs.classList.contains('hidden'));
    const readBtns = Array.from(document.querySelectorAll('#pdocslist [data-doc-file]'));
    let modalOpened = false;
    let modalTitle = '';
    let modalBodyLen = 0;
    if (readBtns.length > 0) {
      readBtns[0].click();
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 150));
        const bodyText = document.getElementById('docModalBody')?.innerText.trim() || '';
        if (bodyText.length >= 200) break;
      }
      const modal = document.getElementById('docModal');
      modalOpened = Boolean(modal && modal.style.display === 'flex');
      modalTitle = document.getElementById('docModalTitle')?.innerText.trim() || '';
      modalBodyLen = (document.getElementById('docModalBody')?.innerText.trim() || '').length;
      const closeBtn = document.querySelector('#docModal button[data-action="close-doc"]');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 250));
      const modalClosed = Boolean(modal && modal.style.display === 'none');
      return {
        pdocsVisible,
        readBtnCount: readBtns.length,
        modalOpened,
        modalClosed,
        modalTitle,
        modalBodyLen
      };
    }
    return {
      pdocsVisible,
      readBtnCount: readBtns.length,
      modalOpened,
      modalClosed: true,
      modalTitle,
      modalBodyLen
    };
  });
  if (!docUiCheck.pdocsVisible || docUiCheck.readBtnCount < 2 || !docUiCheck.modalOpened || !docUiCheck.modalClosed || docUiCheck.modalBodyLen < 200) {
    errors.push(`[Gate 8] Khối Tài liệu đính kèm (#pdocs) hoặc Modal Đọc trực tiếp (#docModal) lỗi: ${JSON.stringify(docUiCheck)}`);
  } else {
    console.log(`[PASS Gate 8] Hồ sơ README.md (${fs.statSync(readmePath).size} B) & Modal "Đọc trực tiếp" (#docModal) hoạt động hoàn hảo (${docUiCheck.readBtnCount} tài liệu, nội dung render ${docUiCheck.modalBodyLen} ký tự)!`);
  }

  // ---------------- GATE 9: ĐỒNG BỘ 7 LỚP TỪ NGOÀI VÀO TRONG (CATALOG / VIDEOS / MODULES / CHANNELS) ----------------
  const catItem = globalCatalog.find(x => (x.sku || '').toLowerCase() === sku.toLowerCase());
  const vidItem = globalVideos.find(x => (x.sku || '').toLowerCase() === sku.toLowerCase());
  const modItem = globalModules.flatMap(m => m.items || []).find(x => (x.sku || '').toLowerCase() === sku.toLowerCase());

  if (!catItem || !vidItem || !modItem) {
    errors.push(`[Gate 9] SKU ${sku} thiếu mặt trong catalog (${Boolean(catItem)}), videos (${Boolean(vidItem)}), hoặc modules (${Boolean(modItem)})`);
  } else {
    const hasTrackFlag = track === 'huan' ? Boolean(vidItem.isHuan) : (track === 'dgmd' ? Boolean(vidItem.isDgmd) : true);
    if (!vidItem.contentNiche || !Array.isArray(vidItem.market) || !vidItem.market.length || !vidItem.published_at || !vidItem.seq || !hasTrackFlag) {
      errors.push(`[Gate 9] Thẻ Video bên ngoài thiếu trường chuẩn H2DEV (contentNiche/market/published_at/seq/trackFlag)`);
    }
    if (!modItem.seq || !/^\d{2,}$/.test(String(modItem.seq))) {
      errors.push(`[Gate 9] Bài học trong Lộ trình (modules) thiếu số thứ tự seq chuẩn ("01", "02"...)`);
    }
    const expectedChans = Array.isArray(ins.channels_mentioned) ? ins.channels_mentioned : [];
    if ((vidItem.channels || []).length !== expectedChans.length || (catItem.channels || []).length !== expectedChans.length) {
      errors.push(`[Gate 9] Lệch số lượng kênh mẫu (channels) giữa insight.json (${expectedChans.length}) và videos (${(vidItem.channels || []).length})`);
    }
    if (expectedChans.length > 0) {
      const chanDom = await page.evaluate(() => {
        const box = document.getElementById('pchannels');
        const items = Array.from(document.querySelectorAll('#pchannelslist a[target="_blank"]')).map(a => ({
          text: a.innerText.trim(),
          href: a.href,
          isDead: a.classList.contains('line-through') || a.innerHTML.includes('channel-chip-dead-badge')
        }));
        return {
          visible: Boolean(box && !box.classList.contains('hidden')),
          count: items.length,
          items
        };
      });
      if (!chanDom.visible || chanDom.count !== expectedChans.length) {
        errors.push(`[Gate 9] Khối Kênh đối thủ (#pchannels) trên Player không hiển thị đủ ${expectedChans.length} kênh: ${JSON.stringify(chanDom)}`);
      } else {
        for (const chItem of chanDom.items) {
          if (chItem.isDead) continue;
          const httpCheck = await checkUrlHttp200(chItem.href);
          if (httpCheck.status !== 200) {
            errors.push(`[Gate 9] Link kênh đối thủ "${chItem.text}" (${chItem.href}) bị chết HTTP ${httpCheck.status || httpCheck.error} (404 Not Found)! Bắt buộc cập nhật URL/handle sống hoặc gắn cờ dead: true!`);
          }
        }
      }
    }
  }
  if (!errors.some(e => e.startsWith('[Gate 9]'))) {
    console.log(`[PASS Gate 9] Đồng bộ 7 Lớp Outside -> Inside hoàn hảo: seq=#${modItem.seq} | Niche="${vidItem.contentNiche}" | Market=${JSON.stringify(vidItem.market)} | Docs=${vidItem.docsCount} | Channels=${(vidItem.channels || []).length}!`);
  }

  // ---------------- GATE 10: CHỤP ẢNH NGHIỆM THU PC (1440px) & KIỂM ĐỊNH MOBILE UI (390x844) ----------------
  const shotDir = path.join(ROOT, '_audit', shotSubdir);
  fs.mkdirSync(shotDir, { recursive: true });
  const shotPath = path.join(shotDir, `${sku}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  // Kiểm tra Responsive Mobile Phone (390x844): 0 tràn ngang, nút Đọc trực tiếp >= 36px, #docModal bottom-sheet
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mobileCheck = await page.evaluate(async () => {
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const readBtns = Array.from(document.querySelectorAll('#pdocslist [data-doc-file]'));
    const btnRect = readBtns[0]?.getBoundingClientRect();
    let sheetOk = false;
    if (readBtns.length > 0) {
      readBtns[0].click();
      await new Promise(r => setTimeout(r, 300));
      const modal = document.getElementById('docModal');
      const panel = modal?.firstElementChild;
      const pRect = panel?.getBoundingClientRect();
      sheetOk = Boolean(modal && modal.style.display === 'flex' && pRect && pRect.width >= 370 && pRect.width <= 390);
      const closeBtn = document.querySelector('#docModal button[data-action="close-doc"]');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 200));
    }
    return {
      docOverflow,
      btnHeight: btnRect ? Math.round(btnRect.height) : 0,
      sheetOk
    };
  });
  const mobileShotPath = path.join(shotDir, `${sku}_mobile.png`);
  await page.screenshot({ path: mobileShotPath, fullPage: false });
  await page.close();

  if (mobileCheck.docOverflow > 1 || mobileCheck.btnHeight < 36 || !mobileCheck.sheetOk) {
    errors.push(`[Gate 10] Lỗi Mobile UI (390x844): ${JSON.stringify(mobileCheck)}`);
  } else {
    console.log(`[PASS Gate 10] PC (1440px) & Mobile UI (390px: overflow=${mobileCheck.docOverflow}px, btnH=${mobileCheck.btnHeight}px, bottomSheet=OK) -> Ảnh: ${shotPath}`);
  }

  if (errors.length > 0) {
    console.error(`\n❌ [FAIL] SKU ${sku} VI PHẠM ${errors.length} LỖI:`);
    errors.forEach(e => console.error(`   - ${e}`));
    return false;
  }

  console.log(`\n✅ [ALL 10 GATES PASS] SKU ${sku} ĐẠT CHUẨN 7 LỚP H2DEV GOLD STANDARD 100% TỪ NGOÀI VÀO TRONG!`);
  return true;
}

async function main() {
  const skus = process.argv.slice(2).filter(a => !a.startsWith('-'));
  if (!skus.length) {
    console.error('Cách dùng: node scripts/verify_sku_az.js VIDEO-xxxxxx [VIDEO-yyyyyy ...]');
    process.exit(1);
  }
  const tracks = {
    huan: {
      track: 'huan',
      globalCatalog: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_huan.json'), 'utf8')),
      globalVideos: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'videos_huan.json'), 'utf8')),
      globalModules: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_huan.json'), 'utf8')).modules || [],
      insAll: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_huan.json'), 'utf8')),
      shotSubdir: 'screenshots_huan'
    },
    dgmd: {
      track: 'dgmd',
      globalCatalog: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_dgmd.json'), 'utf8')),
      globalVideos: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'videos_dgmd.json'), 'utf8')),
      globalModules: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_dgmd.json'), 'utf8')).modules || [],
      insAll: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_dgmd.json'), 'utf8')),
      shotSubdir: 'screenshots_dgmd'
    },
    h2dev: {
      track: 'h2dev',
      globalCatalog: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_full.json'), 'utf8')),
      globalVideos: fs.existsSync(path.join(ROOT, 'data-tabs', 'videos.json'))
        ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'videos.json'), 'utf8'))
        : JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8')),
      globalModules: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules.json'), 'utf8')).modules || [],
      insAll: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights.json'), 'utf8')),
      shotSubdir: 'screenshots_h2dev'
    }
  };

  function resolveTrackCtx(sku) {
    if (tracks.huan.globalCatalog.some(x => x.sku === sku)) return tracks.huan;
    if (tracks.dgmd.globalCatalog.some(x => x.sku === sku)) return tracks.dgmd;
    return tracks.h2dev;
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-gpu',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist'
    ]
  });
  let allOk = true;
  try {
    for (const sku of skus) {
      try {
        const trackCtx = resolveTrackCtx(sku);
        const ok = await verifyOneSku(browser, sku, trackCtx);
        if (!ok) allOk = false;
      } catch (skuErr) {
        console.error(`\n❌ [FAIL] SKU ${sku} GẶP LỖI RUNTIME EXCEPTION: ${skuErr.message}`);
        allOk = false;
      }
    }
  } finally {
    await browser.close();
  }
  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
