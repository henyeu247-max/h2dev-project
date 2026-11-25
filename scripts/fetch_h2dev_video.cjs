'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

/*
  fetch_h2dev_video.cjs — TAI VIDEO H2DEV KHONG CAN DANG NHAP (Shaka NetworkingEngine + AES-128 HLS).

  QUY TRINH:
    1. Mo https://h2dev.vn/learn -> lay cookie public `__vdk` / `__vui`.
    2. GraphQL `saas-api.mona.academy/graphql` resolver `getCourseNoCategory(sku)`
       -> lay playerUrl moi co token (`protected=False`).
    3. Mo playerUrl trong headless Chrome -> doi Shaka Player (`window.player`/`window.ui` + `window.shaka`),
       tam dung `<video>` va tat ABR de khoa 1 resolution duy nhat (mac dinh 1080p -> 720p -> first .m3u8).
    4. Tai master `playlist.m3u8`, `_chunk.m3u8`, `hls.key` (16 bytes) va 100% N/N segment `.ts`
       theo lo 8 luong song song (4 retry/segment) qua `Shaka NetworkingEngine`.
    5. Ghi `WORK/local.m3u8` giu nguyen `#EXT-X-MEDIA-SEQUENCE`, `#EXT-X-KEY` (URI="enc.key" + IV neu co)
       va remux MP4 `+faststart` bang FFmpeg (fallback `-c:v copy -c:a aac -b:a 192k` neu ADTS loi).
    6. Kiem dinh `ffprobe` (video + audio, duration > 0, audio packet rate >= 30 pkt/s voi AAC)
       va CUDA NVDEC decode probe (`h264_cuvid`, fallback `h264` software decode).
    7. Khi co `--apply`, copy vao `video/<SKU>/<SKU>.mp4` (giu shrink guard >= 80%) va don sach `WORK`.

  Dung: node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx [--quality 1080p] [--out path] [--apply]
*/

const SKU = process.argv[2];
if (!SKU || !/^VIDEO-[A-Za-z0-9]+$/.test(SKU)) {
  console.error('Usage: node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx [--quality 1080p] [--out path] [--apply]');
  process.exit(2);
}

const gArg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : d;
};

const APPLY = process.argv.includes('--apply');
const EXPLICIT_OUT = process.argv.includes('--out');
const QUALITY = gArg('--quality', '1080p');
const ROOT = path.resolve(__dirname, '..');
const TMP_BASE = process.env.TEMP || os.tmpdir();
const OUT = gArg('--out', path.join(TMP_BASE, `${SKU}_download.mp4`));
const WORK = path.join(TMP_BASE, `h2dev_dl_${SKU}`);
const DEFAULT_FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const DEFAULT_FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';
const FFMPEG = process.env.FFMPEG || (fs.existsSync(DEFAULT_FFMPEG) ? DEFAULT_FFMPEG : 'ffmpeg');
const FFPROBE = process.env.FFPROBE || (fs.existsSync(DEFAULT_FFPROBE) ? DEFAULT_FFPROBE : 'ffprobe');
const CHROME_EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36';
const BATCH_SIZE = 8;

function padIdx(idx, width) {
  return String(idx).padStart(width, '0');
}

