# H2DEV Full-System Security, UI/UX Standard, Click-Pass & Data Global Audit Report

- **Project:** `D:\YTB\H2DEV-Project` (`http://127.0.0.1:8899`)
- **Date:** 2026-11-26 (`?v=20261126-uifix108` baseline -> remediated to `?v=20261126-uifix109` / `SW v28`)
- **Skills Applied:** `ui-ux-standard`, `h2dev-project-audit`, `customer-journey-friction-audit`, `security`, `goal`

---

## 1. Executive Summary & 5-Pillar Baseline Scorecard

| Pillar | Weight | Baseline Score | Core Evidence |
|---|---:|---:|---|
| **P1 · UI/UX Standard & Gates** | 2.00 | **1.75** | `7/7` static gates PASS (`gate-p1`, `gate-p2`, `gate-icons`, `gate-typography`, `gate-shell 8/8`, `sync-tokens --check`, `check-ui-classes`); `65/65` route×viewport (`360/390/820/1024/1440` × `13` routes) PASS `T-1`, `T-2`, `H-1`, `H-2`, `S-2`, `C-1`, `St-5`, `T-10`. Deducted for `A-1` (`M11` `22×24` on `/video@1440`, `3` links `22px` tall on `/lotrinh/VIDEO-DD983D@1440`), `G-3` (`5` on `/ngachxanh@360`), `H-3` lead vs section `h2`. |
| **P2 · Click-Pass 14 Surfaces & Customer Journey** | 2.00 | **1.80** | `audit-l2-clickpass-cj` (`gemini-4-neon-xhigh`): `14/14` surfaces PASS on Desktop, Mobile, `prefers-reduced-motion`, `0` console/page/HTTP errors, `355/355` matrix cards, `5/5` modals, `4/4` `copyWithFeedback` `.h2-icon` retention, `10/10` bidirectional nav, FTS5/KG `<2–10ms`. Deducted for mobile `<44px` touch targets (`L2-F01..F03`), `L2-F04..F08` friction gaps. |
| **P3 · Data Global Integrity, 3-DB & Grounding** | 2.00 | **1.95** | `audit-l3-data-global` (`gemini-4-hydrogen-xhigh`): `validate-project`, `sync-counts --check`, `verify-data-math` (`33/33`), `9/9` JSON parity, `3/3` SQLite DB `integrity_check=ok`/`fk=0`/`freelist=0`, KG `4800/9398` 1:1, `0` ungrounded videos (`355`) & MD (`79`), `351/351` `docs/VIDEO-*`, `verify_sku_az` (`10/10`), `find-404` (`15` routes / `160` URLs / `0` errors). Deducted for `D:\YTB\HTTP` stray file, `2` `desktop.ini` under `assets/nhac-nen/`, stale doc lag. |
| **P4 · Security, CSP, Auth & Runtime Ops** | 2.00 | **2.00** | `audit-l4-security-ops` (`claude-opus-4-6-thinking`): `test_security_audit.js` (`92/92`), `guard-no-inline-onclick.js` PASS, `npm audit` (`0` vulns), tight CSP/security headers, `5/5` traversal paths `403`, CORS/CSRF enforced, `10/10` CSS/JS/HTML files clean, services & tasks healthy. |
| **P5 · Visual Polish, Computed Styles & Performance** | 2.00 | **1.85** | `audit-l5-visual-perf` (`gemini-4-neon-high`): `11/11` live screenshots captured & inspected, `backdropFilter: blur(10px)` + dot-grid `.app-shell` transparent + `0` WCAG contrast issues + `0` broken images + `H2FX` auto-sleep (`0` idle rAF) + `uifix108`/`SW v27` parity. Deducted for `L5-V01..V05` visual polish defects. |
| **TOTAL BASELINE** | **10.00** | **9.35** | Exceeds 8.5/10 threshold; proceeding to surgical fixes for all actionable defects to reach target `>= 9.70 / 10`. |

---

## 2. Consolidated Findings Registry (Baseline)

