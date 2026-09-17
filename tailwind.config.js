/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html','./player.html','./learn.html','./assets/*.js'],
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
