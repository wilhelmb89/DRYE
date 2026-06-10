document.addEventListener('DOMContentLoaded', () => {
  const navSections = document.querySelectorAll('[data-drye-mobile-nav]');

  navSections.forEach((navRoot) => {
    const overlay = navRoot.querySelector('[data-mobile-nav-overlay]');
    const openBtn = navRoot.querySelector('[data-mobile-nav-open]');
    const closeBtn = navRoot.querySelector('[data-mobile-nav-close]');
    const navItems = navRoot.querySelectorAll('.drye-mobile-nav__nav-item');

    if (!overlay || !openBtn || !closeBtn) return;

    let lastFocusedElement = null;

    const openMenu = () => {
      lastFocusedElement = document.activeElement;
      overlay.hidden = false;

      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
    };

    const closeMenu = () => {
      overlay.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      const handleTransitionEnd = (event) => {
        if (event.target !== overlay) return;
        overlay.hidden = true;
        overlay.removeEventListener('transitionend', handleTransitionEnd);

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
        }
      };

      overlay.addEventListener('transitionend', handleTransitionEnd, { once: false });
    };

    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeMenu();
      }
    });

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        closeMenu();
      });
    });
  });
});