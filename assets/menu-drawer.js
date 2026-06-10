// DRYE — menu-drawer.js (frikopplad, utan beroenden)
(function () {
  const drawer  = document.getElementById('menuDrawer');
  const overlay = document.getElementById('si-overlay');
  if (!drawer) return;

  let lastOpener = null;

  const SELECTORS_FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

 function getFocusable(root){
  const nodes = root.querySelectorAll(SELECTORS_FOCUSABLE);
  return Array.from(nodes).filter(el => {
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.disabled && el.tabIndex !== -1;
  });
}


function lockScroll(on){
  if (on) {
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
  } else {
    const stillOpen = document.querySelector(
      '.menu-drawer.active, .menu-drawer[aria-hidden="false"], ' +
      'cart-drawer.drawer[aria-hidden="false"], ' +
      '#size-chart-drawer.active, #size-chart-drawer.is-open, ' +
      '#size-guide-modal.active, #size-guide-modal.is-open'
    );
    if (!stillOpen) {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    }
  }
}




  function openDrawer(opener) {
    lastOpener = opener || document.activeElement;
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    if (opener) opener.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.classList.add('active');
    lockScroll(true);

    const f = getFocusable(drawer)[0];
    if (f) setTimeout(() => f.focus(), 0);
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('active');
    lockScroll(false);

    if (lastOpener) {
      lastOpener.setAttribute('aria-expanded', 'false');
      setTimeout(() => lastOpener.focus(), 0);
    }
  }

  // Öppna via valfri trigger (kräver data-open-drawer="menuDrawer" ELLER aria-controls="menuDrawer")
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-drawer], [aria-controls="menuDrawer"]');
    if (opener && (opener.getAttribute('data-open-drawer') === 'menuDrawer' || opener.getAttribute('aria-controls') === 'menuDrawer')) {
      e.preventDefault(); openDrawer(opener); return;
    }

    if (e.target.closest('[data-close-drawer]')) { e.preventDefault(); closeDrawer(); return; }
    if (overlay && e.target === overlay) { closeDrawer(); return; }
  }, { passive: false });


  // Klaviatur: Escape stänger, Tab trap i panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.getAttribute('aria-hidden') === 'false') {
      e.preventDefault(); closeDrawer(); return;
    }
    if (e.key === 'Tab' && drawer.getAttribute('aria-hidden') === 'false') {
      const nodes = getFocusable(drawer); if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Extra säkerhet för stängknappen
  const closeBtn = drawer.querySelector('[data-close-drawer], #menuClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeDrawer(); });
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeDrawer(); }
    });
  }
})();
