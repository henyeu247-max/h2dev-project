const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const modulesPath = path.join(ROOT, 'data', 'modules_dgmd.json');
const catalogPath = path.join(ROOT, 'data', 'catalog_dgmd.json');

const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const catalogBySku = new Map(catalogData.map(v => [v.sku, v]));

const videosDgmd = [];
let globalIndex = 1;

modulesData.modules.forEach(m => {
  m.items.forEach(item => {
    const catItem = catalogBySku.get(item.sku) || {};

    // Phân loại thị trường theo nội dung module & bài học
    const textBlob = ((m.title || '') + ' ' + (item.title || '')).toUpperCase();
    const market = [];
    if (textBlob.includes('VIEW NGOẠI')) {
      market.push('🌍 View Ngoại');
    }
    if (textBlob.includes('FACEBOOK')) {
      market.push('📘 Facebook');
    }
    if (textBlob.includes('VIDEO NGẮN') || textBlob.includes('REELS') || textBlob.includes('SHORTS')) {
      market.push('📱 Shorts / Reels');
    }
    if (market.length === 0 || textBlob.includes('VIEW VIỆT') || textBlob.includes('VIỆT')) {
      if (!market.includes('🇻🇳 Việt Nam')) market.unshift('🇻🇳 Việt Nam');
    }

    // Làm sạch tên chuyên mục / ngách
    const cleanNiche = m.title
      .replace(/^[0-9.]+\s*/, '')
      .replace(/^BỘ\s+\d+\s+QUY\s+TRÌNH\s+/, '')
      .replace(/^COMBO\s+(\d+\s+)?QUY\s+TRÌNH\s+/, '')
      .trim();

    const localMp4 = path.join(ROOT, 'video', item.sku, `${item.sku}.mp4`);
    const exists = fs.existsSync(localMp4);
    const diskSize = exists ? fs.statSync(localMp4).size : 0;
    const isDownloaded = exists && diskSize > 1024 * 1024;
    const localRelPath = `video/${item.sku}/${item.sku}.mp4`;

    const videoObj = {
      sku: item.sku,
      title: item.title,
      index: globalIndex++,
      market: market,
      niche: cleanNiche || m.title,
      contentNiche: m.title,
      module_id: m.id,
      module_title: m.title,
      size: isDownloaded ? diskSize : 0,
      size_mb: isDownloaded ? parseFloat((diskSize / (1024 * 1024)).toFixed(2)) : 0,
      duration: item.duration || '00:00',
      duration_sec: item.duration_sec || 0,
      free: Boolean(item.free),
      is_free: Boolean(item.free),
      drm: false,
      is_drm: false,
      isDgmd: true,
      docs: item.docs || [],
      docsCount: (item.docs || []).length,
      channels: item.channels || [],
      origin: item.origin || '',
      image: item.image || `assets/thumbs-dgmd/${item.sku}.png`,
      thumb: item.image || `assets/thumbs-dgmd/${item.sku}.png`,
      published_at: item.published_at || '2026-10-12',
      tags: item.tags || [],
      file: isDownloaded ? localRelPath : '',
      mp4: isDownloaded ? localRelPath : '',
      video_link: isDownloaded ? localRelPath : '',
      local: isDownloaded
    };

    videosDgmd.push(videoObj);
  });
});

const outPath = path.join(ROOT, 'data', 'videos_dgmd.json');
fs.writeFileSync(outPath, JSON.stringify(videosDgmd, null, 2), 'utf8');
console.log(`Generated ${videosDgmd.length} DGMD videos in data/videos_dgmd.json`);
