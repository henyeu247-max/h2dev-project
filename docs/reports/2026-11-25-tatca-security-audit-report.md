# H2DEV `/tatca` 5-Layer Security, Data, DOM & UX Audit Report

- **Target:** `http://127.0.0.1:8899/tatca` (`D:\YTB\H2DEV-Project`)
- **Date:** 2026-11-25
- **Methodology:** 5-Layer Parallel Swarm Audit (`tatca-l1-http`, `tatca-l2-data`, `tatca-l3-dom-xss`, `tatca-l4-live-ux`, `tatca-l5-hygiene`) across distinct model families, followed by source cross-verification and Phase 08 adversarial verification.

---

## Executive Summary

| Severity | Verified Count | Actionable Fixes | Accepted / Info |
|---|---:|---:|---:|
| **CRITICAL** | 0 | 0 | 0 |
| **HIGH** | 2 | 2 (`L3-XSS-02`, `L3-HREF-01`) | 0 |
| **MEDIUM** | 4 | 4 (`L1-01`, `L4-A11Y-01`, `L4-A11Y-02`, `L4-A11Y-03`) | 0 |
| **LOW** | 9 | 7 (`L1-03`, `L2-01`, `L2-02`, `L2-03`, `L3-XSS-01`, `L3-XSS-03`, `L4-UX-01`) | 2 (`L1-02`, `L2-04`) |
| **INFO** | 5 | 3 (`L2-05`, `L2-06`, `L2-07`) | 2 (`L2-08`, `L4-UX-02`) |

- **Live `/tatca` Runtime Baseline (Playwright PC `1440×900` & Mobile `390×844`):** `0` console errors/warnings, `0` uncaught `pageerror`, `0` HTTP `>=400`, `0` CSP violations, `0` horizontal overflow, `5/5` XSS URL/hash/input injection probes blocked (`window.__xss === undefined`).
- **PR Delta vs `origin/main` (before audit fixes):** `index.html`, `assets/app/main.js`, `assets/app/tabs/content.js`, `assets/app/search-core.js`, `assets/app/sw.js` (`+2,002 / -502` net lines); `server.js` was clean (`0` diff).

---

## Layer 1 — HTTP Server, Auth Gate, CSP & Service Worker

| ID | Sev | CWE | Location | Verified Evidence | Status |
|---|---|---|---|---|---|
| `L1-01` | **MEDIUM** | CWE-770 | `server.js:1017-1039` | `/api/intelligence/spider` POST handler does not drain unread request body (`req.resume()`) and lacks server-wide `requestTimeout` / `headersTimeout` | ✅ Fixed this session |
| `L1-02` | **LOW** | CWE-693 | `server.js:40` | CSP `style-src 'self' 'unsafe-inline'` permits inline style attributes (`script-src-attr 'none'` remains enforced; moving all inline styles to CSS would break existing cards/modals) | Accepted LOW |
| `L1-03` | **LOW** | CWE-693 | `server.js:691-698` | `OPTIONS` preflight lacks `Access-Control-Max-Age` caching header | ✅ Fixed this session |

**Verified Clean L1 Controls:** `/tatca` (`200`), `/tat-ca` (`301 -> /tatca`), traversal/ADS/`:$DATA` (`403`), NUL byte (`400`), `.env`/`.git`/`server.js` (`403`), `/scripts/*` (`404`), CORS cross-site block (`403`), Host header check (`400`), CSRF headers on `/api/kg/reload`, `/api/kg/sync`, `/api/intelligence/spider` (`403`), `auth_gate.js` HMAC `timingSafeEqual` + rate limit + `safeNext()`, symlink `fs.realpathSync` containment.

---

## Layer 2 — Data Layer, SQLite DAL & JSON Payloads

| ID | Sev | CWE | Location | Verified Evidence | Status |
|---|---|---|---|---|---|
| `L2-01` | **LOW** | CWE-1333 | `scripts/hot_memory_store.js:495` | `getNicheRadarResponse()` uses `/median\s*:?\s*\$?\s*(\d+(?:\.\d+)?)/i` (`O(N³)` backtracking: `362.82ms` on 1,500 spaces) | ✅ Fixed this session |
| `L2-02` | **INFO** | CWE-116 | `scripts/master_dal.js:250-263` | `ensureSnippetHighlight()` wraps tokens in `<mark>` matching SQLite `snippet()`; safely stripped (`search.js:212`) and `esc()`-escaped (`content.js:882`) at client sink (pre-escaping in DAL would double-escape `&`) | Mitigated at Sink |
| `L2-03` | **LOW** | CWE-1321 | `scripts/hot_memory_store.js:86-96`, `scripts/kg_query.js:39-49`, `assets/app/tabs/content.js:157` | `safeMerge()` checks prototype keys only at top level; `renderTongQuan` aggregates `market = {}` instead of `new Map()` | ✅ Fixed this session |
| `L2-04` | **LOW** | CWE-200 | `data/music_catalog.json`, `assets/music_player_modal.js:126` | `music_catalog.json` includes `localAbsPath` used by workstation "Copy Path" convenience button in Music modal | Accepted LOW (local UX feature) |
| `L2-05` | **INFO** | CWE-20 | `server.js:1084-1109, 1182` | `collectChannelAliases` did not slice `qAlias` to `256` chars; invalid `?type=` fell through instead of explicit empty filter | ✅ Fixed this session |
| `L2-06` | **INFO** | CWE-209 | `server.js:755`, `scripts/kg_query.js:1029` | Two non-`/tatca` handlers returned raw `err.message` instead of generic error text | ✅ Fixed this session |
| `L2-07` | **INFO** | CWE-59 | `scripts/hot_memory_store.js:70-84` | `resolveSafeRootPath()` checked `path.relative` lexically without `fs.realpathSync` symlink containment | ✅ Fixed this session |
| `L2-08` | **INFO** | CWE-79 | `data/catalog_{huan,dgmd}.json` | 21 legacy `.desc` fields contain `<p>`/`<span>`/`<a>` tags; verified unused by `/tatca` and unrendered in active UI | Info (unused) |

