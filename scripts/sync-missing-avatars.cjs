/**
 * sync-missing-avatars.cjs
 * Tự động tải avatar thực tế từ YouTube cho toàn bộ kênh trong data-tabs/kenh-mau.json
 * và đồng bộ sang data-tabs/raw-kenh-mau.json.
 * Tuân thủ nghiêm ngặt quy ước đặt tên:
 * - CJK / non-ASCII (Hàn/Nhật/Hoa...): ch-<10-char-sha256>.jpg (tránh xung đột trùng file phi ASCII)
 * - ASCII: <handle-slug>-<10-char-sha256>.jpg
 * - Fallback: Tạo avatar SVG cục bộ nếu kênh không phản hồi trên YouTube
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CHANNELS_PATH = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const RAW_CHANNELS_PATH = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const NGACH_XANH_PATH = path.join(ROOT, 'data-tabs', 'ngach-xanh.json');
const AVATARS_DIR = path.join(ROOT, 'assets', 'avatars');

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

function getSafeFilename(handle, isSvg = false) {
  const norm = String(handle || '').trim();
  const h = norm.replace(/^@/, '');
  const hash = crypto.createHash('sha256').update(norm).digest('hex').slice(0, 10);
  const isAscii = /^[\x00-\x7F]+$/.test(h);
  const ext = isSvg ? '.svg' : '.jpg';
  if (isAscii) {
    const slug = h.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    return `${slug || 'ch'}-${hash}${ext}`;
  }
  return `ch-${hash}${ext}`;
}

function normalizeAvatarSizeUrl(rawUrl) {
  if (!rawUrl) return null;
  const clean = rawUrl.replace(/=s\d+[^"'\s]*/i, '');
  return `${clean}=s176-c-k-c0x00ffffff-no-rj`;
}

function extractAvatarFromHtml(html, isEnd = false) {
  if (!html) return null;
  const ogMatch = /<meta\s+property=["']og:image["']\s+content=["'](https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[^"']+)["']/i.exec(html);
  if (ogMatch && ogMatch[1] && !ogMatch[1].includes('AIdro_k2LdY')) {
    return ogMatch[1];
  }
  const avatarFieldMatch = /"avatar":\{"thumbnails":\[\{"url":"(https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[^"]+)"/i.exec(html);
  if (avatarFieldMatch && avatarFieldMatch[1] && !avatarFieldMatch[1].includes('AIdro_k2LdY')) {
    return avatarFieldMatch[1];
  }
  if (isEnd) {
    const fallbackMatch = /https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/(?:ytc\/)?[a-zA-Z0-9_\-]{16,}/i.exec(html);
    if (fallbackMatch && fallbackMatch[0] && !fallbackMatch[0].includes('AIdro_k2LdY')) {
      return fallbackMatch[0];
    }
  }
  return null;
}

function fetchAvatarUrlByUrl(targetUrl, redirectDepth = 0) {
  return new Promise((resolve) => {
    if (redirectDepth > 4) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (val) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };

    const req = https.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://www.youtube.com${res.headers.location}`;
        fetchAvatarUrlByUrl(nextUrl, redirectDepth + 1).then(done);
        return;
      }
      if (res.statusCode !== 200) {
        req.destroy();
        done(null);
        return;
      }
      const stream = res.headers['content-encoding'] === 'gzip'
        ? res.pipe(zlib.createGunzip())
        : res;

      let data = '';
      stream.on('data', (chunk) => {
        data += chunk.toString('utf8');
        if (data.length > 600000) {
          const found = extractAvatarFromHtml(data, false);
          if (found) {
            req.destroy();
            done(found);
          }
        }
      });
      stream.on('end', () => {
        done(extractAvatarFromHtml(data, true));
      });
      stream.on('error', () => {
        done(extractAvatarFromHtml(data, true));
      });
    });

    req.on('error', () => done(null));
    req.setTimeout(15000, () => {
      req.destroy();
      done(null);
    });
  });
}

async function fetchAvatarUrl(handle, channelId) {
  const cleanH = String(handle || '').trim();
  if (cleanH) {
    const withAt = cleanH.startsWith('@') ? cleanH : `@${cleanH}`;
    const url = `https://www.youtube.com/${encodeURI(withAt)}`;
    const res = await fetchAvatarUrlByUrl(url);
    if (res) return res;
  }
  if (channelId && /^UC[\w-]{20,}$/.test(channelId)) {
    const url = `https://www.youtube.com/channel/${channelId}`;
    const res = await fetchAvatarUrlByUrl(url);
    if (res) return res;
  }
  return null;
}

