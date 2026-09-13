const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function downloadAndInstall(slug) {
  console.log(`=== ĐANG CÀI ĐẶT SKILL: ${slug} ===`);
  const tmpZip = path.join(__dirname, `tmp_${slug}.zip`);
  const targetDir = path.join(process.env.USERPROFILE || 'C:\\Users\\SaxukeB', '.workbuddy', 'skills', slug);
  const projectSkillDir = path.join('D:\\YTB\\.workbuddy\\skills', slug);

  // Tạo thư mục đích
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(projectSkillDir)) fs.mkdirSync(projectSkillDir, { recursive: true });

  const url = `https://lightmake.site/api/v1/download?slug=${encodeURIComponent(slug)}`;
  console.log(`Đang tải từ: ${url}`);

  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(tmpZip);
          res2.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(tmpZip);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', reject);
  });

  const stats = fs.statSync(tmpZip);
  console.log(`Đã tải xong ${stats.size} bytes vào ${tmpZip}`);

  // Giải nén dùng tar
  try {
    execSync(`tar -xf "${tmpZip}" -C "${targetDir}"`, { stdio: 'inherit' });
    console.log(`[PASS] Đã giải nén vào User Skills: ${targetDir}`);
  } catch (e) {
    // Fallback PowerShell Expand-Archive
    execSync(`powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${targetDir}' -Force"`, { stdio: 'inherit' });
    console.log(`[PASS] Đã giải nén bằng PowerShell vào: ${targetDir}`);
  }

  // Copy sang project skill dir
  try {
    execSync(`powershell -Command "Copy-Item -Path '${targetDir}\\*' -Destination '${projectSkillDir}' -Recurse -Force"`, { stdio: 'inherit' });
    console.log(`[PASS] Đã đồng bộ sang Project Skills: ${projectSkillDir}`);
  } catch (e) {
    console.log(`Lỗi đồng bộ sang project skills:`, e.message);
  }

  // Dọn dẹp file tạm
  if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);

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
if (slug) {
  downloadAndInstall(slug);
} else {
  console.log('Cách dùng: node install-market-skill.js <slug>');
}
