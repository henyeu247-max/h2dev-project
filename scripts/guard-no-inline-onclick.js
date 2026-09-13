/**
 * Guard: không cho phép inline onclick truyền dữ liệu động (${...}) trong index.html.
 * Lý do: tiêu đề/ tên kênh có dấu nháy đơn (Can't, Earth's) làm vỡ lệnh JS inline,
 * khiến nút "Xem Video" chết hoàn toàn mà không báo lỗi nhìn thấy được.
 * Chuẩn: dùng class + data-* và sự kiện ủy quyền (delegated event).
 * Chạy: node scripts/guard-no-inline-onclick.js
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(PROJECT_ROOT, 'index.html');

const html = fs.readFileSync(TARGET, 'utf8');
const lines = html.split(/\r?\n/);
const offenders = [];

lines.forEach((line, idx) => {
  const m = line.match(/on(?:click|error|load|change|mouseover)="([^"]*)"/g);
  if (!m) return;
  m.forEach((attr) => {
    if (attr.includes('${')) {
      offenders.push({ line: idx + 1, snippet: attr.slice(0, 160) });
    }
  });
});

if (offenders.length) {
  console.error('FAIL | Tìm thấy inline handler chứa dữ liệu động:');
  offenders.forEach((o) => console.error(`  index.html:${o.line} -> ${o.snippet}`));
  console.error('\nSửa bằng cách: bỏ inline handler, dùng class + data-* và delegated event listener.');
  process.exit(1);
}

console.log('PASS | Không có inline handler chứa dữ liệu động trong index.html');
process.exit(0);
