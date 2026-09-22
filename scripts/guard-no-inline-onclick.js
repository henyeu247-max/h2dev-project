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
const TARGETS = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'player.html'),
  path.join(ROOT, 'learn.html'),
  path.join(ROOT, 'assets', 'music_player_modal.js'),
  path.join(ROOT, 'assets', 'learn.js'),
  path.join(ROOT, 'assets', 'h2dev-core.js'),
];

// Attribute handlers trong HTML/template
const ATTR_HANDLER_RE = /\son(?:click|error|load|change|mouseover|mouseenter|submit|keydown|keyup|input|focus|blur)\s*=\s*"([^"]*)"/gi;

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [{ line: 0, handler: 'file', snippet: `missing file ${filePath}`, file: filePath }];
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const offenders = [];
  lines.forEach((line, idx) => {
    // Gán property (el.onclick= / this.onerror=) không phải attribute — bỏ qua
    const withoutProps = line.replace(/\bthis\.(?:onerror|onload|onclick)\s*=/g, 'THIS_PROP=')
      .replace(/\b[A-Za-z_$][\w$]*\.(?:onclick|onerror|onload|onchange|onkeydown|onkeyup|oninput|onfocus|onblur)\s*=/g, 'PROP_ASSIGN=');
    const matches = withoutProps.match(ATTR_HANDLER_RE) || line.match(ATTR_HANDLER_RE);
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
  return TARGETS.flatMap((f) => scanFile(f));
}

module.exports = { scan: (p) => (p ? scanFile(p) : scanAll()), scanAll };

if (require.main === module) {
  const offenders = scanAll();
  if (offenders.length) {
    console.error(`FAIL | Tìm thấy ${offenders.length} inline event handler attribute:`);
    offenders.forEach((o) => console.error(`  ${path.relative(ROOT, o.file)}:${o.line} -> ${o.snippet}`));
    console.error('\nCách sửa: bỏ inline handler, dùng class + data-* và delegated event listener.');
    process.exit(1);
  }
  console.log('PASS | Không còn inline event handler attribute (onclick/onerror/...) trong UI templates');
  process.exit(0);
}
