// H2DEV Project - High-Speed Bit-Perfect DRM Video & Audio Downloader + Decryptor
// Tải 100% video và audio gốc từ Mona Cloud CENC Widevine DRM qua Shaka NetworkingEngine
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const PY_CMD = process.platform === 'win32' ? 'py' : 'python3';
const PY_PREFIX = process.platform === 'win32' ? ['-3'] : [];
const SAFE_SKU_RE = /^[A-Za-z0-9_-]+$/;

function assertSafeSku(sku) {
  const s = String(sku || '').trim();
  if (!SAFE_SKU_RE.test(s)) {
    throw new Error(`Invalid SKU format: ${s}`);
  }
  return s;
}

const ALLOWED_LICENSE_HOST = 'widevine-dash.ezdrm.com';

function assertAllowedLicenseUrl(rawUrl) {
  let u;
  try {
    u = new URL(String(rawUrl || '').trim());
  } catch (_) {
    throw new Error(`Invalid DRM license URL: ${rawUrl}`);
  }
  if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== ALLOWED_LICENSE_HOST) {
    throw new Error(`Disallowed DRM license URL (must be https://${ALLOWED_LICENSE_HOST}/...): ${rawUrl}`);
  }
  return u.toString();
}

const ROOT = 'd:/YTB/H2DEV-Project';
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';

function parseTimeline(timelineXml) {
  const segs = [];
  let currentTime = 0;
  const sTags = [...timelineXml.matchAll(/<S\s+([^>]+)\/>/g)];
  for (const s of sTags) {
    const attr = s[1];
    const tMatch = attr.match(/t="(\d+)"/);
    const dMatch = attr.match(/d="(\d+)"/);
    const rMatch = attr.match(/r="(\d+)"/);
    if (tMatch) currentTime = parseInt(tMatch[1], 10);
    const d = parseInt(dMatch[1], 10);
    const r = rMatch ? parseInt(rMatch[1], 10) : 0;
    for (let i = 0; i <= r; i++) {
      segs.push(currentTime);
      currentTime += d;
    }
  }
  return segs;
}

function extractPssh(buf) {
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
}

function syncSkuMetadata(sku, sizeBytes, sizeMb) {
  try {
    const catPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
    if (fs.existsSync(catPath)) {
      const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
      const c = cat.find(x => x.sku === sku);
      if (c) {
        c.file = `video/${sku}/${sku}.mp4`;
        c.size_mb = parseFloat(sizeMb);
        c.is_drm = false;
        c.local = true;
        fs.writeFileSync(catPath, JSON.stringify(cat, null, 2), 'utf8');
      }
    }

    // Rebuild videos_dgmd.json
    execFileSync(process.execPath, ['scripts/build_dgmd_data.js'], { cwd: ROOT, stdio: 'ignore', windowsHide: true });
  } catch (err) {
    console.warn('Lỗi đồng bộ metadata:', err.message);
  }
}

