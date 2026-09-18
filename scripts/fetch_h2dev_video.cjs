const { chromium } = require('playwright');
const fs = require('fs');
const { spawnSync } = require('child_process');

/*
  fetch_h2dev_video.cjs — TAI VIDEO H2DEV KHONG CAN DANG NHAP (flow public chuan).

  QUY TRINH (da kiem chung thuc te 18/09/2026, tai thanh cong VIDEO-61ad94: 76/76
  segment, 105.7 MB, h264+aac 1280x720, 630.05s):

    1. Mo https://h2dev.vn/learn -> lay cookie public `__vdk` / `__vui`
    2. GraphQL `saas-api.mona.academy/graphql` resolver `getCourseNoCategory(sku)`
       -> player link MOI (co token). KHONG can dang nhap.
    3. Mo player -> BAY response khi player dang phat:
         - chunk playlist .m3u8 (token con song)
         - tung segment .ts  (DA MA HOA AES-128)
         - hls.key (16 bytes)
    4. Giai ma AES-128-CBC tung segment (IV = sequence number) bang openssl.
    5. Ghep + remux MP4 bang ffmpeg local.
    6. ffprobe kiem tra; CHI thay file dich khi dat chuan.

  BAI HOC QUAN TRONG (da thu va that bai -> dung cach nay):
    - KHONG de ffmpeg tu goi CDN: ffmpeg thieu cookie/header -> HTTP 403.
    - KHONG tai lai playlist bang request context: `wmsAuthSign` gan THOI DIEM PHAT,
      request lai se 403. PHAI bay response ngay luc player dang phat.
    - Segment la TS DA MA HOA (byte dau != 0x47) -> bat buoc giai ma AES-128 truoc.

  GIOI HAN: video `protected=True` (DRM Widevine/PlayReady) KHONG tai duoc bang flow nay.

  Dung: node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx [--quality 1080p] [--out path] [--apply]
        (khong --apply = chi tai vao thu muc tam, khong thay file dich trong repo)
*/
const SKU = process.argv[2];
if (!SKU || !/^VIDEO-[A-Za-z0-9]+$/.test(SKU)) {
  console.error('Usage: node scripts/fetch_h2dev_video.cjs VIDEO-xxxxxx [--quality 720p] [--out path] [--apply]');
  process.exit(2);
}
const gArg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const APPLY = process.argv.includes('--apply');
const QUALITY = gArg('--quality', '1080p');
const ROOT = require('path').resolve(__dirname, '..');
const OUT = gArg('--out', (process.env.TEMP || '/tmp') + '/' + SKU + '_download.mp4');
const WORK = (process.env.TEMP || '/tmp') + '/h2dev_dl_' + SKU;
const FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFPROBE = 'D:/Linly-Dubbing/bin/ffprobe.exe';
const OPENSSL = 'openssl';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36';
const CONC = 6;
const TS_SYNC = 0x47;

function decryptAll(keyPath, segFiles) {
  const key = fs.readFileSync(keyPath);
  const decDir = WORK + '/dec';
  fs.rmSync(decDir, { recursive: true, force: true });
  fs.mkdirSync(decDir, { recursive: true });
  const out = [];
  segFiles.forEach((src, i) => {
    const dst = decDir + '/' + require('path').basename(src);
    const iv = Buffer.alloc(16);
    iv.writeUInt32BE(i >>> 0, 12);          // IV = sequence number (big-endian)
    const r = spawnSync(OPENSSL, ['enc', '-d', '-aes-128-cbc', '-K', key.toString('hex'),
      '-iv', iv.toString('hex'), '-in', src, '-out', dst], { encoding: 'utf8' });
    if (r.status !== 0) return;
    const buf = fs.readFileSync(dst);
    if (buf.length && buf[0] === TS_SYNC) out.push(dst);
  });
  return out;
}

