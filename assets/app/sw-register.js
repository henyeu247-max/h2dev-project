/* G6: SW register ? extracted
   UI-06 (2026-09-28): register '/sw.js' O GOC — scope tu dong la '/' de SW
   control toan site (index/player/learn). Truoc day dang ky 'assets/app/sw.js'
   => scope chi '/assets/app/' => trang goc khong duoc control => offline reload chet.
   File '/sw.js' da ton tai o goc va server tra 200 application/javascript. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
