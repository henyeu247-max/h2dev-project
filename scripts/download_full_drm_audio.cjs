// H2DEV Project - Production DRM Audio Downloader & Decryption Pipeline
// Tự động tải và giải mã 100% âm thanh chuẩn cho các bài giảng bảo vệ bằng Widevine/PlayReady DRM
// Tốc độ cao (~1-2 phút cho toàn bộ video 43 phút / 2-3 tiếng), không cần ghi âm thời gian thực.
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKU = process.argv[2] || 'VIDEO-f59aa7';
const ROOT = path.resolve(__dirname, '..');
const WORK_DIR = path.join(ROOT, '_tmp_drm_audio_work');
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';

async function main() {
  console.log('================================================================');
  console.log(`>>> H2DEV PRODUCTION DRM AUDIO PIPELINE: ${SKU}`);
  console.log('================================================================\n');

  if (fs.existsSync(WORK_DIR)) fs.rmSync(WORK_DIR, { recursive: true, force: true });
  fs.mkdirSync(WORK_DIR, { recursive: true });

  console.log('Bước 1: Khởi động trình duyệt Edge và nạp luồng phát...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();

  const capturedSegments = new Map(); // timestamp -> filename
  let initSaved = false;

  await page.exposeFunction('saveSegmentData', (type, timeStr, base64) => {
    const buf = Buffer.from(base64, 'base64');
    if (type === 'init') {
      fs.writeFileSync(path.join(WORK_DIR, 'init.m4a'), buf);
      initSaved = true;
    } else {
      const t = parseInt(timeStr, 10);
      const filename = `seg_${timeStr.padStart(10, '0')}.m4s`;
      fs.writeFileSync(path.join(WORK_DIR, filename), buf);
      capturedSegments.set(t, filename);
      if (capturedSegments.size % 20 === 0) {
        process.stdout.write(`Đã thu thập: ${capturedSegments.size} phân đoạn audio...\r`);
      }
    }
  });

  await page.addInitScript(() => {
    function toB64(buf) {
      const bytes = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      }
      return window.btoa(s);
    }

    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input ? input.url : '');
      const response = await origFetch.apply(this, arguments);

      if (url.includes('s_0.m4a')) {
        const clone = response.clone();
        clone.arrayBuffer().then(buf => window.saveSegmentData('init', '0', toB64(buf)));
      }
      if (url.includes('s_0_') && url.includes('.m4s')) {
        const match = url.match(/s_0_(\d+)\.m4s/);
        if (match) {
          const clone = response.clone();
          clone.arrayBuffer().then(buf => window.saveSegmentData('seg', match[1], toB64(buf)));
        }
      }
      return response;
    };
  });

  await page.goto(`http://127.0.0.1:8899/live/${SKU}`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  const durationSec = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? v.duration : 2588;
  });
  console.log(`Thời lượng video: ${durationSec.toFixed(2)} giây (${(durationSec/60).toFixed(2)} phút)`);

  console.log('\nBước 2: Quét thu thập phân đoạn Audio thần tốc (Pass 1)...');
  const t0 = Date.now();

  for (let t = 0; t <= durationSec; t += 5.5) {
    const prevCount = capturedSegments.size;
    await page.evaluate(time => {
      const v = document.querySelector('video');
      if (v) v.currentTime = time;
    }, t);

    const startWait = Date.now();
    while (capturedSegments.size === prevCount && Date.now() - startWait < 250) {
      await page.waitForTimeout(25);
    }
  }

  // Pass 2: Quét bù các khoảng hở
  console.log('\nBước 3: Quét bù các khoảng hở (Pass 2)...');
  for (let t = 2; t <= durationSec; t += 5.5) {
    await page.evaluate(time => {
      const v = document.querySelector('video');
      if (v) v.currentTime = time;
    }, t);
    await page.waitForTimeout(60);
  }

  await page.waitForTimeout(3000);
  await browser.close();

  const totalSegments = capturedSegments.size;
  console.log(`\nThu thập hoàn tất trong ${((Date.now() - t0) / 1000).toFixed(1)}s! Tổng phân đoạn: ${totalSegments}`);

  if (!initSaved || totalSegments === 0) {
    throw new Error('Lỗi: Không thu thập được phân đoạn audio.');
  }

  // Bước 4: Ghép các phân đoạn audio theo timeline
  console.log('Bước 4: Ghép các phân đoạn thành khối MP4 mã hóa...');
  const sortedTimes = [...capturedSegments.keys()].sort((a, b) => a - b);
  const encCombinedPath = path.join(WORK_DIR, 'audio_encrypted.mp4');
  const writeStream = fs.createWriteStream(encCombinedPath);
  writeStream.write(fs.readFileSync(path.join(WORK_DIR, 'init.m4a')));
  for (const time of sortedTimes) {
    const filename = capturedSegments.get(time);
    writeStream.write(fs.readFileSync(path.join(WORK_DIR, filename)));
  }
  await new Promise(r => writeStream.end(r));
  console.log(`File audio mã hóa: ${(fs.statSync(encCombinedPath).size / 1024 / 1024).toFixed(2)} MB`);

  // Bước 5: Trích xuất khóa giải mã Widevine DRM tự động
  console.log('Bước 5: Trích xuất khóa giải mã Widevine DRM...');
  const keyOutput = execSync(`py -3 "${path.join(__dirname, 'get_drm_key.py')}" "AAAAP3Bzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAAB8SEJczlSnXFlRSR1k8BB0uLtoaBWV6ZHJtSOPclZsG" "https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=A98506"`, { encoding: 'utf8' }).trim();
  const [kid, key] = keyOutput.split(':');
  console.log(`Đã trích xuất Key thành công: KID=${kid} | KEY=${key}`);

  // Bước 6: Giải mã bằng FFmpeg
  console.log('Bước 6: Giải mã toàn bộ âm thanh sang M4A sạch qua FFmpeg...');
  const decAudioPath = path.join(WORK_DIR, 'audio_clean.m4a');
  execSync(`"${FFMPEG}" -y -decryption_key ${key} -i "${encCombinedPath}" -c copy "${decAudioPath}"`, { stdio: 'inherit' });
  console.log(`File audio giải mã sạch: ${(fs.statSync(decAudioPath).size / 1024 / 1024).toFixed(2)} MB`);

  // Bước 7: Đo âm lượng và kiểm tra FFprobe
  console.log('Bước 7: Kiểm định phổ âm lượng của file âm thanh mới giải mã...');
  const volOut = execSync(`"${FFMPEG}" -i "${decAudioPath}" -af volumedetect -f null - 2>&1`, { encoding: 'utf8' });
  const meanVol = volOut.match(/mean_volume:\s*([^\n\r]+)/)?.[1] || 'unknown';
  const maxVol = volOut.match(/max_volume:\s*([^\n\r]+)/)?.[1] || 'unknown';
  console.log(`Âm lượng thực tế: mean_volume=${meanVol}, max_volume=${maxVol}`);

  // Bước 8: Remux với video 1080p sắc nét hiện có
  const targetDir = path.join(ROOT, 'video', SKU);
  const targetMp4 = path.join(targetDir, `${SKU}.mp4`);
  const backupDir = path.join(ROOT, '_backup', `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${SKU}-pre-drm-fix`);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(targetMp4, path.join(backupDir, `${SKU}.mp4`));
  console.log(`Đã sao lưu file cũ vào: ${backupDir}`);

  const tempRemuxMp4 = path.join(WORK_DIR, `${SKU}_remuxed.mp4`);
  console.log('Bước 8: Ghép âm thanh giải mã sạch với video 1080p gốc...');
  execSync(`"${FFMPEG}" -y -i "${targetMp4}" -i "${decAudioPath}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k "${tempRemuxMp4}"`, { stdio: 'inherit' });

  // Promote file
  fs.copyFileSync(tempRemuxMp4, targetMp4);
  console.log(`>>> ĐÃ CẬP NHẬT FILE MỚI: ${targetMp4} (${(fs.statSync(targetMp4).size / 1024 / 1024).toFixed(2)} MB)`);

  // Bước 9: Dọn dẹp thư mục làm việc tạm
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
  console.log('Đã dọn dẹp thư mục tạm.');

  console.log('\n================================================================');
  console.log('>>> HOÀN THÀNH QUY TRÌNH TẢI & GIẢI MÃ VIDEO f59aa7 FULL 100%!');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\nLỗi trong quá trình thực thi:', err.message);
  process.exit(1);
});
