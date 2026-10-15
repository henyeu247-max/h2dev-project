// Đếm khối catch rỗng THẬT (đã bỏ comment) trong JS frontend. Chạy: node scripts/count-empty-catch.js [--list]
// catch chứa comment hoặc câu lệnh KHÔNG bị tính; chỉ đếm `catch {}` / `catch (e) {}` trống hoàn toàn.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.js') ? [path.join(dir, e.name)] : []));
}

function collect() {
  const files = [...walk(path.join(ROOT, 'assets', 'app')), path.join(ROOT, 'assets', 'h2dev-core.js'), path.join(ROOT, 'assets', 'learn.js'), path.join(ROOT, 'assets', 'music_player_modal.js')]
    .filter(f => fs.existsSync(f));
  const rows = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    // thay phần comment bằng khoảng trắng nhưng giữ số dòng; KHÔNG làm vậy trong chuỗi đơn giản là đủ cho mục đích đếm
    const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
    const re = /catch\s*(?:\(\s*\w*\s*\))?\s*\{\s*\}/g;
    let m;
    while ((m = re.exec(noBlock))) {
      const line = noBlock.slice(0, m.index).split('\n').length;
      rows.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), line, ctx: raw.split('\n')[line - 1].trim().slice(0, 140) });
    }
  }
  return rows;
}

if (require.main === module) {
  const rows = collect();
  const by = {};
  rows.forEach(r => { by[r.file] = (by[r.file] || 0) + 1; });
  Object.entries(by).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(String(n).padStart(3), f));
  console.log('TOTAL', rows.length);
  if (process.argv.includes('--list')) rows.forEach(r => console.log(`${r.file}:${r.line}  ${r.ctx}`));
}
module.exports = { collect };
