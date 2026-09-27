# TOKEN REFERENCE (TU SINH — KHONG SUA TAY)

> **File nay do `scripts/sync-tokens.js` sinh ra tu CSS THAT.** Sua tay se bi ghi de.
> Muon doi: sua CSS roi chay `node scripts/sync-tokens.js`.
> Cong kiem drift: `node scripts/sync-tokens.js --check` (exit 1 neu lech).

## Nguon du lieu

- Nguon chan ly: **MOI file .css SONG (loai tru: _backup/, _archive/, node_modules/, data/, va file build assets/tailwind.css)**
- So file CSS quet: **10**
- So file nguon dem luot dung: **167** (`.css`/`.js`/`.mjs`/`.html`)
- Tong so token khai bao: **98**

## Bai hoc SCAR-024

Danh sach token viet tay trong `design-system/tokens.json` (28 token) **KHONG phai**
tap day du (CSS that co 98). Tai lieu nay SINH TU MA NGUON nen khong the troi.

## Bang token

### `bg` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--bg` | `#050505` | `assets/viddar.css:52` | 16 |
| `--bg-subtle` | `#0a0a0a` | `assets/viddar.css:53` | 7 |

### `border` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--border` | `#222` | `assets/viddar.css:56` | 83 |
| `--border-strong` | `#333` | `assets/viddar.css:57` | 27 |

### `bottom` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--bottom-nav-bg` | `rgba(5,5,5,0.94)` | `assets/viddar.css:86` | 1 |

### `brand` (6 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--brand` | `#E2023A` | `assets/viddar.css:63` | 58 |
| `--brand-fg` | `#fff` | `assets/viddar.css:65` | 6 |
| `--brand-hover` | `#ff1a4d` | `assets/viddar.css:64` | 15 |
| `--brand-ink` | `#ff8095` | `assets/viddar.css:66` | 22 |
| `--brand-tint` | `#2a0a12` | `assets/viddar.css:67` | 10 |
| `--brand-tint-fg` | `#ff8095` | `assets/viddar.css:68` | 5 |

### `danger` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--danger` | `#ff4060` | `assets/viddar.css:78` | 3 |

### `fg` (4 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--fg` | `#f0f0f0` | `assets/viddar.css:59` | 53 |
| `--fg-2` | `#dfdfdf` | `assets/viddar.css:60` | 36 |
| `--fg-faint` | `#9ca3af` | `assets/viddar.css:62` | 11 |
| `--fg-muted` | `#a9a9a9` | `assets/viddar.css:61` | 46 |

### `focus` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--focus-ring` | `0 0 0 2px var(--bg), 0 0 0 4px rgba(226,2,58,.6)` | `assets/viddar.css:87` | 13 |

### `font` (3 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--font-display` | `"Space Grotesk", var(--font-sans)` | `assets/viddar.css:94` | 8 |
| `--font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace` | `assets/viddar.css:93` | 27 |
| `--font-sans` | `"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `assets/viddar.css:92` | 17 |

### `h2-backdrop` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-backdrop-blur` | `10px` | `assets/h2dev-tokens.css:83` | 25 |

### `h2-badge` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-badge-blur` | `4px` | `assets/h2dev-tokens.css:93` | 1 |

### `h2-container` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-container-max` | `min(1120px, 100%)` | `assets/h2dev-tokens.css:73` | 1 |

### `h2-font` (9 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-font-2xl` | `24px` | `assets/h2dev-tokens.css:35` | 1 |
| `--h2-font-2xs` | `11px` | `assets/h2dev-tokens.css:28` | 8 |
| `--h2-font-3xl` | `32px` | `assets/h2dev-tokens.css:36` | 0 |
| `--h2-font-base` | `14px` | `assets/h2dev-tokens.css:31` | 2 |
| `--h2-font-lg` | `18px` | `assets/h2dev-tokens.css:33` | 2 |
| `--h2-font-md` | `16px` | `assets/h2dev-tokens.css:32` | 4 |
| `--h2-font-sm` | `13px` | `assets/h2dev-tokens.css:30` | 9 |
| `--h2-font-xl` | `20px` | `assets/h2dev-tokens.css:34` | 1 |
| `--h2-font-xs` | `12px` | `assets/h2dev-tokens.css:29` | 2 |

### `h2-fw` (4 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-fw-bold` | `700` | `assets/h2dev-tokens.css:56` | 3 |
| `--h2-fw-medium` | `500` | `assets/h2dev-tokens.css:54` | 4 |
| `--h2-fw-regular` | `400` | `assets/h2dev-tokens.css:53` | 0 |
| `--h2-fw-semibold` | `600` | `assets/h2dev-tokens.css:55` | 9 |

### `h2-header` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-header-h` | `56px` | `assets/h2dev-tokens.css:71` | 2 |
| `--h2-header-pad` | `0 24px` | `assets/h2dev-tokens.css:72` | 1 |

### `h2-icon` (4 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-icon-14` | `14px` | `assets/h2dev-tokens.css:59` | 6 |
| `--h2-icon-16` | `16px` | `assets/h2dev-tokens.css:60` | 18 |
| `--h2-icon-20` | `20px` | `assets/h2dev-tokens.css:61` | 14 |
| `--h2-icon-24` | `24px` | `assets/h2dev-tokens.css:62` | 10 |

### `h2-lh` (6 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-lh-body` | `1.5` | `assets/h2dev-tokens.css:42` | 3 |
| `--h2-lh-body-px` | `20px` | `assets/h2dev-tokens.css:44` | 0 |
| `--h2-lh-display` | `1.2` | `assets/h2dev-tokens.css:40` | 4 |
| `--h2-lh-heading` | `1.35` | `assets/h2dev-tokens.css:41` | 12 |
| `--h2-lh-none` | `1` | `assets/h2dev-tokens.css:39` | 0 |
| `--h2-lh-prose` | `1.6` | `assets/h2dev-tokens.css:43` | 2 |

