const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));

const SKU = process.argv[2] || 'VIDEO-f2ebfb';
const SAFE_SKU_RE = /^[A-Za-z0-9_-]+$/;
if (!SAFE_SKU_RE.test(SKU)) {
  console.error(`Invalid SKU format: ${SKU}`);
  process.exit(1);
}
const FFMPEG = process.env.FFMPEG_PATH || (fs.existsSync('D:/Linly-Dubbing/bin/ffmpeg.exe') ? 'D:/Linly-Dubbing/bin/ffmpeg.exe' : 'ffmpeg');
const FFPROBE = process.env.FFPROBE_PATH || (fs.existsSync('D:/Linly-Dubbing/bin/ffprobe.exe') ? 'D:/Linly-Dubbing/bin/ffprobe.exe' : 'ffprobe');
const SCRATCH = path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', 'dgmd_shaka_scratch');

async function main() {
  console.log(`\n======================================================`);
  console.log(`>>> DGMD (daigiamangdep.com) VIDEO DOWNLOADER: ${SKU}`);
  console.log(`======================================================\n`);

  const taskScratch = path.join(SCRATCH, `download_${SKU}`);
  let browser = null;
  let context = null;

  try {
    // 1. Launch browser
    console.log('Step 1: Launching browser and navigating to daigiamangdep.com/learn...');
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    });
    const page = await context.newPage();

    // 2. Query product metadata from GraphQL
    console.log(`Step 2: Querying metadata for ${SKU} from api.daigiamangdep.com/graphql...`);
    await page.goto('https://daigiamangdep.com/learn', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const query = `
      query($sku: String!) {
        getCourseNoCategory(sku: $sku) {
          __typename
          ... on ProductInterface {
            id
            sku
            name
            time
            video_link
            url_key
            image { url }
            thumbnail { url }
            description { html }
          }
        }
      }
    `;

    const gqlRes = await page.evaluate(async ({ q, targetSku }) => {
      const res = await fetch('https://api.daigiamangdep.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, variables: { sku: targetSku } })
      });
      return await res.json();
    }, { q: query, targetSku: SKU });

    const product = gqlRes.data?.getCourseNoCategory;
    if (!product || !product.video_link) {
      throw new Error(`Product SKU ${SKU} or video_link not found in DGMD getCourseNoCategory`);
    }
    console.log(`Product found: "${product.name}"`);
    console.log(`Duration: ${product.time}s | Link: ${product.video_link.slice(0, 80)}...`);

    // 3. Open player page and capture playlist
    console.log('Step 3: Opening player page and capturing master playlist...');
    let masterPlaylistUrl = null;

    page.on('response', async res => {
      const url = res.url();
      if (url.includes('playlist.m3u8') || url.includes('manifest.mpd')) {
        masterPlaylistUrl = url.replace('manifest.mpd', 'playlist.m3u8');
      }
    });

    await page.setExtraHTTPHeaders({ 'Referer': 'https://daigiamangdep.com/learn' });
    await page.goto(product.video_link, { waitUntil: 'domcontentloaded', timeout: 60000 });

    let retries = 20;
    while (!masterPlaylistUrl && retries > 0) {
      await page.waitForTimeout(1000);
      retries--;
    }
    if (!masterPlaylistUrl) throw new Error('Could not intercept master playlist');
    console.log('Captured master playlist URL:', masterPlaylistUrl);

    // 4. Fetch master playlist and find best stream
    const baseUrl = masterPlaylistUrl.substring(0, masterPlaylistUrl.lastIndexOf('/') + 1);
    const masterText = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return await res.text();
    }, masterPlaylistUrl);

    const streamLines = masterText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let chunkRelUrl = null;
    for (let i = 0; i < streamLines.length; i++) {
      if (streamLines[i].includes('1280x720') && i + 1 < streamLines.length) {
        chunkRelUrl = streamLines[i + 1];
        console.log('Selected stream: 720p');
        break;
      }
    }
    if (!chunkRelUrl) {
      for (let i = 0; i < streamLines.length; i++) {
        if (streamLines[i].includes('1920x1080') && i + 1 < streamLines.length) {
          chunkRelUrl = streamLines[i + 1];
          console.log('Selected stream: 1080p');
          break;
        }
      }
    }
    if (!chunkRelUrl) {
      for (let i = streamLines.length - 1; i >= 0; i--) {
        if (streamLines[i].includes('.m3u8')) {
          chunkRelUrl = streamLines[i];
          console.log('Selected fallback stream:', chunkRelUrl);
          break;
        }
      }
    }
    const chunkUrl = new URL(chunkRelUrl, baseUrl).toString();

    // 5. Fetch chunk playlist
    const chunkText = await page.evaluate(async (url) => {
      const res = await fetch(url);
      return await res.text();
    }, chunkUrl);

    let keyRelUrl = null;
    const chunkLines = chunkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const segmentUrls = [];

    for (const line of chunkLines) {
      if (line.startsWith('#EXT-X-KEY')) {
        const match = line.match(/URI="([^"]+)"/);
        if (match) keyRelUrl = match[1];
      } else if (!line.startsWith('#') && line.length > 0) {
        segmentUrls.push(new URL(line, chunkUrl).toString());
      }
    }

    let keyUrl = keyRelUrl ? new URL(keyRelUrl, chunkUrl).toString() : null;
    console.log(`Found Key URL: ${keyUrl}`);
    console.log(`Found ${segmentUrls.length} segments to download.`);

    // 6. Fetch AES-128 key
    let rawKey = null;
    if (keyUrl) {
      console.log('Step 4: Fetching AES-128 key via Shaka NetworkingEngine...');
      const keyBase64 = await page.evaluate(async (url) => {
        try {
          if (window.player) {
            const net = window.player.getNetworkingEngine();
            const req = window.shaka.net.NetworkingEngine.makeRequest(
              url,
              window.player.getConfiguration().streaming.retryParameters
            );
            const op = net.request(window.shaka.net.NetworkingEngine.RequestType.KEY, req);
            const res = await op.promise;
            const u8 = new Uint8Array(res.data);
            let binary = '';
            for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
            return btoa(binary);
          }
        } catch (e) {}

        const r = await fetch(url);
        const ab = await r.arrayBuffer();
        const u8 = new Uint8Array(ab);
        let binary = '';
        for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
        return btoa(binary);
      }, keyUrl);

      rawKey = Buffer.from(keyBase64, 'base64');
      console.log(`Decryption key obtained: ${rawKey.length} bytes (expected 16)`);
    } else {
      console.log('No AES-128 key URL in chunk playlist (clear stream).');
    }

    // 7. Download and decrypt segments
    if (!fs.existsSync(taskScratch)) fs.mkdirSync(taskScratch, { recursive: true });

    console.log(`Step 5: Downloading and decrypting ${segmentUrls.length} segments via Shaka NetworkingEngine...`);
    const decryptedFiles = new Array(segmentUrls.length);
    let savedCount = 0;

    const scratchResolved = path.resolve(taskScratch);
    await page.exposeFunction('saveDecryptedSegment', (idx, base64Data) => {
      if (!Number.isInteger(idx) || idx < 0 || idx > 1_000_000) {
        throw new Error('Invalid segment index');
      }
      const encBuf = Buffer.from(base64Data, 'base64');
      let decBuf = encBuf;
      if (rawKey) {
        const iv = Buffer.alloc(16, 0);
        iv.writeUInt32BE(idx, 12);
        const decipher = crypto.createDecipheriv('aes-128-cbc', rawKey, iv);
        decipher.setAutoPadding(true);
        try {
          decBuf = Buffer.concat([decipher.update(encBuf), decipher.final()]);
        } catch (err) {
          throw new Error(`AES decryption failed at segment ${idx}: ${err.message}`);
        }
      }
      const segPath = path.resolve(scratchResolved, `seg_${String(idx).padStart(5, '0')}.ts`);
      if (!segPath.startsWith(scratchResolved + path.sep)) {
        throw new Error('Segment path escaped scratchDir');
      }
      fs.writeFileSync(segPath, decBuf);
      decryptedFiles[idx] = segPath;
      savedCount++;
      if (savedCount % 10 === 0 || savedCount === segmentUrls.length) {
        process.stdout.write(`Progress: ${savedCount}/${segmentUrls.length} (${Math.round(savedCount/segmentUrls.length*100)}%)\r`);
      }
    });

    await page.evaluate(async (urls) => {
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
      let retryParams = null;
      if (typeof player !== 'undefined' && player.getNetworkingEngine) {
        net = player.getNetworkingEngine();
        retryParams = player.getConfiguration().streaming.retryParameters;
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
              if (net && typeof shaka !== 'undefined') {
                const req = shaka.net.NetworkingEngine.makeRequest([u], retryParams);
                const res = await net.request(shaka.net.NetworkingEngine.RequestType.SEGMENT, req).promise;
                dataBuffer = res.data;
              } else {
                const r = await fetch(u);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                dataBuffer = await r.arrayBuffer();
              }
              const b64 = bufferToBase64(dataBuffer);
              await window.saveDecryptedSegment(i, b64);
              done = true;
            } catch (e) {
              attempts--;
              if (attempts === 0) {
                console.error('Failed segment ' + i + ' after 4 attempts: ' + (e.message || String(e)));
                throw new Error('Segment ' + i + ' failed: ' + (e.message || String(e)));
              }
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }
      }

      const workers = [];
      for (let w = 0; w < 2; w++) workers.push(worker());
      await Promise.all(workers);
    }, segmentUrls);

    console.log(`\nAll ${segmentUrls.length} segments downloaded and decrypted!`);
    await context.close().catch(() => {}); context = null;
    await browser.close().catch(() => {}); browser = null;

    // 8. Concatenate
    console.log('Step 6: Concatenating decrypted TS files...');
    const mergedTs = path.join(taskScratch, `${SKU}_merged.ts`);
    const outWs = fs.createWriteStream(mergedTs);
    for (let i = 0; i < segmentUrls.length; i++) {
      const segFile = path.join(taskScratch, `seg_${String(i).padStart(5, '0')}.ts`);
      const data = fs.readFileSync(segFile);
      outWs.write(data);
    }
    outWs.end();
    await new Promise(r => outWs.on('finish', r));
    console.log(`Merged TS file: ${(fs.statSync(mergedTs).size / 1024 / 1024).toFixed(2)} MB`);

    // 9. Remux to MP4 (via temp file first so GoogleDriveFS receives MOOV_FIRST complete MP4)
    const outDir = path.join(ROOT, 'video', SKU);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outMp4 = path.join(outDir, `${SKU}.mp4`);
    const tmpMp4 = path.join(taskScratch, `${SKU}_faststart.mp4`);

    console.log(`Step 7: Remuxing to MP4 via FFmpeg: ${outMp4}...`);
    execFileSync(FFMPEG, ['-y', '-i', mergedTs, '-c', 'copy', '-movflags', '+faststart', tmpMp4], { stdio: 'inherit', windowsHide: true });
    fs.copyFileSync(tmpMp4, outMp4);

    // 10. Verify via FFprobe
    console.log('Step 8: Verifying with FFprobe...');
    const probeRaw = execFileSync(FFPROBE, ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', outMp4], { encoding: 'utf-8', windowsHide: true });
    const probe = JSON.parse(probeRaw);
    console.log(`>>> VERIFIED: duration=${parseFloat(probe.format.duration).toFixed(2)}s, size=${(probe.format.size/1024/1024).toFixed(2)}MB, video+audio OK!`);

    // 11. Download thumbnail to assets/thumbs-dgmd/<SKU>.png
    const thumbUrl = product.thumbnail?.url || product.image?.url;
    if (thumbUrl) {
      const thumbDir = path.join(ROOT, 'assets', 'thumbs-dgmd');
      fs.mkdirSync(thumbDir, { recursive: true });
      const thumbDest = path.join(thumbDir, `${SKU}.png`);
      if (!fs.existsSync(thumbDest)) {
        try {
          const tRes = await fetch(thumbUrl);
          const tBuf = await tRes.arrayBuffer();
          fs.writeFileSync(thumbDest, Buffer.from(tBuf));
          console.log(`Saved thumbnail: ${thumbDest}`);
        } catch (e) {
          console.log(`Thumbnail download failed: ${e.message}`);
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`>>> DOWNLOAD & PACKAGING COMPLETE FOR DGMD ${SKU}`);
    console.log(`======================================================\n`);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    try { fs.rmSync(taskScratch, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
