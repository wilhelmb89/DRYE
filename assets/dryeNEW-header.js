document.addEventListener('DOMContentLoaded', function () {
  var headers = document.querySelectorAll('[data-drye-header]');

  headers.forEach(function (header) {
    var overlay = header.querySelector('[data-drye-header-overlay]');
    var openBtn = header.querySelector('[data-drye-header-open]');
    var closeBtn = header.querySelector('[data-drye-header-close]');
    var navItems = header.querySelectorAll('[data-drye-header-nav-item]');

    if (!overlay || !openBtn || !closeBtn) return;

    var lastFocusedElement = null;

    function openMenu() {
      lastFocusedElement = document.activeElement;
      overlay.hidden = false;

      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
        overlay.removeAttribute('hidden');
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
    }

    function closeMenu() {
      overlay.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      window.setTimeout(function () {
        overlay.setAttribute('hidden', 'hidden');

        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
          lastFocusedElement.focus();
        }
      }, 380);
    }

    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);

    navItems.forEach(function (item) {
      item.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeMenu();
      }
    });
  });
});