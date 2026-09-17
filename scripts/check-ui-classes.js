#!/usr/bin/env node
/**
 * check-ui-classes.js — Guard chống tái phát lỗi "CSS build cũ / thiếu class".
 *
 * Bối cảnh (KE-HOACH-SUA-CHUA-TOAN-DIEN-2026-08-27.md, mục B8):
 *   - assets/tailwind.css từng bị build cũ hàng chục ngày, hàng trăm class
 *     Tailwind dùng trong HTML không tồn tại trong CSS thật được nạp.
 *   - Checker cũ (check-ui-full.js) đã kiểm file CSS mồ côi (app.css) nên báo
 *     "OK" giả, và sau đó bị xóa hẳn khỏi repo.
 *
 * Cách làm đúng: với từng trang HTML, parse chính các <link rel="stylesheet">
 * mà trang đó nạp, rồi đối chiếu danh sách class thực dùng trong trang với
 * union CSS thật sự được nạp. Class nào thiếu => báo lỗi.
 *
 * Nguồn class được quét:
 *   1. class="..." tĩnh và class="...${...}..." (bỏ phần ${} động, giữ phần tĩnh)
 *   2. class=`...` template literal (bỏ phần ${} động)
 *   3. Các biến gán danh sách class động đã biết: badgeColor, badge, cls
 *   4. Quét thêm assets/*.js đã nạp bởi trang (nếu có) để bắt class trong JS
 *
 * Xuất: 0 = sạch; 1 = có class thiếu (in rõ trang / class).
 * Dùng: node scripts/check-ui-classes.js [--json]
 *
 * Tích hợp: được gọi tự động trong scripts/validate-project.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'player.html', 'learn.html'];

// Class dựng động hoàn toàn trong runtime (không thể suy ra từ source) —
// thêm vào đây CHỈ KHI có bằng chứng cụ thể, kèm lý do.
const ALLOWLIST = new Set([
  // Hook JS đã kiểm chứng bằng tay: mọi nơi dùng đều style="" inline hoặc utility Tailwind đầy đủ,
  // tên class chỉ để JS query (index.html: querySelector('.sub-tab-btn'), '.btn-open-video-sub').
  'sub-tab-btn',
  'btn-open-video-sub',
  // Các hook JS khác (đã xác minh tương tự, không cần CSS):
  'btn-copy-combined-prompt', 'btn-copy-context', 'btn-copy-full-packaging',
  'btn-copy-master-prompt', 'btn-copy-scene', 'btn-copy-speech-block',
  'btn-copy-thumb-prompt', 'btn-copy-visual-kit', 'btn-copy-visual-prompt',
  'btn-copy-voice-design',
]);

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

/** Trả về danh sách href CSS mà trang nạp (đã bỏ query string). */
function linkedStylesheets(html) {
  const hrefs = [];
  const re = /<link\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!/rel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const hm = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!hm) continue;
    let href = hm[1].split('?')[0].split('#')[0];
    if (href.startsWith('http://') || href.startsWith('https://')) continue; // external
    if (href.startsWith('/')) href = href.slice(1);
    hrefs.push(href);
  }
  return hrefs;
}

/** Các JS mà trang nạp (src trong <script>), để quét class động trong JS. */
function linkedScripts(html) {
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let src = m[1].split('?')[0];
    if (/^https?:/.test(src)) continue;
    if (src.startsWith('/')) src = src.slice(1);
    out.push(src);
  }
  return out;
}

