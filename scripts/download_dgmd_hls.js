// H2DEV Project - High-Speed HLS AES-128 Ingest for Remaining Lessons
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = 'd:/YTB/H2DEV-Project';
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';

async function downloadHlsLesson(sku, browser) {
  console.log(`\n================================================================`);
  console.log(`>>> BẮT ĐẦU TẢI HLS AES-128 SKU: ${sku}`);
  console.log(`================================================================`);

  const outDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const finalMp4Path = path.join(outDir, `${sku}.mp4`);

  const taskScratch = path.join(ROOT, `_tmp_hls_${sku}`);
  if (fs.existsSync(taskScratch)) fs.rmSync(taskScratch, { recursive: true, force: true });
  fs.mkdirSync(taskScratch, { recursive: true });

  const page = await browser.newPage();

  let masterUrl = null;
  let detectedChunkUrl = null;

  page.on('response', res => {
    const u = res.url();
    if (u.includes('playlist.m3u8')) masterUrl = u;
    if (u.includes('_chunk.m3u8')) detectedChunkUrl = u;
  });

  await page.goto(`http://127.0.0.1:8899/live/${sku}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(4000);

  let targetChunkUrl = detectedChunkUrl;

  if (!targetChunkUrl && masterUrl) {
    // Phân giải master playlist sang variant chunk m3u8
    const masterText = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return await res.text();
    }, masterUrl);

    const lines = masterText.split('\n').map(l => l.trim()).filter(Boolean);
    let chosenRel = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('RESOLUTION=1920x1080') && i + 1 < lines.length) {
        chosenRel = lines[i + 1];
        break;
      }
    }
    if (!chosenRel) {
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('.m3u8')) {
          chosenRel = lines[i];
          break;
        }
      }
    }
    if (chosenRel) {
      targetChunkUrl = new URL(chosenRel, masterUrl).toString();
    }
  }

  if (!targetChunkUrl) throw new Error('Không phân giải được URL chunk m3u8 cho ' + sku);

  console.log('Target Chunk Playlist URL:', targetChunkUrl);

  const chunkM3u8Text = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return await res.text();
  }, targetChunkUrl);

  const chunkLines = chunkM3u8Text.split('\n').map(l => l.trim()).filter(Boolean);
  let keyRelUrl = null;
  const segmentUrls = [];

  for (const line of chunkLines) {
    if (line.startsWith('#EXT-X-KEY')) {
      const match = line.match(/URI="([^"]+)"/);
      if (match) keyRelUrl = match[1];
    } else if (!line.startsWith('#') && line.length > 0) {
      segmentUrls.push(new URL(line, targetChunkUrl).toString());
    }
  }

  console.log(`Tìm thấy: ${segmentUrls.length} segments | Key: ${keyRelUrl}`);

  let rawKey = null;
  if (keyRelUrl) {
    const fullKeyUrl = new URL(keyRelUrl, targetChunkUrl).toString();
    const keyB64 = await page.evaluate(async (url) => {
      let net = null;
      if (typeof window.player !== 'undefined' && window.player.getNetworkingEngine) {
        net = window.player.getNetworkingEngine();
      }
      if (net && typeof window.shaka !== 'undefined') {
        try {
          const req = window.shaka.net.NetworkingEngine.makeRequest([url], {});
          const op = await net.request(window.shaka.net.NetworkingEngine.RequestType.KEY, req).promise;
          const u8 = new Uint8Array(op.data);
          let bin = '';
          for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
          return window.btoa(bin);
        } catch (e) {}
      }
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      const u8 = new Uint8Array(ab);
      let bin = '';
      for (let i = 0; i < u8.byteLength; i++) bin += String.fromCharCode(u8[i]);
      return window.btoa(bin);
    }, fullKeyUrl);
    rawKey = Buffer.from(keyB64, 'base64');
    console.log('AES-128 Key:', rawKey.toString('hex'));
  }

  await page.exposeFunction('saveHlsDecryptedSeg_' + sku, (i, b64) => {
    const encBuf = Buffer.from(b64, 'base64');
    let decBuf = encBuf;
    if (rawKey) {
      const iv = Buffer.alloc(16, 0);
      iv.writeUInt32BE(i, 12);
      const decipher = crypto.createDecipheriv('aes-128-cbc', rawKey, iv);
      decipher.setAutoPadding(true);
      try {
        decBuf = Buffer.concat([decipher.update(encBuf), decipher.final()]);
      } catch (err) {
        decBuf = encBuf;
      }
    }
    const segPath = path.join(taskScratch, `seg_${String(i).padStart(5, '0')}.ts`);
    fs.writeFileSync(segPath, decBuf);
  });

  console.log(`Đang tải song song ${segmentUrls.length} segments qua page context...`);
  await page.evaluate(async ({ urls, skuName }) => {
    function bufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return window.btoa(binary);
    }

    let net = null;
    if (typeof window.player !== 'undefined' && window.player.getNetworkingEngine) {
      net = window.player.getNetworkingEngine();
    }

    let index = 0;
    async function worker() {
      while (index < urls.length) {
        const i = index++;
        const u = urls[i];
        let attempts = 4;
        let done = false;
        while (attempts > 0 && !done) {
          try {
            let dataBuffer = null;
            if (net && typeof window.shaka !== 'undefined') {
              try {
                const req = window.shaka.net.NetworkingEngine.makeRequest([u], {});
                const res = await net.request(window.shaka.net.NetworkingEngine.RequestType.SEGMENT, req).promise;
                dataBuffer = res.data;
              } catch (shakaErr) {
                const r = await fetch(u);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                dataBuffer = await r.arrayBuffer();
              }
            } else {
              const r = await fetch(u);
              if (!r.ok) throw new Error('HTTP ' + r.status);
              dataBuffer = await r.arrayBuffer();
            }

            const b64 = bufferToBase64(dataBuffer);
            await window['saveHlsDecryptedSeg_' + skuName](i, b64);
            done = true;
          } catch (e) {
            attempts--;
            if (attempts === 0) throw e;
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }
    }

    const workers = [];
    for (let w = 0; w < 6; w++) workers.push(worker());
    await Promise.all(workers);
  }, { urls: segmentUrls, skuName: sku });

  await page.close();

  // Merge TS
  console.log('Ghép các phân đoạn TS...');
  const mergedTs = path.join(taskScratch, `${sku}_merged.ts`);
  const outWs = fs.createWriteStream(mergedTs);
  for (let i = 0; i < segmentUrls.length; i++) {
    const segFile = path.join(taskScratch, `seg_${String(i).padStart(5, '0')}.ts`);
    if (fs.existsSync(segFile)) {
      const data = fs.readFileSync(segFile);
      outWs.write(data);
      fs.unlinkSync(segFile);
    }
  }
  outWs.end();
  await new Promise(r => outWs.on('finish', r));

  // Mux sang MP4
  console.log('Mux sang MP4 hoàn chỉnh bằng FFmpeg...');
  execSync(`"${FFMPEG}" -y -i "${mergedTs}" -c copy -movflags +faststart "${finalMp4Path}"`, { stdio: 'ignore' });
  fs.rmSync(taskScratch, { recursive: true, force: true });

  const finalStat = fs.statSync(finalMp4Path);
  const sizeMb = (finalStat.size / (1024 * 1024)).toFixed(2);
  console.log(`>>> HOÀN TẤT MP4 CHUẨN ĐẦU RA: ${finalMp4Path} (${sizeMb} MB)`);

  // Update catalog_dgmd
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

  // Whisper transcribe
  console.log('Bóc tách phụ đề bằng Whisper...');
  try {
    execSync(`py -3 scripts/transcribe_sku.py ${sku}`, { cwd: ROOT, stdio: 'inherit' });
  } catch (wErr) {
    console.warn(`Whisper warning:`, wErr.message);
  }

  return true;
}

async function run() {
  const targetSkus = process.argv.slice(2);
  const skus = targetSkus.length > 0 ? targetSkus : ['VIDEO-11a507', 'VIDEO-c0353f', 'VIDEO-af2c29'];

  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--disable-web-security', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    for (const sku of skus) {
      try {
        await downloadHlsLesson(sku, browser);
      } catch (err) {
        console.error(`❌ Lỗi tải HLS cho ${sku}:`, err.message);
      }
    }
  } finally {
    await browser.close();
    execSync('node scripts/build_videos_dgmd.js', { cwd: ROOT, stdio: 'ignore' });
  }
}

if (require.main === module) {
  run().catch(console.error);
}

module.exports = { downloadHlsLesson };
