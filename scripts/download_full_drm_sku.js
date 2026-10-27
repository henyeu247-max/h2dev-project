// H2DEV Project - Full DRM Video & Audio Downloader + Decryptor
// Giải mã bit-perfect 100% video và audio từ Mona Cloud CENC DRM
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'd:/YTB/H2DEV-Project';
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';

async function downloadAndDecryptDrmSku(sku) {
  console.log(`\n================================================================`);
  console.log(`>>> DOWNLOADING & DECRYPTING DRM SKU: ${sku}`);
  console.log(`================================================================`);

  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_dgmd.json'), 'utf8'));
  const item = catalog.find(x => x.sku === sku);
  if (!item) throw new Error('SKU not found in catalog_dgmd.json: ' + sku);

  const outDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const finalMp4Path = path.join(outDir, `${sku}.mp4`);

  const workDir = path.join(ROOT, '_tmp_drm_work_' + sku);
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const audioDir = path.join(workDir, 'audio');
  const videoDir = path.join(workDir, 'video');
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(videoDir, { recursive: true });

  console.log('Bước 1: Khởi động Edge và nạp luồng phát...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Referer': 'https://daigiamangdep.com/learn' }
  });
  const page = await context.newPage();

  const audioSegs = new Map(); // time -> buffer
  const videoSegs = new Map(); // time -> buffer
  let initAudioBuf = null;
  let initVideoBuf = null;

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('/s_0.m4a')) {
      const b = await res.body().catch(() => null);
      if (b && b.length > 50) initAudioBuf = b;
    } else if (u.includes('/v_0.m4v') || u.includes('/v_0.mp4') || (u.includes('/v_0') && !u.includes('.m4s'))) {
      const b = await res.body().catch(() => null);
      if (b && b.length > 50) initVideoBuf = b;
    } else if (u.includes('/s_0_') && u.includes('.m4s')) {
      const m = u.match(/\/s_0_(\d+)\.m4s/);
      if (m) {
        const t = parseInt(m[1], 10);
        if (!audioSegs.has(t)) {
          const b = await res.body().catch(() => null);
          if (b && b.length > 0) audioSegs.set(t, b);
        }
      }
    } else if (u.includes('/v_0_') && u.includes('.m4s')) {
      const m = u.match(/\/v_0_(\d+)\.m4s/);
      if (m) {
        const t = parseInt(m[1], 10);
        if (!videoSegs.has(t)) {
          const b = await res.body().catch(() => null);
          if (b && b.length > 0) videoSegs.set(t, b);
        }
      }
    }
  });

  const streamUrl = item.file || item.video_link;
  await page.goto(streamUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);

  const durationSec = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? (v.duration || 1343) : 1343;
  });
  console.log(`Thời lượng video: ${durationSec.toFixed(1)}s (${(durationSec / 60).toFixed(1)} phút)`);

  console.log('Bước 2: Quét thu thập phân đoạn Audio & Video toàn dải (Pass 1)...');
  const t0 = Date.now();
  // Step 5 seconds to trigger Shaka prefetching
  for (let t = 0; t <= durationSec; t += 5.0) {
    await page.evaluate(time => {
      const v = document.querySelector('video');
      if (v) v.currentTime = time;
    }, t);
    await page.waitForTimeout(60);
    if (audioSegs.size % 20 === 0 && audioSegs.size > 0) {
      process.stdout.write(`Đã thu thập: Audio=${audioSegs.size} | Video=${videoSegs.size}...\r`);
    }
  }

  // Pass 2: Quét bù các khoảng hở
  console.log('\nBước 3: Quét bù các khoảng hở (Pass 2)...');
  for (let t = 2.5; t <= durationSec; t += 5.0) {
    await page.evaluate(time => {
      const v = document.querySelector('video');
      if (v) v.currentTime = time;
    }, t);
    await page.waitForTimeout(40);
  }

  await page.waitForTimeout(4000);
  await browser.close();

  console.log(`\nThu thập xong trong ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
  console.log(`Tổng phân đoạn: Audio=${audioSegs.size}, Video=${videoSegs.size}`);

  if (!initAudioBuf || !initVideoBuf) {
    throw new Error(`Init segment missing! AudioInit=${Boolean(initAudioBuf)}, VideoInit=${Boolean(initVideoBuf)}`);
  }

  // Bước 4: Trích xuất Content Key qua get_drm_key.py
  console.log('Bước 4: Trích xuất khóa giải mã Widevine DRM...');
  const extractPssh = buf => {
    const psshHeader = Buffer.from('pssh', 'utf8');
    for (let offset = 0; offset < buf.length - 8; offset++) {
      if (buf.slice(offset + 4, offset + 8).equals(psshHeader)) {
        const boxSize = buf.readUInt32BE(offset);
        if (boxSize >= 12 && offset + boxSize <= buf.length) {
          return buf.slice(offset, offset + boxSize).toString('base64');
        }
      }
    }
    return null;
  };

  const pssh = extractPssh(initAudioBuf) || extractPssh(initVideoBuf);
  if (!pssh) throw new Error('Could not extract PSSH from init segments');

  const licenseUrl = 'https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=A98506';
  const keyOutput = execSync(`py -3 scripts/get_drm_key.py "${pssh}" "${licenseUrl}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
  const [kid, key] = keyOutput.split(':');
  console.log(`>>> ĐÃ CÓ KEY: KID=${kid} | KEY=${key}`);

  // Bước 5: Ghép và giải mã Audio
  console.log('Bước 5: Ghép và giải mã Audio sang M4A sạch...');
  const encAudioPath = path.join(workDir, 'audio_encrypted.mp4');
  const cleanAudioPath = path.join(workDir, 'audio_clean.m4a');
  const sortedAudioTimes = [...audioSegs.keys()].sort((a, b) => a - b);
  const audioStream = fs.createWriteStream(encAudioPath);
  audioStream.write(initAudioBuf);
  for (const t of sortedAudioTimes) audioStream.write(audioSegs.get(t));
  await new Promise(r => audioStream.end(r));

  execSync(`"${FFMPEG}" -y -decryption_key ${key} -i "${encAudioPath}" -c copy "${cleanAudioPath}"`, { stdio: 'inherit' });

  // Bước 6: Ghép và giải mã Video
  console.log('Bước 6: Ghép và giải mã Video sang MP4 sạch...');
  const encVideoPath = path.join(workDir, 'video_encrypted.mp4');
  const cleanVideoPath = path.join(workDir, 'video_clean.mp4');
  const sortedVideoTimes = [...videoSegs.keys()].sort((a, b) => a - b);
  const videoStream = fs.createWriteStream(encVideoPath);
  videoStream.write(initVideoBuf);
  for (const t of sortedVideoTimes) videoStream.write(videoSegs.get(t));
  await new Promise(r => videoStream.end(r));

  execSync(`"${FFMPEG}" -y -decryption_key ${key} -i "${encVideoPath}" -c copy "${cleanVideoPath}"`, { stdio: 'inherit' });

  // Bước 7: Mux Video + Audio thành MP4 hoàn chỉnh
  console.log('Bước 7: Mux Video + Audio thành MP4 hoàn chỉnh...');
  execSync(`"${FFMPEG}" -y -i "${cleanVideoPath}" -i "${cleanAudioPath}" -c copy -movflags +faststart "${finalMp4Path}"`, { stdio: 'inherit' });

  const finalSize = fs.statSync(finalMp4Path).size;
  console.log(`\n>>> XUẤT BẢN THÀNH CÔNG MP4 LOCAL: ${finalMp4Path} (${(finalSize / 1024 / 1024).toFixed(2)} MB)`);

  // Bước 8: Chạy Whisper transcribe
  console.log('Bước 8: Chạy Whisper transcribe tạo phụ đề bóc tách...');
  try {
    execSync(`py -3 scripts/transcribe_sku.py ${sku}`, { cwd: ROOT, stdio: 'inherit' });
  } catch (trErr) {
    console.warn('Whisper warning:', trErr.message);
  }

  // Dọn dẹp workDir
  fs.rmSync(workDir, { recursive: true, force: true });
  console.log('Hoàn tất dọn dẹp thư mục tạm.');

  return true;
}

if (require.main === module) {
  const targetSku = process.argv[2] || 'VIDEO-73c662';
  downloadAndDecryptDrmSku(targetSku).catch(err => {
    console.error('\nLỖI DRM PIPELINE:', err);
    process.exit(1);
  });
}

module.exports = { downloadAndDecryptDrmSku };
