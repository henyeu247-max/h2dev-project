/* H2SearchCore - tokenize + AND matchScore (port FckSignups useTools.ts) */
(function (global) {
  "use strict";

  /** Split into lowercase alphanumeric keywords: "video-editor" / "Video Editor" -> ["video","editor"] */
  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter(Boolean);
  }

  function haystackOf(parts) {
    return parts
      .map(function (p) { return p == null ? "" : String(p); })
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9+]+/g, " ");
  }

  /** Number of query keywords found in haystack. */
  function matchScore(parts, keywords) {
    if (!keywords || !keywords.length) return 0;
    var hay = haystackOf(parts);
    return keywords.filter(function (kw) { return hay.indexOf(kw) >= 0; }).length;
  }

  /** FckSignups rule: keep item only if score == keywords.length (AND). */
  function matchesQuery(parts, query) {
    var keywords = tokenize(query);
    if (!keywords.length) return true;
    return matchScore(parts, keywords) === keywords.length;
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
    matchScore: matchScore,
    matchesQuery: matchesQuery,
    rankByScoreThen: rankByScoreThen,
    pad2: pad2
  };
})(typeof window !== "undefined" ? window : globalThis);
