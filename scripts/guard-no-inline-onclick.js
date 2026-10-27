/**
 * Guard: cấm inline event handler (onclick/onerror/...) trong template HTML/JS.
 *
 * VÌ SAO:
 * - onclick="...${esc(x)}..." — esc() escape HTML, KHÔNG escape JS string.
 * - Dấu nháy đơn trong data làm vỡ lệnh JS -> nút chết.
 * - Chuẩn: class + data-* + delegated event listener.
 *
 * Ngoại lệ được phép:
 * - Gán property: el.onclick = ... (không phải attribute trong template)
 * - onerror placeholder TĨNH không chứa ${...} (fallback ảnh)
 *
 * Chạy: node scripts/guard-no-inline-onclick.js
 * Được gọi trong: node scripts/validate-project.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_TARGETS = ['index.html', 'player.html', 'learn.html', 'graph.html'];
const SKIP_DIRS = new Set(['vendor', 'vendors', 'dist', 'build', 'node_modules']);

function discoverTargets() {
  const targets = HTML_TARGETS.map(rel => path.join(ROOT, rel));
  const assetsRoot = path.join(ROOT, 'assets');
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name.toLowerCase())) walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.name.endsWith('.js') || /(?:\.min|\.bundle)\.js$/i.test(entry.name)) continue;
      targets.push(path.join(dir, entry.name));
    }
  }
  if (fs.existsSync(assetsRoot)) walk(assetsRoot);
  return targets.sort();
}

// Attribute handlers trong HTML/template
const ATTR_HANDLER_RE = /\son(?:click|error|load|change|mouseover|mouseenter|submit|keydown|keyup|input|focus|blur)\s*=\s*"([^"]*)"/gi;

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [{ line: 0, handler: 'file', snippet: `missing file ${filePath}`, file: filePath }];
  }
  return scanText(fs.readFileSync(filePath, 'utf8'), filePath);
}

function scanText(source, filePath = '<memory>') {
  const lines = source.split(/\r?\n/);
  const offenders = [];
  lines.forEach((line, idx) => {
    // Gán property (el.onclick= / this.onerror=) không phải attribute — bỏ qua
    const withoutProps = line.replace(/\bthis\.(?:onerror|onload|onclick)\s*=/g, 'THIS_PROP=')
      .replace(/\b[A-Za-z_$][\w$]*\.(?:onclick|onerror|onload|onchange|onkeydown|onkeyup|oninput|onfocus|onblur)\s*=/g, 'PROP_ASSIGN=');
    // Template JS có thể ghi delimiter attribute dưới dạng \"; chuẩn hoá để guard không bỏ sót.
    const normalized = withoutProps.replace(/\\"/g, '"');
    const matches = normalized.match(ATTR_HANDLER_RE);
    if (!matches) return;
    matches.forEach((attr) => {
      const body = attr.replace(/^on\w+=/i, '');
      // onerror placeholder tĩnh (fallback ảnh, không ${}) được phép
      const isStaticImgFallback = /this\.(onerror|style)|THIS_PROP|null;this\.src/.test(line) && !body.includes('${') && /onerror=/i.test(attr);
      if (isStaticImgFallback) return;
      if (/onerror=/i.test(attr) && !attr.includes('${') && /placeholder|this\.src|this\.style/.test(attr)) return;
      offenders.push({
        file: filePath,
        line: idx + 1,
        handler: attr.trim().split('=')[0].trim(),
        snippet: attr.slice(0, 160),
      });
    });
  });
  return offenders;
}

function scanAll() {
  return discoverTargets().flatMap((f) => scanFile(f));
}

module.exports = { scan: (p) => (p ? scanFile(p) : scanAll()), scanAll, discoverTargets };

if (require.main === module) {
  if (process.argv.includes('--probe')) {
    const crypto = require('crypto');
    const targets = discoverTargets();
    const sha1 = file => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
    const before = new Map(targets.map(file => [file, sha1(file)]));
    const injected = scanText('const html = `<button onclick=\\"doThing()\\">X</button>`;');
    const restored = scanText('const button = {}; button.onclick = doThing;');
    const identical = targets.every(file => before.get(file) === sha1(file));
    console.log('PROBE injected escaped onclick -> ' + (injected.length ? 'FAIL BAT DUOC' : 'BO LOT'));
    console.log('PROBE restored/property assignment -> ' + (restored.length === 0 ? 'PASS' : 'DO GIA'));
    console.log('SHA1 source truoc/sau byte-identical: ' + (identical ? 'OK' : 'THAT BAI'));
    process.exit(injected.length && restored.length === 0 && identical ? 0 : 1);
  }
  const offenders = scanAll();
  if (offenders.length) {
    console.error(`FAIL | Tìm thấy ${offenders.length} inline event handler attribute:`);
    offenders.forEach((o) => console.error(`  ${path.relative(ROOT, o.file)}:${o.line} -> ${o.snippet}`));
    console.error('\nCách sửa: bỏ inline handler, dùng class + data-* và delegated event listener.');
    process.exit(1);
  }
  console.log(`PASS | Không còn inline event handler attribute ngoài whitelist trong ${discoverTargets().length} HTML/JS source files`);
  process.exit(0);
}