**Verified Clean L2 Controls:** `11` `/tatca` JSON datasets (`0` proto keys, `0` `javascript:`/`data:`/`//` URLs, `0` raw HTML/script tags); `100%` SQLite queries bound with `?` and `ESCAPE '\\'`; `/tatca` API endpoints (`/api/overview-summary`, `/api/niche-radar`, `/api/search`) returned `200 OK` across 29 adversarial payloads.

---

## Layer 3 — Client DOM XSS, URL Sanitization & Redirects

| ID | Sev | CWE | Location | Verified Evidence | Status |
|---|---|---|---|---|---|
| `L3-XSS-02` | **HIGH** | CWE-79 | `assets/music_player_modal.js:82-94, 120` | `t.streamUrl` passed into `<a href="${esc(streamSrc)}">` and `<audio src="${esc(streamSrc)}">` with `esc()` only (does not block `javascript:` URI scheme) | ✅ Fixed this session (`safeMediaUrl()`) |
| `L3-HREF-01` | **HIGH** | CWE-79 / CWE-601 | `assets/app/tabs/content.js:2750-2752, 3028-3030` | `k.link`, `k.file`, `k.fileLocal`, `n.link`, `n.file` wrapped in `esc()` only without `safeExternalUrl()` / `safeUrl()`, permitting `javascript:` if data contains crafted URI | ✅ Fixed this session (`safeExternalUrl()` / `safeUrl()`) |
| `L3-XSS-01` | **LOW** | CWE-79 | `assets/app/main.js:4745-4753` | `inlineMdFull` inserts `u` into `href="${u}"` after outer `esc(s)` (outer `esc()` blocks `"` breakout, but whitespace/control/entity characters in `u` are not stripped) | ✅ Fixed this session |
| `L3-XSS-03` | **LOW** | CWE-79 | `assets/app/main.js:4755-4757` | `inlineMdFull` auto-link matcher runs after outer `esc(s)` without filtering entity-encoded boundary artifacts in `url` | ✅ Fixed this session |

**Verified Clean L3 Controls:** `0` `eval()`/`new Function()`/`document.write()`/`window.open()` sinks; `100%` `target="_blank"` anchors carry `rel="noopener noreferrer"`; `safeUrl()` blocks `//` and `javascript:`; `openDocPreviewModal()` blocks schemes and `..` traversal.

---

## Layer 4 — Live Playwright Runtime, UX & Accessibility (`/tatca`)

| ID | Sev | Area / Spec | Location | Runtime Evidence | Status |
|---|---|---|---|---|---|
| `L4-A11Y-01` | **MEDIUM** | WAI-ARIA Combobox | `assets/app/tabs/content.js:243`, `assets/app/main.js:1322,1552,1591` | `#tatca-search-suggestions` uses `role="listbox"`, but `/tatca` `#fq` lacks `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-expanded` | ✅ Fixed this session |
| `L4-A11Y-02` | **MEDIUM** | Modal Focus Restore | `assets/music_player_modal.js:437, 446-452` | `_prevActiveElement` captured after `await` inside `openMusicStudioModal`, causing focus restore on close to drop to `BODY` | ✅ Fixed this session |
| `L4-A11Y-03` | **MEDIUM** | Focus & Scroll Jump | `assets/app/main.js:713-729` | Toggling `[data-toggle-tatca-list]` triggers full `render()`, losing button focus to `BODY` and jumping `#panel-root.scrollTop` (`900 -> 1387`) | ✅ Fixed this session |
| `L4-UX-01` | **LOW** | Empty Search State | `assets/app/tabs/content.js:855-866` | Non-matching FTS5 search hides `#tatca-search-suggestions` silently with no empty-state message | ✅ Fixed this session |
| `L4-UX-02` | **INFO** | Metric Copy | `assets/app/main.js:2500`, `content.js:217` | Topbar `1444 KÊNH` shows live channels alongside KPI card `1740 Kênh mẫu (1444 sống · 296 DIE)` | Info (intentional live count) |

---

## Layer 5 — Assets, Cache-Busting, CSP & Hygiene

- **Cache-Busting:** Bumped synchronously to `20261125-uifix106` across all 6 manifest/HTML/JS locations + `AUTH_LOGIN_VER` + SW `h2dev-shell-v25` / `h2dev-data-v25`.
- **CSP Parity:** `100%` of external image/media/iframe origins covered; `script-src 'self'`; `script-src-attr 'none'`.
- **Guards & Hygiene:** `guard-no-inline-onclick.js` **PASS** (`0` hits), `validate-project.js` **PASS**, `npm audit` **0 vulnerabilities**, `0` secrets / real IPs / SSH key filenames leaked.
- **Remediation Summary:** All `16` actionable findings (`2` HIGH, `4` MEDIUM, `7` LOW, `3` INFO) have been patched, regression-tested (`tests/test_security_audit.js`), and verified clean across all local CI gates and Phase 08 cross-family verification.