/** Trích các token class literal từ một đoạn source. */
function classTokens(src) {
  const tokens = new Set();

  // Bỏ phần nội suy động ${...} với cân bằng ngoặc (tránh cắt sai).
  const stripInterpolation = (s) => {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '$' && s[i + 1] === '{') {
        let depth = 1;
        i += 2;
        while (i < s.length && depth > 0) {
          if (s[i] === '{') depth++;
          else if (s[i] === '}') depth--;
          i++;
        }
        i--;
        out += ' ';
      } else {
        out += s[i];
      }
    }
    return out;
  };

  const pushList = (s) => {
    let text = String(s);
    // ES5 nối chuỗi: class="ltag ' + bc + '" → bỏ hẳn cụm ' + <biến JS> + ', giữ phần literal
    if (text.includes('+')) {
      text = text.replace(/'\s*\+\s*[^+']*?\s*\+\s*'/g, ' ');
      text = text.replace(/"\s*\+\s*[^+"]*?\s*\+\s*"/g, ' ');
    }
    const cleaned = stripInterpolation(text);
    for (const t of cleaned.split(/\s+/)) {
      if (t) tokens.add(t);
    }
  };

  // 1) class="..." (double-quoted) — cho phép ' bên trong
  for (const m of src.matchAll(/class\s*=\s*"([^"]*)"/g)) pushList(m[1]);
  // 2) class='...' (single-quoted) — cho phép " bên trong
  for (const m of src.matchAll(/class\s*=\s*'([^']*)'/g)) pushList(m[1]);
  // 3) class=`...` (template literal JS)
  for (const m of src.matchAll(/class\s*=\s*`([^`]*)`/g)) pushList(m[1]);
  // 3b) class="foo ' + varName + '" — nối chuỗi kiểu ES5:
  //     bóc phần chuỗi literal trong các biểu thức nối class.
  const CONCAT_RE = /class\s*=\s*"([^"]*)"/g;
  for (const m of src.matchAll(/class\s*=\s*(['"])((?:\\.|(?!\1)[^\\])*?)\1/g)) pushList(m[2]);
  // 4) Các biến class-list đã biết (không nhận biến không phải class-list)
  const CLASS_LIST_VARS = /\b(?:badgeColor|badgeCls)\s*[:=]\s*['"`]([^'"`]+)['"`]/g;
  for (const m of src.matchAll(CLASS_LIST_VARS)) pushList(m[1]);
  return tokens;
}

/** Tập class có trong nội dung CSS (đã unescape tên class). */
function cssClassSet(css) {
  const out = new Set();
  // .class-name  với escape \: \/ \[ \] \. \% \# \( \) \, \! ... 
  const re = /\.((?:\\.|[A-Za-z0-9_-])+)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const raw = m[1].replace(/\\/g, '');
    out.add(raw);
  }
  return out;
}

/**
 * Lọc token để chỉ giữ những cái "có khả năng là class CSS cần style":
 * - không chứa ký tự lạ kiểu $ { } < > " '
 * - không phải số thuần / chuỗi quá dài
 * - với asset hash kiểu "ch-abc123.jpg" thì bỏ (đuôi file)
 * - bỏ emoji, chuỗi tiếng Việt, toán tử JS, dấu câu đơn lẻ
 */