(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await browser.newContext({ userAgent: UA, extraHTTPHeaders: { Referer: 'https://h2dev.vn/' } });

  // 1+2 player link
  const boot = await ctx.newPage();
  await boot.goto('https://h2dev.vn/learn', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const cm = Object.fromEntries((await ctx.cookies('https://h2dev.vn')).map(c => [c.name, c.value]));
  const gq = 'query($sku:String!){getCourseNoCategory(sku:$sku){__typename ... on ProductInterface {sku time video_link}}}';
  const api = await ctx.request.post('https://saas-api.mona.academy/graphql', {
    headers: { 'content-type': 'application/json', 'verify-site': cm.__vdk, 'x-saas-user-id': cm.__vui, origin: 'https://h2dev.vn', referer: 'https://h2dev.vn/learn' },
    data: { query: gq, variables: { sku: SKU } },
  });
  const meta = ((await api.json()) || {}).data?.getCourseNoCategory || {};
  const playerUrl = meta.video_link || '';
  const prot = (playerUrl.match(/protected=(True|False)/) || [])[1];
  console.log('[1] sku=' + SKU + ' | time=' + meta.time + ' | protected=' + prot);
  if (!playerUrl) { console.error('KHONG co player link'); await browser.close(); process.exit(1); }
  if (prot === 'True') {
    console.error('[!] protected=True -> DRM Widevine/PlayReady. Flow HLS KHONG tai duoc.');
    await browser.close(); process.exit(3);
  }
  await boot.close();

  const page = await ctx.newPage();
  const saved = new Map();
  let keyPath = null, playlistTotal = 0, listResolve;
  const listReady = new Promise(r => { listResolve = r; });

  page.on('response', async resp => {
    const u = resp.url();
    try {
      if (/hls\.key/.test(u)) {
        const b = await resp.body();
        if (b.length === 16) { keyPath = WORK + '/hls.key'; fs.writeFileSync(keyPath, b); }
        return;
      }
      const m = u.match(/-n_(\d+)_\d+_\d+\.ts/);
      if (m && /__mp4__/.test(u)) {
        const idx = parseInt(m[1], 10);
        if (saved.has(idx)) return;
        const b = await resp.body();
        if (b && b.length) { const p = WORK + '/seg_' + String(idx).padStart(5, '0') + '.ts'; fs.writeFileSync(p, b); saved.set(idx, p); }
        return;
      }
      if (/_chunk\.m3u8/.test(u) && u.indexOf('__mp4__' + QUALITY) >= 0) {
        const txt = await resp.text();
        const n = txt.split('\n').filter(l => { l = l.trim(); return l && !l.startsWith('#'); }).length;
        if (n > playlistTotal) { playlistTotal = n; listResolve(n); }
      }
    } catch (e) { /* body het hieu luc */ }
  });

  await page.goto(playerUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  console.log('[2] phat + seek de bay segment...');
  const duration = meta.time ? parseFloat(meta.time) : null;
  await page.evaluate(() => { const v = document.querySelector('video'); if (v) { v.muted = true; const p = v.play(); if (p) p.catch(() => {}); } });
  await Promise.race([listReady, new Promise(r => setTimeout(r, 60000))]);
  console.log('[3] playlist: ' + playlistTotal + ' segment');
  const total = playlistTotal || 0;
  const steps = total ? Math.min(48, total) : 24;
  for (let i = 0; i < steps; i++) {
    const t = duration ? (duration * i / steps) : (i * 30);
    await page.evaluate((tt) => { const v = document.querySelector('video'); if (v) { v.muted = true; v.currentTime = tt; const p = v.play(); if (p) p.catch(() => {}); } }, t);
    await page.waitForTimeout(2500);
    if (i % 6 === 0) process.stdout.write('    luu ' + saved.size + (total ? '/' + total : '') + '\r');
  }
  await page.waitForTimeout(8000);
  console.log('\n[4] da luu: ' + saved.size + (total ? '/' + total : '') + ' segment | key=' + (keyPath ? 'CO' : 'KHONG'));
  await browser.close();

  if (!saved.size) { console.error('KHONG luu duoc segment nao'); process.exit(1); }
  if (!keyPath) { console.error('KHONG co hls.key -> khong giai ma duoc'); process.exit(1); }
  const segFiles = [...saved.keys()].sort((a, b) => a - b).map(k => saved.get(k));
  const missing = total ? Array.from({ length: total }, (_, i) => i).filter(i => !saved.has(i)) : [];

  // 4 giai ma AES-128
  const dec = decryptAll(keyPath, segFiles);
  console.log('[5] giai ma AES-128: ' + dec.length + '/' + segFiles.length + ' segment TS sach');
  if (!dec.length) { console.error('giai ma that bai toan bo'); process.exit(1); }

  // 5 ghep + remux
  const lf = WORK + '/concat_dec.txt';
  fs.writeFileSync(lf, dec.map(p => "file '" + p.replace(/\\/g, '/') + "'").join('\n'), 'utf8');
  const args = ['-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', lf, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', OUT];
  console.log('[6] ghep + remux -> ' + OUT);
  const t0 = Date.now();
  const res = spawnSync(FFMPEG, args, { encoding: 'utf8', timeout: 3600000 });
  if (res.status !== 0) { console.error('ffmpeg loi:\n' + (res.stderr || '').slice(-1200)); process.exit(1); }

  // 6 kiem tra
  const pr = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration,size', '-show_entries', 'stream=codec_name,width,height', '-of', 'default=nw=1', OUT], { encoding: 'utf8' });
  const size = fs.statSync(OUT).size;
  const dur = (pr.stdout.match(/duration=([\d.]+)/) || [])[1];
  console.log('[7] FILE: ' + size + ' bytes (' + (size / 1048576).toFixed(1) + ' MB) | ' + Math.round((Date.now() - t0) / 1000) + 's');
  console.log(pr.stdout);
  if (missing.length) console.log('[!] thieu ' + missing.length + ' segment: ' + missing.slice(0, 12).join(','));

  // 7 tuy chon thay file dich
  if (APPLY) {
    const dest = ROOT + '/video/' + SKU + '/' + SKU + '.mp4';
    fs.mkdirSync(require('path').dirname(dest), { recursive: true });
    const oldSize = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    if (oldSize > 0 && size < oldSize * 0.8) {
      console.error('[ABORT] file moi (' + size + ') NHO hon 80% file cu (' + oldSize + ') -> khong thay.');
    } else {
      fs.copyFileSync(OUT, dest);
      console.log('[8] DA THAY: ' + dest + ' (' + oldSize + ' -> ' + size + ' bytes)');
      console.log('    -> chay tiep: node scripts/sync-h2dev-record.cjs ' + SKU);
      console.log('    -> roi boc phu de: py scripts/transcribe_sku.py ' + SKU);
    }
  } else {
    console.log('[8] (chua --apply) file tam: ' + OUT);
  }
  console.log(JSON.stringify({ sku: SKU, ok: true, bytes: size, duration: dur, segments: dec.length, total_segments: total, missing: missing.length, out: OUT }));
})().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
