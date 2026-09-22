/* H2RawDeepModal - G3 modal controls extract from index.html */
(function (global) {
  'use strict';

  function makeControls(modal) {
    function closeRawDeepModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Dừng toàn bộ audio đang phát ngầm
        modal.querySelectorAll('audio').forEach(a => {
          try { a.pause(); a.currentTime = 0; } catch (e) {}
        });
        // Gỡ src iframe YouTube để ngắt kết nối âm thanh và video ngầm
        modal.querySelectorAll('iframe').forEach(f => {
          try { f.src = 'about:blank'; } catch (e) {}
        });
    }

    function switchRawTab(tabKey) {
        modal.querySelectorAll('.raw-tab-btn').forEach(btn => {
          const isMatch = btn.getAttribute('data-tab') === tabKey;
          if (isMatch) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
        modal.querySelectorAll('.raw-tab-panel').forEach(p => {
          if (tabKey === 'all') {
            p.style.display = 'flex';
          } else {
            p.style.display = (p.id === 'raw-panel-' + tabKey) ? 'flex' : 'none';
          }
        });
        const b = modal.querySelector('.raw-deep-body');
        if (b) b.scrollTop = 0;
    }

    return { closeRawDeepModal: closeRawDeepModal, switchRawTab: switchRawTab };
  }

  global.H2RawDeepModal = { makeControls: makeControls };
})(typeof window !== 'undefined' ? window : globalThis);
