/**
 * Guard: không cho phép inline event handler truyền dữ liệu động (${...}) trong index.html.
 *
 * VÌ SAO CẦN GUARD NÀY:
 * - Code cũ dạng: onclick="window.openQuickVideoModal('${esc(v.title)}', ...)"
 * - Hàm esc() chỉ escape HTML, KHÔNG escape chuỗi JavaScript.
 * - Khi tiêu đề có dấu nháy đơn (ví dụ: "Can't", "Earth's") thì chuỗi JS bị ngắt
 *   -> sinh lỗi "missing ) after argument list" -> nút bấm chết hoàn toàn.
 * - Chuẩn mới: dùng class + data-* và sự kiện ủy quyền (delegated event listener).
 *
 * CÁCH DÙNG:
 * - Chạy độc lập: node scripts/guard-no-inline-onclick.js
 * - Được gọi tự động trong: node scripts/validate-project.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'index.html');

const HANDLER_RE = /on(?:click|error|load|change|mouseover|mouseenter|submit)="([^"]*)"/g;

/**
 * Quét file HTML tìm inline handler chứa dữ liệu động.
 * @returns {Array<{line:number, handler:string, snippet:string}>} danh sách vi phạm
 */
function scan(filePath = TARGET) {
  if (!fs.existsSync(filePath)) {
    return [{ line: 0, handler: 'file', snippet: `missing file ${filePath}` }];
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const offenders = [];
  lines.forEach((line, idx) => {
    const matches = line.match(HANDLER_RE);
    if (!matches) return;
    matches.forEach((attr) => {
      if (attr.includes('${')) {
        offenders.push({
          line: idx + 1,
          handler: attr.split('=')[0],
          snippet: attr.slice(0, 160),
        });
      }
    });
  });
  return offenders;
}

module.exports = { scan };

if (require.main === module) {
  const offenders = scan();
  if (offenders.length) {
    console.error(`FAIL | Tìm thấy ${offenders.length} inline handler chứa dữ liệu động trong index.html:`);
    offenders.forEach((o) => console.error(`  index.html:${o.line} -> ${o.snippet}`));
    console.error('\nCách sửa: bỏ inline handler, dùng class + data-* và delegated event listener.');
    process.exit(1);
  }
  console.log('PASS | Không có inline handler chứa dữ liệu động trong index.html');
  process.exit(0);
}
