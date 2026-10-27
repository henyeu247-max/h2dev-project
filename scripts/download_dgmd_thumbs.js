const fs = require('fs');
const path = require('path');

const ROOT = 'd:/YTB/H2DEV-Project';
const catalogPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
const modulesPath = path.join(ROOT, 'data', 'modules_dgmd.json');
const thumbsDir = path.join(ROOT, 'assets', 'thumbs');

if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

async function downloadThumb(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return true;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buf));
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('Ingesting DGMD thumbnails...');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const modules = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));

  let downloaded = 0;
  for (const item of catalog) {
    const rawUrl = item.thumb || item.image;
    if (rawUrl && rawUrl.startsWith('http')) {
      const dest = path.join(thumbsDir, `${item.sku}.png`);
      const ok = await downloadThumb(rawUrl, dest);
      if (ok) {
        downloaded++;
        item.image = `/assets/thumbs/${item.sku}.png`;
        item.thumb = `/assets/thumbs/${item.sku}.png`;
      }
    }
  }

  // Update in modules too
  for (const mod of modules.modules) {
    for (const item of mod.items) {
      const localThumb = `/assets/thumbs/${item.sku}.png`;
      if (fs.existsSync(path.join(ROOT, localThumb.slice(1)))) {
        item.image = localThumb;
        item.thumb = localThumb;
      }
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(modulesPath, JSON.stringify(modules, null, 2), 'utf8');
  console.log(`Successfully downloaded and updated ${downloaded}/${catalog.length} thumbnails to local assets/thumbs/`);
}

main().catch(console.error);
