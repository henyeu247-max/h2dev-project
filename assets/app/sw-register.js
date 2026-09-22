/* G6: SW register ? extracted */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('assets/app/sw.js').catch(function () {});
    });
  }
