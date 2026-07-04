document.addEventListener('DOMContentLoaded', function () {
  var modules = document.querySelectorAll('.drye-liner-worker-proof__card');

  modules.forEach(function (module) {
    var wrap = module.querySelector('[data-drye-liner-worker-proof-wrap]');
    var ticker = module.querySelector('[data-drye-liner-worker-proof-ticker]');
    var expand = module.querySelector('[data-drye-liner-worker-proof-expand]');
    var quoteEl = expand ? expand.querySelector('[data-drye-liner-worker-proof-quote]') : null;
    var sourceEl = expand ? expand.querySelector('[data-drye-liner-worker-proof-source]') : null;

    var hovering = false;
    var locked = false;
    var openItem = null;
    var resumeTimer = null;

    function setPaused() {
      if (ticker) {
        ticker.classList.toggle('is-paused', hovering || locked);
      }
    }

    if (wrap) {
      wrap.addEventListener(
        'touchstart',
        function () {
          hovering = true;
          setPaused();
          if (resumeTimer) clearTimeout(resumeTimer);
        },
        { passive: true }
      );

      wrap.addEventListener(
        'touchend',
        function () {
          if (resumeTimer) clearTimeout(resumeTimer);
          resumeTimer = setTimeout(function () {
            if (!locked) {
              hovering = false;
              setPaused();
            }
          }, 2500);
        },
        { passive: true }
      );

      wrap.addEventListener('mouseenter', function () {
        hovering = true;
        setPaused();
      });

      wrap.addEventListener('mouseleave', function () {
        hovering = false;
        setPaused();
      });
    }

    function setPlus(btn, isOpen) {
      var plus = btn.querySelector('.drye-liner-worker-proof__iplus');
      if (plus) plus.textContent = isOpen ? '−' : '+';
      btn.classList.toggle('is-open', isOpen);
    }

    function openExpand(btn) {
      if (!expand) return;
      if (openItem && openItem !== btn) setPlus(openItem, false);

      var full = btn.getAttribute('data-full') || '';
      var handle = btn.getAttribute('data-handle') || '';
      var label = btn.getAttribute('data-label') || '';

      if (quoteEl) quoteEl.textContent = '"' + full + '"';
      if (sourceEl) sourceEl.textContent = [handle, label].filter(Boolean).join(' · ');

      expand.hidden = false;
      setPlus(btn, true);
      openItem = btn;
      locked = true;
      setPaused();
    }

    function closeExpand() {
      if (expand) expand.hidden = true;
      if (openItem) {
        setPlus(openItem, false);
        openItem = null;
      }
      locked = false;
      hovering = false;
      setPaused();
    }

    module.addEventListener('click', function (e) {
      var target = e.target;
      var closeBtn = target.closest ? target.closest('[data-drye-liner-worker-proof-close]') : null;
      if (closeBtn) {
        closeExpand();
        return;
      }

      var itemBtn = target.closest ? target.closest('[data-drye-liner-worker-proof-item]') : null;
      if (!itemBtn) return;

      if (itemBtn === openItem) {
        closeExpand();
      } else {
        openExpand(itemBtn);
      }
    });
  });
});