function looksLikeClass(t) {
  if (!t || t.length > 80) return false;
  if (/[${}<>"'`;(),?!|&+*=~^%]/.test(t)) return false;
  if (/\.(png|jpg|jpeg|svg|webp|mp4|mp3|json|md|html|css|js|woff2?)$/i.test(t)) return false;
  if (/^(https?|\/\/)/.test(t)) return false;
  // emoji / ký tự ngoài ASCII + chữ Latin có dấu (tiếng Việt trong text lọt ra)
  if (/[^\u0000-\u007F\u0100-\u01FF\u1EA0-\u1EFF]/.test(t)) return false;
  // token phải bắt đầu bằng chữ cái (class Tailwind/custom đều vậy)
  if (!/^[A-Za-z]/.test(t)) return false;
  return true;
}

/**
 * Class là "hook JS" thuần: chỉ dùng làm selector trong JS hoặc style bằng style="" inline.
 * - js-* : hook JS (mở modal, xử lý click) — không cần CSS.
 * - Các class btn-* đặc thù (copy prompt, open video sub) cũng là hook JS:
 *   kiểm tra bằng bằng chứng "mọi chỗ dùng đều kèm style=... inline".
 * Hàm nhận (token, html) và kiểm tra usage trong html.
 */
function isJsHookToken(t, html) {
  if (/^js-/.test(t)) return true;
  if (/^data-/.test(t)) return true;
  // btn-* hook: nếu MỌI lần xuất hiện trong class= đều có style="" cùng thẻ -> hook
  if (/^btn-/.test(t)) {
    const re = new RegExp('<' + '[a-z]+\\b[^>]*class="[^"]*\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b[^"]*"[^>]*>', 'gi');
    const tags = html.match(re) || [];
    if (tags.length === 0) return false;
    const allInline = tags.every(tag => /\bstyle\s*=/.test(tag));
    if (allInline) return true;
  }
  return false;
}

function main() {
  const jsonMode = process.argv.includes('--json');
  const report = [];
  let totalMissing = 0;

  for (const page of PAGES) {
    const pagePath = path.join(ROOT, page);
    const html = readFileSafe(pagePath);
    if (html === null) continue; // trang không tồn tại -> bỏ qua

    const cssFiles = linkedStylesheets(html);
    const jsFiles = linkedScripts(html);

    // union CSS nạp bởi trang này
    const cssUnion = new Set();
    for (const rel of cssFiles) {
      const css = readFileSafe(path.join(ROOT, rel));
      if (css === null) {
        report.push({ page, kind: 'missing-css-file', detail: rel });
        totalMissing += 1;
        continue;
      }
      for (const c of cssClassSet(css)) cssUnion.add(c);
    }

    // token từ HTML của trang
    const tokens = classTokens(html);
    // token từ JS mà trang nạp
    for (const rel of jsFiles) {
      const js = readFileSafe(path.join(ROOT, rel));
      if (js) for (const t of classTokens(js)) tokens.add(t);
    }
    // JS dùng trong index.html nhưng nạp bằng đường dẫn khác (music modal)
    const extraJs = ['assets/music_player_modal.js'];
    for (const rel of extraJs) {
      const js = readFileSafe(path.join(ROOT, rel));
      if (js && html.includes(path.basename(rel))) {
        for (const t of classTokens(js)) tokens.add(t);
      }
    }

    const missing = [];
    const warnings = [];
    // Tiền tố class Tailwind hợp lệ — dùng để phân biệt utility (FAIL) vs custom (WARN)
    const TW_UTIL = /^(?:[a-z-]+:)*(?:bg|text|border|divide|ring|outline|shadow|from|via|to|fill|stroke|decoration|accent|caret|placeholder|font|leading|tracking|indent|align|whitespace|break|truncate|overflow|object|aspect|grid|col|row|auto|flex|basis|grow|shrink|order|justify|content|items|self|place|gap|space|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|min-w|max-w|h|min-h|max-h|size|inset|top|bottom|left|right|z|rounded|opacity|cursor|select|pointer|sr|inline|block|hidden|table|list|transition|duration|delay|ease|animate|transform|translate|scale|rotate|skew|origin|backdrop|filter|blur|brightness|contrast|saturate|sepia|hue|grayscale|invert|mix|isolation|container|prose|line-clamp|antialiased|subpixel)/;
    for (const t of tokens) {
      if (!looksLikeClass(t)) continue;
      if (ALLOWLIST.has(t)) continue;
      if (isJsHookToken(t, html)) continue;
      if (cssUnion.has(t)) continue;
      (TW_UTIL.test(t) ? missing : warnings).push(t);
    }
    missing.sort();
    warnings.sort();
    if (missing.length) {
      totalMissing += missing.length;
      report.push({ page, kind: 'missing-classes', count: missing.length, classes: missing, warnings });
    } else {
      report.push({ page, kind: 'ok', cssFiles, jsFiles, warnings });
    }
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify({ totalMissing, report }, null, 2) + '\n');
  } else {
    console.log('[ui-classes] Kiểm tra class HTML <-> CSS thật được nạp');
    for (const r of report) {
      if (r.kind === 'ok') {
        console.log(`  [OK]      ${r.page}  (css: ${r.cssFiles.join(', ')})`);
      } else if (r.kind === 'missing-css-file') {
        console.log(`  [LỖI]     ${r.page}  thiếu file CSS: ${r.detail}`);
      } else {
        console.log(`  [THIẾU]   ${r.page}  ${r.count} class utility không có trong CSS được nạp:`);
        for (const c of r.classes) console.log(`              .${c}`);
      }
      if (r.warnings && r.warnings.length) {
        console.log(`  [CẢNH BÁO] ${r.page}  ${r.warnings.length} class custom chưa có CSS (kiểm tra thủ công):`);
        for (const c of r.warnings) console.log(`              .${c}`);
      }
    }
    console.log(totalMissing === 0
      ? '[ui-classes] OK — mọi class utility dùng trong HTML đều tồn tại trong CSS thật.'
      : `[ui-classes] THẤT BẠI — tổng ${totalMissing} class utility thiếu CSS.`);
  }

  process.exitCode = totalMissing === 0 ? 0 : 1;
}

main();
