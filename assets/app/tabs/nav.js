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
  return `<button id="${id}" type="button" role="tab" aria-selected="${selected ? 'true' : 'false'}" aria-controls="content" tabindex="${selected ? '0' : '-1'}" class="tab-btn${selected ? ' active' : ''}" data-tab="${t.id}" title="${t.name}">${t.icon}<span>${label}</span></button>`;
}

function bindTabButton(b) {
  b.onclick = () => {
    openTab(b.dataset.tab);
  };
  b.onkeydown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const tabs = [...document.querySelectorAll('#tabs .tab-btn')];
      const index = tabs.indexOf(b);
      if (index < 0) return;
      const next = (index + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); tabs[next].click();
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
    const moreBtnHtml = `<button id="m-tab-more" type="button" role="tab" aria-selected="${isOverflowActive ? 'true' : 'false'}" aria-controls="content" class="tab-btn${isOverflowActive ? ' active' : ''}" title="Mục khác">${moreIcon}<span>Khác</span></button>`;

    bottom.innerHTML = mainBottom.map(t => tabMarkup(t, `m-tab-${t.id}`)).join('') + moreBtnHtml;
    bottom.querySelectorAll('.tab-btn:not(#m-tab-more)').forEach(bindTabButton);

    const moreBtn = document.getElementById('m-tab-more');
    if (moreBtn) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        toggleMoreMenu(overflowTabs);
      };
    }
  }
}

function toggleMoreMenu(overflowTabs) {
  let sheet = document.getElementById('moreMenuSheet');
  let backdrop = document.getElementById('moreMenuBackdrop');
  if (sheet) {
    sheet.remove();
    if (backdrop) backdrop.remove();
    return;
  }
  backdrop = document.createElement('div');
  backdrop.id = 'moreMenuBackdrop';
  backdrop.className = 'more-menu-backdrop';
  backdrop.onclick = () => { sheet?.remove(); backdrop?.remove(); };
  document.body.appendChild(backdrop);

  sheet = document.createElement('div');
  sheet.id = 'moreMenuSheet';
  sheet.className = 'more-menu-sheet';
  sheet.innerHTML = overflowTabs.map(t => {
    const sel = state.tab === t.id;
    return `<button type="button" class="more-item${sel ? ' active font-bold' : ''}" data-tab="${t.id}">${t.icon}<span>${t.name}</span></button>`;
  }).join('');
  sheet.querySelectorAll('.more-item').forEach(btn => {
    btn.onclick = () => {
      state.tab = btn.dataset.tab;
      sheet.remove();
      backdrop.remove();
      renderTabs();
      render();
    };
  });
  document.body.appendChild(sheet);
}

    return { tabMarkup: tabMarkup, bindTabButton: bindTabButton, renderTabs: renderTabs, toggleMoreMenu: toggleMoreMenu };
  }

  global.H2TabsNav = { createTabNav: createTabNav };
})(typeof window !== 'undefined' ? window : globalThis);
