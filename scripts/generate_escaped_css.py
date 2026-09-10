import re, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

with open('assets/app.css', 'r', encoding='utf-8') as f:
    current_app_css = f.read()

rules = """
/* ==========================================================================
   EXACT TAILWIND ESCAPED UTILITIES FOR 100% COVERAGE
   ========================================================================== */

.-translate-y-1\\/2 { transform: translateY(-50%) !important; }
.\\[overflow-wrap\\:anywhere\\] { overflow-wrap: anywhere !important; }

.left-3\\.5 { left: 0.875rem !important; }
.top-1\\/2 { top: 50% !important; }
.top-\\[60px\\] { top: 60px !important; }

.w-1\\.5 { width: 0.375rem !important; }
.w-\\[72px\\] { width: 72px !important; }
.h-\\[40px\\] { height: 40px !important; }
.h-\\[60px\\] { height: 60px !important; }
.min-h-\\[38px\\] { min-height: 38px !important; }
.min-h-\\[60vh\\] { min-height: 60vh !important; }
.min-w-\\[160px\\] { min-width: 160px !important; }
.max-w-\[140px\] { max-width: 140px !important; }
.max-w-\[280px\] { max-width: 280px !important; }
.max-w-\[1440px\] { max-width: 1440px !important; }

.p-3\\.5 { padding: 0.875rem !important; }
.px-2\\.5 { padding-left: 0.625rem !important; padding-right: 0.625rem !important; }
.px-3\\.5 { padding-left: 0.875rem !important; padding-right: 0.875rem !important; }
.py-1\\.5 { padding-top: 0.375rem !important; padding-bottom: 0.375rem !important; }
.py-2\\.5 { padding-top: 0.625rem !important; padding-bottom: 0.625rem !important; }
.pt-3\\.5 { padding-top: 0.875rem !important; }

.mb-1\\.5 { margin-bottom: 0.375rem !important; }
.mb-3\\.5 { margin-bottom: 0.875rem !important; }
.mt-0\\.5 { margin-top: 0.125rem !important; }
.mt-2\\.5 { margin-top: 0.625rem !important; }
.mt-3\\.5 { margin-top: 0.875rem !important; }

.gap-1\\.5 { gap: 0.375rem !important; }
.gap-2\\.5 { gap: 0.625rem !important; }
.space-y-1\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.375rem !important; }

.text-\\[10px\\] { font-size: 10px !important; line-height: 14px !important; }
.text-\\[11px\\] { font-size: 11px !important; line-height: 15px !important; }
.text-\\[11\\.5px\\] { font-size: 11.5px !important; line-height: 16px !important; }
.text-\\[13px\\] { font-size: 13px !important; line-height: 18px !important; }
.text-\\[13\\.5px\\] { font-size: 13.5px !important; line-height: 19px !important; }
.text-\\[15px\\] { font-size: 15px !important; line-height: 21px !important; }
.text-\\[22px\\] { font-size: 22px !important; line-height: 28px !important; }
.text-\\[26px\\] { font-size: 26px !important; line-height: 32px !important; }

.tracking-\\[0\\.22em\\] { letter-spacing: 0.22em !important; }

.text-amber-400\\/80 { color: rgba(251, 191, 36, 0.8) !important; }
.text-lime-400\\/80 { color: rgba(163, 230, 53, 0.8) !important; }

.bg-amber-950\\/10 { background-color: rgba(69, 26, 3, 0.25) !important; }
.bg-red-950\\/10 { background-color: rgba(69, 10, 10, 0.25) !important; }
.bg-brand-600\\/20 { background-color: rgba(219, 39, 119, 0.2) !important; }
.bg-brand-600\\/25 { background-color: rgba(219, 39, 119, 0.25) !important; }
.bg-ink-900\\/60 { background-color: rgba(7, 9, 14, 0.6) !important; }
.bg-ink-900\\/80 { background-color: rgba(7, 9, 14, 0.8) !important; }
.bg-ink-800\\/60 { background-color: rgba(14, 18, 27, 0.6) !important; }
.bg-ink-800\\/80 { background-color: rgba(14, 18, 27, 0.8) !important; }
.bg-ink-800\\/90 { background-color: rgba(14, 18, 27, 0.9) !important; }

.border-brand-700\\/40 { border-color: rgba(190, 24, 93, 0.4) !important; }
.border-brand-900\\/40 { border-color: rgba(131, 24, 67, 0.4) !important; }
.border-amber-900\\/30 { border-color: rgba(120, 53, 15, 0.4) !important; }
.border-red-900\\/40 { border-color: rgba(127, 29, 29, 0.4) !important; }

.focus\\:outline-none:focus { outline: none !important; }
.hover\\:bg-brand-500:hover { background-color: #ec4899 !important; }
.hover\\:bg-brand-700:hover { background-color: #be185d !important; }
.hover\\:bg-ink-500:hover { background-color: #33415c !important; }
.hover\\:bg-ink-600:hover { background-color: #222b40 !important; }
.hover\\:bg-ink-700\\/60:hover { background-color: rgba(22, 28, 43, 0.6) !important; }
.hover\\:border-brand-500:hover { border-color: #ec4899 !important; }
.hover\\:border-ink-600:hover { border-color: #222b40 !important; }
.hover\\:text-brand-300:hover { color: #f9a8d4 !important; }
.hover\\:text-white:hover { color: #ffffff !important; }

.group:hover .group-hover\\:bg-brand-500 { background-color: #ec4899 !important; }
.group:hover .group-hover\\:text-brand-200 { color: #fbcfe8 !important; }

@media (min-width: 640px) {
  .sm\\:block { display: block !important; }
  .sm\\:inline { display: inline !important; }
  .sm\\:flex { display: flex !important; }
  .sm\\:hidden { display: none !important; }
  .sm\\:flex-1 { flex: 1 1 0% !important; }
  .sm\\:flex-row { flex-direction: row !important; }
  .sm\\:items-center { align-items: center !important; }
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .sm\\:w-40 { width: 10rem !important; }
  .sm\\:w-64 { width: 16rem !important; }
  .sm\\:p-4 { padding: 1rem !important; }
  .sm\\:p-5 { padding: 1.25rem !important; }
  .sm\\:p-6 { padding: 1.5rem !important; }
  .sm\\:px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
  .sm\\:px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
  .sm\\:py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
  .sm\\:text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
  .sm\\:text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
  .sm\\:text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
}

@media (min-width: 768px) {
  .md\\:flex-row { flex-direction: row !important; }
  .md\\:items-center { align-items: center !important; }
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}

@media (min-width: 1280px) {
  .xl\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
  .xl\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
}
"""

with open('assets/app.css', 'w', encoding='utf-8') as f:
    f.write(current_app_css + '\n' + rules)

print("Đã bổ sung tất cả quy tắc CSS escaped vào assets/app.css!")
