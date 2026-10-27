// H2DEV Project - Live Player Link Resolver
// Tự động phân giải link phát trực tiếp từ máy chủ gốc Mona Cloud cho mọi SKU
// Cấp token tươi sống không bao giờ hết hạn, phục vụ xem trên mọi trình duyệt (Cốc Cốc, Chrome, Edge, Safari...)
'use strict';

async function getLivePlayerUrl(sku) {
  if (!sku || !/^VIDEO-[A-Za-z0-9]+$/i.test(sku)) return null;

  // Check DGMD catalog first
  try {
    const fs = require('fs');
    const path = require('path');
    // Check HUAN Academy catalog first
    const huanCatPath = path.join(__dirname, '..', 'data', 'catalog_huan.json');
    if (fs.existsSync(huanCatPath)) {
      const huanCat = JSON.parse(fs.readFileSync(huanCatPath, 'utf8'));
      const huanItem = huanCat.find(x => x.sku.toUpperCase() === sku.toUpperCase());
      if (huanItem) {
        let streamUrl = huanItem.file;
        if (!streamUrl || !streamUrl.startsWith('http')) {
          streamUrl = huanItem.video_link;
        }
        if (streamUrl && streamUrl.startsWith('http')) {
          return { url: streamUrl, referer: 'https://huan.academy/learn' };
        }
      }
    }

    // Check DGMD catalog
    const dgmdCatPath = path.join(__dirname, '..', 'data', 'catalog_dgmd.json');
    if (fs.existsSync(dgmdCatPath)) {
      const dgmdCat = JSON.parse(fs.readFileSync(dgmdCatPath, 'utf8'));
      const dgmdItem = dgmdCat.find(x => x.sku.toUpperCase() === sku.toUpperCase());
      if (dgmdItem) {
        let streamUrl = dgmdItem.file;
        if (!streamUrl || !streamUrl.startsWith('http')) {
          streamUrl = dgmdItem.video_link;
        }
        if (streamUrl && streamUrl.startsWith('http')) {
          const ref = (dgmdItem.platform === 'huan.academy' || (dgmdItem.module_id && dgmdItem.module_id.startsWith('HUAN-')))
            ? 'https://huan.academy/learn'
            : 'https://daigiamangdep.com/learn';
          return { url: streamUrl, referer: ref };
        }
      }
    }
  } catch (e) {}

  const bootRes = await fetch('https://h2dev.vn/learn', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131' },
    signal: AbortSignal.timeout(10000)
  });

  const rawCookies = bootRes.headers.getSetCookie ? bootRes.headers.getSetCookie() : [bootRes.headers.get('set-cookie') || ''];
  const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);
  const vdkMatch = cookieStr.match(/__vdk=([^;]+)/);
  const vuiMatch = cookieStr.match(/__vui=([^;]+)/);

  const gq = 'query($sku:String!){getCourseNoCategory(sku:$sku){video_link}}';
  const apiRes = await fetch('https://saas-api.mona.academy/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'verify-site': vdkMatch ? vdkMatch[1] : '',
      'x-saas-user-id': vuiMatch ? vuiMatch[1] : '',
      'origin': 'https://h2dev.vn',
      'referer': 'https://h2dev.vn/learn'
    },
    body: JSON.stringify({ query: gq, variables: { sku } }),
    signal: AbortSignal.timeout(10000)
  });

  const data = await apiRes.json();
  const vl = data?.data?.getCourseNoCategory?.video_link || null;
  return vl ? { url: vl, referer: 'https://h2dev.vn/' } : null;
}

module.exports = { getLivePlayerUrl };
