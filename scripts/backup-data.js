/**
 * Backup data-tabs + data trước khi sửa
 * → _backup/<timestamp>/
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15); // 20260819T001234
const bkDir = path.join(ROOT, '_backup', ts);

fs.mkdirSync(bkDir, { recursive: true });

const dirsToBackup = ['data-tabs', 'data'];
let copied = 0;

for (const dir of dirsToBackup) {
  const src = path.join(ROOT, dir);
  const dst = path.join(bkDir, dir);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src).filter(f => f.endsWith('.json'));
  for (const f of files) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
    copied++;
    console.log(`  ✅ ${dir}/${f}`);
  }
}

console.log(`\nBackup done: ${bkDir}`);
console.log(`Files copied: ${copied}`);