function verifyMediaOutput(mp4Path) {
  const pr = spawnSync(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'format=duration,size',
    '-show_entries', 'stream=index,codec_type,codec_name,width,height,sample_rate,channels,duration',
    '-of', 'json',
    mp4Path
  ], { encoding: 'utf8', timeout: 60000, windowsHide: true });

  if (pr.status !== 0) {
    throw new Error(`ffprobe stream inspection failed: ${(pr.stderr || '').slice(-800)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(pr.stdout || '{}');
  } catch (e) {
    throw new Error(`ffprobe JSON parse failed: ${e.message}`);
  }

  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const vStream = streams.find(s => s.codec_type === 'video');
  const aStream = streams.find(s => s.codec_type === 'audio');
  const duration = parseFloat(parsed.format?.duration || vStream?.duration || '0');
  const size = fs.statSync(mp4Path).size;

  if (!vStream) throw new Error('Verification failed: missing video stream');
  if (!aStream) throw new Error('Verification failed: missing audio stream');
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Verification failed: invalid duration (${parsed.format?.duration})`);
  }

  // Audio packet rate check (-select_streams a:0 -count_packets)
  const aPr = spawnSync(FFPROBE, [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-count_packets',
    '-show_entries', 'stream=codec_name,nb_read_packets,duration',
    '-of', 'json',
    mp4Path
  ], { encoding: 'utf8', timeout: 120000, windowsHide: true });

  if (aPr.status !== 0) {
    throw new Error(`ffprobe audio packet count failed: ${(aPr.stderr || '').slice(-800)}`);
  }

  let aParsed;
  try {
    aParsed = JSON.parse(aPr.stdout || '{}');
  } catch (e) {
    throw new Error(`ffprobe audio packet JSON parse failed: ${e.message}`);
  }

  const aInfo = (Array.isArray(aParsed.streams) && aParsed.streams[0]) || {};
  const aCodec = String(aInfo.codec_name || aStream.codec_name || '').toLowerCase();
  const aDur = parseFloat(aInfo.duration || '') || duration;
  const nbReadPackets = parseInt(aInfo.nb_read_packets || '0', 10);
  const pktRate = aDur > 0 ? (nbReadPackets / aDur) : 0;

  if (aCodec === 'aac' && pktRate < 30) {
    throw new Error(`Verification failed: AAC audio packet rate too low (${pktRate.toFixed(2)} pkt/s < 30 pkt/s, packets=${nbReadPackets}, dur=${aDur.toFixed(2)}s)`);
  }
  if (nbReadPackets <= 0) {
    throw new Error(`Verification failed: 0 audio packets read`);
  }

  // CUDA NVDEC decode probe (with software h264 fallback if GPU unavailable/busy)
  const seekSec = duration > 2 ? '1' : '0';
  let decodeProbe = 'cuda_nvdec';
  const cudaArgs = [
    '-hide_banner', '-v', 'error',
    '-hwaccel', 'cuda', '-c:v', 'h264_cuvid',
    '-ss', seekSec, '-t', '1',
    '-i', mp4Path,
    '-f', 'null', '-'
  ];
  let decRes = spawnSync(FFMPEG, cudaArgs, { encoding: 'utf8', timeout: 60000, windowsHide: true });
  if (decRes.status !== 0) {
    const cudaErr = (decRes.stderr || '').trim().slice(-300);
    console.warn(`[WARN] CUDA NVDEC probe unavailable/failed (${cudaErr || 'exit ' + decRes.status}); falling back to software decode...`);
    decodeProbe = vStream.codec_name === 'h264' ? 'sw_h264' : 'sw_decode';
    const swArgs = [
      '-hide_banner', '-v', 'error',
      ...(vStream.codec_name === 'h264' ? ['-c:v', 'h264'] : []),
      '-ss', seekSec, '-t', '1',
      '-i', mp4Path,
      '-f', 'null', '-'
    ];
    decRes = spawnSync(FFMPEG, swArgs, { encoding: 'utf8', timeout: 60000, windowsHide: true });
    if (decRes.status !== 0) {
      throw new Error(`Video decode probe failed: ${(decRes.stderr || '').slice(-800)}`);
    }
  }

  return {
    size,
    duration,
    videoCodec: vStream.codec_name,
    width: vStream.width,
    height: vStream.height,
    audioCodec: aCodec,
    audioPackets: nbReadPackets,
    audioPktRate: Number(pktRate.toFixed(2)),
    decodeProbe
  };
}

