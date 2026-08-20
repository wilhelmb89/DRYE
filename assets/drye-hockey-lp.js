/* DRYE hockey LP — shared behaviour. One file for every drye-hockey-* section. */
(function () {
  if (window.DRYEHockey) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Deliberately NOT setting .js on <html>. base.css hides every .dryeNEW-reveal
     element behind that class, which meant sections rendered blank and popped in
     as you scrolled — the white flash. Nothing is hidden now; the observer below
     still runs, so if the theme arms reveal elsewhere the sections are unhidden
     early rather than late. */

  function reveal(scope) {
    var els = scope.querySelectorAll('.dryeNEW-reveal:not([data-drye-reveal-bound])');
    if (!els.length) return;
    var narrow = window.matchMedia('(max-width: 767px)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.setAttribute('data-drye-reveal-bound', '1'); el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: narrow ? 0.4 : 0.18, rootMargin: narrow ? '0px 0px -22% 0px' : '0px 0px -8% 0px' });
    els.forEach(function (el) {
      el.setAttribute('data-drye-reveal-bound', '1');
      /* Anything already at or above the fold is shown at once — no first-paint
         flash even if something else on the page arms the reveal. */
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-visible');
        return;
      }
      if (narrow) el.classList.remove('dryeNEW-rd1', 'dryeNEW-rd2', 'dryeNEW-rd3');
      io.observe(el);
    });
  }

  function rails(scope) {
    scope.querySelectorAll('[data-drye-rail]:not([data-drye-rail-bound])').forEach(function (root) {
      root.setAttribute('data-drye-rail-bound', '1');
      var track = root.querySelector('[data-drye-rail-track]');
      if (!track) return;
      var step = function () {
        var card = track.firstElementChild;
        if (!card) return track.clientWidth * 0.8;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return card.getBoundingClientRect().width + gap;
      };
      root.querySelectorAll('[data-drye-rail-prev]').forEach(function (b) {
        b.addEventListener('click', function () { track.scrollBy({ left: -step() * 2, behavior: 'smooth' }); });
      });
      root.querySelectorAll('[data-drye-rail-next]').forEach(function (b) {
        b.addEventListener('click', function () { track.scrollBy({ left: step() * 2, behavior: 'smooth' }); });
      });
    });
  }

  function carousels(scope) {
    scope.querySelectorAll('[data-drye-carousel]:not([data-drye-carousel-bound])').forEach(function (root) {
      root.setAttribute('data-drye-carousel-bound', '1');
      var track = root.querySelector('[data-drye-carousel-track]');
      if (!track) return;
      var slides = track.children.length;
      var i = 0;
      function paint() { track.style.transform = 'translateX(' + (-100 * i) + '%)'; }
      root.querySelectorAll('[data-drye-carousel-prev]').forEach(function (b) {
        b.addEventListener('click', function () { i = (i + slides - 1) % slides; paint(); });
      });
      root.querySelectorAll('[data-drye-carousel-next]').forEach(function (b) {
        b.addEventListener('click', function () { i = (i + 1) % slides; paint(); });
      });
      var x0 = null;
      track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 48) { i = dx < 0 ? (i + 1) % slides : (i + slides - 1) % slides; paint(); }
        x0 = null;
      });
      paint();
    });
  }

  /* Period clock for drye-hockey-mechanism: counts one period, then the next. */
  function clocks(scope) {
    scope.querySelectorAll('[data-drye-clock]:not([data-drye-clock-bound])').forEach(function (root) {
      root.setAttribute('data-drye-clock-bound', '1');
      if (reduce) return;
      var mins = parseInt(root.getAttribute('data-drye-clock-minutes'), 10) || 20;
      var periods = parseInt(root.getAttribute('data-drye-clock-periods'), 10) || 3;
      var timeEl = root.querySelector('[data-drye-clock-time]');
      var meterEl = root.querySelector('[data-drye-clock-meter]');
      var perEl = root.querySelector('[data-drye-clock-period]');
      var words = perEl ? perEl.textContent.trim().split(/\s+/) : ['Period', '1', 'of'];
      var word = words[0] || 'Period';
      var of = words[2] || 'of';
      var total = mins * 60;
      var sec = 0;
      var period = 1;
      var running = !('IntersectionObserver' in window);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { running = e.isIntersecting; });
        }, { threshold: 0.2 }).observe(root);
      }

      setInterval(function () {
        if (!running) return;
        sec += 12;
        if (sec >= total) { sec = 0; period = period % periods + 1; }
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        if (timeEl) timeEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        if (meterEl) meterEl.style.width = (sec / total * 100).toFixed(1) + '%';
        if (perEl) perEl.textContent = word + ' ' + period + ' ' + of + ' ' + periods;
      }, 220);
    });
  }

  /* Animation clocks + arrival sequencing.

     Separate from reveal on purpose: reveal fires early (so nothing pops in),
     but a looping figure must not start counting until the thing it animates is
     actually on screen.

       data-drye-anim           selector for the element to watch (section is fallback)
       data-drye-anim-steps     how many cards arrive in sequence (omit = no sequence)
       data-drye-anim-step-ms   ms between arrivals, default 3000

     Sets .is-seq at bind time (collapsed start state — gated so that if this
     never runs, everything renders normally), then .is-running plus a
     data-step counter on intersection. Single pass; loops keep running. */
  function anims(scope) {
    scope.querySelectorAll('[data-drye-anim]:not([data-drye-anim-bound])').forEach(function (root) {
      root.setAttribute('data-drye-anim-bound', '1');

      var steps = parseInt(root.getAttribute('data-drye-anim-steps'), 10) || 0;
      var gap = parseInt(root.getAttribute('data-drye-anim-step-ms'), 10) || 3000;

      if (reduce || !('IntersectionObserver' in window)) {
        if (steps) root.setAttribute('data-step', String(steps));
        root.classList.add('is-running');
        return;
      }

      if (steps) root.classList.add('is-seq');

      var sel = root.getAttribute('data-drye-anim');
      var target = (sel && root.querySelector(sel)) || root;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          root.classList.add('is-running');
          if (!steps) return;
          var i = 1;
          root.setAttribute('data-step', '1');
          var t = setInterval(function () {
            i += 1;
            root.setAttribute('data-step', String(i));
            if (i >= steps) clearInterval(t);
          }, gap);
        });
      }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });

      io.observe(target);
    });
  }