| ID | Layer | Sev | Rule / CWE | Location | Evidence | Planned Remediation |
|---|---|---|---|---|---|---|
| `L1-A1-01` | L1 UI Std | Medium | `A-1` | `assets/viddar.css:2056` | `14` `M11` module buttons on `/video@1440` measure `22×24px` (`<24px` min width) | Add `min-width: 24px; justify-content: center;` |
| `L1-A1-02` | L1 UI Std | Medium | `A-1` | `assets/player.css`, `assets/h2dev-studio-v2.css` | `3` tag links inside `#pinsights` (`VIDEO-DD983D@1440`) measure `22px` height (`<24px`) | Enforce `min-height: 24px; display: inline-flex; align-items: center;` on `#pinsights a[href]` |
| `L2-F01` | L2 CJ | Medium | `A-1` Mobile | `graph.html:513,574-611` | `14` controls on `/graph@390` measure `30–34px < 44px` | Raise `@media (max-width: 900px)` touch targets to `min-height: 44px` |
| `L2-F02` | L2 CJ | Medium | `A-1` Mobile | `assets/viddar.css:2054-2058` | Specificity beats `h2dev-shell.css:436` on mobile (`button.badge` `24px`, pager `30px`) | Add mobile `@media (max-width: 1024px)` `min-height: var(--h2-touch-min)` overrides for pager buttons & `.badge:is(button, a[href])` |
| `L2-F03` | L2 CJ | Medium | `A-1` Mobile | `assets/h2dev-components-lesson-row.css:34,146`, `assets/player.css:314-321`, `assets/app/modals/raw-deep.js` | `a.ltag` (`24px`), `a.sec-stat` (`36px`), `#pchannelslist` (`36px`), `#raw-deep-modal` close btn (`32×44`) on mobile | Raise `@media (max-width: 1024px)` height/width to `44px` |
| `L2-F06` | L2 CJ | Low | Dead-End Link | `assets/app/tabs/content.js:3624` | `6/6` DIE raw cards (`rv=dead`) keep `Mở YouTube ↗` label instead of `YT 404 ↗` | Use `YT 404` cue when `vA.healthStatus === 'DEAD_OR_PURGED'` |
| `L2-F07` | L2 CJ | Low | State Loss | `assets/app/player-main.js:211-245` | Mobile `#playerTabSelector` (`insights`/`transcript`) resets to `overview` on F5 reload | Sync `?ptab=` to URL via `history.replaceState` & restore on init |
| `L3-H01` | L3 Data | Low | Hygiene | `D:\YTB\HTTP` | Stray `44 B` scratch file at `D:\YTB\` root | Remove `D:\YTB\HTTP` |
| `L3-H02` | L3 Data | Low | Hygiene | `assets/nhac-nen/**/desktop.ini` | `2` OS `desktop.ini` files inside `assets/nhac-nen/` | Remove the `2` `desktop.ini` files |
| `L3-H03` | L3 Data | Info | Doc Lag | `D:\YTB\docs\WORKING_STATE.md` | Shows `Last Verified: 2026-11-24` | Refresh snapshot to `2026-11-26` |
| `L5-V01` | L5 Visual | Medium | `G-3` Polish | `assets/viddar.css:2231` | Desktop wrapped orphan `.filter-btn` pills stretch 700–1050px wide | Scope `flex: 1 1 auto` away from broad desktop `#content .flex-wrap`, keeping `flex: 0 1 auto` |
| `L5-V02` | L5 Visual | Medium | Text Clip | `assets/app/tabs/content.js:4249-4274`, `assets/viddar.css` | All 4 `.km-select` dropdowns on `/kenh-mau@1440` clip mid-word before chevron | Give `.km-select` generous `min-width` + concise labels |
| `L5-V03` | L5 Visual | Low | Text Clip | `assets/app/tabs/content.js:2841` | Long category badges on `/nhac` SAFE YPP preview cards clip cleanly only with flex `min-w-0` | Ensure right category button has `min-w-0 flex-1 text-right truncate` so `SAFE YPP` stays intact and category ellipsizes |
| `L5-V04` | L5 Visual | Low | SVG / Pill Gap | `assets/app/tabs/content.js:5139, 5310-5311` | Edge label `Tài liệu SOP kèm` clips to `Tài liệu SOP k`; header pills lack `gap-1.5` | Shorten to `'Tài liệu SOP'` & add `inline-flex items-center gap-1.5` |
| `L5-V05` | L5 Visual | Low | Wrap Polish | `assets/h2dev-components-lesson-row.css:34` | `a.sec-stat` wraps `↗` alone on line 2 at `390px` | Add `white-space: nowrap; flex-shrink: 0;` |

*(Out-of-scope / Info accepted: `KE-HOACH-THUC-CHIEN-YOUTUBE.md` legacy user doc in project root; `L2-04` local path copy UX; `L1-02` `style-src 'unsafe-inline'`.)*


---

## 3. Post-Fix Remediation & Final Phase 08 Verification (`uifix109` + `SW v28`)

