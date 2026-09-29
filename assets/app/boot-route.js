/* H2DEV boot-route (2026-09-30) — chay DONG BO ngay sau </header> trong index.html, TRUOC lan ve dau.
 * Ly do: /chienluoc co thanh tab phu trong topbar (cao +55px @1280). main.js nap cuoi <body> nen trinh duyet
 * co the ve trang 1 lan TRUOC khi main.js dung subnav -> #panel-root bi day xuong (CLS 0.0345, do tren 5/5 lan).
 * File nay chi bat san cac class giu cho; noi dung subnav van do main.js (syncTopbarSubnav) dung. */
(function () {
  try {
    var p = location.pathname.replace(/\/+$/, "");
    var q = new URLSearchParams(location.search);
    var isCl = /^\/chienluoc$/i.test(p) || ((p === "" || /^\/index\.html$/i.test(p)) && q.get("tab") === "chienluoc");
    if (!isCl) return;
    var tb = document.getElementById("vd-topbar");
    var sub = document.getElementById("topbar-subnav");
    var shell = document.querySelector(".app-shell");
    if (tb) tb.classList.add("has-subnav");
    if (sub) sub.classList.remove("hidden");
    if (shell) shell.classList.add("has-topbar-subnav");
  } catch (e) {}
})();
