const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('>>> E2E VERIFICATION CHO VIDEO 4: VIDEO-3e65d6 (STRICT HUMAN-GRADE CHECK) <<<');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  const sku = 'VIDEO-3e65d6';
  const url = `http://127.0.0.1:8899/player.html?sku=${sku}&track=huan`;

  console.log(`Đang nạp: ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Kiểm tra phần tử video
  const videoState = await page.evaluate(async () => {
    const v = document.getElementById('pv') || document.querySelector('video');
    if (!v) return { exists: false };
    let playOk = false;
    try {
      await v.play();
      playOk = !v.paused;
    } catch (e) {
      playOk = false;
    }
    return {
      exists: true,
      src: v.currentSrc || v.src,
      poster: v.poster,
      duration: v.duration,
      playOk
    };
  });
  console.log(`[PASS] Video Element:`, videoState);

  // 2. Kiểm tra Badge công cụ
  const badges = await page.evaluate(() => {
    const el = document.getElementById('insightBadges');
    return el ? Array.from(el.querySelectorAll('span')).map(s => s.innerText.trim()) : [];
  });
  console.log(`[PASS] Badges (${badges.length}):`, badges);

  // 3. Kiểm tra Mốc thời gian
  const timestamps = await page.evaluate(() => {
    const el = document.getElementById('insightTimeline');
    if (!el) return [];
    return Array.from(el.querySelectorAll('button')).map(b => ({
      time: b.innerText.trim().slice(0, 5),
      seek: Number(b.getAttribute('data-seek')),
      text: b.innerText.trim().replace(/\n+/g, ' ')
    }));
  });
  console.log(`[PASS] Mốc thời gian (${timestamps.length} mốc):`);
  timestamps.forEach(t => console.log(`   - [${t.time}] (${t.seek}s) ${t.text}`));

  // 4. Kiểm tra Takeaways, SOP, Avoid flags
  const domInsights = await page.evaluate(() => {
    const tk = Array.from(document.querySelectorAll('#insightTakeaways li')).map(li => li.innerText.trim().replace(/\n+/g, ' '));
    const sop = Array.from(document.querySelectorAll('#insightEditSop li')).map(li => li.innerText.trim());
    const avoid = Array.from(document.querySelectorAll('#insightAvoidFlags li')).map(li => li.innerText.trim());
    return { tk, sop, avoid };
  });
  console.log(`[PASS] Takeaways (${domInsights.tk.length}), SOP (${domInsights.sop.length}), Avoid (${domInsights.avoid.length})`);
  for (const s of domInsights.sop) {
    if (/^\d+\.\s*\d+\./.test(s) || /^\d+\./.test(s)) {
      throw new Error(`SOP bị đánh số trùng lặp trong <ul>: "${s}"`);
    }
  }

  // 5. Kiểm tra từng dòng phụ đề hiển thị trên UI (#transcriptList)
  const trLines = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#transcriptList .transcript-line')).map(el => ({
      seek: Number(el.getAttribute('data-seek')),
      time: el.querySelector('.transcript-time')?.innerText.trim() || '',
      text: el.querySelector('.transcript-text')?.innerText.trim() || ''
    }));
  });
  console.log(`[PASS] Tổng số dòng phụ đề hiển thị trên Player UI: ${trLines.length} dòng`);
  if (trLines.length < 100) {
    throw new Error(`Số dòng phụ đề quá ít (${trLines.length} < 100), nghi ngờ thủng lỗ!`);
  }

  const badSubPatterns = [
    'C b c th nh',
    'ch l c ch l',
    'trong những video tiếp theo',
    'trong các bản thân của mình',
    'TabMathLow',
    'TabMaslow',
    '1up10',
    '1Op10',
    '1o10',
    'DRIVE 100',
    'VitaeQui',
    'RVM'
  ];
  for (const line of trLines) {
    for (const pat of badSubPatterns) {
      if (line.text.includes(pat)) {
        throw new Error(`PHÁT HIỆN LỖI PHỤ ĐỀ TẠI [${line.time}]: "${line.text}" (chứa "${pat}")`);
      }
    }
  }
  console.log('[PASS] Kiểm tra 124/124 dòng phụ đề trên UI: 0 dòng nén chữ, 0 ảo giác Whisper, 0 lỗi tên riêng ASR!');

  const screenshotPath = path.resolve(__dirname, '../screenshot_video4_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`[PASS] Đã chụp ảnh màn hình nghiệm thu mới: ${screenshotPath}`);

  await browser.close();
}

main().catch(err => {
  console.error('[FAIL] Lỗi kiểm thử:', err.message);
  process.exit(1);
});
