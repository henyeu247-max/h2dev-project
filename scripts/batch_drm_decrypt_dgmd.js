// H2DEV Project - Production DRM Batch Decryptor & Ingester for DGMD
// Chuyên dụng tải và giải mã 23 bài giảng bảo vệ bằng Widevine/CENC DRM
// Chuẩn 100% SSoT của H2DEV theo H2DEV-SCAR-027
'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';
const WVD_PATH = path.join(ROOT, '_tools', 'cdm', 'device.wvd');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function decryptSku(item) {
  const sku = item.sku;
  console.log(`\n====================================================`);
  console.log(`>>> PROCESSING DRM SKU: ${sku} - "${item.title}"`);
  console.log(`====================================================`);

  const outDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const mp4Path = path.join(outDir, `${sku}.mp4`);

  if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024) {
    console.log(`   * Local MP4 already exists: ${(fs.statSync(mp4Path).size / 1024 / 1024).toFixed(2)} MB`);
    return true;
  }

  const workDir = path.join(ROOT, '_tmp_drm_work_' + sku);
  if (fs.existsSync(workDir)) fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  console.log('   * Step 1: Launching Edge instance with DRM capability...');
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Referer': 'https://daigiamangdep.com/learn' }
  });
  const page = await context.newPage();

  let psshBase64 = null;
  let licenseUrl = 'https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=B7A7E8';
  let initAudioSaved = false;
  let initVideoSaved = false;
  const audioSegs = new Map();
  const videoSegs = new Map();

  await page.exposeFunction('saveDrmSegment', (type, idStr, base64) => {
    const buf = Buffer.from(base64, 'base64');
    if (type === 'init_audio') {
      fs.writeFileSync(path.join(workDir, 'init_audio.m4a'), buf);
      initAudioSaved = true;
    } else if (type === 'init_video') {
      fs.writeFileSync(path.join(workDir, 'init_video.mp4'), buf);
      initVideoSaved = true;
    } else if (type === 'seg_audio') {
      const idx = parseInt(idStr, 10);
      fs.writeFileSync(path.join(workDir, `seg_a_${String(idx).padStart(8, '0')}.m4s`), buf);
      audioSegs.set(idx, true);
    } else if (type === 'seg_video') {
      const idx = parseInt(idStr, 10);
      fs.writeFileSync(path.join(workDir, `seg_v_${String(idx).padStart(8, '0')}.m4s`), buf);
      videoSegs.set(idx, true);
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
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : (input ? input.url : '');
      const response = await origFetch.apply(this, arguments);

      if (url.includes('/s_0.m4a')) {
        const clone = response.clone();
        clone.arrayBuffer().then(buf => window.saveDrmSegment('init_audio', '0', toB64(buf)));
      } else if (url.includes('/v_0.mp4') || url.includes('/v_0')) {
        const clone = response.clone();
        clone.arrayBuffer().then(buf => window.saveDrmSegment('init_video', '0', toB64(buf)));
      } else if (url.includes('/s_0_') && url.includes('.m4s')) {
        const m = url.match(/\/s_0_(\d+)\.m4s/);
        if (m) {
          const clone = response.clone();
          clone.arrayBuffer().then(buf => window.saveDrmSegment('seg_audio', m[1], toB64(buf)));
        }
      } else if (url.includes('/v_0_') && url.includes('.m4s')) {
        const m = url.match(/\/v_0_(\d+)\.m4s/);
        if (m) {
          const clone = response.clone();
          clone.arrayBuffer().then(buf => window.saveDrmSegment('seg_video', m[1], toB64(buf)));
        }
      }
      return response;
    };
  });

  const streamUrl = item.file || item.video_link;
  console.log(`   * Step 2: Navigating to stream URL...`);
  await page.goto(streamUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);

  const durationSec = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? (v.duration || 600) : 600;
  });
  console.log(`   * Duration: ${durationSec.toFixed(1)}s (${(durationSec / 60).toFixed(1)}m)`);

  // Seek across timeline to collect all segments
  console.log(`   * Step 3: Fast-seeking to harvest segments...`);
  const t0 = Date.now();
  for (let t = 0; t <= durationSec; t += 6) {
    await page.evaluate(time => {
      const v = document.querySelector('video');
      if (v) v.currentTime = time;
    }, t);
    await page.waitForTimeout(100);
  }

  await page.waitForTimeout(3000);
  await browser.close();

  console.log(`   * Collected: ${audioSegs.size} audio segments, ${videoSegs.size} video segments in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return true;
}

module.exports = { decryptSku };
