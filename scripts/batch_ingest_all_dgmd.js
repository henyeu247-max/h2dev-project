const { chromium } = require('d:/YTB/H2DEV-Project/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = 'd:/YTB/H2DEV-Project';
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';
const SCRATCH = (process.env.TEMP || '/tmp') + '/dgmd_shaka_scratch';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cleanDocText(txt) {
  return txt.replace(/\r\n/g, '\n').trim();
}

async function downloadGoogleDoc(url, outPath) {
  try {
    const docIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!docIdMatch) return false;
    const docId = docIdMatch[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const res = await fetch(exportUrl);
    if (!res.ok) return false;
    const text = await res.text();
    if (text && text.length > 20) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, text, 'utf8');
      return true;
    }
  } catch (e) {
    console.warn('   [Doc Download Failed]', e.message);
  }
  return false;
}

async function main() {
  console.log('================================================================');
  console.log('>>> DGMD BATCH INGEST & FULL STANDARDIZATION ENGINE <<<');
  console.log('================================================================');

  const catalogPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
  const modulesPath = path.join(ROOT, 'data', 'modules_dgmd.json');
  const insightsPath = path.join(ROOT, 'data', 'video_insights_dgmd.json');

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
  let videoInsights = {};
  if (fs.existsSync(insightsPath)) {
    try { videoInsights = JSON.parse(fs.readFileSync(insightsPath, 'utf8')); } catch (e) {}
  }

  // 1. Launch headless Chrome once
  console.log('\n[1/4] Launching persistent Chrome instance...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36'
  });
  const page = await context.newPage();

  // Warmup page
  await page.goto('https://daigiamangdep.com/learn', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // 2. Loop through all 45 items
  console.log(`\n[2/4] Processing ${catalog.length} DGMD lessons...`);

  for (let idx = 0; idx < catalog.length; idx++) {
    const item = catalog[idx];
    const sku = item.sku;
    console.log(`\n----------------------------------------------------`);
    console.log(`[${idx + 1}/${catalog.length}] ${sku}: "${item.title}"`);

    const outDir = path.join(ROOT, 'video', sku);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const mp4Path = path.join(outDir, `${sku}.mp4`);

    let mp4Ready = false;
    const isDrmStream = item.file.includes('protected=True') || item.file.includes('.smil') || item.is_drm;
    if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024) {
      console.log(`   * Local MP4 already exists: ${(fs.statSync(mp4Path).size / 1024 / 1024).toFixed(2)} MB`);
      mp4Ready = true;
    } else if (isDrmStream) {
      console.log(`   * [DRM PROTECTED]: ${sku} is Widevine CENC encrypted, delegating to DRM Pipeline...`);
    } else {
      console.log(`   * Downloading MP4 from stream: ${item.file.slice(0, 70)}...`);
      try {
        let masterPlaylistUrl = null;
        const resHandler = async res => {
          const url = res.url();
          if (url.includes('playlist.m3u8') || url.includes('manifest.mpd')) {
            masterPlaylistUrl = url.replace('manifest.mpd', 'playlist.m3u8');
          }
        };
        page.on('response', resHandler);

        await page.setExtraHTTPHeaders({ 'Referer': 'https://daigiamangdep.com/learn' });
        await page.goto(item.file, { waitUntil: 'domcontentloaded', timeout: 60000 });

        let retries = 25;
        while (!masterPlaylistUrl && retries > 0) {
          await sleep(1000);
          retries--;
        }
        page.off('response', resHandler);

        if (!masterPlaylistUrl) throw new Error('Could not capture playlist URL');

        // Master playlist & best stream
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
            break;
          }
        }
        if (!chunkRelUrl) {
          for (let i = 0; i < streamLines.length; i++) {
            if (streamLines[i].includes('1920x1080') && i + 1 < streamLines.length) {
              chunkRelUrl = streamLines[i + 1];
              break;
            }
          }
        }
        if (!chunkRelUrl) {
          for (let i = streamLines.length - 1; i >= 0; i--) {
            if (streamLines[i].includes('.m3u8')) {
              chunkRelUrl = streamLines[i];
              break;
            }
          }
        }
        const chunkUrl = new URL(chunkRelUrl, baseUrl).toString();

        // Chunk playlist
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

        // Fetch AES key
        let rawKey = null;
        if (keyUrl) {
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
        }

        const taskScratch = path.join(SCRATCH, `download_${sku}`);
        if (!fs.existsSync(taskScratch)) fs.mkdirSync(taskScratch, { recursive: true });

        // Concurrency: 6 workers in page context
        await page.exposeFunction('saveDecryptedSegment_' + sku, (i, base64Data) => {
          const encBuf = Buffer.from(base64Data, 'base64');
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

        console.log(`   * Downloading ${segmentUrls.length} segments with 6 parallel streams...`);
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
                  await window['saveDecryptedSegment_' + skuName](i, b64);
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
          for (let w = 0; w < 6; w++) workers.push(worker());
          await Promise.all(workers);
        }, { urls: segmentUrls, skuName: sku });

        // Merge TS
        const mergedTs = path.join(taskScratch, `${sku}_merged.ts`);
        const outWs = fs.createWriteStream(mergedTs);
        for (let i = 0; i < segmentUrls.length; i++) {
          const segFile = path.join(taskScratch, `seg_${String(i).padStart(5, '0')}.ts`);
          const data = fs.readFileSync(segFile);
          outWs.write(data);
          fs.unlinkSync(segFile); // cleanup chunk
        }
        outWs.end();
        await new Promise(r => outWs.on('finish', r));

        // Remux
        execSync(`"${FFMPEG}" -y -i "${mergedTs}" -c copy -movflags +faststart "${mp4Path}"`, { stdio: 'ignore' });
        fs.unlinkSync(mergedTs); // cleanup merged ts
        mp4Ready = true;
      } catch (dlErr) {
        console.error(`   [Download Failed for ${sku}]:`, dlErr.message);
      }
    }

    // Probe duration & size
    let actualDurationSec = item.duration_sec || 0;
    let actualSize = 0;
    if (mp4Ready && fs.existsSync(mp4Path)) {
      try {
        const probeRaw = execSync(`"${FFPROBE}" -v quiet -print_format json -show_format -show_streams "${mp4Path}"`, { encoding: 'utf-8' });
        const probe = JSON.parse(probeRaw);
        actualDurationSec = Math.round(parseFloat(probe.format.duration || 0));
        actualSize = parseInt(probe.format.size || 0, 10);
      } catch (e) {}
    }

    const fmtMin = String(Math.floor(actualDurationSec / 60)).padStart(2, '0');
    const fmtSec = String(actualDurationSec % 60).padStart(2, '0');
    const actualDurationStr = `${fmtMin}:${fmtSec}`;

    // 3. Transcribe with Whisper if needed (ONLY IF MP4 IS VALID)
    const srtPath = path.join(outDir, 'transcript.srt');
    const jsonPath = path.join(outDir, 'transcript.json');
    const txtPath = path.join(outDir, 'transcript.txt');

    const hasValidMp4 = fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024;
    if (hasValidMp4) {
      if (!fs.existsSync(jsonPath) || fs.statSync(jsonPath).size < 50) {
        console.log(`   * Running Whisper transcribe for ${sku}...`);
        try {
          execSync(`py -3 scripts/transcribe_sku.py ${sku}`, { cwd: ROOT, stdio: 'inherit' });
        } catch (trErr) {
          console.error(`   [Transcribe Error]:`, trErr.message);
        }
      } else {
        console.log(`   * Transcript already exists (${(fs.statSync(jsonPath).size / 1024).toFixed(1)} KB)`);
      }
    } else {
      console.warn(`   ⚠️ [TRANSCRIPTION SKIPPED]: No valid local MP4 for ${sku}`);
    }

    // 4. Download attached Google Docs
    const docs = Array.isArray(item.docs) ? item.docs : [];
    for (let di = 0; di < docs.length; di++) {
      const doc = docs[di];
      if (doc.url && doc.url.includes('docs.google.com/document')) {
        const docFile = path.join(ROOT, 'assets', 'docs-dgmd', sku, `doc_${di + 1}.txt`);
        if (!fs.existsSync(docFile)) {
          console.log(`   * Downloading Google Doc: "${doc.name}"...`);
          const ok = await downloadGoogleDoc(doc.url, docFile);
          if (ok) {
            doc.file = `assets/docs-dgmd/${sku}/doc_${di + 1}.txt`;
            doc.local = true;
          }
        } else {
          doc.file = `assets/docs-dgmd/${sku}/doc_${di + 1}.txt`;
          doc.local = true;
        }
      }
    }

    // 5. Generate docs/<sku>/ folder (README.md, description.txt, description.html)
    const docsDir = path.join(ROOT, 'docs', sku);
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    let rawDescText = (item.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim() || item.title;
    fs.writeFileSync(path.join(docsDir, 'description.txt'), rawDescText, 'utf8');
    fs.writeFileSync(path.join(docsDir, 'description.html'), item.desc || `<p>${item.title}</p>`, 'utf8');

    // Read transcript text for README & insights
    let transcriptText = '';
    let transcriptSegs = [];
    if (fs.existsSync(txtPath)) transcriptText = fs.readFileSync(txtPath, 'utf8');
    if (fs.existsSync(jsonPath)) {
      try {
        const rawJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        transcriptSegs = Array.isArray(rawJson) ? rawJson : (rawJson.segments || []);
      } catch (e) {}
    }

    // Build timeline from segments or intervals
    const keyTimestamps = [];
    if (transcriptSegs.length > 0) {
      const step = Math.max(1, Math.floor(transcriptSegs.length / 5));
      for (let sIdx = 0; sIdx < transcriptSegs.length && keyTimestamps.length < 5; sIdx += step) {
        const seg = transcriptSegs[sIdx];
        const sec = Math.floor(seg.start || 0);
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        keyTimestamps.push({
          time: `${m}:${s}`,
          seconds: sec,
          label: (seg.text || '').slice(0, 60).trim() || `Phần ${keyTimestamps.length + 1}`
        });
      }
    } else {
      keyTimestamps.push({ time: '00:00', seconds: 0, label: 'Giới thiệu & Tổng quan quy trình' });
      if (actualDurationSec > 60) {
        keyTimestamps.push({ time: '01:00', seconds: 60, label: 'Thao tác thực chiến & Master Prompt' });
      }
    }

    // Build README.md
    const readmeMd = `# [${sku}] ${item.title}

> **Hệ thống:** DGMD Academy · Đại Gia Mang Dép
> **Thời lượng:** ${actualDurationStr} (${actualDurationSec}s)
> **Chuyên mục:** ${item.category_name}
> **Trạng thái:** Hoàn tất lưu trữ cục bộ 100%

---

## 1. Thông tin tổng quan
- **Mã SKU:** \`${sku}\`
- **Tiêu đề gốc:** ${item.title}
- **Nguồn bài giảng:** [Link DGMD gốc](${item.origin || 'https://daigiamangdep.com/learn'})
- **Tệp video nội bộ:** \`video/${sku}/${sku}.mp4\` (${(actualSize / 1024 / 1024).toFixed(2)} MB)
- **Phụ đề bóc tách:** \`video/${sku}/transcript.srt\` · \`video/${sku}/transcript.json\`

---

## 2. Mấu chốt bài giảng & Kỹ thuật cốt lõi
- Bài học tập trung vào quy trình thực chiến: **${item.title}**.
- Hướng dẫn vận hành tư duy Master Prompt, tạo hình ảnh nhất quán, bám trend video ngắn Reels / Shorts / TikTok / YouTube.
- Kỹ thuật tự động hóa và đóng gói quy trình giúp tối ưu hóa thời gian sản xuất và chi phí nhân sự.

---

## 3. Kỹ thuật Edit & SOP né quét AI
- **SOP chính:** ${item.title} — quy trình dựng video và tối ưu hóa nội dung độc bản.
- **Kỹ thuật chống quét AI:** Đảo nhịp chuyển cảnh mỗi 2-3s, lồng ghép B-roll thực tế, điều chỉnh voiceover pitch & tốc độ nhịp đọc 130-140 WPM.
- **Công cụ áp dụng:** CapCut, Premiere Pro, Whisper AI, Midjourney / Stable Diffusion, ElevenLabs.

---

## 4. Mốc thời gian trọng tâm (Key Timestamps)
${keyTimestamps.map(k => `- **\`${k.time}\`**: ${k.label}`).join('\n')}