- **Cache-Busting & Service Restart:** Bumped to `?v=20261126-uifix109` (`0` stale `uifix108`) across `index.html`, `learn.html`, `player.html`, `graph.html`, `assets/app/main.js`, `assets/music_player_modal.js`, `scripts/auth_gate.js`, and `assets/app/sw.js` (`h2dev-shell-v28` / `h2dev-data-v28`). `H2DEV_Service` restarted via Admin NSSM (`PID 171448` live on `127.0.0.1:8899`).
- **Fixes Applied & Re-Verified (`17/17` Automated Suites `EXIT 0`):**
  - `L1-A1-01` (`assets/viddar.css:2056`): `min-width: 24px` on `#content [data-action="video-card-module"]` -> `0` `<24px` targets on `/video@1440`.
  - `L1-A1-02` (`assets/h2dev-studio-v2.css`): `min-height: 24px` on `#pinsights a[href], #pinsights button` -> `0` `<24px` targets on `/lotrinh/VIDEO-DD983D@1440`.
  - `L2-F01` (`graph.html:574-611`), `L2-F02` (`assets/h2dev-studio-v2.css`), `L2-F03` (`assets/h2dev-components-lesson-row.css:165`, `assets/player.css:314-321`): Mobile (`<= 1024px` / `<= 900px`) touch targets raised to `>= 44px`.
  - `L2-F06` (`assets/app/tabs/content.js:3624`): Terminated `/rawkenh` DIE cards labeled `YT 404`.
  - `L2-F07` (`assets/app/player-main.js:211-235, 1199-1205`): Mobile `#playerTabSelector` syncs allowlisted `?ptab=` to URL (`history.replaceState`) and persists on reload (`0` XSS injection).
  - `L5-V01..V05` (`assets/viddar.css:2231`, `assets/app/tabs/content.js:2839, 4249, 5139, 5310`, `assets/h2dev-components-lesson-row.css:34`): Removed broad desktop `.filter-btn` orphan stretch, shortened `.km-select` labels & `min-width: max-content`, ellipsized `/nhac` SAFE YPP genre pill cleanly, shortened `/sodo` SVG edge `HAS_SOP` to `'Tài liệu SOP'` + added header pill gaps, prevented `a.sec-stat` wrapping `↗` on `390px`.
  - `L3-H01..H03`: Removed stray `D:\YTB\HTTP` and `2` `desktop.ini` under `assets/nhac-nen/`; updated `D:\YTB\docs\WORKING_STATE.md` to `2026-11-26`.

### Independent Cross-Family Phase 08 Verdict (`CHECK-PASS`)

- **`phase08-final-hydrogen` (`gemini-4-hydrogen-xhigh`):** **`9.80 / 10.00`** (`P1: 1.95`, `P2: 1.95`, `P3: 1.98`, `P4: 2.00`, `P5: 1.92`) — `16/16` suites `EXIT 0`, `26/26` Playwright checks (`0` `A-1`, `0` overflow, `0` contrast issues, `H2FX` 0 idle rAF).
- **`phase08-final-neon` (`gemini-4-neon-xhigh`):** **`CHECK-PASS`** — `92/92` security tests, tight CSP/CORS/CSRF, `11/11` `403` traversal blocks, `29/29` `aria-controls`, zero XSS/injection regressions across modified files.

---

## 4. Wave 2 Deep E2E & Spot Test-Fix Addendum (`uifix110` + `SW v29`)

