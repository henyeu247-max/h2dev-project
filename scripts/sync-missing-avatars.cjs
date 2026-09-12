/**
 * sync-missing-avatars.cjs
 * Tự động tải avatar thực tế từ YouTube cho các kênh live trong data-tabs/kenh-mau.json.
 * Tuân thủ nghiêm ngặt quy ước đặt tên:
 * - CJK (Hàn/Nhật/Hoa): ch-<10-char-sha256>.jpg (tránh xung đột trùng file phi ASCII)
 * - ASCII: <handle-slug>-<10-char-sha256>.jpg
 * - Fallback: Tạo avatar SVG cục bộ nếu kênh không phản hồi trên YouTube
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CHANNELS_PATH = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const AVATARS_DIR = path.join(ROOT, 'assets', 'avatars');

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

function getSafeFilename(handle, isSvg = false) {
  const h = (handle || '').replace(/^@/, '');
  const hash = crypto.createHash('sha256').update(handle || '').digest('hex').slice(0, 10);
  const isAscii = /^[\x00-\x7F]+$/.test(h);
  const ext = isSvg ? '.svg' : '.jpg';
  if (isAscii) {
    const slug = h.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    return `${slug || 'ch'}-${hash}${ext}`;
  } else {
    return `ch-${hash}${ext}`;
  }
}

function fetchAvatarUrl(handle) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/${encodeURIComponent(handle)}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        const m = /https:\/\/yt3\.googleusercontent\.com\/[a-zA-Z0-9_\-]+/i.exec(data);
        if (m) {
          req.destroy();
          resolve(m[0]);
        }
      });
      res.on('end', () => {
        const m = /https:\/\/yt3\.googleusercontent\.com\/[a-zA-Z0-9_\-]+/i.exec(data);
        resolve(m ? m[0] : null);
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    // Append standard YouTube avatar size parameter if not present
    const imgUrl = url.includes('=s') ? url : `${url}=s176-c-k-c0x00ffffff-no-rj`;
    const req = https.get(imgUrl, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
      file.on('error', () => {
        fs.unlink(destPath, () => {});
        resolve(false);
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function generateSvgAvatar(handle) {
  const initial = (handle.replace(/^@/, '')[0] || '?').toUpperCase();
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

async function main() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ AVATAR KÊNH MẪU ===');
  const channels = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf8'));

  let downloadedCount = 0;
  let generatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < channels.length; i += 1) {
    const c = channels[i];

    // Nếu là kênh dead, giữ avatar là null để UI hiển thị trạng thái dead đúng chuẩn
    if (c.dead === true) {
      if (c.avatar) {
        c.avatar = null;
      }
      skippedCount += 1;
      continue;
    }

    // Kiểm tra xem kênh đã có avatar hợp lệ trên đĩa chưa
    if (c.avatar) {
      const fullPath = path.join(ROOT, c.avatar);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
        skippedCount += 1;
        continue;
      }
    }

    console.log(`[${i + 1}/${channels.length}] Đang xử lý: ${c.handle}...`);

    let avatarUrl = await fetchAvatarUrl(c.handle);
    let filename;
    let saved = false;

    if (avatarUrl) {
      filename = getSafeFilename(c.handle, false);
      const destPath = path.join(AVATARS_DIR, filename);
      saved = await downloadImage(avatarUrl, destPath);
      if (saved) {
        console.log(`  ✓ Đã tải thành công từ YouTube: ${filename}`);
        downloadedCount += 1;
      }
    }

    if (!saved) {
      // Fallback: sinh avatar vector SVG chất lượng cao
      filename = getSafeFilename(c.handle, true);
      const destPath = path.join(AVATARS_DIR, filename);
      const svgContent = generateSvgAvatar(c.handle);
      fs.writeFileSync(destPath, svgContent, 'utf8');
      console.log(`  ✓ Đã tạo avatar vector SVG: ${filename}`);
      generatedCount += 1;
    }

    c.avatar = `assets/avatars/${filename}`;
  }

  // Ghi lại data-tabs/kenh-mau.json
  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2), 'utf8');

  console.log('\n=== KẾT QUẢ ĐỒNG BỘ ===');
  console.log(`- Tải từ YouTube: ${downloadedCount}`);
  console.log(`- Tạo vector SVG: ${generatedCount}`);
  console.log(`- Đã có sẵn / Bỏ qua (Dead): ${skippedCount}`);
  console.log(`- Tổng cộng: ${channels.length} kênh.`);
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
