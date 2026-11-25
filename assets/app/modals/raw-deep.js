/* H2RawDeepModal - G3 modal controls extract from index.html */
(function (global) {
  'use strict';

  var OTHER_MODAL_IDS = [
    'doc-preview-modal',
    'quick-video-modal',
    'video-transcript-modal',
    'raw-image-modal',
    'music-studio-modal'
  ];

  function hasOtherOpenModal(currentModal) {
    if (typeof document === 'undefined') return false;
    var curId = currentModal && currentModal.id ? currentModal.id : '';
    return OTHER_MODAL_IDS.some(function (id) {
      if (id === curId) return false;
      var el = document.getElementById(id);
      return Boolean(el && el.style.display === 'flex');
    });
  }

  function stopAllAudio(modal) {
    // Dung toan bo <audio> ben trong modal va tren trang (bao gom card preview neu co)
    if (modal && typeof modal.querySelectorAll === 'function') {
      modal.querySelectorAll('audio').forEach(function (a) {
        try { a.pause(); a.currentTime = 0; } catch (e) {}
      });
    }
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('audio').forEach(function (a) {
        try { a.pause(); a.currentTime = 0; } catch (e) {}
      });
    }
    if (global && typeof global.H2AudioStopAll === 'function') {
      try { global.H2AudioStopAll(); } catch (e) {}
    }
  }

  function makeControls(modal) {
    if (!modal) {
      return {
        closeRawDeepModal: function () {},
        switchRawTab: function () {},
        bindModalEvents: function () {},
        unbindModalEvents: function () {},
        stopAllAudio: stopAllAudio
      };
    }

    function unbindModalEvents() {
      if (modal._h2BackdropHandler && typeof modal.removeEventListener === 'function') {
        try { modal.removeEventListener('click', modal._h2BackdropHandler); } catch (e) {}
      }
      if (modal._h2EscHandler && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        try { document.removeEventListener('keydown', modal._h2EscHandler); } catch (e) {}
      }
      modal._h2BackdropHandler = null;
      modal._h2EscHandler = null;
    }

    function closeRawDeepModal() {
      stopAllAudio(modal);
      // Go src iframe YouTube de ngat ket noi am thanh va video ngam
      if (typeof modal.querySelectorAll === 'function') {
        modal.querySelectorAll('iframe').forEach(function (f) {
          try { f.src = 'about:blank'; } catch (e) {}
        });
      }
      modal.style.display = 'none';
      if (typeof document !== 'undefined' && document.body && !hasOtherOpenModal(modal)) {
        document.body.style.overflow = '';
      }
      unbindModalEvents();
      if (modal._prevActiveElement && typeof modal._prevActiveElement.focus === 'function') {
        try { modal._prevActiveElement.focus(); } catch (e) {}
      }
    }

    function bindModalEvents() {
      unbindModalEvents();
      modal._h2BackdropHandler = function (e) {
        if (!e) return;
        var closeBtn = e.target && e.target.closest ? e.target.closest('#close-raw-deep, [data-close-raw-deep]') : null;
        if (e.target === modal || (e.target && e.target.id === 'close-raw-deep') || closeBtn) {
          closeRawDeepModal();
        }
      };
      if (typeof modal.addEventListener === 'function') {
        modal.addEventListener('click', modal._h2BackdropHandler);
      }
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        modal._h2EscHandler = function (e) {
          if (e && e.key === 'Escape' && modal.style.display === 'flex') {
            closeRawDeepModal();
          }
        };
        document.addEventListener('keydown', modal._h2EscHandler);
      }
    }

    function switchRawTab(tabKey) {
      modal.querySelectorAll('.raw-tab-btn').forEach(function (btn) {
        var isMatch = btn.getAttribute('data-tab') === tabKey;
        if (isMatch) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      modal.querySelectorAll('.raw-tab-panel').forEach(function (p) {
        if (tabKey === 'all') {
          p.style.display = 'flex';
        } else {
          p.style.display = (p.id === 'raw-panel-' + tabKey) ? 'flex' : 'none';
        }
      });
      var b = modal.querySelector('.raw-deep-body');
      if (b) b.scrollTop = 0;
    }

    return {
      closeRawDeepModal: closeRawDeepModal,
      switchRawTab: switchRawTab,
      bindModalEvents: bindModalEvents,
      unbindModalEvents: unbindModalEvents,
      stopAllAudio: function () { return stopAllAudio(modal); }
    };
  }

  global.H2RawDeepModal = {
    makeControls: makeControls,
    stopAllAudio: stopAllAudio
  };
})(typeof window !== 'undefined' ? window : globalThis);
