// H2DEV Project - TOKEN MANIFEST SCOUT (scripts/lib/token-manifest.js)
// Sinh MANIFEST TOKEN tu CSS THAT tren dia — thay cho viec viet tay tokens.json
// (bai hoc SCAR-024: "danh sach trong tai lieu KHONG phai tap day du", da tai pham 3 lan).
//
// NGUON CHAN LY: MOI file .css SONG (ngoai SKIP_DIR + file build assets/tailwind.css).
// Khong doc tu design-system/tokens.json (do la TAI LIEU, khong phai ma nguon).
//
// Nguyen tac:
//   - KHONG bia token. Chi ghi cai DO DUOC tu CSS.
//   - Strip comment DUNG LOAI FILE (SCAR-034: CSS khong co comment `//`).
//   - Dem luot dung THAT bang regex `var\(--x`, KHONG dung indexOf (SCAR-019).
//   - Sap xep TAT DINH (theo ten token) de `--check` so sanh duoc bang byte.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const SKIP_DIR = ['node_modules', '_backup', '_archive', '.git', '_tmp-proof', '.venv-gpu', '_tmp-orig', 'data'];
/* BAY (PROBE phat hien): file `_tmp-*.js` (script kiem tam, da bi .gitignore dong 38) NAM O
 * GOC DU AN nen bi tinh vao `usageSources` (188 -> 189 khi em chay 1 script tam).
 * => phat hien: `--check` bao DRIFT GIA ngay sau khi vua ghi manifest (vi so file doi giua
 *    2 lan chay). Phai loai tru cac file TAM de phep quet la HERMETIC (ket qua chi phu thuoc
 *    ma nguon that, khong phu thuoc rac tam). */
const SKIP_FILE_RE = /^_tmp[-_]/;   // _tmp-*.js, _tmp_*.js (khop .gitignore dong 37-38)
const BUILD_FILE = 'assets/tailwind.css';   // FILE BUILD — nguon that la css/input.css
const USAGE_EXTS = ['.css', '.js', '.mjs', '.html'];

/* stripComments(src, isCss) — CSS chi co comment block (SCAR-034). */
function stripComments(src, isCss) {
  // 1) block comment (giu so dong)
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // 2) line comment — CHI JS. Voi CSS se pha code that.
  if (!isCss) {
    s = s.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  }
  return s;
}

function isCssPath(rel) { return /\.(css|html)$/i.test(rel); }

/* collectFiles(exts) — liet ke TUONG MINH + loai tru tuong minh (SCAR-018/026) */
function collectFiles(exts) {
  const acc = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (SKIP_DIR.includes(e.name)) continue;
      if (SKIP_FILE_RE.test(e.name)) continue;    // loai rac tam -> phep quet HERMETIC
      const rel = dir ? dir + '/' + e.name : e.name;
      if (e.isDirectory()) walk(rel);
      else if (exts.includes(path.extname(e.name)) && rel !== BUILD_FILE) acc.push(rel);
    }
  })('');
  return acc.sort();
}

/* readCssFiles() — danh sach file CSS song */
function readCssFiles() {
  return collectFiles(['.css']);
}

/* buildManifest() — quet CSS that -> { schemaVersion, generatedFrom, tokens: {...} } */
function buildManifest() {
  const cssFiles = readCssFiles();
  const usageFiles = collectFiles(USAGE_EXTS);

  // 1) Thu thap KHAI BAO (moi file CSS, GOM ca @media/selector)
  //    key = ten token; giu ban khai bao DAU TIEN (canonical nhat: viddar/h2dev-tokens nap truoc)
  const order = [];                 // thu tu gap (tat dinh theo ten file da sort)
  const decl = new Map();           // token -> { token, value, file, line }
  for (const rel of cssFiles) {
    const body = stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'), true);
    const lines = body.split(/\r?\n/);
    lines.forEach((ln, i) => {
      const m = ln.match(/^\s*(--[\w-]+)\s*:\s*(.+?);\s*$/);
      if (!m) return;
      const token = m[1];
      if (decl.has(token)) return;  // giu ban dau tien
      decl.set(token, { token, value: m[2].trim(), file: rel, line: i + 1 });
      order.push(token);
    });
  }

  // 2) Dem LUOT DUNG THAT (regex `var(--x` tren MOI file .css/.js/.html/.mjs)
  const usageSources = usageFiles.map(rel => ({
    rel,
    body: stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8'), isCssPath(rel))
  }));

  const tokens = {};
  for (const token of order.slice().sort()) {      // sap xep TAT DINH theo ten
    const d = decl.get(token);
    const re = new RegExp('var\\(\\s*' + token.replace(/-/g, '\\-') + '\\s*[,)]');
    let uses = 0;
    const usedIn = [];
    for (const u of usageSources) {
      const n = (u.body.match(new RegExp(re.source, 'g')) || []).length;
      if (n) { uses += n; usedIn.push(u.rel); }
    }
    tokens[token] = {
      value: d.value,
      file: d.file,
      line: d.line,
      uses,
      usedIn: usedIn.sort()
    };
  }

  return {
    schemaVersion: 1,
    generatedFrom: 'MOI file .css SONG (loai tru: _backup/, _archive/, node_modules/, data/, va file build assets/tailwind.css)',
    scanner: 'scripts/sync-tokens.js',
    usageSources: usageFiles.length,
    cssSources: cssFiles.length,
    totalTokens: order.length,
    tokens
  };
}

module.exports = { ROOT, buildManifest, readCssFiles, collectFiles, stripComments };
