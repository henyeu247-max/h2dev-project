/* H2Icons - G? (PHASE 3, 2026-09-23): ten icon CHUAN cho TABS[].
 *
 * LY DO TACH RIENG (khong de trong main.js):
 *   index.html nap h2dev-core.js -> taxonomy.js -> ui-core.js -> search-core.js -> nav.js
 *   -> content.js -> modals/raw-deep.js -> search.js -> main.js
 * TABS[] nam trong main.js (nap CUOI). Nav/search chay TRUOC khi co TABS nen khong the
 * doc nguoc tu main.js. De 1 file khai bao ten icon, moi noi nap TRUOC deu doc duoc
 * => mot chuan duy nhat, khong con ICONS.<key> = chuoi <svg> inline trong main.js.
 *
 * QUY TAC: chi khai bao TEN icon (kebab-case) => assets/icons/<ten>.svg (h2dev-icons.css).
 * KHONG khai bao SVG inline o day.
 */
(function (global) {
  'use strict';

  var NAMES = {
    home: 'home',
    video: 'video',
    niche: 'circle',
    doc: 'file-text',
    music: 'music',
    link: 'link',
    channel: 'tv',
    image: 'image',
    strategy: 'map',
    grid: 'layout-grid',
    /* 2026-09-24 (P3.6d) — BOSUNG 2 key BI THIEU:
     * content.js co goi ICONS.disk (the "Dung luong dia") va ICONS.search
     * (the "Dang hoat dong" / "Co OCR") nhung NAMES khong khai bao
     * => undefined => the KPI MAT ICON hoan toan (da kiem chung bang DOM that).
     * Ten icon lay dung tu assets/icons/ (da co san, khong tai moi). */
    disk: 'hard-drive',
    search: 'search'
  };

  function ico(name, size) {
    return '<span class="h2-icon h2-icon--' + (size || 16) + '" data-h2i="' + String(name) + '" aria-hidden="true"></span>';
  }

  /* Icon co MAU: .h2-icon = background-color:currentColor => doi mau bang `color` span boc ngoai. */
  function icoColored(name, color, size) {
    return '<span style="color:' + color + ';display:inline-flex;align-items:center;" aria-hidden="true">' + ico(name, size || 16) + '</span>';
  }

  global.H2Icons = { NAMES: NAMES, ico: ico, icoColored: icoColored };
})(typeof window !== 'undefined' ? window : globalThis);