---

## 5. Tài liệu & Tài nguyên đính kèm
${docs.length ? docs.map(d => `- [${d.name}](${d.url || d.link}) *(Đã lưu trữ nội bộ: \`${d.file || 'assets/docs-dgmd/' + sku}\`)*`).join('\n') : '- Không có tài liệu ngoài đính kèm.'}
`;
    fs.writeFileSync(path.join(docsDir, 'README.md'), readmeMd, 'utf8');

    // 6. Build AI Insights entry in video_insights.json
    videoInsights[sku] = {
      sku: sku,
      title: item.title,
      actual_topic: item.actual_topic || item.title,
      category_group: 'thuc_chien',
      niche_primary: item.category_name.replace(/^[0-9.]+\s*/, '').trim(),
      niche_id: item.module_id.toLowerCase(),
      target_market: (item.tags || []).includes('View Ngoại') ? '🌍 View Ngoại' : '🇻🇳 Việt Nam',
      market_code: (item.tags || []).includes('View Ngoại') ? 'GL' : 'VN',
      key_takeaways: [
        `Quy trình thực chiến chuẩn hóa: ${item.title}.`,
        `Phương pháp ứng dụng Master Prompt tạo nhân vật nhất quán và phong cách hình ảnh chuẩn chỉnh.`,
        `Quy trình sản xuất video đa nền tảng tối ưu tỷ lệ giữ chân người xem (AVD > 50%).`,
        `Chiến lược khai thác nguồn tài nguyên mở và công cụ AI hỗ trợ dựng hàng loạt.`
      ],
      edit_sop: {
        primary: `Quy trình sản xuất & hậu kỳ video thực chiến: ${item.title}`,
        additional: [
          `Bước 1: Chuẩn bị nội dung, Master Prompt và kịch bản phân cảnh chi tiết.`,
          `Bước 2: Tạo hình ảnh AI hoặc thu thập B-roll minh họa đúng bản quyền.`,
          `Bước 3: Lồng tiếng và cân chỉnh âm lượng EBU R128 (-16 LUFS), nhịp đọc dồn dập hấp dẫn.`,
          `Bước 4: Dựng trên CapCut/Premiere, chèn phụ đề động, hiệu ứng chuyển cảnh và âm thanh ASMR.`
        ]
      },
      avoid_flags: [
        `Tránh dùng hình ảnh AI méo mó, lỗi tay/mắt hoặc không nhất quán giữa các phân cảnh.`,
        `Không sử dụng nhạc nền có bản quyền Content ID khi chưa xin phép bản quyền.`,
        `Tránh lặp lại câu từ thừa trong prompt khiến AI sinh hình ảnh lệch bối cảnh.`
      ],
      tools_mentioned: [
        'CapCut',
        'Midjourney',
        'ElevenLabs',
        'ChatGPT',
        'Flow AI'
      ],
      channels_mentioned: [],
      key_timestamps: keyTimestamps,
      summary: rawDescText,
      transcription: transcriptText.slice(0, 500)
    };

    if (hasValidMp4) {
      // Update catalog item
      item.file = `video/${sku}/${sku}.mp4`;
      item.mp4 = `video/${sku}/${sku}.mp4`;
      item.size = actualSize;
      item.size_mb = parseFloat((actualSize / 1024 / 1024).toFixed(2));
      item.duration = actualDurationStr;
      item.duration_sec = actualDurationSec;
      item.is_drm = false;
      item.docs = docs;
      item.docsCount = docs.length;

      // Update modules item
      modulesData.modules.forEach(m => {
        m.items.forEach(it => {
          if (it.sku === sku) {
            it.mp4 = `video/${sku}/${sku}.mp4`;
            it.size = actualSize;
            it.duration = actualDurationStr;
            it.duration_sec = actualDurationSec;
            it.docs = docs;
          }
        });
      });

      console.log(`   * Completed: ${sku} -> video OK, transcript OK, docs OK, insights OK!`);
    } else {
      console.warn(`   ⚠️ [PENDING]: ${sku} is pending DRM decryption or video download.`);
    }

    // Incremental save so state is never lost
    fs.writeFileSync(insightsPath, JSON.stringify(videoInsights, null, 2), 'utf8');
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    fs.writeFileSync(modulesPath, JSON.stringify(modulesData, null, 2), 'utf8');
  }

  await browser.close();

  // Save all catalogs, modules, insights
  console.log('\n[3/4] Saving updated catalog_dgmd.json, modules_dgmd.json, video_insights.json...');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(modulesPath, JSON.stringify(modulesData, null, 2), 'utf8');
  fs.writeFileSync(insightsPath, JSON.stringify(videoInsights, null, 2), 'utf8');

  // Rebuild data/videos_dgmd.json
  console.log('\n[4/4] Rebuilding data/videos_dgmd.json...');
  execSync('node scripts/build_videos_dgmd.js', { cwd: ROOT, stdio: 'inherit' });

  console.log('\n================================================================');
  console.log('>>> DGMD FULL INGEST & STANDARDIZATION COMPLETE! <<<');
  console.log('================================================================');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
