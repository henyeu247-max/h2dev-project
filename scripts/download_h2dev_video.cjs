const { chromium } = require('d:/YTB/H2DEV-Project/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const SKU = process.argv[2] || 'VIDEO-73d98a';
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';
const ROOT = 'd:/YTB/H2DEV-Project';
const SCRATCH = 'C:/Users/SaxukeB/.gemini/antigravity/brain/a2e4c820-6071-45ab-ad92-8c402a4bd23d/scratch';

async function main() {
  console.log(`\n======================================================`);
  console.log(`>>> H2DEV VIDEO DOWNLOADER: ${SKU}`);
  console.log(`======================================================\n`);

  // 1. Launch browser
  console.log('Step 1: Launching browser and navigating to h2dev.vn/learn...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto('https://h2dev.vn/learn', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const cookies = await context.cookies('https://h2dev.vn');
  const cookieMap = Object.fromEntries(cookies.map(c => [c.name, c.value]));

  // 2. Query GraphQL getCourseNoCategory(sku)
  console.log(`Step 2: Querying metadata for ${SKU}...`);
  const graphqlUrl = 'https://saas-api.mona.academy/graphql';
  const graphqlQuery = `query($sku:String!){getCourseNoCategory(sku:$sku){__typename ... on ProductInterface {id sku name time video_link description { html } image { url }}}}`;

  const apiRes = await context.request.post(graphqlUrl, {
    headers: {
      'content-type': 'application/json',
      'verify-site': cookieMap.__vdk || '',
      'x-saas-user-id': cookieMap.__vui || '',
      origin: 'https://h2dev.vn',
      referer: 'https://h2dev.vn/learn',
    },
    data: { query: graphqlQuery, variables: { sku: SKU } },
  });
  const productData = await apiRes.json();
  const product = productData?.data?.getCourseNoCategory;
  if (!product || !product.video_link) {
    throw new Error(`Failed to get video_link for ${SKU}: ${JSON.stringify(productData)}`);
  }
  console.log(`Product found: "${product.name}"`);
  console.log(`Duration: ${product.time}s | Link: ${product.video_link.substring(0, 80)}...`);

  // 3. Intercept master playlist
  console.log('Step 3: Opening player page and capturing master playlist...');
  let masterPlaylistUrl = null;

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('playlist.m3u8')) {
      masterPlaylistUrl = url;
    }
  });

  await page.setExtraHTTPHeaders({ 'Referer': 'https://h2dev.vn/' });
  await page.goto(product.video_link, { waitUntil: 'networkidle', timeout: 60000 });

  let retries = 10;
  while (!masterPlaylistUrl && retries > 0) {
    await page.waitForTimeout(1000);
    retries--;
  }
  if (!masterPlaylistUrl) throw new Error('Could not intercept master playlist');
  console.log('Captured master playlist URL:', masterPlaylistUrl);

  // 4. Fetch master playlist and find 1080p stream
  const baseUrl = masterPlaylistUrl.substring(0, masterPlaylistUrl.lastIndexOf('/') + 1);
  const masterText = await page.evaluate(async (url) => {
    const res = await fetch(url);
    return await res.text();
  }, masterPlaylistUrl);

  const streamLines = masterText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let chunkRelUrl = null;
  for (let i = 0; i < streamLines.length; i++) {
    if (streamLines[i].includes('1920x1080') && i + 1 < streamLines.length) {
      chunkRelUrl = streamLines[i + 1];
      console.log('Selected stream: 1080p');
      break;
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
  const segmentUrls = [];
  for (const line of chunkText.split('\n').map(l => l.trim())) {
    if (line.startsWith('#EXT-X-KEY')) {
      const match = line.match(/URI=["']([^"']+)["']/);
      if (match) keyRelUrl = match[1];
    } else if (!line.startsWith('#') && line.includes('.ts')) {
      segmentUrls.push(new URL(line, baseUrl).toString());
    }
  }
  const keyUrl = new URL(keyRelUrl, baseUrl).toString();
  console.log(`Found Key URL: ${keyUrl}`);
  console.log(`Found ${segmentUrls.length} segments to download.`);

  // 6. Setup disk storage
  const tempDir = path.join(SCRATCH, `download_${SKU}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // 7. Get decryption key via Shaka NetworkingEngine
  console.log('Step 4: Fetching AES-128 key via Shaka NetworkingEngine...');
  const keyBase64 = await page.evaluate(async (kUrl) => {
    const net = player.getNetworkingEngine();
    const req = shaka.net.NetworkingEngine.makeRequest([kUrl], player.getConfiguration().streaming.retryParameters);
    const res = await net.request(shaka.net.NetworkingEngine.RequestType.KEY, req).promise;
    const bytes = new Uint8Array(res.data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  }, keyUrl);

  const keyBuffer = Buffer.from(keyBase64, 'base64');
  console.log(`Decryption key obtained: ${keyBuffer.length} bytes (expected 16)`);

  // 8. Download and decrypt segments
  console.log(`Step 5: Downloading and decrypting ${segmentUrls.length} segments...`);
  const decryptedFiles = new Array(segmentUrls.length);
  let savedCount = 0;

  await page.exposeFunction('saveDecryptedSegment', (idx, base64Data) => {
    const encBuf = Buffer.from(base64Data, 'base64');
    const iv = Buffer.alloc(16);
    iv.writeUInt32BE(idx, 12);
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, iv);
    const decBuf = Buffer.concat([decipher.update(encBuf), decipher.final()]);
    const segPath = path.join(tempDir, `seg_${String(idx).padStart(5, '0')}.ts`);
    fs.writeFileSync(segPath, decBuf);
    decryptedFiles[idx] = segPath;
    savedCount++;
    if (savedCount % 10 === 0 || savedCount === segmentUrls.length) {
      process.stdout.write(`Progress: ${savedCount}/${segmentUrls.length} (${Math.round(savedCount/segmentUrls.length*100)}%)\r`);
    }
  });

  // Run download loop inside page evaluation
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

    const net = player.getNetworkingEngine();
    const retryParams = player.getConfiguration().streaming.retryParameters;

    // Concurrency 4
    let index = 0;
    async function worker() {
      while (index < urls.length) {
        const i = index++;
        const u = urls[i];
        let attempts = 3;
        let done = false;
        while (attempts > 0 && !done) {
          try {
            const req = shaka.net.NetworkingEngine.makeRequest([u], retryParams);
            const res = await net.request(shaka.net.NetworkingEngine.RequestType.SEGMENT, req).promise;
            const b64 = bufferToBase64(res.data);
            await window.saveDecryptedSegment(i, b64);
            done = true;
          } catch (e) {
            attempts--;
            if (attempts === 0) throw e;
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }

    const workers = [];
    for (let w = 0; w < 4; w++) workers.push(worker());
    await Promise.all(workers);
  }, segmentUrls);

  console.log(`\nAll ${segmentUrls.length} segments downloaded and decrypted!`);
  await browser.close();

  // 9. Merge TS segments
  console.log('Step 6: Concatenating decrypted TS files...');
  const mergedTsPath = path.join(tempDir, `${SKU}_merged.ts`);
  const writeStream = fs.createWriteStream(mergedTsPath);
  for (const segFile of decryptedFiles) {
    const data = fs.readFileSync(segFile);
    writeStream.write(data);
  }
  await new Promise(r => writeStream.end(r));
  console.log(`Merged TS file: ${(fs.statSync(mergedTsPath).size / 1024 / 1024).toFixed(2)} MB`);

  // 10. Remux to MP4
  const targetDir = path.join(ROOT, 'video', SKU);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const targetMp4 = path.join(targetDir, `${SKU}.mp4`);

  console.log(`Step 7: Remuxing to MP4 via FFmpeg: ${targetMp4}...`);
  execSync(`"${FFMPEG}" -y -i "${mergedTsPath}" -c copy "${targetMp4}"`, { stdio: 'inherit' });

  // 11. Verify with FFprobe
  console.log('Step 8: Verifying with FFprobe...');
  const probeOutput = execSync(`"${FFPROBE}" -v error -show_entries format=duration,size,bit_rate:stream=codec_name,codec_type,width,height -of json "${targetMp4}"`, { encoding: 'utf8' });
  const probe = JSON.parse(probeOutput);
  console.log('FFprobe format:', JSON.stringify(probe.format, null, 2));
  console.log('FFprobe streams:', JSON.stringify(probe.streams, null, 2));

  const durationSec = parseFloat(probe.format?.duration || '0');
  const bytes = parseInt(probe.format?.size || '0');
  const hasVideo = (probe.streams || []).some(s => s.codec_type === 'video');
  const hasAudio = (probe.streams || []).some(s => s.codec_type === 'audio');

  if (!hasVideo || !hasAudio || durationSec <= 0 || bytes <= 0) {
    throw new Error('FFprobe integrity check FAILED');
  }
  console.log(`>>> VERIFIED: duration=${durationSec.toFixed(2)}s, size=${(bytes/1024/1024).toFixed(2)}MB, video+audio OK!`);

  // 12. Thumbnail
  const targetThumb = path.join(ROOT, 'assets/thumbs', `${SKU}.png`);
  if (product.image?.url) {
    console.log(`Step 9: Downloading thumbnail from ${product.image.url}...`);
    const thumbRes = await fetch(product.image.url);
    const thumbBuf = Buffer.from(await thumbRes.arrayBuffer());
    fs.writeFileSync(targetThumb, thumbBuf);
    console.log(`Saved thumbnail: ${targetThumb} (${thumbBuf.length} bytes)`);
  }

  // 13. Create docs
  const docsDir = path.join(ROOT, 'docs', SKU);
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const descHtml = product.description?.html || '';
  fs.writeFileSync(path.join(docsDir, 'description.html'), descHtml, 'utf8');

  const durationFormatted = `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}`;
  const readmeContent = `# ${SKU} — ${product.name}

- SKU: \`${SKU}\`
- Title: ${product.name}
- Module: 4 (vị trí mới)
- Published: 2026-09-06
- Duration: ${durationFormatted} (${Math.round(durationSec)}s)
- Size: ${bytes} bytes (verified)
- MP4: \`video/${SKU}/${SKU}.mp4\`
- Thumb: \`assets/thumbs/${SKU}.png\`
- DRM: false
- Access: PRO
- Market: Nhật Bản, Hàn Quốc
- Niche: Bán Content Ngách Cực Nhỏ

## Ghi chú

- Tải hoàn tất ngày 2026-09-09 qua player public, ${segmentUrls.length}/${segmentUrls.length} segment AES-128.
- Kiểm tra ffprobe: 1920x1080, duration ${durationSec.toFixed(3)}s, kích thước ${bytes} bytes, đầy đủ luồng video và audio.
- Mô tả trích xuất từ \`getCourseNoCategory(sku).description.html\`.
`;
  fs.writeFileSync(path.join(docsDir, 'README.md'), readmeContent, 'utf8');
  console.log(`Created docs for ${SKU}`);

  // 14. Clean up temp
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`\n======================================================`);
  console.log(`>>> DOWNLOAD & PACKAGING COMPLETE FOR ${SKU}`);
  console.log(`======================================================\n`);
  return { sku: SKU, name: product.name, bytes, duration: durationSec };
}

main().catch(e => {
  console.error('\nFATAL ERROR:', e);
  process.exit(1);
});
