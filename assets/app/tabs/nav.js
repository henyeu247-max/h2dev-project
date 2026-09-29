/* H2TabsNav - G3 tab navigation extract from index.html */
(function (global) {
  'use strict';

  function createTabNav(deps) {
    const state = deps.state;
    const TABS = deps.TABS;
    const BOTTOM_TABS = deps.BOTTOM_TABS;
    const openTab = deps.openTab;
    const render = deps.render;

function tabMarkup(t, extraId) {
  const selected = state.tab === t.id;
  const id = extraId || `tab-${t.id}`;
  const isBottom = extraId && extraId.startsWith('m-tab-');
  const label = isBottom ? (t.short || t.name) : t.name;
  if (isBottom) {
    /* FIX 2026-09-30 (UI-03): #bottom-nav la <nav> landmark, KHONG phai tablist -> role=tab o day
       sai ARIA (tab khong co cha tablist). Dung nut dieu huong + aria-current. */
    return `<button id="${id}" type="button"${selected ? ' aria-current="page"' : ''} class="tab-btn${selected ? ' active' : ''}" data-tab="${t.id}" title="${t.name}">${t.icon}<span>${label}</span></button>`;
  }
  return `<button id="${id}" type="button" role="tab" aria-selected="${selected ? 'true' : 'false'}" aria-controls="content" tabindex="${selected ? '0' : '-1'}" class="tab-btn${selected ? ' active' : ''}" data-tab="${t.id}" title="${t.name}">${t.icon}<span>${label}</span></button>`;
}

/* FIX 2026-09-30 (UI-03): renderTabs() tao lai toan bo nut -> phan tu dang focus bi thay the,
   focus rot ve BODY. Sau moi lan chuyen tab, dat focus lai vao nut moi co cung id. */
function refocusById(id) {
  const el = id && document.getElementById(id);
  if (el && typeof el.focus === 'function') {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
}

function bindTabButton(b) {
  b.onclick = () => {
    const keepFocus = document.activeElement === b ? b.id : '';
    openTab(b.dataset.tab);
    if (keepFocus) refocusById(keepFocus);
  };
  b.onkeydown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      /* FIX 2026-09-30 (UI-03): truoc day luon tim trong '#tabs' -> nut o #bottom-nav (mobile) bam
         mui ten khong lam gi. Nay tim trong CHINH nhom chua nut. */
      const group = b.closest('#tabs, #bottom-nav');
      if (!group) return;
      e.preventDefault();
      const isBottom = group.id === 'bottom-nav';
      const items = [...group.querySelectorAll('.tab-btn')];
      const index = items.indexOf(b);
      if (index < 0) return;
      let next;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else next = (index + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      const target = items[next];
      if (isBottom) {
        /* Bottom-nav la nav landmark: mui ten chi di chuyen focus, Enter/Space moi kich hoat
           (tranh tu mo sheet Khac khi di qua nut Khac). */
        target.focus();
        return;
      }
      const targetId = target.id;
      target.focus(); target.click();
      refocusById(targetId);
    }
  };
}

function renderTabs() {
  const nav = document.getElementById('tabs');
  const bottom = document.getElementById('bottom-nav');
  nav.innerHTML = TABS.map(t => tabMarkup(t)).join('');
  nav.querySelectorAll('.tab-btn').forEach(bindTabButton);
  if (bottom) {
    const mainBottom = TABS.filter(t => BOTTOM_TABS.includes(t.id));
    const overflowTabs = TABS.filter(t => !BOTTOM_TABS.includes(t.id));
    const isOverflowActive = overflowTabs.some(t => t.id === state.tab);
    const moreIcon = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    /* FIX 2026-09-30 (UI-03): nut Khac la nut mo sheet (expander), khong phai tab noi dung. */
    const moreBtnHtml = `<button id="m-tab-more" type="button" aria-haspopup="dialog" aria-expanded="false"${isOverflowActive ? ' aria-current="page"' : ''} class="tab-btn${isOverflowActive ? ' active' : ''}" title="Mục khác">${moreIcon}<span>Khác</span></button>`;

    bottom.innerHTML = mainBottom.map(t => tabMarkup(t, `m-tab-${t.id}`)).join('') + moreBtnHtml;
    bottom.querySelectorAll('.tab-btn:not(#m-tab-more)').forEach(bindTabButton);

    const moreBtn = document.getElementById('m-tab-more');
    if (moreBtn) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        toggleMoreMenu(overflowTabs);
      };
      /* Mui ten tren nut Khac: chi di chuyen focus trong nhom (khong mo sheet). */
      const arrowOnly = (e) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const items = [...bottom.querySelectorAll('.tab-btn')];
        const index = items.indexOf(moreBtn);
        let next;
        if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = items.length - 1;
        else next = (index + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      };
      moreBtn.onkeydown = arrowOnly;
    }
  }
}

function toggleMoreMenu(overflowTabs) {
  let sheet = document.getElementById('moreMenuSheet');
  let backdrop = document.getElementById('moreMenuBackdrop');
  if (sheet) {
    sheet.remove();
    if (backdrop) backdrop.remove();
    const mbClose = document.getElementById('m-tab-more');
    if (mbClose) mbClose.setAttribute('aria-expanded', 'false');
    return;
  }
  const triggerBtn = document.activeElement;
  const moreBtnNow = document.getElementById('m-tab-more');
  if (moreBtnNow) moreBtnNow.setAttribute('aria-expanded', 'true');
  function closeMoreMenu() {
    sheet?.remove();
    backdrop?.remove();
    const mb = document.getElementById('m-tab-more');
    if (mb) mb.setAttribute('aria-expanded', 'false');
    /* FIX 2026-09-30: trigger co the da bi renderTabs() thay the -> lay lai theo id. */
    const target = (triggerBtn && triggerBtn.isConnected) ? triggerBtn : (triggerBtn && triggerBtn.id ? document.getElementById(triggerBtn.id) : mb);
    if (target && typeof target.focus === 'function') {
      try { target.focus(); } catch (e) {}
    }
  }

  backdrop = document.createElement('div');
  backdrop.id = 'moreMenuBackdrop';
  backdrop.className = 'more-menu-backdrop';
  backdrop.onclick = closeMoreMenu;
  document.body.appendChild(backdrop);

  sheet = document.createElement('div');
  sheet.id = 'moreMenuSheet';
  sheet.className = 'more-menu-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Danh mục tab mở rộng');
  sheet.tabIndex = -1;
  sheet.innerHTML = overflowTabs.map(t => {
    const sel = state.tab === t.id;
    return `<button type="button" class="more-item${sel ? ' active font-bold' : ''}" data-tab="${t.id}">${t.icon}<span>${t.name}</span></button>`;
  }).join('');
  sheet.querySelectorAll('.more-item').forEach(btn => {
    btn.onclick = () => {
      /* UI-03 (2026-09-28): DI QUA openTab (khong set state.tab truc tiep) de
         URL/history pushState + don filter chay dung nhu tab thuong. */
      closeMoreMenu();
      openTab(btn.dataset.tab);
      /* FIX 2026-09-30 (UI-03): openTab() render lai bottom-nav -> focus ve BODY. Dat lai vao nut Khac moi. */
      refocusById('m-tab-more');
    };
  });
  sheet.onkeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMoreMenu();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = Array.from(sheet.querySelectorAll('button, [tabindex="0"]'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  document.body.appendChild(sheet);
  const firstItem = sheet.querySelector('.more-item');
  if (firstItem) {
    try { firstItem.focus(); } catch (e) {}
  }
}

    return { tabMarkup: tabMarkup, bindTabButton: bindTabButton, renderTabs: renderTabs, toggleMoreMenu: toggleMoreMenu };
  }

  global.H2TabsNav = { createTabNav: createTabNav };
})(typeof window !== 'undefined' ? window : globalThis);
