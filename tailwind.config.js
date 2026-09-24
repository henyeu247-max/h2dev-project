/** @type {import('tailwindcss').Config} */
module.exports = {
  /* SUA 2026-09-24 (P3.7): content cu './assets/*.js' la SAI DUONG DAN.
   *   Thuc te class Tailwind nam o assets/app/*.js + assets/app/tabs/*.js (thu muc con)
   *   va duoc sinh dong trong JS (render), nen glob cu khong quet toi
   *   -> `npm run build:css` PURGE MAT 253 class -> vo UI.
   *   Day la ly do KHONG DUOC rebuild tailwind.css bang config cu.
   *   Dung glob de quy **\/*.js moi phu het. */
  content: [
    './index.html',
    './player.html',
    './learn.html',
    './assets/**/*.js',
  ],
  /* P3.7 (2026-09-24): SAFELIST 9 bac font-size chuan.
   * Ly do: Tailwind chi sinh class NAO duoc quet thay trong content.
   *   Neu doi text-[10px] -> text-[14px] ma `text-[14px]` chua tung xuat hien
   *   thi class KHONG duoc sinh -> validate-project bao "class thieu CSS that" (da gap that).
   *   Safelist dam bao 9 bac LUON co CSS, bat ke co dang duoc dung hay khong. */
  safelist: [
    'text-2xs', 'text-xs', 'text-sm', 'text-base', 'text-md',
    'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
  ],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
        ink: { 50:'#f8fafc', 100:'#f1f5f9', 900:'#0a0c10', 950:'#05060a', 800:'#12151c', 700:'#1a1f2b', 600:'#242b3a', 500:'#2f384d', 400:'#3d4a66' },
        surface: { DEFAULT:'#141821', card:'#1c212e', hover:'#232a3d' },
        success: { bg:'#052e22', text:'#6ee7b7', border:'#065f46' },
        danger: { bg:'#450a0a', text:'#fca5a5', border:'#7f1d1d' },
        info: { bg:'#1e293b', text:'#93c5fd', border:'#1e3a5f' },
        warn: { bg:'#451a03', text:'#fcd34d', border:'#92400e' },
      },
      fontFamily: {
        sans: ['Inter','ui-sans-serif','system-ui','-apple-system','sans-serif'],
      },
      /* P3.7 (2026-09-24): THANG FONT-SIZE CHUAN 9 BAC.
       * Ly do: code dang dung class arbitrary `text-[11px]`, `text-[12px]`, `text-[14px]`...
       *   Tailwind chi sinh class arbitrary NEU quet thay chuoi do trong content.
       *   Khi doi class cu -> class moi (vd text-[10px] -> text-[14px]) ma class moi
       *   chua tung xuat hien thi no KHONG duoc sinh -> validate-project BAO FAIL
       *   "class thieu CSS that".
       * Giai phap: khai bao san 9 bac -> moi class text-{ten} duoc sinh chac chan,
       *   ke ca khi chua xuat hien trong content.
       * Nguon chuan: design-system/tokens.json -> font.sizeScale.standardized.
       * LUU Y: van KHONG duoc dung text-[Npx] arbitrary ngoai 9 bac (gate chan). */
      fontSize: {
        '2xs': '11px',
        'xs': '12px',
        'sm': '13px',
        'base': '14px',
        'md': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2)',
        'card-hover': '0 8px 24px rgba(0,0,0,.4), 0 4px 8px rgba(219,39,119,.12)',
        glow: '0 0 20px rgba(219,39,119,.15)',
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
    }
  },
  plugins: []
}
