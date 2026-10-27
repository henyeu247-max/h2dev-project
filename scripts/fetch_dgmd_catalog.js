const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

async function queryDGMD(query, variables = {}) {
  const res = await fetch('https://api.daigiamangdep.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    },
    body: JSON.stringify({ query, variables })
  });
  return await res.json();
}

async function main() {
  console.log('>>> FETCHING FULL METADATA FOR DGMD (daigiamangdep.com) <<<');

  // 1. Get Course list
  const listRes = await queryDGMD(`
    query {
      getListCourse {
        entity_id
        title
        url_key
        price
        total_lesson
        total_time
        launch_date
        image
        description
      }
    }
  `);
  const courseList = listRes.data?.getListCourse || [];
  console.log(`Found ${courseList.length} courses in DGMD list.`);

  // 2. Get COURSE1 grouped products and items
  const course1Res = await queryDGMD(`
    query getCourse($sku: String!) {
      getCourse(sku: $sku) {
        id
        sku
        name
        time
        description { html }
        short_description { html }
        image { url label }
        thumbnail { url label }
        ... on GroupedProduct {
          items {
            position
            qty
            product {
              id
              sku
              name
              time
              video_link
              url_key
              image { url label }
              thumbnail { url label }
              description { html }
              short_description { html }
            }
          }
        }
      }
    }
  `, { sku: 'COURSE1' });

  const c1 = course1Res.data?.getCourse;
  const items = c1?.items || [];
  console.log(`COURSE1 "${c1?.name}" has ${items.length} video lessons.`);

  // 3. Format as DGMD Modules structure
  // Divide the 45 videos into logical clusters based on the 8 topics in DGMD
  const modulesDgmd = [
    {
      id: 'DGMD-M01',
      title: 'Chủ đề 1 — Bộ 3 Chủ Đề YouTube View Ngoại Tiềm Năng',
      desc: 'Quy trình sản xuất các dạng video view ngoại bùng nổ view quốc tế (Nhạc cổ, Quiz English, Hội thoại tiếng Anh).',
      count: 0,
      totalDuration: '',
      items: []
    },
    {
      id: 'DGMD-M02',
      title: 'Chủ đề 2 — Bộ 3 Chủ Đề Sản Xuất Video Facebook',
      desc: 'Chiến lược sản xuất video ngắn và dài tối ưu phân phối trên nền tảng Facebook Reels / Fanpage.',
      count: 0,
      totalDuration: '',
      items: []
    },
    {
      id: 'DGMD-M03',
      title: 'Chủ đề 3 — Bộ 6 Quy Trình Sản Xuất View Việt Đột Phá',
      desc: 'Các quy trình sản xuất nội dung ngách âm nhạc dân gian (Chầu Văn, Nhạc Xẩm) và nội dung đời sống Việt Nam.',
      count: 0,
      totalDuration: '',
      items: []
    },
    {
      id: 'DGMD-M04',
      title: 'Chủ đề 4 — Combo Tư Duy Xây Dựng Kênh YouTube & Shorts Ngoại',
      desc: 'Hệ thống tư duy chọn ngách, sản xuất shorts triệu view và xây dựng thương hiệu kênh dài hạn.',
      count: 0,
      totalDuration: '',
      items: []
    }
  ];

  const catalogDgmd = [];

  items.forEach((it, idx) => {
    const p = it.product;
    const durSec = parseInt(p.time || '0', 10);
    const m = Math.floor(durSec / 60);
    const s = durSec % 60;
    const durHms = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const videoItem = {
      sku: p.sku,
      title: p.name,
      id: p.id,
      position: it.position,
      duration: durHms,
      duration_sec: durSec,
      video_link: p.video_link,
      url_key: p.url_key,
      thumb: p.thumbnail?.url || '',
      image: p.image?.url || '',
      mp4: `video/${p.sku}/${p.sku}.mp4`,
      origin: `https://daigiamangdep.com/learn/study/${p.url_key}`,
      published_at: '2026-08-01',
      free: false,
      size: 50000000,
      channels: [],
      docsCount: 0,
      seq: String(idx + 1),
      badge: 'DGMD',
      access: 'PRO',
      docs: [],
      desc: p.description?.html || '',
      market: ['🇻🇳 Việt', '🌐 Ngoại'],
      tags: ['DGMD', 'Thực chiến'],
      track: 'DGMD',
      platform: 'daigiamangdep.com'
    };

    catalogDgmd.push(videoItem);

    // Grouping into 4 modules by index
    const modIdx = Math.min(Math.floor(idx / 12), modulesDgmd.length - 1);
    modulesDgmd[modIdx].items.push(videoItem);
  });

  // Calculate durations for modules
  modulesDgmd.forEach(mod => {
    mod.count = mod.items.length;
    mod.countOriginal = mod.items.length;
    let totalSec = mod.items.reduce((acc, cur) => acc + cur.duration_sec, 0);
    const h = Math.floor(totalSec / 3600);
    const remM = Math.floor((totalSec % 3600) / 60);
    mod.totalDuration = `${h}h ${remM}m`;
  });

  const outData = {
    brand: 'DGMD',
    brand_name: 'Đại Gia Mang Dép',
    domain: 'daigiamangdep.com',
    api_endpoint: 'https://api.daigiamangdep.com/graphql',
    total_videos: catalogDgmd.length,
    courses_count: courseList.length,
    courses: courseList,
    modules: modulesDgmd
  };

  const outModulesPath = path.join(projectRoot, 'data', 'modules_dgmd.json');
  const outCatalogPath = path.join(projectRoot, 'data', 'catalog_dgmd.json');

  fs.writeFileSync(outModulesPath, JSON.stringify(outData, null, 2), 'utf8');
  fs.writeFileSync(outCatalogPath, JSON.stringify(catalogDgmd, null, 2), 'utf8');

  console.log(`Saved DGMD modules: ${outModulesPath} (${modulesDgmd.length} modules, ${catalogDgmd.length} videos).`);
  console.log(`Saved DGMD catalog: ${outCatalogPath}`);
}

main();
