/* H2Search - G3: filter-search consolidate + /api/search FTS */
(function (global) {
  "use strict";

  var inflight = null;

  /* FIX (uifix87) LỖI 3 — truoc day: `r.ok ? r.json() : {results:[]}` => HTTP 5xx bi bien thanh
   * "khong co ket qua". Nay: phan biet ro 4 truong hop
   *   1) 2xx, khong co `error` -> { rows }                         (rong = that su 0 ket qua)
   *   2) 2xx, CO `error`      -> { rows, warning }                 (server tra rows goc + loi enrich;
   *                              vd thieu du lieu dieu huong => client PHAI canh bao, khong duoc im lang)
   *   3) HTTP >= 400          -> reject Error h2SearchServiceError = true (banner loi trong dropdown)
   *   4) loi mang/abort       -> { rows: [] } (khong phai loi dich vu, tranh banner gia khi offline)
   * Doi shape tu mang -> object { rows, warning }: 2 noi goi trong tabs/content.js da cap nhat. */
  function fetchApiSearch(q, limit) {
    if (!q || !q.trim()) return Promise.resolve({ rows: [], warning: "" });
    if (inflight) { try { inflight.abort(); } catch (e) {} }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    inflight = ctrl;
    var url = "/api/search?q=" + encodeURIComponent(q.trim()) + "&limit=" + (limit || 8);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (!r.ok) {
          return r.json().catch(function () { return {}; }).then(function (data) {
            var err = new Error((data && data.error) || ("HTTP " + r.status));
            err.h2SearchServiceError = true;
            err.h2Status = r.status;
            throw err;
          });
        }
        return r.json().then(function (data) {
          return {
            rows: Array.isArray(data && data.results) ? data.results : [],
            warning: (data && typeof data.error === "string") ? data.error : ""
          };
        });
      })
      .then(function (out) {
        if (inflight === ctrl) inflight = null;
        return out;
      })
      .catch(function (err) {
        if (inflight === ctrl) inflight = null;
        if (err && err.h2SearchServiceError) throw err;
        return { rows: [], warning: "" };
      });
  }

  /* FIX (uifix88) LỖI F1 — moi entity_type cua search_fts phai mo dung MOT muc, dieu huong bang ID
   * (khong con loc theo ten/chuoi con). Bang chung DB (data/h2dev_master.db, doc read-only, 2251 dong):
   *   CHANNEL    386  entity_id = channel_id (UC...), title = ten kenh
   *   LESSON     144  entity_id = SKU VIDEO-xxxxxx (144/144 co trong data/catalog.json => co trang player)
   *   SOP        300  entity_id = DOC_n (khop documents.doc_id 300/300; title = documents.name)
   *   TRANSCRIPT 1421 entity_id = video_id YouTube, title = ten video doi thu
   *   (khong co entity_type DOCUMENT/VIDEO trong DB — nhanh 'document' cu la code chet, href sai chinh ta)
   * Router (assets/app/main.js#readStateFromURL) chi doc pathname + query, KHONG doc hash => bo het href "/#...".
   *
   * Vi sao phai dung ID: do that tren TOAN BO 2251 dong (uifix87 loc theo ten):
   *   SOP "Bản ghi phụ đề đầy đủ (Transcript timestamped .txt)" co 17 muc TRUNG TEN -> pq=<ten> ra 17 muc.
   *   CHANNEL 6/149 ho so co ten trung tien to -> rq=<ten> ra nhieu ho so (vd BeyondTheBlue ra 3).
   *   CHANNEL handle: kq=@weirdhistory khop ca @weirdhistoryfood (loc chuoi con).
   *   TRANSCRIPT truoc day mo theo TEN KENH CHA -> ca kenh (nhieu pho), khong phai video/muc can xem.
   *
   * Hop dong dich (moi cai deu la ID that, khong phai chuoi tim kiem):
   *   CHANNEL  co raw_id        -> /rawkenh?rid=<RAW-nnn>     tab Raw loc DUNG 1 ho so theo id
   *   CHANNEL  khong co raw_id  -> /kenh-mau?handle=<@handle>  tab Kenh mau khop TUYET DOI handle
   *   TRANSCRIPT                -> /rawkenh?rid=<parent_raw_id>  mo dung ho so kenh CHA cua video
   *   SOP                       -> /tai-lieu?did=<DOC_n>        tab Tai lieu loc DUNG 1 muc theo doc id
   *   LESSON                    -> /lotrinh/<SKU>              trang player 1 bai (server validate SKU)
   * Khong co du lieu de mo -> dest = null => directUrl rong, UI khong render nut "Mo" (khong co link gia). */
  function ftsDestination(et, r) {
    var id = String(r.entity_id || "").trim();
    var rawId = String(r.raw_id || "").trim();
    var parentRawId = String(r.parent_raw_id || "").trim();
    var kenhHandle = String(r.kenh_handle || "").trim();
    if (et === "channel") {
      if (rawId) return { href: "/rawkenh?rid=" + encodeURIComponent(rawId), label: "Mở đúng hồ sơ kênh raw ↗", rawId: rawId };
      if (kenhHandle) return { href: "/kenh-mau?handle=" + encodeURIComponent(kenhHandle), label: "Mở đúng kênh trong tab Kênh mẫu ↗", rawId: "" };
      /* 0/386 kenh roi vao day (do that: 149 co raw_id + 237 co handle trong kenh-mau = 386/386).
         Giu nhanh null de khong bao gio sinh link gia. */
      return null;
    }
    if ((et === "lesson" || et === "video") && /^(?:VIDEO|ZOOM|HUAN|DGMD)-[A-Za-z0-9-]+$/i.test(id)) {
      return { href: "/lotrinh/" + encodeURIComponent(id), label: "Mở bài học ↗", rawId: "" };
    }
    if (et === "sop" && /^DOC_\d+$/.test(id)) {
      /* Tab Tai lieu render tu data-tabs/tai-lieu-full.json (khong tu DB) => can ca doc_id (nhan/kiem)
         VA vi tri trong JSON (di) de mo dung 1 muc. server bo sung doc_index (do that 300/300). */
      var docIdx = (typeof r.doc_index === "number") ? r.doc_index : -1;
      if (docIdx < 0) return null;
      return { href: "/tai-lieu?did=" + encodeURIComponent(id) + "&di=" + docIdx, label: "Mở đúng tài liệu trong tab Tài liệu ↗", rawId: "" };
    }
    if (et === "transcript" && parentRawId) {
      return { href: "/rawkenh?rid=" + encodeURIComponent(parentRawId), label: "Mở đúng kênh chứa video ↗", rawId: parentRawId };
    }
    if (et === "policy") {
      return { href: "/chienluoc?sub=policy", label: "Mở trụ cột Chính sách YouTube 2026 ↗", rawId: "" };
    }
    if (et === "checklist") {
      return { href: "/chienluoc?sub=policy", label: "Mở Checklist Trước Khi Đăng ↗", rawId: "" };
    }
    if (et === "niche") {
      var nName = String(r.niche_name || r.title || "").replace(/^\[[^\]]+\]\s*/, "").trim();
      return { href: "/ngachxanh" + (nName ? ("?niche=" + encodeURIComponent(nName)) : ""), label: "Mở đúng Ngách Xanh ↗", rawId: "" };
    }
    if (et === "reup") {
      return { href: "/nguonreup", label: "Mở Kho Nguồn Reup ↗", rawId: "" };
    }
    return null;
  }

  function ftsToSuggestions(rows) {
    return (rows || []).map(function (r) {
      var et = (r.entity_type || "").toLowerCase();
      /* PHASE 3 (2026-09-23): icon = TEN icon (he CSS mask), khong dung emoji. */
      var icon = et === "channel" ? "tv" : et === "lesson" || et === "video" ? "graduation-cap" : et === "sop" ? "file-text" : et === "transcript" ? "scroll-text" : et === "policy" ? "shield" : et === "checklist" ? "check" : et === "niche" ? "flame" : et === "reup" ? "layers" : "search";
      var badge = r.entity_type || "FTS";
      var dest = ftsDestination(et, r);
      return {
        type: "fts",
        icon: icon,
        badge: badge,
        badgeColor: "bg-brand-950/60 text-brand-300 border-brand-800/60",
        title: String(r.title || r.entity_id || "").replace(/<\/?mark>/g, ""),
        sub: String(r.snippet || "").replace(/<\/?mark>/g, "").slice(0, 120),
        searchTerm: String(r.title || r.entity_id || "").replace(/<\/?mark>/g, ""),
        rawId: dest && dest.rawId ? dest.rawId : "",
        directUrl: dest ? dest.href : "",
        btnLabel: dest ? dest.label : "",
        /* F3: dong KHONG co dich that -> UI khong duoc cho bam ra ket qua rong gia. */
        noDest: !dest,
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
      var urlKey = item.directUrl ? ("url:" + item.directUrl) : "";
      var titleKey = "t:" + String(item.title || "").trim().toLowerCase().slice(0, 50);
      var key = (item.type || "") + ":" + (item.badge || "") + ":" + (item.title || "").slice(0, 40);
      if (seen[key] || (urlKey && seen[urlKey]) || (item.type === "fts" && seen[titleKey])) return;
      seen[key] = 1;
      seen[titleKey] = 1;
      if (urlKey) seen[urlKey] = 1;
      out.push(item);
    }
    (localList || []).forEach(push);
    (ftsList || []).forEach(push);
    return sortSuggestions(out).slice(0, max || 12);
  }

  /* FIX (uifix87) LỖI 3 — banner loi ngan trong dropdown goi y (dung class san co, khong mau hex).
   * Goi tu content.js khi fetchApiSearch reject vi dich vu loi.
   *
   * FIX (uifix88) F3/F4 — truoc day banner duoc CHEN thang vao DOM, roi lan render ke tiep cua dropdown
   * (`box.innerHTML = ...`) XOA MAT, va dong "Khong tim thay goi y" nam lai duoi banner loi => mau thuan.
   * Nay trang thai banner luu theo hop (box id); content.js render banner bang ftsNoticesHtml(boxId)
   * trong CHINH markup cua no, nen khong bao gio mat va khong bao gio mau thuan. */
  var boxNotices = (global._h2FtsNotices = global._h2FtsNotices || {});
  function noticeState(box) {
    var id = (box && box.id) || "h2-sug-box";
    if (!boxNotices[id]) boxNotices[id] = { error: "", warn: "" };
    return boxNotices[id];
  }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function ftsNoticesHtml(boxId) {
    var s = boxNotices[boxId || ""];
    if (!s) return "";
    var out = "";
    if (s.error) out += '<div class="js-fts-error px-3.5 py-2 text-xs text-red-300 flex items-center gap-1.5 bg-surface" role="status">' + escHtml(s.error) + "</div>";
    if (s.warn) out += '<div class="js-fts-warn px-3.5 py-2 text-xs text-amber-300 flex items-center gap-1.5 bg-surface" role="status">' + escHtml(s.warn) + "</div>";
    return out;
  }
  function clearFtsNotices(box) {
    if (!box) return;
    var s = noticeState(box);
    s.error = "";
    s.warn = "";
  }
  /* Ghi trang thai banner vao DOM NGAY (khong doi lan render markup ke tiep). */
  function applyNotices(box) {
    if (!box) return;
    var old = box.querySelectorAll(".js-fts-error, .js-fts-warn");
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
    var html = ftsNoticesHtml(box.id);
    if (html) box.insertAdjacentHTML("afterbegin", html);
    box.classList.remove("hidden");
  }
  function showFtsError(box, err) {
    if (!box) return;
    var s = noticeState(box);
    s.error = "Tìm kiếm toàn văn đang lỗi — chỉ hiển thị gợi ý cục bộ. Thử lại sau." + (err && err.h2Status ? " (HTTP " + err.h2Status + ")" : "");
    applyNotices(box);
  }

  /* FIX (uifix88) F3 — server tra 200 nhung co truong `error` (vd 'enrich: ...'): ket qua thieu du lieu
   * dieu huong. Truoc day client nuot `error` => nguoi dung bam dong FTS va roi vao ket qua rong.
   * Nay hien banner canh bao (mau AMBER, class co san) va dong nao khong co dich thi ghi ro. */
  function showFtsNotice(box, warning) {
    if (!box || !warning) return;
    var s = noticeState(box);
    /* Khong ghi de canh bao da co (vd thong diep enrich chi tiet hon) — chi bo sung khi dang trong. */
    if (!s.warn) {
      s.warn = "Kết quả toàn văn bị thiếu dữ liệu điều hướng — dòng không có đích sẽ không mở được. (" + String(warning).slice(0, 120) + ")";
    }
    applyNotices(box);
  }

  global.H2Search = {
    fetchApiSearch: fetchApiSearch,
    ftsToSuggestions: ftsToSuggestions,
    ftsDestination: ftsDestination,
    mergeSuggestions: mergeSuggestions,
    sortSuggestions: sortSuggestions,
    showFtsError: showFtsError,
    showFtsNotice: showFtsNotice,
    ftsNoticesHtml: ftsNoticesHtml,
    clearFtsNotices: clearFtsNotices
  };
})(typeof window !== "undefined" ? window : globalThis);