(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });

  const launchOpts = {
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  };
  if (fs.existsSync(CHROME_EXE)) {
    launchOpts.executablePath = CHROME_EXE;
  }

  const browser = await chromium.launch(launchOpts);
  let streamMeta;
  let totalSegs = 0;
  let padWidth = 5;

  try {
    const ctx = await browser.newContext({
      userAgent: UA,
      extraHTTPHeaders: { Referer: 'https://h2dev.vn/' }
    });

    // 1+2. Public cookies + GraphQL playerUrl
    const boot = await ctx.newPage();
    await boot.goto('https://h2dev.vn/learn', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const cm = Object.fromEntries((await ctx.cookies('https://h2dev.vn')).map(c => [c.name, c.value]));
    const gq = 'query($sku:String!){getCourseNoCategory(sku:$sku){__typename ... on ProductInterface {sku time video_link}}}';
    const api = await ctx.request.post('https://saas-api.mona.academy/graphql', {
      headers: {
        'content-type': 'application/json',
        'verify-site': cm.__vdk || '',
        'x-saas-user-id': cm.__vui || '',
        origin: 'https://h2dev.vn',
        referer: 'https://h2dev.vn/learn'
      },
      data: { query: gq, variables: { sku: SKU } }
    });
    const meta = ((await api.json()) || {}).data?.getCourseNoCategory || {};
    const playerUrl = meta.video_link || '';
    const prot = (playerUrl.match(/protected=(True|False)/i) || [])[1] || 'Unknown';
    console.log(`[1] sku=${SKU} | time=${meta.time} | protected=${prot} | target_quality=${QUALITY}`);
    if (!playerUrl) {
      console.error('KHONG co player link');
      await browser.close();
      process.exit(1);
    }
    if (/^True$/i.test(prot)) {
      console.error('[!] protected=True -> DRM Widevine/PlayReady. Flow HLS KHONG tai duoc.');
      await browser.close();
      process.exit(3);
    }
    await boot.close();

    // 3. Open player page & initialize Shaka NetworkingEngine downloader
    const page = await ctx.newPage();
    let observedMasterUrl = null;
    page.on('response', resp => {
      const u = resp.url();
      if (!observedMasterUrl && /playlist\.m3u8/i.test(u)) {
        observedMasterUrl = u;
      }
    });

    const workResolved = path.resolve(WORK);
    await page.exposeFunction('saveFileChunk', (filename, b64) => {
      if (typeof filename !== 'string' || !/^(?:enc\.key|seg_\d{1,8}\.ts)$/.test(filename)) {
        throw new Error(`Invalid chunk filename: ${String(filename)}`);
      }
      const targetPath = path.resolve(workResolved, filename);
      if (!targetPath.startsWith(workResolved + path.sep)) {
        throw new Error(`Chunk path escaped WORK: ${filename}`);
      }
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(targetPath, buf);
      return buf.length;
    });

    for (let navTry = 0; navTry < 3; navTry++) {
      try {
        await page.goto(playerUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        break;
      } catch (e) {
        if (navTry === 2) throw e;
        console.warn(`[WARN] Retry player navigation (${navTry + 2}/3): ${e.message}`);
        await page.waitForTimeout(2000);
      }
    }

    console.log('[2] Waiting for Shaka Player (up to 30s)...');
    await page.waitForFunction(() => {
      const p = window.player || (window.ui && window.ui.getControls && window.ui.getControls().getPlayer && window.ui.getControls().getPlayer());
      return Boolean(p && window.shaka && p.getNetworkingEngine && p.getNetworkingEngine());
    }, { timeout: 30000 });

    // Wait briefly for assetUri to populate if not set immediately on load
    try {
      await page.waitForFunction(() => {
        const p = window.player || (window.ui && window.ui.getControls && window.ui.getControls().getPlayer && window.ui.getControls().getPlayer());
        return Boolean(p && p.getAssetUri && p.getAssetUri());
      }, { timeout: 15000 });
    } catch (_) {
      if (!observedMasterUrl) {
        throw new Error('Shaka Player initialized but assetUri / playlist.m3u8 did not appear within timeout');
      }
    }

    // Fetch master playlist, pick single consistent quality, fetch chunk playlist + key
    streamMeta = await page.evaluate(async ({ quality, fallbackMasterUrl }) => {
      const p = window.player || (window.ui && window.ui.getControls && window.ui.getControls().getPlayer && window.ui.getControls().getPlayer());
      if (!p || !window.shaka) throw new Error('Shaka Player or window.shaka not available');

      // Pause video and disable ABR immediately so Shaka stops competing for bandwidth / switching tracks
      try {
        const vEl = document.querySelector('video');
        if (vEl) {
          vEl.muted = true;
          vEl.pause();
        }
        p.configure({
          abr: { enabled: false },
          streaming: { bufferingGoal: 1, rebufferingGoal: 1, bufferBehind: 0 }
        });
      } catch (_) {}

      const net = p.getNetworkingEngine();
      const ReqType = window.shaka.net.NetworkingEngine.RequestType;
      const makeReq = u => window.shaka.net.NetworkingEngine.makeRequest([u], {});

      const toB64 = ab => {
        const bytes = new Uint8Array(ab);
        const chunks = [];
        for (let i = 0; i < bytes.length; i += 32768) {
          chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 32768)));
        }
        return window.btoa(chunks.join(''));
      };

      const assetUri = (p.getAssetUri && p.getAssetUri()) || fallbackMasterUrl;
      if (!assetUri) throw new Error('No assetUri available from Shaka Player');

      const resM = await net.request(ReqType.MANIFEST, makeReq(assetUri)).promise;
      const masterText = new TextDecoder().decode(resM.data);

      let chunkUri = assetUri;
      let chunkText = masterText;
      let chosenLabel = 'direct';

      if (masterText.includes('#EXT-X-STREAM-INF')) {
        const lines = masterText.split(/\r?\n|\r/);
        const variants = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#EXT-X-STREAM-INF:')) {
            let nextUri = '';
            for (let j = i + 1; j < lines.length; j++) {
              const cand = lines[j].trim();
              if (!cand) continue;
              if (!cand.startsWith('#')) {
                nextUri = cand;
                break;
              }
            }
            if (!nextUri) continue;
            const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/i);
            const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
            const width = resMatch ? parseInt(resMatch[1], 10) : 0;
            const height = resMatch ? parseInt(resMatch[2], 10) : 0;
            const bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;
            variants.push({ uri: nextUri, width, height, bandwidth, line });
          }
        }

        const qNumMatch = String(quality || '1080p').match(/(\d+)/);
        const targetHeight = qNumMatch ? parseInt(qNumMatch[1], 10) : 1080;
        const qToken = String(quality || '1080p').toLowerCase();

        let chosen =
          variants.find(v => v.height === targetHeight) ||
          variants.find(v => v.uri.toLowerCase().includes(qToken)) ||
          (targetHeight !== 720 ? variants.find(v => v.height === 720) : null) ||
          (targetHeight !== 720 ? variants.find(v => v.uri.toLowerCase().includes('720p')) : null) ||
          variants.find(v => /\.m3u8(\?|$)/i.test(v.uri)) ||
          variants[0];

        let chosenRel = chosen ? chosen.uri : null;
        if (!chosenRel) {
          const rawM3u8 = lines.map(l => l.trim()).find(l => l && !l.startsWith('#') && /\.m3u8/i.test(l));
          if (!rawM3u8) throw new Error('No variant .m3u8 found in master playlist');
          chosenRel = rawM3u8;
        }

        chosenLabel = chosen && chosen.height ? `${chosen.width}x${chosen.height}` : chosenRel;
        chunkUri = new URL(chosenRel, assetUri).toString();
        const resC = await net.request(ReqType.MANIFEST, makeReq(chunkUri)).promise;
        chunkText = new TextDecoder().decode(resC.data);
      }

      const cLines = chunkText.split(/\r?\n|\r/);
      let mediaSequence = 0;
      let targetDuration = 12;
      let version = 3;
      let keyMethod = null;
      let keyRelUri = null;
      let keyIv = null;
      const segments = [];
      let currentDuration = '10.000';

      for (let i = 0; i < cLines.length; i++) {
        const line = cLines[i].trim();
        if (!line) continue;
        if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
          const n = parseInt(line.split(':')[1].trim(), 10);
          if (Number.isFinite(n)) mediaSequence = n;
        } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
          const n = parseInt(line.split(':')[1].trim(), 10);
          if (Number.isFinite(n) && n > 0) targetDuration = n;
        } else if (line.startsWith('#EXT-X-VERSION:')) {
          const n = parseInt(line.split(':')[1].trim(), 10);
          if (Number.isFinite(n) && n > 0) version = n;
        } else if (line.startsWith('#EXT-X-KEY:')) {
          const mMethod = line.match(/METHOD=([^,\s]+)/i);
          const mUri = line.match(/URI="([^"]+)"/i);
          const mIv = line.match(/IV=(0x[0-9a-fA-F]+)/i);
          if (mMethod) keyMethod = mMethod[1].trim().toUpperCase();
          if (mUri) keyRelUri = mUri[1].trim();
          if (mIv) keyIv = mIv[1].trim();
        } else if (line.startsWith('#EXTINF:')) {
          const rawDur = line.slice('#EXTINF:'.length).split(',')[0].trim();
          const numDur = Number(rawDur);
          currentDuration = (Number.isFinite(numDur) && numDur > 0) ? numDur.toFixed(3) : '10.000';
        } else if (!line.startsWith('#')) {
          const segUrl = new URL(line, chunkUri).toString();
          segments.push({ url: segUrl, duration: currentDuration });
        }
      }

      if (!segments.length) {
        throw new Error(`0 segments parsed from chunk playlist (${chunkUri})`);
      }

      let hasKey = false;
      if (keyMethod && keyMethod.toUpperCase() !== 'NONE' && keyRelUri) {
        if (keyMethod.toUpperCase() !== 'AES-128') {
          throw new Error(`Unsupported HLS key method: ${keyMethod}`);
        }
        const keyUri = new URL(keyRelUri, chunkUri).toString();
        const resK = await net.request(ReqType.KEY, makeReq(keyUri)).promise;
        if (!resK.data || resK.data.byteLength !== 16) {
          throw new Error(`Invalid AES-128 key length: ${resK.data ? resK.data.byteLength : 0} bytes`);
        }
        await window.saveFileChunk('enc.key', toB64(resK.data));
        hasKey = true;
      }

      return {
        assetUri,
        chunkUri,
        chosenLabel,
        mediaSequence,
        targetDuration,
        version,
        keyMethod,
        keyIv,
        hasKey,
        segments
      };
    }, { quality: QUALITY, fallbackMasterUrl: observedMasterUrl });

    totalSegs = streamMeta.segments.length;
    padWidth = Math.max(5, String(totalSegs).length);
    console.log(`[3] variant=${streamMeta.chosenLabel} | seq=${streamMeta.mediaSequence} | segments=${totalSegs} | key=${streamMeta.hasKey ? 'AES-128' : 'NONE'}`);

    // 4. Download ALL N/N segments in parallel batches of 8 with 4 retries per segment
    const tDl = Date.now();
    for (let i = 0; i < totalSegs; i += BATCH_SIZE) {
      const batch = streamMeta.segments.slice(i, i + BATCH_SIZE).map((s, bIdx) => {
        const idx = i + bIdx;
        return {
          idx,
          url: s.url,
          filename: `seg_${padIdx(idx, padWidth)}.ts`
        };
      });

      await page.evaluate(async (items) => {
        const p = window.player || (window.ui && window.ui.getControls && window.ui.getControls().getPlayer && window.ui.getControls().getPlayer());
        const net = p.getNetworkingEngine();
        const segType = window.shaka.net.NetworkingEngine.RequestType.SEGMENT;

        const toB64 = ab => {
          const bytes = new Uint8Array(ab);
          const chunks = [];
          for (let k = 0; k < bytes.length; k += 32768) {
            chunks.push(String.fromCharCode.apply(null, bytes.subarray(k, k + 32768)));
          }
          return window.btoa(chunks.join(''));
        };

        await Promise.all(items.map(async item => {
          let lastErr = null;
          for (let attempt = 0; attempt < 4; attempt++) {
            try {
              const req = window.shaka.net.NetworkingEngine.makeRequest([item.url], {});
              const res = await net.request(segType, req).promise;
              if (!res || !res.data || res.data.byteLength === 0) {
                throw new Error(`Empty response for ${item.filename}`);
              }
              await window.saveFileChunk(item.filename, toB64(res.data));
              return;
            } catch (err) {
              lastErr = err;
              if (attempt < 3) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
          }
          throw new Error(`Failed segment ${item.idx} (${item.filename}) after 4 attempts: ${lastErr && lastErr.message ? lastErr.message : String(lastErr)}`);
        }));
      }, batch);

      const done = Math.min(i + BATCH_SIZE, totalSegs);
      const pct = Math.round((done / totalSegs) * 100);
      process.stdout.write(`    downloading ${done}/${totalSegs} (${pct}%)\r`);
    }
    const dlSec = ((Date.now() - tDl) / 1000).toFixed(1);
    console.log(`\n[4] downloaded ${totalSegs}/${totalSegs} segments in ${dlSec}s`);
  } finally {
    await browser.close();
  }

  // Strict N/N disk completeness check (0 missing segments tolerated)
  if (streamMeta.hasKey) {
    const keyFile = path.join(WORK, 'enc.key');
    if (!fs.existsSync(keyFile) || fs.statSync(keyFile).size !== 16) {
      console.error('[ERROR] enc.key missing or not 16 bytes');
      process.exit(1);
    }
  }
  const missing = [];
  for (let i = 0; i < totalSegs; i++) {
    const f = path.join(WORK, `seg_${padIdx(i, padWidth)}.ts`);
    if (!fs.existsSync(f) || fs.statSync(f).size === 0) {
      missing.push(i);
    }
  }
  if (missing.length > 0) {
    console.error(`[ERROR] Missing ${missing.length}/${totalSegs} segments on disk: ${missing.slice(0, 20).join(',')}`);
    process.exit(1);
  }

  // 5. Write WORK/local.m3u8 preserving #EXT-X-MEDIA-SEQUENCE, #EXT-X-KEY (+ IV if present), and all seg_<idx>.ts
  const safeVersion = Number.isInteger(Number(streamMeta.version)) && Number(streamMeta.version) > 0 ? Number(streamMeta.version) : 3;
  const safeTargetDur = Number.isInteger(Number(streamMeta.targetDuration)) && Number(streamMeta.targetDuration) > 0 ? Number(streamMeta.targetDuration) : 12;
  const safeMediaSeq = Number.isInteger(Number(streamMeta.mediaSequence)) && Number(streamMeta.mediaSequence) >= 0 ? Number(streamMeta.mediaSequence) : 0;
  const m3u8Lines = [
    '#EXTM3U',
    `#EXT-X-VERSION:${safeVersion}`,
    `#EXT-X-TARGETDURATION:${safeTargetDur}`,
    `#EXT-X-MEDIA-SEQUENCE:${safeMediaSeq}`
  ];
  if (streamMeta.hasKey) {
    const safeKeyMethod = String(streamMeta.keyMethod || 'AES-128').trim().toUpperCase();
    if (safeKeyMethod !== 'AES-128') {
      throw new Error(`Unsupported HLS key method: ${safeKeyMethod}`);
    }
    const rawIv = streamMeta.keyIv ? String(streamMeta.keyIv).trim() : '';
    if (rawIv && !/^0x[0-9a-fA-F]{1,32}$/.test(rawIv)) {
      throw new Error(`Invalid HLS key IV: ${rawIv}`);
    }
    const ivPart = rawIv ? `,IV=${rawIv}` : '';
    m3u8Lines.push(`#EXT-X-KEY:METHOD=${safeKeyMethod},URI="enc.key"${ivPart}`);
  }
  streamMeta.segments.forEach((s, idx) => {
    const durNum = Number(s.duration);
    const safeDur = (Number.isFinite(durNum) && durNum > 0) ? durNum.toFixed(3) : '10.000';
    m3u8Lines.push(`#EXTINF:${safeDur},`);
    m3u8Lines.push(`seg_${padIdx(idx, padWidth)}.ts`);
  });
  m3u8Lines.push('#EXT-X-ENDLIST');
  const localM3u8 = path.join(WORK, 'local.m3u8');
  fs.writeFileSync(localM3u8, m3u8Lines.join('\n') + '\n', 'utf8');

  // 6. Remux via FFmpeg (lossless -c copy first, fallback to -c:v copy -c:a aac -b:a 192k on ADTS error)
  try { if (fs.existsSync(OUT)) fs.unlinkSync(OUT); } catch (_) {}
  console.log(`[5] remuxing local.m3u8 -> ${OUT}`);
  const tMux = Date.now();
  let remuxMode = 'copy';
  const copyArgs = [
    '-hide_banner', '-y', '-threads', '2',
    '-allowed_extensions', 'ts,key',
    '-i', localM3u8,
    '-c', 'copy',
    '-movflags', '+faststart',
    OUT
  ];
  let res = spawnSync(FFMPEG, copyArgs, { encoding: 'utf8', timeout: 3600000, windowsHide: true });
  if (res.status !== 0 || !fs.existsSync(OUT) || fs.statSync(OUT).size === 0) {
    console.warn(`[WARN] ffmpeg -c copy failed (exit=${res.status}); retrying with ADTS audio re-encode fallback:\n${(res.stderr || '').slice(-600)}`);
    try { if (fs.existsSync(OUT)) fs.unlinkSync(OUT); } catch (_) {}
    remuxMode = 'aac_reencode';
    const fallbackArgs = [
      '-hide_banner', '-y', '-threads', '2',
      '-err_detect', 'ignore_err',
      '-allowed_extensions', 'ts,key',
      '-i', localM3u8,
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart',
      OUT
    ];
    res = spawnSync(FFMPEG, fallbackArgs, { encoding: 'utf8', timeout: 3600000, windowsHide: true });
    if (res.status !== 0 || !fs.existsSync(OUT) || fs.statSync(OUT).size === 0) {
      console.error('ffmpeg fallback failed:\n' + (res.stderr || '').slice(-1200));
      process.exit(1);
    }
  }
  const muxSec = ((Date.now() - tMux) / 1000).toFixed(1);

  // 7. Verify output with FFPROBE + audio packet rate + CUDA NVDEC decode probe
  const verify = verifyMediaOutput(OUT);
  console.log(
    `[6] VERIFIED (${remuxMode}, ${muxSec}s): ${verify.size} bytes (${(verify.size / 1048576).toFixed(2)} MB) | ` +
    `${verify.videoCodec} ${verify.width}x${verify.height} + ${verify.audioCodec} ` +
    `(${verify.audioPackets} pkts, ${verify.audioPktRate} pkt/s) | dur=${verify.duration.toFixed(2)}s | decode=${verify.decodeProbe}`
  );

  // 8. Apply to video/<SKU>/<SKU>.mp4 (keeping >=80% shrink guard) & clean WORK
  let finalPath = OUT;
  if (APPLY) {
    const dest = path.join(ROOT, 'video', SKU, `${SKU}.mp4`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const oldSize = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    if (oldSize > 0 && verify.size < oldSize * 0.8) {
      console.error(`[ABORT] file moi (${verify.size}) NHO hon 80% file cu (${oldSize}) -> khong thay.`);
      process.exit(1);
    }
    fs.copyFileSync(OUT, dest);
    finalPath = dest;
    fs.rmSync(WORK, { recursive: true, force: true });
    if (!EXPLICIT_OUT) {
      try { if (fs.existsSync(OUT)) fs.unlinkSync(OUT); } catch (_) {}
    }
    console.log(`[7] APPLIED: ${dest} (${oldSize} -> ${verify.size} bytes) | cleaned WORK`);
  } else {
    console.log(`[7] (dry-run without --apply) temp file: ${OUT}`);
  }

  console.log(JSON.stringify({
    sku: SKU,
    ok: true,
    bytes: verify.size,
    duration: verify.duration.toFixed(2),
    resolution: `${verify.width}x${verify.height}`,
    video_codec: verify.videoCodec,
    audio_codec: verify.audioCodec,
    audio_packets: verify.audioPackets,
    audio_pkt_rate: verify.audioPktRate,
    decode_probe: verify.decodeProbe,
    remux_mode: remuxMode,
    segments: totalSegs,
    total_segments: totalSegs,
    missing: 0,
    out: finalPath
  }));
})().catch(e => {
  console.error(e && e.stack ? e.stack : String(e));
  process.exit(1);
});