function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    const imgUrl = normalizeAvatarSizeUrl(url);
    if (!imgUrl) {
      resolve(false);
      return;
    }
    const req = https.get(imgUrl, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 200) {
          resolve(false);
          return;
        }
        try {
          fs.writeFileSync(destPath, buf);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function generateSvgAvatar(handle) {
  const clean = String(handle || '').replace(/^@/, '').trim();
  const initial = (clean[0] || '?').toUpperCase();
  const palette = [
    ['#1e293b', '#38bdf8'],
    ['#18181b', '#34d399'],
    ['#1e1b4b', '#a78bfa'],
    ['#31102b', '#f472b6'],
    ['#292524', '#fbbf24'],
    ['#0f172a', '#60a5fa'],
  ];
  const charCodeSum = (handle || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const color = palette[Math.abs(charCodeSum) % palette.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="176" viewBox="0 0 176 176">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color[0]}"/>
      <stop offset="100%" stop-color="${color[1]}"/>
    </linearGradient>
  </defs>
  <rect width="176" height="176" rx="40" fill="url(#bg)"/>
  <text x="88" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="72" font-weight="700" fill="#ffffff" text-anchor="middle">${initial}</text>
</svg>`;
}

function normalizeHandleInNgachXanh() {
  if (!fs.existsSync(NGACH_XANH_PATH)) return;
  const raw = fs.readFileSync(NGACH_XANH_PATH, 'utf8');
  if (raw.includes('"@Tiny Empires"')) {
    const fixed = raw.replace(/"@Tiny Empires"/g, '"@TinyEmpires"');
    fs.writeFileSync(NGACH_XANH_PATH, fixed, 'utf8');
    console.log('[Normalize] Đã chuẩn hoá "@Tiny Empires" -> "@TinyEmpires" trong data-tabs/ngach-xanh.json');
  }
}

async function main() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ AVATAR KÊNH MẪU TOÀN HỆ THỐNG ===');
  normalizeHandleInNgachXanh();

  const channels = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf8'));
  const rawJson = JSON.parse(fs.readFileSync(RAW_CHANNELS_PATH, 'utf8'));
  const rawRecords = rawJson.records || [];

  const rawRemoteByHandle = new Map();
  const rawChannelIdByHandle = new Map();
  for (const r of rawRecords) {
    const ch = r.channel || {};
    const pData = (r.youtubeApiVerification && r.youtubeApiVerification.data) || {};
    const h = String(pData.handle || ch.handle || r.handle || '').replace(/^@/, '').trim().toLowerCase();
    const cid = pData.channelId || ch.channelId || '';
    const av = pData.remoteAvatar || ch.remoteAvatar || pData.avatar || ch.avatar || r.avatar || '';
    if (h) {
      if (cid) rawChannelIdByHandle.set(h, cid);
      if (av && av.startsWith('http') && !av.includes('AIdro_k2LdY')) {
        rawRemoteByHandle.set(h, av);
      }
    }
  }

  let downloadedCount = 0;
  let reusedDiskCount = 0;
  let generatedCount = 0;
  let skippedDeadCount = 0;

  for (const c of channels) {
    if (c.handle === '@Tiny Empires') {
      c.handle = '@TinyEmpires';
      c.url = 'https://www.youtube.com/@TinyEmpires';
    }
  }

  const CONCURRENCY = 20;
  let cursor = 0;

  async function worker() {
    while (cursor < channels.length) {
      const idx = cursor++;
      const c = channels[idx];
      const cleanKey = String(c.handle || '').replace(/^@/, '').trim().toLowerCase();

      if (c.dead === true) {
        if (c.avatar) c.avatar = null;
        skippedDeadCount += 1;
        continue;
      }

      const expectedJpg = getSafeFilename(c.handle, false);
      const expectedJpgPath = path.join(AVATARS_DIR, expectedJpg);
      if (fs.existsSync(expectedJpgPath) && fs.statSync(expectedJpgPath).size > 200) {
        c.avatar = `assets/avatars/${expectedJpg}`;
        reusedDiskCount += 1;
        continue;
      }

      if (c.avatar && c.avatar.endsWith('.jpg')) {
        const fullPath = path.join(ROOT, c.avatar);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 200) {
          reusedDiskCount += 1;
          continue;
        }
      }

      const cid = c.channelId || rawChannelIdByHandle.get(cleanKey) || '';
      let avatarUrl = await fetchAvatarUrl(c.handle, cid);
      if (!avatarUrl && rawRemoteByHandle.has(cleanKey)) {
        avatarUrl = rawRemoteByHandle.get(cleanKey);
      }

      let saved = false;
      if (avatarUrl) {
        saved = await downloadImage(avatarUrl, expectedJpgPath);
        if (saved) {
          c.avatar = `assets/avatars/${expectedJpg}`;
          downloadedCount += 1;
          const oldSvgPath = path.join(AVATARS_DIR, getSafeFilename(c.handle, true));
          if (fs.existsSync(oldSvgPath)) {
            try { fs.unlinkSync(oldSvgPath); } catch (e) {}
          }
        }
      }

      if (!saved) {
        const svgFilename = getSafeFilename(c.handle, true);
        const svgPath = path.join(AVATARS_DIR, svgFilename);
        if (!fs.existsSync(svgPath) || fs.statSync(svgPath).size === 0) {
          fs.writeFileSync(svgPath, generateSvgAvatar(c.handle), 'utf8');
        }
        c.avatar = `assets/avatars/${svgFilename}`;
        generatedCount += 1;
      }

      if ((idx + 1) % 50 === 0 || idx === channels.length - 1) {
        console.log(`[Progress] ${idx + 1}/${channels.length} (JPG mới: ${downloadedCount}, JPG sẵn: ${reusedDiskCount}, SVG fallback: ${generatedCount}, Dead: ${skippedDeadCount})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2) + '\n', 'utf8');

  const avatarByHandle = new Map();
  for (const c of channels) {
    if (c.handle && c.avatar) {
      avatarByHandle.set(String(c.handle).replace(/^@/, '').trim().toLowerCase(), c.avatar);
    }
  }

  let rawUpdated = 0;
  for (const r of rawRecords) {
    const ch = r.channel || {};
    const pData = (r.youtubeApiVerification && r.youtubeApiVerification.data) || null;
    const h = pData?.handle || ch.handle || r.handle || '';
    const cleanH = String(h).replace(/^@/, '').trim().toLowerCase();
    let localAv = avatarByHandle.get(cleanH) || null;

    if (!localAv && h) {
      const expectedJpg = getSafeFilename(h, false);
      const expectedJpgPath = path.join(AVATARS_DIR, expectedJpg);
      if (fs.existsSync(expectedJpgPath) && fs.statSync(expectedJpgPath).size > 200) {
        localAv = `assets/avatars/${expectedJpg}`;
      } else {
        const cid = pData?.channelId || ch.channelId || '';
        const fetchedUrl = await fetchAvatarUrl(h, cid);
        if (fetchedUrl && await downloadImage(fetchedUrl, expectedJpgPath)) {
          localAv = `assets/avatars/${expectedJpg}`;
          downloadedCount += 1;
          const oldSvgPath = path.join(AVATARS_DIR, getSafeFilename(h, true));
          if (fs.existsSync(oldSvgPath)) {
            try { fs.unlinkSync(oldSvgPath); } catch (e) {}
          }
        } else {
          const svgFilename = getSafeFilename(h, true);
          const svgPath = path.join(AVATARS_DIR, svgFilename);
          if (!fs.existsSync(svgPath)) {
            fs.writeFileSync(svgPath, generateSvgAvatar(h), 'utf8');
          }
          localAv = `assets/avatars/${svgFilename}`;
        }
      }
    }

    if (localAv) {
      r.avatar = localAv;
      if (r.channel) {
        if (!r.channel.remoteAvatar && r.channel.avatar && r.channel.avatar.startsWith('http') && !r.channel.avatar.includes('AIdro_k2LdY')) {
          r.channel.remoteAvatar = r.channel.avatar;
        }
        r.channel.avatar = localAv;
      }
      if (pData) {
        if (!pData.remoteAvatar && pData.avatar && pData.avatar.startsWith('http') && !pData.avatar.includes('AIdro_k2LdY')) {
          pData.remoteAvatar = pData.avatar;
        }
        pData.avatar = localAv;
      }
      rawUpdated += 1;
    }
  }

  fs.writeFileSync(RAW_CHANNELS_PATH, JSON.stringify(rawJson, null, 2) + '\n', 'utf8');

  console.log('\n=== KẾT QUẢ ĐỒNG BỘ AVATAR ===');
  console.log(`- Tải mới .jpg từ YouTube: ${downloadedCount}`);
  console.log(`- Tái sử dụng .jpg có sẵn: ${reusedDiskCount}`);
  console.log(`- Tạo vector SVG fallback: ${generatedCount}`);
  console.log(`- Bỏ qua (Kênh Dead):      ${skippedDeadCount}`);
  console.log(`- Đồng bộ raw-kenh-mau:    ${rawUpdated}/${rawRecords.length} hồ sơ`);
  console.log(`- Tổng cộng kenh-mau.json: ${channels.length} kênh.`);
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
