// H2DEV Project - High-Speed Bit-Perfect Video Downloader & Decryptor for Huan Academy
// Tải và giải mã 100% video gốc từ Mona Cloud HLS AES-128 qua Shaka NetworkingEngine + FFmpeg
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SKU = process.argv[2] || 'VIDEO-78d170';
const SAFE_SKU_RE = /^[A-Za-z0-9_-]+$/;

function assertSafeSku(sku) {
  const s = String(sku || '').trim();
  if (!SAFE_SKU_RE.test(s)) {
    throw new Error(`Invalid SKU format: ${s}`);
  }
  return s;
}

async function downloadHuanSku(sku, browserInstance = null) {
  sku = assertSafeSku(sku);
  console.log(`\n======================================================`);
  console.log(`>>> HUAN ACADEMY DOWNLOADER: ${sku}`);
  console.log(`======================================================\n`);

  // 1. Look up SKU in catalog_huan.json
  const huanCatPath = path.join(ROOT, 'data', 'catalog_huan.json');
  const cat = JSON.parse(fs.readFileSync(huanCatPath, 'utf8'));
  const item = cat.find(x => x.sku.toUpperCase() === sku.toUpperCase());
  if (!item) throw new Error(`SKU ${sku} not found in catalog_huan.json`);

  console.log(`Tiêu đề: "${item.title}"`);
  console.log(`Thời lượng: ${item.duration} (${item.duration_sec}s)`);

  const outDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const finalMp4Path = path.join(outDir, `${sku}.mp4`);

  if (fs.existsSync(finalMp4Path) && fs.statSync(finalMp4Path).size > 1000000) {
    console.log(`[BỎ QUA] File đã tồn tại hoàn chỉnh: ${finalMp4Path} (${(fs.statSync(finalMp4Path).size / (1024*1024)).toFixed(2)} MB)`);
    return finalMp4Path;
  }

  const workDir = path.join(os.tmpdir(), `h2dev_huan_work_${sku}_${process.pid}_${Date.now()}`);
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  const tmpMp4Path = path.join(workDir, `${sku}.mp4`);
  const cacheDir = path.join(ROOT, '.cache');
  const stagingMp4Path = path.join(cacheDir, `staging_huan_${sku}_${process.pid}_${Date.now()}.mp4`);

  const shouldCloseBrowser = !browserInstance;
  const browser = browserInstance || await chromium.launch({
    headless: true,
    args: [
      '--enable-gpu',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist',
      '--renderer-process-limit=2'
    ]
  });
  const page = await browser.newPage({
    extraHTTPHeaders: {
      'Referer': 'https://huan.academy/learn',
      'Origin': 'https://huan.academy'
    }
  });

  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  const workDirResolved = path.resolve(workDir);
  await page.exposeFunction('saveFileChunk', (filename, b64) => {
    if (typeof filename !== 'string' || !/^(?:enc\.key|seg_\d{1,6}\.ts)$/.test(filename)) {
      throw new Error(`Invalid chunk filename: ${String(filename)}`);
    }
    const targetPath = path.resolve(workDirResolved, filename);
    if (!targetPath.startsWith(workDirResolved + path.sep)) {
      throw new Error(`Chunk path escaped workDir: ${filename}`);
    }
    fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));
  });

  try {
    console.log('Bước 1: Nạp trang video Mona Cloud...');
    for (let navTry = 0; navTry < 3; navTry++) {
      try {
        await page.goto(item.video_link, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(3500);
        break;
      } catch (e) {
        if (navTry === 2) throw e;
        console.log(`Thử lại nạp trang lần ${navTry + 2}...`);
        await page.waitForTimeout(2000);
      }
    }

    console.log('Bước 2: Phân tích playlist HLS và tải key...');
    const streamMeta = await page.evaluate(async () => {
      const p = window.player || (window.ui ? window.ui.getControls().getPlayer() : null);
      if (!p) throw new Error('Shaka Player not initialized');
      const net = p.getNetworkingEngine();
      const assetUri = p.getAssetUri();
      
      const reqM = window.shaka.net.NetworkingEngine.makeRequest([assetUri], {});
      const resM = await net.request(window.shaka.net.NetworkingEngine.RequestType.MANIFEST, reqM).promise;
      const masterText = new TextDecoder().decode(resM.data);

      const lines = masterText.split(/\r?\n|\r/);
      // Priority: 1080p > 720p > first m3u8
      let subRel = null;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('RESOLUTION=1920x1080')) {
          subRel = lines[i+1].trim();
          break;
        }
      }
      if (!subRel) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('RESOLUTION=1280x720')) {
            subRel = lines[i+1].trim();
            break;
          }
        }
      }
      if (!subRel) subRel = lines.find(l => l.includes('.m3u8')).trim();

      const base = assetUri.substring(0, assetUri.lastIndexOf('/') + 1);
      const subUri = subRel.startsWith('http') ? subRel : base + subRel;

      const reqS = window.shaka.net.NetworkingEngine.makeRequest([subUri], {});
      const resS = await net.request(window.shaka.net.NetworkingEngine.RequestType.MANIFEST, reqS).promise;
      const subText = new TextDecoder().decode(resS.data);

      const toB64 = ab => {
        const bytes = new Uint8Array(ab);
        const chunks = [];
        for (let i = 0; i < bytes.length; i += 32768) {
          chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 32768)));
        }
        return window.btoa(chunks.join(''));
      };

      // Get AES-128 key
      const subLines = subText.split(/\r?\n|\r/);
      let keyMethod = null;
      let keyUri = null;
      for (const rawL of subLines) {
        const l = rawL.trim();
        if (l.startsWith('#EXT-X-KEY:')) {
          const mMethod = l.match(/METHOD=([^,\s]+)/i);
          const mUri = l.match(/URI="([^"]+)"/i);
          if (mMethod) keyMethod = mMethod[1].trim().toUpperCase();
          if (mUri) keyUri = mUri[1].startsWith('http') ? mUri[1] : base + mUri[1];
          break;
        }
      }
      if (keyUri) {
        if (keyMethod && keyMethod !== 'AES-128') {
          throw new Error(`Unsupported HLS key method: ${keyMethod}`);
        }
        const rk = window.shaka.net.NetworkingEngine.makeRequest([keyUri], {});
        const resK = await net.request(window.shaka.net.NetworkingEngine.RequestType.KEY, rk).promise;
        await window.saveFileChunk('enc.key', toB64(resK.data));
      }
      // Pause video and disable background ABR buffering so Shaka doesn't compete for bandwidth
      try {
        const vEl = document.querySelector('video');
        if (vEl) vEl.pause();
        p.configure({
          abr: { enabled: false },
          streaming: { bufferingGoal: 1, rebufferingGoal: 1, bufferBehind: 0 }
        });
      } catch (e) {}

      // Collect segment URLs and durations
      const segments = [];
      let currentDuration = '10.000';

      for (let i = 0; i < subLines.length; i++) {
        const line = subLines[i].trim();
        if (line.startsWith('#EXTINF:')) {
          const rawDur = line.slice('#EXTINF:'.length).split(',')[0].trim();
          const numDur = Number(rawDur);
          currentDuration = (Number.isFinite(numDur) && numDur > 0) ? numDur.toFixed(3) : '10.000';
        } else if (line.includes('.ts')) {
          const segUrl = line.startsWith('http') ? line : base + line;
          segments.push({ url: segUrl, duration: currentDuration });
        }
      }

      return {
        hasKey: Boolean(keyUri),
        keyMethod: keyMethod || (keyUri ? 'AES-128' : null),
        segments
      };
    });

    const totalSegs = streamMeta.segments.length;
    console.log(`Tìm thấy ${totalSegs} phân đoạn video. Bắt đầu tải đa luồng qua Shaka...`);

    const tStart = Date.now();
    const BATCH_SIZE = 8;

    for (let i = 0; i < totalSegs; i += BATCH_SIZE) {
      const batchUrls = streamMeta.segments.slice(i, i + BATCH_SIZE).map((s, bIdx) => ({
        url: s.url,
        idx: i + bIdx
      }));

      await page.evaluate(async (items) => {
        const p = window.player || (window.ui ? window.ui.getControls().getPlayer() : null);
        const net = p.getNetworkingEngine();
        const type = window.shaka.net.NetworkingEngine.RequestType.SEGMENT;

        const toB64 = ab => {
          const bytes = new Uint8Array(ab);
          const chunks = [];
          for (let k = 0; k < bytes.length; k += 32768) {
            chunks.push(String.fromCharCode.apply(null, bytes.subarray(k, k + 32768)));
          }
          return window.btoa(chunks.join(''));
        };

        await Promise.all(items.map(async item => {
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const req = window.shaka.net.NetworkingEngine.makeRequest([item.url], {});
              const res = await net.request(type, req).promise;
              await window.saveFileChunk(`seg_${item.idx}.ts`, toB64(res.data));
              return;
            } catch (err) {
              if (attempt === 3) throw err;
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
          }
        }));
      }, batchUrls);

      const percent = Math.min(100, Math.round(((i + BATCH_SIZE) / totalSegs) * 100));
      process.stdout.write(`\rTiến độ: ${percent}% (${Math.min(i + BATCH_SIZE, totalSegs)}/${totalSegs} phân đoạn)...`);
    }

    const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
    console.log(`\nĐã tải xong toàn bộ ${totalSegs} phân đoạn trong ${elapsed}s!`);

    console.log('Bước 3: Tạo local playlist, giải mã bằng FFmpeg & kiểm chứng phần cứng CUDA GPU NVDEC...');
    let m3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:12\n#EXT-X-MEDIA-SEQUENCE:0\n`;
    if (streamMeta.hasKey) {
      const keyMethod = String(streamMeta.keyMethod || 'AES-128').toUpperCase();
      if (keyMethod !== 'AES-128') {
        throw new Error(`Disallowed HLS key method: ${keyMethod}`);
      }
      m3u8 += `#EXT-X-KEY:METHOD=${keyMethod},URI="enc.key"\n`;
    }
    streamMeta.segments.forEach((s, idx) => {
      const durNum = Number(s.duration);
      if (!Number.isFinite(durNum) || durNum <= 0) {
        throw new Error(`Invalid #EXTINF duration at segment ${idx}: ${s.duration}`);
      }
      m3u8 += `#EXTINF:${durNum.toFixed(3)},\nseg_${idx}.ts\n`;
    });
    m3u8 += `#EXT-X-ENDLIST\n`;

    fs.writeFileSync(path.join(workDir, 'local.m3u8'), m3u8);

    const ffmpegBin = fs.existsSync('D:\\Linly-Dubbing\\bin\\ffmpeg.exe') ? 'D:\\Linly-Dubbing\\bin\\ffmpeg.exe' : 'ffmpeg';
    execFileSync(
      ffmpegBin,
      ['-y', '-threads', '2', '-allowed_extensions', 'ts,key', '-i', path.join(workDir, 'local.m3u8'), '-c', 'copy', '-movflags', '+faststart', tmpMp4Path],
      { stdio: 'ignore', windowsHide: true }
    );
    // Verify hardware decode on NVIDIA CUDA GPU (h264_cuvid)
    execFileSync(
      ffmpegBin,
      ['-hide_banner', '-v', 'error', '-hwaccel', 'cuda', '-c:v', 'h264_cuvid', '-ss', '1', '-t', '1', '-i', tmpMp4Path, '-f', 'null', '-'],
      { stdio: 'pipe', windowsHide: true }
    );

    fs.mkdirSync(cacheDir, { recursive: true });
    fs.copyFileSync(tmpMp4Path, stagingMp4Path);
    fs.renameSync(stagingMp4Path, finalMp4Path);

    const finalSize = fs.statSync(finalMp4Path).size;
    const finalSizeMb = (finalSize / (1024 * 1024)).toFixed(2);
    console.log(`>>> TẢI, GIẢI MÃ & XÁC THỰC CUDA GPU NVDEC HOÀN TẤT: ${finalMp4Path} (${finalSizeMb} MB)`);

    // Update catalog_huan.json safely (non-fatal if another worker is writing)
    try {
      const latestCat = JSON.parse(fs.readFileSync(huanCatPath, 'utf8'));
      const latestItem = latestCat.find(x => x.sku.toUpperCase() === sku.toUpperCase());
      if (latestItem) {
        latestItem.file = `video/${sku}/${sku}.mp4`;
        latestItem.mp4 = `video/${sku}/${sku}.mp4`;
        latestItem.size = finalSize;
        latestItem.size_mb = parseFloat(finalSizeMb);
        latestItem.local = true;
        fs.writeFileSync(huanCatPath, JSON.stringify(latestCat, null, 2), 'utf8');
      }
    } catch (e) {}

    // Update in catalog_dgmd.json as well
    try {
      const dgmdCatPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
      if (fs.existsSync(dgmdCatPath)) {
        const dgmdCat = JSON.parse(fs.readFileSync(dgmdCatPath, 'utf8'));
        const dgmdIt = dgmdCat.find(x => x.sku === sku);
        if (dgmdIt) {
          dgmdIt.file = `video/${sku}/${sku}.mp4`;
          dgmdIt.mp4 = `video/${sku}/${sku}.mp4`;
          dgmdIt.size = finalSize;
          dgmdIt.size_mb = parseFloat(finalSizeMb);
          dgmdIt.local = true;
          fs.writeFileSync(dgmdCatPath, JSON.stringify(dgmdCat, null, 2), 'utf8');
        }
      }
    } catch (e) {}

    return finalMp4Path;
  } finally {
    await page.close().catch(() => {});
    if (shouldCloseBrowser) await browser.close().catch(() => {});
    try { if (fs.existsSync(stagingMp4Path)) fs.unlinkSync(stagingMp4Path); } catch (_) {}
    try { if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function main() {
  await downloadHuanSku(SKU);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Lỗi tải video:', err.message);
    process.exit(1);
  });
}

module.exports = { downloadHuanSku };
