// H2DEV Project - Live Player Link Resolver
// Tự động phân giải link phát trực tiếp từ máy chủ gốc Mona Cloud cho mọi SKU
// Cấp token tươi sống không bao giờ hết hạn, phục vụ xem trên mọi trình duyệt (Cốc Cốc, Chrome, Edge, Safari...)
'use strict';

async function getLivePlayerUrl(sku) {
  if (!sku || !/^VIDEO-[A-Za-z0-9]+$/i.test(sku)) return null;

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
  return data?.data?.getCourseNoCategory?.video_link || null;
}

module.exports = { getLivePlayerUrl };