function cleanupDrmArtifacts({ workDir, stagingMp4Path, streams = [] }) {
  for (const s of streams) {
    if (s && !s.ended && s.stream) {
      try { s.stream.destroy(); } catch (_) {}
      s.ended = true;
    }
  }
  try { if (stagingMp4Path && fs.existsSync(stagingMp4Path)) fs.unlinkSync(stagingMp4Path); } catch (_) {}
  try { if (workDir && fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}
}

async function downloadDrmSku(sku, browser, retryCount = 0, opts = {}) {
  sku = assertSafeSku(sku);
  if (retryCount && typeof retryCount === 'object') {
    opts = retryCount;
    retryCount = 0;
  }
  console.log(`\n================================================================`);
  console.log(`>>> BẮT ĐẦU TẢI & GIẢI MÃ SKU: ${sku} (Lần thử ${retryCount + 1})`);
  console.log(`================================================================`);

  const outDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const finalMp4Path = path.join(outDir, `${sku}.mp4`);

  const workDir = path.join(os.tmpdir(), `h2dev_drm_work_${sku}_${process.pid}_${Date.now()}`);
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const encAudioPath = path.join(workDir, 'audio_encrypted.mp4');
  const encVideoPath = path.join(workDir, 'video_encrypted.mp4');
  const cleanAudioPath = path.join(workDir, 'audio_clean.m4a');
  const cleanVideoPath = path.join(workDir, 'video_clean.mp4');
  const tmpMp4Path = path.join(workDir, `${sku}.mp4`);
  const cacheDir = path.join(ROOT, '.cache');
  const stagingMp4Path = path.join(cacheDir, `staging_drm_${sku}_${process.pid}_${Date.now()}.mp4`);

  const audioStream = fs.createWriteStream(encAudioPath);
  const videoStream = fs.createWriteStream(encVideoPath);
  let audioEnded = false;
  let videoEnded = false;

  const page = await browser.newPage();

  // Expose chunk receiver to stream disk directly
  await page.exposeFunction('appendMediaChunk', (type, b64) => {
    const buf = Buffer.from(b64, 'base64');
    if (type === 'audio') audioStream.write(buf);
    else if (type === 'video') videoStream.write(buf);
  });

  try {
    console.log('Bước 1: Kết nối luồng live resolver và nạp Shaka Player...');
    await page.goto(`http://127.0.0.1:8899/live/${sku}`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3500);

    console.log('Bước 2: Phân tích MPD Manifest Timeline...');
    const manifestData = await page.evaluate(async () => {
      const p = window.player;
      if (!p) throw new Error('Shaka Player not initialized on live page');
      const assetUri = p.getAssetUri();
      if (!assetUri) throw new Error('Asset URI not available');
      const base = assetUri.replace(/manifest\.mpd.*$/, '');
      const mpdText = await (await fetch(assetUri)).text();
      return { assetUri, base, mpdText };
    });

    const { base, mpdText } = manifestData;
    const audioMatch = mpdText.match(/<AdaptationSet[^>]*mimeType="audio\/mp4"[\s\S]*?<\/AdaptationSet>/);
    const videoMatch = mpdText.match(/<AdaptationSet[^>]*mimeType="video\/mp4"[\s\S]*?<\/AdaptationSet>/);

    if (!audioMatch || !videoMatch) throw new Error('MPD does not contain audio/video adaptation sets');

    const audioTpl = audioMatch[0].match(/<SegmentTemplate[^>]*timescale="(\d+)"[^>]*media="([^"]+)"[^>]*initialization="([^"]+)"[\s\S]*?<SegmentTimeline>([\s\S]*?)<\/SegmentTimeline>/);
    const audioRep = audioMatch[0].match(/<Representation[^>]*id="([^"]+)"/)[1];
    const audioTimes = parseTimeline(audioTpl[4]);

    const videoReps = [...videoMatch[0].matchAll(/<Representation[^>]*id="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/g)];
    const chosenVideoRep = videoReps.find(r => r[3] === '1080') || videoReps.sort((a, b) => parseInt(b[3], 10) - parseInt(a[3], 10))[0];
    const videoRepId = chosenVideoRep[1];
    const videoTpl = videoMatch[0].match(/<SegmentTemplate[^>]*timescale="(\d+)"[^>]*media="([^"]+)"[^>]*initialization="([^"]+)"[\s\S]*?<SegmentTimeline>([\s\S]*?)<\/SegmentTimeline>/);
    const videoTimes = parseTimeline(videoTpl[4]);

    console.log(`Cấu hình Video: ${chosenVideoRep[2]}x${chosenVideoRep[3]} (${videoTimes.length} segments)`);
    console.log(`Cấu hình Audio: ${audioRep} (${audioTimes.length} segments)`);

    const initAudioUrl = base + audioTpl[3].replace('$RepresentationID$', audioRep).replace(/&amp;/g, '&');
    const initVideoUrl = base + videoTpl[3].replace('$RepresentationID$', videoRepId).replace(/&amp;/g, '&');

    const audioMediaTpl = base + audioTpl[2].replace('$RepresentationID$', audioRep).replace(/&amp;/g, '&');
    const videoMediaTpl = base + videoTpl[2].replace('$RepresentationID$', videoRepId).replace(/&amp;/g, '&');

    console.log('Bước 3: Tải Init Segments và trích xuất PSSH DRM...');
    const initSegs = await page.evaluate(async ({ initAudioUrl, initVideoUrl }) => {
      const net = window.player.getNetworkingEngine();
      const type = window.shaka.net.NetworkingEngine.RequestType.SEGMENT;
      const toB64 = ab => {
        let binary = '';
        const bytes = new Uint8Array(ab);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return window.btoa(binary);
      };

      const reqA = window.shaka.net.NetworkingEngine.makeRequest([initAudioUrl], {});
      const resA = await net.request(type, reqA).promise;
      const reqV = window.shaka.net.NetworkingEngine.makeRequest([initVideoUrl], {});
      const resV = await net.request(type, reqV).promise;

      return {
        audioInitB64: toB64(resA.data),
        videoInitB64: toB64(resV.data)
      };
    }, { initAudioUrl, initVideoUrl });

    const initAudioBuf = Buffer.from(initSegs.audioInitB64, 'base64');
    const initVideoBuf = Buffer.from(initSegs.videoInitB64, 'base64');

    audioStream.write(initAudioBuf);
    videoStream.write(initVideoBuf);

    const pssh = extractPssh(initAudioBuf) || extractPssh(initVideoBuf);
    if (!pssh) throw new Error('Không thể trích xuất PSSH từ init segment');

    console.log('Bước 4: Giải mã khóa Widevine License EZDRM...');
    const mpdLicMatch = mpdText.match(/https?:\/\/[^\s"'<>]+widevine-foreignkey\.php\?pX=[A-Za-z0-9_-]+/i);
    const licenseUrl = assertAllowedLicenseUrl(
      mpdLicMatch ? mpdLicMatch[0] : 'https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=A98506'
    );
    const keyOutput = execFileSync(PY_CMD, [...PY_PREFIX, 'scripts/get_drm_key.py', pssh, licenseUrl], { cwd: ROOT, encoding: 'utf8', shell: false, windowsHide: true }).trim();
    const [kid, key] = keyOutput.split(':');
    if (!key || !/^[0-9a-f]{32}$/i.test(key)) throw new Error('Lấy Content Key thất bại: ' + keyOutput);
    console.log(`>>> CONTENT KEY THÀNH CÔNG: KID=${kid} | KEY=${key}`);

    console.log('Bước 5: Tải toàn bộ phân đoạn Audio & Video qua Shaka NetworkingEngine...');
    const audioUrls = audioTimes.map(t => audioMediaTpl.replace('$Time$', String(t)));
    const videoUrls = videoTimes.map(t => videoMediaTpl.replace('$Time$', String(t)));

    const tStart = Date.now();

    // Tải Audio (Concurrency 10)
    process.stdout.write(`Đang tải Audio (${audioUrls.length} segs)... `);
    await page.evaluate(async (urls) => {
      const net = window.player.getNetworkingEngine();
      const type = window.shaka.net.NetworkingEngine.RequestType.SEGMENT;
      const toB64 = ab => {
        let binary = '';
        const bytes = new Uint8Array(ab);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return window.btoa(binary);
      };

      const CONCURRENCY = 10;
      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const promises = batch.map(async u => {
          const req = window.shaka.net.NetworkingEngine.makeRequest([u], {});
          const res = await net.request(type, req).promise;
          return toB64(res.data);
        });
        const results = await Promise.all(promises);
        for (const b64 of results) {
          await window.appendMediaChunk('audio', b64);
        }
      }
    }, audioUrls);
    await new Promise(r => audioStream.end(() => { audioEnded = true; r(); }));
    console.log('Xong!');

    // Tải Video (Concurrency 10)
    process.stdout.write(`Đang tải Video 1080p (${videoUrls.length} segs)... `);
    await page.evaluate(async (urls) => {
      const net = window.player.getNetworkingEngine();
      const type = window.shaka.net.NetworkingEngine.RequestType.SEGMENT;
      const toB64 = ab => {
        let binary = '';
        const bytes = new Uint8Array(ab);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return window.btoa(binary);
      };

      const CONCURRENCY = 10;
      for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const promises = batch.map(async u => {
          const req = window.shaka.net.NetworkingEngine.makeRequest([u], {});
          const res = await net.request(type, req).promise;
          return toB64(res.data);
        });
        const results = await Promise.all(promises);
        for (const b64 of results) {
          await window.appendMediaChunk('video', b64);
        }
      }
    }, videoUrls);
    await new Promise(r => videoStream.end(() => { videoEnded = true; r(); }));
    console.log('Xong!');

    const dlDuration = ((Date.now() - tStart) / 1000).toFixed(1);
    console.log(`Tải xong dữ liệu mã hóa trong ${dlDuration}s!`);

    await page.close();

    // Bước 6: Giải mã bằng FFmpeg
    console.log('Bước 6: Giải mã CENC bằng FFmpeg decryption key...');
    execFileSync(FFMPEG, ['-y', '-decryption_key', key, '-i', encAudioPath, '-c', 'copy', cleanAudioPath], { stdio: 'ignore', windowsHide: true });
    execFileSync(FFMPEG, ['-y', '-decryption_key', key, '-i', encVideoPath, '-c', 'copy', cleanVideoPath], { stdio: 'ignore', windowsHide: true });

    // Bước 7: Mux thành MP4 hoàn chỉnh trong workDir rồi đưa nguyên tử vào video/
    console.log('Bước 7: Mux Video + Audio thành MP4 hoàn chỉnh...');
    execFileSync(FFMPEG, ['-y', '-i', cleanVideoPath, '-i', cleanAudioPath, '-c', 'copy', '-movflags', '+faststart', tmpMp4Path], { stdio: 'ignore', windowsHide: true });

    fs.mkdirSync(cacheDir, { recursive: true });
    fs.copyFileSync(tmpMp4Path, stagingMp4Path);
    fs.renameSync(stagingMp4Path, finalMp4Path);

    const finalStat = fs.statSync(finalMp4Path);
    const sizeMb = (finalStat.size / (1024 * 1024)).toFixed(2);
    console.log(`>>> HOÀN TẤT MP4 CHUẨN ĐẦU RA: ${finalMp4Path} (${sizeMb} MB)`);

    cleanupDrmArtifacts({
      workDir,
      stagingMp4Path,
      streams: [
        { stream: audioStream, ended: audioEnded },
        { stream: videoStream, ended: videoEnded }
      ]
    });

    // Đồng bộ ngay lập tức metadata
    syncSkuMetadata(sku, finalStat.size, sizeMb);

    // Bước 8: Chạy Whisper transcribe (bỏ qua nếu được gọi từ auto_ingest_pipeline.js để chạy chuẩn CUDA retranscribe_clean_turbo.py)
    if (!opts || !opts.skipTranscribe) {
      console.log('Bước 8: Bóc tách phụ đề tự động bằng Whisper...');
      try {
        execFileSync(PY_CMD, [...PY_PREFIX, 'scripts/transcribe_sku.py', String(sku)], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
      } catch (wErr) {
        console.warn(`Whisper cảnh báo cho ${sku}:`, wErr.message);
      }
    }

    return { sku, sizeMb: parseFloat(sizeMb), finalMp4Path };
  } catch (err) {
    if (!page.isClosed()) await page.close().catch(() => {});
    cleanupDrmArtifacts({
      workDir,
      stagingMp4Path,
      streams: [
        { stream: audioStream, ended: audioEnded },
        { stream: videoStream, ended: videoEnded }
      ]
    });

    if (retryCount < 1) {
      console.warn(`\n[RETRY] Gặp lỗi với ${sku}: ${err.message}. Đang thử lại...`);
      await new Promise(r => setTimeout(r, 4000));
      return downloadDrmSku(sku, browser, retryCount + 1, opts);
    }
    throw err;
  }
}

async function run() {
  const targetSku = process.argv[2];
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  try {
    if (targetSku) {
      await downloadDrmSku(targetSku, browser);
    } else {
      const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_dgmd.json'), 'utf8'));
      const todo = catalog.filter(c => {
        const mp4Path = path.join(ROOT, 'video', c.sku, `${c.sku}.mp4`);
        if (!fs.existsSync(mp4Path)) return true;
        const sz = fs.statSync(mp4Path).size;
        return sz < 1024 * 1024; // < 1MB
      });

      console.log(`\n================================================================`);
      console.log(`TỔNG SỐ BÀI HỌC CẦN TẢI VỀ MP4 LOCAL: ${todo.length}/${catalog.length}`);
      console.log(`================================================================`);

      for (let i = 0; i < todo.length; i++) {
        const item = todo[i];
        console.log(`\n>>> TIẾN TRÌNH: [${i + 1}/${todo.length}] | SKU: ${item.sku} | ${item.title}`);
        try {
          await downloadDrmSku(item.sku, browser);
        } catch (itemErr) {
          console.error(`❌ THẤT BẠI KHI XỬ LÝ ${item.sku}:`, itemErr.message);
        }
      }

      console.log(`\n>>> TOÀN BỘ DANH SÁCH ĐÃ ĐƯỢC XỬ LÝ XONG!`);
      execFileSync(process.execPath, ['scripts/build_dgmd_data.js'], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
      execFileSync(process.execPath, ['scripts/sync-counts.js'], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('LỖI CHƯƠNG TRÌNH:', err);
    process.exit(1);
  });
}

module.exports = { downloadDrmSku };
