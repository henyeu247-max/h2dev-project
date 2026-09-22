/* H2Search - G3: filter-search consolidate + /api/search FTS */
(function (global) {
  "use strict";

  var inflight = null;

  function fetchApiSearch(q, limit) {
    if (!q || !q.trim()) return Promise.resolve([]);
    if (inflight) { try { inflight.abort(); } catch (e) {} }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    inflight = ctrl;
    var url = "/api/search?q=" + encodeURIComponent(q.trim()) + "&limit=" + (limit || 8);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : { results: [] }; })
      .then(function (data) {
        inflight = null;
        return Array.isArray(data.results) ? data.results : [];
      })
      .catch(function () {
        inflight = null;
        return [];
      });
  }

  function ftsToSuggestions(rows) {
    return rows.map(function (r) {
      var et = (r.entity_type || "").toLowerCase();
      var icon = et === "channel" ? "📺" : et === "lesson" || et === "video" ? "🎓" : et === "document" ? "📄" : "🔎";
      var href = "#";
      if (et === "channel" && r.entity_id) href = "/#kenh";
      else if (et === "lesson" || et === "video") href = "/lotrinh/" + encodeURIComponent(r.entity_id || "");
      else if (et === "document") href = "/#taolieu";
      return {
        type: "fts",
        icon: icon,
        badge: r.entity_type || "FTS",
        badgeColor: "bg-brand-950/60 text-brand-300 border-brand-800/60",
        title: String(r.title || r.entity_id || "").replace(/<\/?mark>/g, ""),
        sub: String(r.snippet || "").replace(/<\/?mark>/g, "").slice(0, 120),
        searchTerm: String(r.title || ""),
        directUrl: href,
        btnLabel: "Mở ↗",
        priority: 50
      };
    });
  }

  function sortSuggestions(list) {
    return list.slice().sort(function (a, b) {
      return (b.priority || 0) - (a.priority || 0);
    });
  }

  function mergeSuggestions(localList, ftsList, max) {
    var seen = {};
    var out = [];
    function push(item) {
      var key = (item.type || "") + ":" + (item.badge || "") + ":" + (item.title || "").slice(0, 40);
      if (seen[key]) return;
      seen[key] = 1;
      out.push(item);
    }
    (localList || []).forEach(push);
    (ftsList || []).forEach(push);
    return sortSuggestions(out).slice(0, max || 12);
  }

  /* H2DEV 2026-09-23 — GHI CHU (khong xoa, theo dung ky luat NO_DELETE):
   * rowHtml() hien KHONG con duoc goi o dau. Trinh render goi y that su hien nay nam
   * TRUC TIEP trong assets/app/tabs/content.js (buildVideoSearchSuggestions), noi
   * render .js-v-sug-row bang template string — khong goi nguoc ve ham nay.
   * Tham so `jsRowClass` la ten class TRUYEN VAO tu luc goi, nen bo quet HTML<->CSS
   * khong the biet gia tri that => no chi bao "CANH BAO", khong phai loi.
   * => Giu lai lam API du phong. Neu xac nhan khong dung nua thi xoa o dot don dep sau.
   */
  function rowHtml(item, idx, jsRowClass) {
    var title = global.H2UICore && global.H2UICore.highlightQuery ? global.H2UICore.highlightQuery(item.title, item.searchTerm) : item.title;
    return (
      '<button type="button" class="' + jsRowClass + " px-3.5 py-2.5 hover:bg-[#1e293b] cursor-pointer flex items-center justify-between gap-3 transition-colors group\" data-idx=\"" + idx + '" data-href="' + (item.directUrl || "#") + '" data-sku="' + (item.sku || "") + '" data-raw="' + (item.rawId || "") + '" data-term="' + (item.searchTerm || "") + '">' +
      '<span class="min-w-0 flex-1 text-left">' +
      '<span class="block text-[13px] text-white truncate">' + (item.icon || "") + " " + title + "</span>" +
      '<span class="block text-[11px] text-gray-400 truncate">' + (item.sub || "") + "</span>" +
      "</span>" +
      '<span class="shrink-0 text-[10px] font-mono border rounded px-1.5 py-0.5 ' + (item.badgeColor || "") + '">' + (item.badge || "") + "</span>" +
      "</button>"
    );
  }

  global.H2Search = {
    fetchApiSearch: fetchApiSearch,
    ftsToSuggestions: ftsToSuggestions,
    mergeSuggestions: mergeSuggestions,
    sortSuggestions: sortSuggestions,
    rowHtml: rowHtml
  };
})(typeof window !== "undefined" ? window : globalThis);
