const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKU = process.argv[2];
const finalPath = path.join(ROOT, 'video', SKU || '', `${SKU || ''}.mp4`);
const graphqlUrl = 'https://saas-api.mona.academy/graphql';
const graphqlQuery = `query($sku:String!){getCourseNoCategory(sku:$sku){__typename ... on ProductInterface {id sku time video_link}}}`;

if (!SKU || !/^VIDEO-[A-Za-z0-9]+$/.test(SKU)) {
  throw new Error('Usage: node scripts/sync-h2dev-record.cjs VIDEO-xxxxxx');
}

const chromePaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = chromePaths.find((candidate) => fs.existsSync(candidate));
if (!executablePath) throw new Error('CHROME_OR_EDGE_NOT_FOUND');
if (!fs.existsSync(finalPath) || fs.statSync(finalPath).size <= 0) throw new Error('LOCAL_MP4_NOT_READY');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function writeJson(file, value) {
  const fullPath = path.join(ROOT, file);
  const tempPath = `${fullPath}.tmp-sync`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, fullPath);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
  });
  const page = await context.newPage();
  await page.goto('https://h2dev.vn/learn', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const cookies = await context.cookies('https://h2dev.vn');
  const cookieMap = Object.fromEntries(cookies.map((cookie) => [cookie.name, cookie.value]));
  const api = await context.request.post(graphqlUrl, {
    headers: {
      'content-type': 'application/json',
      'verify-site': cookieMap.__vdk,
      'x-saas-user-id': cookieMap.__vui,
      origin: 'https://h2dev.vn',
      referer: 'https://h2dev.vn/learn',
    },
    data: { query: graphqlQuery, variables: { sku: SKU } },
  });
  const payload = await api.json();
  const playerUrl = payload?.data?.getCourseNoCategory?.video_link;
  await browser.close();
  if (!playerUrl) throw new Error('PUBLIC_PRODUCT_VIDEO_LINK_EMPTY');

  const bytes = fs.statSync(finalPath).size;
  const full = readJson('data/catalog_full.json');
  const slim = readJson('data/catalog.json');
  const tabs = readJson('data-tabs/videos.json');
  const fullRecord = full.find((record) => record.sku === SKU);
  const slimRecord = slim.find((record) => record.sku === SKU);
  const tabRecord = tabs.find((record) => record.sku === SKU);
  if (!fullRecord || !slimRecord || !tabRecord) throw new Error('CATALOG_RECORD_NOT_FOUND');
  fullRecord.video_link = playerUrl;
  fullRecord.size = bytes;
  slimRecord.size_mb = Math.round(bytes / 1024 / 1024);
  tabRecord.size = bytes;
  writeJson('data/catalog_full.json', full);
  writeJson('data/catalog.json', slim);
  writeJson('data-tabs/videos.json', tabs);

  const csvPath = path.join(ROOT, 'manifest_full.csv');
  const csvLines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/);
  const csvIndex = csvLines.findIndex((line) => line.startsWith(`${SKU},`));
  if (csvIndex >= 0) csvLines[csvIndex] = csvLines[csvIndex].replace(/,\d+,HLS,/, `,${bytes},HLS,`);
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(JSON.stringify({ sku: SKU, bytes, api: 'getCourseNoCategory', synced: true }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
