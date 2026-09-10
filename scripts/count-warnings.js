const fs = require('fs');
const path = require('path');
const input = process.argv[2] || path.join(__dirname, '..', 'audit-recheck.txt');
if (!fs.existsSync(input)) {
  throw new Error('Thiếu file audit. Chạy: node scripts/count-warnings.js <đường-dẫn-file-audit>');
}
const t = fs.readFileSync(input, 'utf8');
const lines = t.split('\n');
const ws = lines.filter(l => l.match(/^\s+\d+\.\s/));
console.log('Total warnings:', ws.length);
const noCh = ws.filter(l => l.includes('channels[]'));
console.log('No channels[]:', noCh.length);
const noDocs = ws.filter(l => l.includes('docs[]'));
console.log('No docs[]:', noDocs.length);
const noMkt = ws.filter(l => l.includes('market rỗng'));
console.log('market rỗng:', noMkt.length);
const niche = ws.filter(l => l.includes('Khắc'));
console.log('niche Khắc:', niche.length);
const dead = ws.filter(l => l.includes('DEAD'));
console.log('DEAD:', dead.length);
const pipe = ws.filter(l => l.includes('pipelines'));
console.log('pipelines:', pipe.length);
const size = ws.filter(l => l.includes('size lệch'));
console.log('size lệch:', size.length);
const title = ws.filter(l => l.includes('title lệch'));
console.log('title lệch:', title.length);
