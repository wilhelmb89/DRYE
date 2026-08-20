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
      if (slides < 2) return;
      var i = 0;
      function paint() { track.style.transform = 'translateX(' + (-100 * i) + '%)'; }
      root.querySelectorAll('[data-drye-carousel-prev]').forEach(function (b) {
        b.addEventListener('click', function () { i = (i + slides - 1) % slides; paint(); });
      });
      root.querySelectorAll('[data-drye-carousel-next]').forEach(function (b) {
        b.addEventListener('click', function () { i = (i + 1) % slides; paint(); });
      });

      /* Axis lock. The old version fired on any touch whose horizontal delta
         passed 48px — a diagonal scroll down the page counted as a swipe, which
         is why the carousel jumped while the reader was only scrolling. A swipe
         now has to be both long enough AND more horizontal than vertical. */
      var x0 = null, y0 = null;
      track.addEventListener('touchstart', function (e) {
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
      }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          i = dx < 0 ? (i + 1) % slides : (i + slides - 1) % slides;
          paint();
        }
        x0 = null;
        y0 = null;
      }, { passive: true });

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

  /* Animation clocks. Separate from reveal on purpose: reveal fires early (so
     nothing pops in), but a looping figure must not start counting until the
     thing it animates is actually on screen. data-drye-anim holds an optional
     selector for the element to watch; the section itself is the fallback. */
  function anims(scope) {
    scope.querySelectorAll('[data-drye-anim]:not([data-drye-anim-bound])').forEach(function (root) {
      root.setAttribute('data-drye-anim-bound', '1');
      if (reduce || !('IntersectionObserver' in window)) {
        root.classList.add('is-running');
        return;
      }
      var sel = root.getAttribute('data-drye-anim');
      var target = (sel && root.querySelector(sel)) || root;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          root.classList.add('is-running');
          io.unobserve(e.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -30% 0px' });
      io.observe(target);
    });
  }

  window.DRYEHockey = {
    init: function (scope) {
      var t = scope || document;
      reveal(t); rails(t); strips(t); carousels(t); clocks(t); anims(t);
    }
  };

  document.addEventListener('DOMContentLoaded', function () { window.DRYEHockey.init(); });
  document.addEventListener('shopify:section:load', function (e) { window.DRYEHockey.init(e.target); });
  if (document.readyState !== 'loading') window.DRYEHockey.init();

  /* Swipe strip: snap columns, dots, mobile pill hint, desktop arrows.
     Behaviour lives here rather than in a per-section inline <script> so it
     also re-arms on shopify:section:load. */
  function strips(scope) {
    scope.querySelectorAll('[data-drye-strip]:not([data-drye-strip-bound])').forEach(function (root) {
      root.setAttribute('data-drye-strip-bound', '1');
      var track = root.querySelector('[data-drye-strip-track]');
      if (!track) return;

      var cards = Array.prototype.slice.call(track.children);
      var hint = root.querySelector('[data-drye-strip-hint]');
      /* dots live outside the wrap, so search the section, not the wrap */
      var section = root.closest('[data-drye-section]') || root.parentElement;
      var dotsWrap = section ? section.querySelector('[data-drye-strip-dots]') : null;

      if (cards.length < 2) {
        if (hint) hint.classList.add('is-hidden');
        track.classList.add('is-at-end');
        return;
      }

      var dots = [];
      if (dotsWrap) {
        cards.forEach(function (_, i) {
          var d = document.createElement('span');
          d.className = 'drye-hockey-obj__dot' + (i === 0 ? ' is-active' : '');
          dotsWrap.appendChild(d);
          dots.push(d);
        });
      }

      function step() {
        var first = cards[0];
        if (!first) return track.clientWidth * 0.8;
        var cs = getComputedStyle(track);
        var gap = parseFloat(cs.columnGap || cs.gap) || 0;
        return first.getBoundingClientRect().width + gap;
      }

      var touched = false;

      function paint() {
        var s = step();
        var i = s ? Math.round(track.scrollLeft / s) : 0;
        if (i < 0) i = 0;
        if (i > cards.length - 1) i = cards.length - 1;

        dots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });

        var max = track.scrollWidth - track.clientWidth;
        track.classList.toggle('is-at-end', track.scrollLeft >= max - 8);

        if (hint) {
          var wide = window.matchMedia('(min-width: 768px)').matches;
          hint.classList.toggle('is-hidden', wide || max <= 8 || track.scrollLeft > 16 || touched);
        }
      }

      var queued = false;
      track.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; paint(); });
      }, { passive: true });

      function touch() {
        if (touched) return;
        touched = true;
        if (hint) hint.classList.add('is-hidden');
        if (dotsWrap) dotsWrap.classList.add('is-faded');
      }
      track.addEventListener('touchstart', touch, { passive: true });
      track.addEventListener('pointerdown', touch, { passive: true });

      root.querySelectorAll('[data-drye-strip-prev]').forEach(function (b) {
        b.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      });
      root.querySelectorAll('[data-drye-strip-next]').forEach(function (b) {
        b.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
      });

      window.addEventListener('resize', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; paint(); });
      });

      paint();
      nudge(track);
    });
  }

  /* One-time nudge so the reader physically feels the row is swipeable.

     Two things the inline version got wrong. It fired 700ms after page load —
     while the section was still far below the fold, so the affordance was spent
     unseen. And it scrolled against scroll-snap-type: x mandatory, which
     cancels a short programmatic scroll instantly, so nothing moved at all.
     Snap is switched off for the duration and the whole thing waits for the
     row to be on screen. */
  function nudge(scroller) {
    if (reduce || !scroller || !('IntersectionObserver' in window)) return;
    var spent = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || spent) return;
        spent = true;
        io.disconnect();
        if (scroller.scrollWidth <= scroller.clientWidth + 4) return;
        setTimeout(function () {
          var prev = scroller.style.scrollSnapType;
          scroller.style.scrollSnapType = 'none';
          scroller.scrollTo({ left: 44, behavior: 'smooth' });
          setTimeout(function () {
            scroller.scrollTo({ left: 0, behavior: 'smooth' });
            setTimeout(function () { scroller.style.scrollSnapType = prev; }, 500);
          }, 460);
        }, 320);
      });
    }, { threshold: 0.35 });
    io.observe(scroller);
  }
})();