### `h2-ls` (4 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-ls-label` | `0.02em` | `assets/h2dev-tokens.css:49` | 1 |
| `--h2-ls-micro` | `0.04em` | `assets/h2dev-tokens.css:50` | 0 |
| `--h2-ls-normal` | `0` | `assets/h2dev-tokens.css:47` | 1 |
| `--h2-ls-tight` | `-0.02em` | `assets/h2dev-tokens.css:48` | 6 |

### `h2-motion` (4 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-motion-base` | `200ms` | `assets/h2dev-tokens.css:77` | 2 |
| `--h2-motion-ease` | `cubic-bezier(.2, .6, .3, 1)` | `assets/h2dev-tokens.css:79` | 13 |
| `--h2-motion-fast` | `120ms` | `assets/h2dev-tokens.css:76` | 11 |
| `--h2-motion-slow` | `300ms` | `assets/h2dev-tokens.css:78` | 0 |

### `h2-overlay` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-overlay-alpha` | `0.92` | `assets/h2dev-tokens.css:87` | 1 |
| `--h2-overlay-bg` | `rgba(0, 0, 0, var(--h2-overlay-alpha))` | `assets/h2dev-tokens.css:88` | 6 |

### `h2-space` (6 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-space-1` | `4px` | `assets/h2dev-tokens.css:20` | 8 |
| `--h2-space-2` | `8px` | `assets/h2dev-tokens.css:21` | 8 |
| `--h2-space-3` | `12px` | `assets/h2dev-tokens.css:22` | 11 |
| `--h2-space-4` | `16px` | `assets/h2dev-tokens.css:23` | 15 |
| `--h2-space-6` | `24px` | `assets/h2dev-tokens.css:24` | 5 |
| `--h2-space-8` | `32px` | `assets/h2dev-tokens.css:25` | 3 |

### `h2-touch` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-touch-min` | `44px` | `assets/h2dev-tokens.css:65` | 15 |

### `h2-translate` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-translate-max` | `4px` | `assets/h2dev-tokens.css:80` | 0 |

### `h2-z` (8 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--h2-z-base` | `1` | `assets/h2dev-tokens.css:101` | 7 |
| `--h2-z-drawer` | `60` | `assets/h2dev-tokens.css:104` | 4 |
| `--h2-z-fixed` | `40` | `assets/h2dev-tokens.css:103` | 3 |
| `--h2-z-modal` | `1000` | `assets/h2dev-tokens.css:107` | 3 |
| `--h2-z-modal-top` | `1010` | `assets/h2dev-tokens.css:108` | 4 |
| `--h2-z-sticky` | `20` | `assets/h2dev-tokens.css:102` | 3 |
| `--h2-z-toast` | `300` | `assets/h2dev-tokens.css:106` | 3 |
| `--h2-z-topbar-mobile` | `100` | `assets/h2dev-tokens.css:105` | 6 |

### `hairline` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--hairline` | `#1a1a1a` | `assets/viddar.css:58` | 10 |

### `info` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--info` | `#00ccff` | `assets/viddar.css:79` | 4 |

### `pad` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--pad-page` | `28px` | `assets/viddar.css:91` | 1 |

### `r` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--r-lg` | `4px` | `assets/viddar.css:89` | 8 |
| `--r-md` | `4px` | `assets/viddar.css:88` | 14 |

### `red` (6 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--red-300` | `#ff8095` | `assets/viddar.css:71` | 0 |
| `--red-400` | `#ff4060` | `assets/viddar.css:72` | 0 |
| `--red-50` | `#2a0a12` | `assets/viddar.css:69` | 5 |
| `--red-50-fg` | `#ff8095` | `assets/viddar.css:70` | 2 |
| `--red-500` | `#E2023A` | `assets/viddar.css:73` | 0 |
| `--red-700` | `#8a0122` | `assets/viddar.css:74` | 1 |

### `row` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--row-h` | `36px` | `assets/viddar.css:90` | 1 |

### `sidebar` (5 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--sidebar-active-bg` | `#1a1a1a` | `assets/viddar.css:82` | 1 |
| `--sidebar-active-fg` | `#f0f0f0` | `assets/viddar.css:83` | 1 |
| `--sidebar-bg` | `var(--bg)` | `assets/viddar.css:81` | 1 |
| `--sidebar-hover-bg` | `#141414` | `assets/viddar.css:84` | 1 |
| `--sidebar-w` | `240px` | `assets/viddar.css:80` | 1 |

### `signal` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--signal-amber` | `#ffcc00` | `assets/viddar.css:95` | 0 |

### `success` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--success` | `#00ff88` | `assets/viddar.css:75` | 5 |
| `--success-fg` | `#80ffc4` | `assets/viddar.css:76` | 9 |

### `surface` (2 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--surface` | `#0f0f0f` | `assets/viddar.css:54` | 71 |
| `--surface-2` | `#1a1a1a` | `assets/viddar.css:55` | 55 |

### `topbar` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--topbar-bg` | `rgba(5,5,5,0.92)` | `assets/viddar.css:85` | 5 |

### `warning` (1 token)

| Token | Gia tri | Nguon (file:line) | Luot dung |
|---|---|---|---|
| `--warning` | `#ffcc00` | `assets/viddar.css:77` | 4 |

## Token CHET (0 luot dung)

- `--h2-font-3xl`
- `--h2-fw-regular`
- `--h2-lh-body-px`
- `--h2-lh-none`
- `--h2-ls-micro`
- `--h2-motion-slow`
- `--h2-translate-max`
- `--red-300`
- `--red-400`
- `--red-500`
- `--signal-amber`
