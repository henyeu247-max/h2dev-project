/* H2SearchCore - tokenize + AND matchScore (port FckSignups useTools.ts) */
(function (global) {
  "use strict";

  /* FIX 2026-09-30 (UI-01): "phat phap" (khong dau) truoc day ra 0/140 trong khi "Phật pháp" ra 3.
   * Hop dong chuan hoa (1 nguon cho index, goi y va loc):
   *  - Chuan hoa NFC + lowercase ca query lan du lieu (tranh lech NFC/NFD).
   *  - Token KHONG co dau (vd "phat")  -> so tren ban da BO DAU cua du lieu (khop "Phật", "phát"...).
   *  - Token CO dau (vd "phật")        -> so chinh xac tren du lieu goc (giu do chinh xac).
   *  - Chi bo dau Latin (U+0300-U+036F) + d/D: KHONG dung vao dakuten Nhat (U+3099/309A),
   *    chu Han/Kana/Thai/Cyrillic giu nguyen.
   *  - Query chi co dau cau (vd "!!!") -> 0 token -> KHONG loc (hanh vi co chu dich, giu nhu cu). */
  function lowerNFC(text) {
    return String(text == null ? "" : text).normalize("NFC").toLowerCase();
  }

  function fold(text) {
    return lowerNFC(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0111/g, "d")
      .normalize("NFC");
  }

  function hasMarks(token) {
    var t = lowerNFC(token);
    return fold(t) !== t;
  }

  /** Split into lowercase keyword tokens, Unicode-aware:
   *  giu nguyen chu co dau (tieng Viet) + chu Han/Kana/Cyrillic (SCAR 28/09: /[^a-z0-9+]+/ bien "phật" thanh token rac ["ph","t"]). */
  function tokenize(text) {
    return lowerNFC(text)
      .split(/[^\p{L}\p{N}\p{M}+]+/u)
      .filter(Boolean);
  }

  function haystackOf(parts) {
    return lowerNFC(parts
      .map(function (p) { return p == null ? "" : String(p); })
      .join(" "))
      .replace(/[^\p{L}\p{N}\p{M}+]+/gu, " ");
  }

  function tokenIn(hay, hayFold, kw) {
    return hasMarks(kw) ? hay.indexOf(kw) >= 0 : hayFold.indexOf(kw) >= 0;
  }

  /** Number of query keywords found in haystack. */
  function matchScore(parts, keywords) {
    if (!keywords || !keywords.length) return 0;
    var hay = haystackOf(parts);
    var hayFold = fold(hay);
    return keywords.filter(function (kw) { return tokenIn(hay, hayFold, kw); }).length;
  }

  /** FckSignups rule: keep item only if score == keywords.length (AND). */
  function matchesQuery(parts, query) {
    var keywords = tokenize(query);
    if (!keywords.length) return true;
    return matchScore(parts, keywords) === keywords.length;
  }

  /** Substring (cho goi y): cung hop dong dau/khong dau voi matchesQuery. */
  function includes(text, query) {
    var q = lowerNFC(query).trim();
    if (!q) return true;
    var t = lowerNFC(text);
    return hasMarks(q) ? t.indexOf(q) >= 0 : fold(t).indexOf(q) >= 0;
  }

  /** Score + sort helpers */
  function rankByScoreThen(items, scoreOf, secondaryOf) {
    return items.slice().sort(function (a, b) {
      var d = (scoreOf(b) || 0) - (scoreOf(a) || 0);
      if (d) return d;
      return (secondaryOf(b) || 0) - (secondaryOf(a) || 0);
    });
  }

  /** padStart(2) count for chips — FckSignups ToolFilters */
  function pad2(n) {
    return String(n == null ? 0 : n).padStart(2, "0");
  }

  global.H2SearchCore = {
    tokenize: tokenize,
    fold: fold,
    includes: includes,
    matchScore: matchScore,
    matchesQuery: matchesQuery,
    rankByScoreThen: rankByScoreThen,
    pad2: pad2
  };
})(typeof window !== "undefined" ? window : globalThis);
