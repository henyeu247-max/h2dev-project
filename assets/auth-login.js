'use strict';

(function () {
  function purgeServiceWorkerAndCaches() {
    try {
      if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
        navigator.serviceWorker.getRegistrations().then(function (regs) {
          regs.forEach(function (reg) {
            try { reg.unregister(); } catch (_) {}
          });
        }).catch(function () {});
      }
      if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
        caches.keys().then(function (keys) {
          keys.forEach(function (k) {
            if (k.indexOf('h2dev-') === 0) {
              caches.delete(k).catch(function () {});
            }
          });
        }).catch(function () {});
      }
    } catch (_) {}
  }

  purgeServiceWorkerAndCaches();

  var form = document.getElementById('loginForm');
  var pwInput = document.getElementById('pw');
  var eyeBtn = document.getElementById('eye');
  var errBox = document.getElementById('errBox');
  var redirInput = document.getElementById('redir');
  var submitBtn = document.getElementById('submitBtn');

  if (!form || !pwInput) return;

  function safeClientNext(val) {
    if (typeof val !== 'string') return '/';
    if (!/^\/[^\/\\]/.test(val) && val !== '/') return '/';
    if (/[\x00-\x1f\x7f]/.test(val)) return '/';
    try {
      var u = new URL(val, window.location.origin);
      if (u.origin !== window.location.origin) return '/';
    } catch (_) { return '/'; }
    return val;
  }

  var nextVal = safeClientNext(form.getAttribute('data-next') || '/');
  var initErr = form.getAttribute('data-err') || '';
  if (redirInput) redirInput.value = nextVal;

  var loginCard = document.getElementById('loginCard');
  var EYE_SHOW_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_HIDE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function showErr(msg) {
    if (!errBox) return;
    if (msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
      if (loginCard) {
        loginCard.classList.remove('is-shaking');
        void loginCard.offsetWidth;
        loginCard.classList.add('is-shaking');
      }
    } else {
      errBox.textContent = '';
      errBox.hidden = true;
    }
  }

  if (initErr) showErr(initErr);

  if (eyeBtn) {
    eyeBtn.addEventListener('click', function () {
      var show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      eyeBtn.innerHTML = show ? EYE_HIDE_SVG : EYE_SHOW_SVG;
      eyeBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
      eyeBtn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xác thực...';
    }

    fetch('/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        password: pwInput.value || '',
        redirect: nextVal
      })
    }).then(function (res) {
      return res.json().catch(function () {
        return { ok: false, error: 'Phản hồi đăng nhập không hợp lệ.' };
      }).then(function (data) {
        return { ok: res.ok && data && data.ok, data: data };
      });
    }).then(function (result) {
      if (result.ok) {
        var target = safeClientNext((result.data && result.data.redirect) || nextVal || '/');
        window.location.replace(target);
        return;
      }
      showErr((result.data && result.data.error) || 'Đăng nhập thất bại.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
      }
      pwInput.focus();
      pwInput.select();
    }).catch(function () {
      showErr('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
      }
    });
  });
})();
