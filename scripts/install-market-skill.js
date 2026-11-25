const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SLUG_RE = /^[a-z0-9][a-z0-9-_]*$/i;
const ALLOWED_HOSTS = new Set(['lightmake.site', 'github.com', 'objects.githubusercontent.com']);
const MAX_REDIRECTS = 3;

function assertValidSlug(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    console.error(`[ERROR] Slug không hợp lệ (chỉ chấp nhận /^[a-z0-9][a-z0-9-_]*$/i): ${String(slug || '')}`);
    process.exit(1);
  }
  return slug;
}

function assertAllowedDownloadUrl(rawUrl) {
  const u = new URL(String(rawUrl || ''));
  if (u.protocol !== 'https:') {
    throw new Error(`Disallowed protocol (must be https:): ${u.protocol}`);
  }
  const host = u.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host) && !host.endsWith('.lightmake.site')) {
    throw new Error(`Disallowed download host: ${host}`);
  }
  return u.toString();
}

function downloadHttpsAllowlisted(startUrl, destPath, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let validUrl;
    try {
      validUrl = assertAllowedDownloadUrl(startUrl);
    } catch (err) {
      return reject(err);
    }

    https.get(validUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (redirectsLeft <= 0) {
          return reject(new Error(`Too many redirects (max ${MAX_REDIRECTS})`));
        }
        let nextUrl;
        try {
          nextUrl = new URL(res.headers.location, validUrl).toString();
        } catch (err) {
          return reject(new Error(`Invalid redirect URL: ${res.headers.location}`));
        }
        return downloadHttpsAllowlisted(nextUrl, destPath, redirectsLeft - 1).then(resolve, reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Unexpected HTTP status ${res.statusCode} from ${validUrl}`));
      }

      const file = fs.createWriteStream(destPath);
      res.on('error', (err) => {
        file.destroy();
        reject(err);
      });
      file.on('error', reject);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function validateArchiveSafe(zipPath) {
  const listOut = execFileSync('tar', ['-tf', zipPath], { encoding: 'utf8', shell: false, windowsHide: true });
  const entries = listOut.split(/\r?\n/).filter(Boolean);
  if (entries.length === 0) {
    throw new Error('Archive is empty');
  }
  for (const rawEntry of entries) {
    const entry = rawEntry.replace(/\r$/, '');
    if (
      entry.startsWith('/') ||
      entry.startsWith('\\') ||
      /^[A-Za-z]:/.test(entry) ||
      /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(entry)
    ) {
      throw new Error(`Unsafe archive entry rejected (path traversal): ${entry}`);
    }
  }
  const verboseOut = execFileSync('tar', ['-tvf', zipPath], { encoding: 'utf8', shell: false, windowsHide: true });
  for (const rawLine of verboseOut.split(/\r?\n/).filter(Boolean)) {
    const line = rawLine.trimStart();
    if (/^[lh]/.test(line) || line.includes(' -> ') || line.includes(' link to ')) {
      throw new Error(`Unsafe archive entry rejected (symlink/hardlink): ${rawLine}`);
    }
  }
}

async function downloadAndInstall(slug) {
  assertValidSlug(slug);
  console.log(`=== ĐANG CÀI ĐẶT SKILL: ${slug} ===`);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-skill-'));
  const tmpZip = path.join(tmpDir, `${slug}.zip`);
  const targetDir = path.join(process.env.USERPROFILE || os.homedir(), '.workbuddy', 'skills', slug);
  const projectSkillDir = path.resolve(__dirname, '..', '..', '.workbuddy', 'skills', slug);

  // Tạo thư mục đích
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(projectSkillDir)) fs.mkdirSync(projectSkillDir, { recursive: true });

  const url = `https://lightmake.site/api/v1/download?slug=${encodeURIComponent(slug)}`;
  console.log(`Đang tải từ: ${url}`);

  try {
    await downloadHttpsAllowlisted(url, tmpZip, MAX_REDIRECTS);

    const stats = fs.statSync(tmpZip);
    console.log(`Đã tải xong ${stats.size} bytes vào ${tmpZip}`);

    // Pre-scan archive entries before extraction (reject traversal / drive letters / symlinks)
    validateArchiveSafe(tmpZip);

    // Giải nén dùng tar (không qua shell)
    try {
      execFileSync('tar', ['-xf', tmpZip, '-C', targetDir], { stdio: 'inherit', shell: false, windowsHide: true });
      console.log(`[PASS] Đã giải nén vào User Skills: ${targetDir}`);
    } catch (e) {
      // Fallback PowerShell Expand-Archive dùng env var (không nội suy chuỗi lệnh)
      execFileSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:H2DEV_ZIP_SRC -DestinationPath $env:H2DEV_ZIP_DST -Force'],
        {
          stdio: 'inherit',
          shell: false,
          windowsHide: true,
          env: Object.assign({}, process.env, { H2DEV_ZIP_SRC: tmpZip, H2DEV_ZIP_DST: targetDir })
        }
      );
      console.log(`[PASS] Đã giải nén bằng PowerShell vào: ${targetDir}`);
    }

    // Copy sang project skill dir bằng Node fs.cpSync
    try {
      fs.cpSync(targetDir, projectSkillDir, { recursive: true, force: true });
      console.log(`[PASS] Đã đồng bộ sang Project Skills: ${projectSkillDir}`);
    } catch (e) {
      console.log(`Lỗi đồng bộ sang project skills:`, e.message);
    }
  } finally {
    // Dọn dẹp thư mục staging tạm
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  // Kiểm tra file SKILL.md
  const skillFile = path.join(targetDir, 'SKILL.md');
  if (fs.existsSync(skillFile)) {
    console.log(`✓ XÁC NHẬN THÀNH CÔNG: Đã có ${skillFile}`);
    return true;
  } else {
    console.log(`⚠️ Chưa thấy file SKILL.md trực tiếp trong ${targetDir}`);
    return false;
  }
}

const slug = process.argv[2];
if (!slug) {
  console.error('Cách dùng: node install-market-skill.js <slug>');
  process.exit(1);
}
assertValidSlug(slug);
downloadAndInstall(slug).catch((err) => {
  console.error('[ERROR]', err && err.message ? err.message : err);
  process.exit(1);
});