### 4.1 Surgical Fixes Applied & Verified Live (`http://127.0.0.1:8899`, `PID 177452`)
1. **P1 CRITICAL — `video.docs` Wiped to `{}` (`scripts/hot_memory_store.js:106-143`, `assets/app/player-main.js:425`):** Replaced global `visited` Set in `safeMerge` with per-branch `ancestors` stack tracking (`add`/`finally delete` + `_cloneArray`) and added `hasValidDocs` fallback guard in `player-main.js`. Verified live bootstrap & DOM: `VIDEO-DD983D` (`6/6` populated docs, `6` `button[data-doc-file]`), `VIDEO-a152a6` (`5/5`), `VIDEO-96b420` (`4/4`), `0` blank `"Tài nguyên"` cards.
2. **P1 — `#doc-preview-modal` Mobile Overflow (`assets/app/main.js:4945-4962`, `assets/h2dev-studio-v2.css`):** Added `min-width:0`, `flex-wrap:wrap`, `overflow-x:auto`, and `#doc-preview-body table { display:block; max-width:100%; overflow-x:auto }`. Verified `panelSW === panelCW` (`378px` @`390`, `348px` @`360`) and `0px` horizontal overflow.
3. **P1 — `/nhac@1440` Stretched Buttons (`assets/viddar.css:2233`):** Scoped `flex: 1 1 0` to `:has(> .filter-btn ~ .filter-btn)` and excluded `.justify-between`/`.justify-center`/headings/`.h2-btn`. Verified `Sơ đồ DB`: `97px` (was `754px`), `Xem toàn bộ 49 tracks`: `174px` (was `719px`).
4. **P1 — `/kenh-mau@900-1440` `.km-select` Clipping (`assets/viddar.css:2607-2629`, `assets/h2dev-studio-v2.css`):** Switched `.km-controls-row` to `minmax(240px, 1.8fr) repeat(3, minmax(150px, 1fr))` with `.km-filter-scroll` on `grid-column: 1 / -1`. Verified widths `377/210/210/210px` @`1440` and `349/194/194/194px` @`1024`, `0` mid-word clipping.
5. **P2 — `#raw-deep-modal` Mobile Icons & `ytUrl` Fallback (`assets/app/main.js:3580, 3627`, `assets/app/tabs/content.js:3541`, `assets/h2dev-studio-v2.css`):** Distinct `tv` + `layout-grid` icons (`44×44px` mobile) and `safeExternalUrl()` + `@handle` fallback prior to YouTube search query.
6. **P2 — `#music-studio-modal` & Player Modals (`assets/music_player_modal.js:186, 355`, `player.html:251-273`, `assets/player.css`, `assets/h2dev-studio-v2.css`):** Centered `.js-music-sodo-link` (`44px`), moved `.js-music-niche-link` sizing to CSS (`24px` desktop / `44px` mobile, `49/49` verified), and moved `#docModal`/`#close-shortcut-modal` sizing out of inline styles so all 4 controls measure `44×44px` on `<= 1024px`.
7. **P2 — `/graph` (`graph.html:177-188, 626-635, 689-708`):** Added `.kg-hud-btn:focus-visible`, mobile `44×44px` `.kg-hud-btn` (`5/5` verified), and `@media (max-width: 380px)` mode-tab wrapping (`#btnModeFlow`/`#btnModeGraph`/`#btnModeMatrix` `sw === cw = 111px`, `clipped: false`).
8. **P3 — `/chienluoc` & Active Tab Focus (`assets/app/tabs/content.js:4468`, `assets/viddar.css:2243`, `assets/h2dev-studio-v2.css`):** `85/85` `.cl-panel` inline handle/SKU buttons `>= 24px` (`0` below), all 6 `/chienluoc` topbar subnav buttons fit unclipped inside `390px` (`12..383px`, `44px` tall), and `#tabs .tab-btn.active:focus-visible` restores `--focus-ring`.
9. **Legitimate Test-Fix & Cache-Busting (`uifix110` + `SW v29`):** Updated `scripts/audit-raw-124-e2e.js` for dynamic `PAGE_SIZE = 24` pagination against `data-tabs/raw-kenh-mau.json` (`156` cards across 7 pages, `156/156` HTTP 200 images), strengthened `scripts/verify_player_ui.js` (`#insightBadges a, span` + non-empty `#pdocslist` assertion), added `pytest.ini` (`norecursedirs`), ran `sync-tokens.js`, and bumped all assets to `?v=20261126-uifix110` (`0` stale `uifix109`) + `h2dev-shell-v29`/`h2dev-data-v29`.

### 4.2 Wave 2 Full Verification Matrix (`EXIT 0` Across All Suites)
| Suite / Gate | Exit | Measured Result |
|---|---:|---|
| `sync-tokens --check` / `gate-p1` / `gate-p2` / `gate-icons` / `gate-typography` / `check-ui-classes` / `guard-no-inline-onclick` / `gate-shell` | `0` | `8/8` PASS (`97` tokens / `12` CSS, `65/225` icons, `8/8` shell) |
| `validate-project` / `sync-counts --check` / `tests/test_security_audit.js` / `py -3 -m pytest -q` | `0` | `355` videos, `1740` channels, `761` docs, `92/92` security, `12/12` pytest |
| `playwright-g2-acceptance.js` | `0` | `26/26 PASS` (`0` console/page errors) |
| `deep-ui-acceptance.js` | `0` | `12/12 PASS` (`0` console errors) |
| `verify_player_ui.js` | `0` | `2/2` SKUs PASS (`VIDEO-a152a6` `5/5` docs & `12` badges; `VIDEO-96b420` `4/4` docs & `6` badges; `0` blank) |
| `audit-raw-124-e2e.js` | `0` | `13/13 PASS` (page 1 = `24`, 7 pages = `156/156`, `156/156` HTTP 200 images, `0` errors) |
| `cross-browser-acceptance.js` | `0` | `28 PASS / 0 FAIL` (Chromium, Firefox, WebKit) |
| `teamwork_e2e_full_verification.js` | `0` | `ALL PASS 100%` (`24/24` steps, `355/355` matrix144 cards desktop & mobile) |
