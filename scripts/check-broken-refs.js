// Check broken references in HTML files
// FIX 2026-08-28: bo qua ref dong (template literal ${...}) va pseudo-protocol.
//   Truoc do script quet ca `${esc(v.origin)}` trong index.html nhu duong dan that
//   -> 18 MISSING, 100% false positive. Chi ref tinh moi duoc check.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const player = fs.readFileSync(path.join(root, 'player.html'), 'utf8');
const re = /(?:href|src)=["']([^"']+)["']/g;

// Tra ve null neu ref khong phai duong dan tinh (bo qua khi check ton tai)
function toStaticPath(r) {
  if (!r) return null;
  if (r.includes('${')) return null;              // template literal - render luc chay
  if (/^(https?:)?\/\//i.test(r)) return null;     // url tuyet doi
  if (/^(data:|blob:|mailto:|tel:|javascript:|#)/i.test(r)) return null;
  if (r.startsWith('?')) return null;              // query string thuan
  return r.split('?')[0].split('#')[0].replace(/^\.\//, '').trim();
}

let m, refs = [], dynamic = 0;
[html, player].forEach(h => {
  while ((m = re.exec(h)) !== null) {
    const r = m[1];
    if (!toStaticPath(r)) { dynamic++; continue; }
    refs.push(r);
  }
});

console.log('=== LOCAL REFERENCES ===');
const unique = [...new Set(refs)];
const broken = [];
unique.forEach(r => {
  const p = path.join(root, toStaticPath(r));
  if (!fs.existsSync(p)) broken.push(r);
});
console.log('Total static refs:', unique.length);
console.log('Skipped (dynamic/pseudo):', dynamic);
console.log('Broken:', broken.length);
broken.forEach(b => console.log('  MISSING:', b));
if (broken.length === 0) console.log('All OK');
