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

  /* One-time nudge so the reader physically feels a row is swipeable.

     Two things the old per-section inline version got wrong. It fired 700ms
     after page load — while the section was still far below the fold, so the
     affordance was spent unseen. And it scrolled against scroll-snap-type: x
     mandatory, which cancels a short programmatic scroll instantly, so nothing
     moved at all. Snap is switched off for the duration, and the whole thing
     waits for the row to be on screen. */
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

  /* Legacy rail: overflow on the track, arrows overlaying it. Kept as-is for
     the sections still on it. New sections should use strips() instead. */
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

  /* Swipe strip: snap columns, dots, mobile pill hint, desktop arrows.
     Behaviour lives here rather than in a per-section inline <script> so it
     also re-arms on shopify:section:load.

     Hooks:  [data-drye-strip]              wrapper
             [data-drye-strip-track]        the scroll container
             [data-drye-strip-hint]         mobile pill, hidden on first touch
             [data-drye-strip-dots]         empty container, filled here
             [data-drye-strip-prev/next]    arrows
             data-drye-strip-dot-class      class for generated dots */
  function strips(scope) {
    scope.querySelectorAll('[data-drye-strip]:not([data-drye-strip-bound])').forEach(function (root) {
      root.setAttribute('data-drye-strip-bound', '1');
      var track = root.querySelector('[data-drye-strip-track]');
      if (!track) return;

      var cards = Array.prototype.slice.call(track.children);
      var hint = root.querySelector('[data-drye-strip-hint]');
      /* dots sit outside the wrapper, so search the section, not the wrapper */
      var section = root.closest('[data-drye-section]') || root.parentElement;
      var dotsWrap = section ? section.querySelector('[data-drye-strip-dots]') : null;

      if (cards.length < 2) {
        if (hint) hint.classList.add('is-hidden');
        track.classList.add('is-at-end');
        return;
      }

      var dots = [];
      if (dotsWrap) {
        var dotClass = root.getAttribute('data-drye-strip-dot-class') || 'drye-hockey-obj__dot';
        cards.forEach(function (_, i) {
          var d = document.createElement('span');
          d.className = dotClass + (i === 0 ? ' is-active' : '');
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
      function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; paint(); });
      }

      track.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);

      /* The pill has done its job the moment the reader touches the row. */
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

      paint();
      nudge(track);
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

  /* Period clock for drye-hockey-mechanism: counts one period, then the next.

     requestAnimationFrame off a real timestamp, not setInterval. setInterval is
     not frame-synced: when the main thread is busy its ticks are deferred and
     queued, so the clock drifts and stutters. Elapsed time is read from the
     clock the browser gives us, so a dropped frame costs nothing — the next
     frame lands on the correct value instead of trying to catch up.

     Writes are also gated: the DOM is only touched when the rendered value
     actually changes. The old version rewrote the period line 4.5 times a
     second for a string that changes once per period. */
  function clocks(scope) {
    scope.querySelectorAll('[data-drye-clock]:not([data-drye-clock-bound])').forEach(function (root) {
      root.setAttribute('data-drye-clock-bound', '1');
      if (reduce) return;

      var mins = parseInt(root.getAttribute('data-drye-clock-minutes'), 10) || 20;
      var periods = parseInt(root.getAttribute('data-drye-clock-periods'), 10) || 3;
      var speed = parseFloat(root.getAttribute('data-drye-clock-speed')) || 55;

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
      var last = 0;
      var shownSec = -1;
      var shownPeriod = 0;
      var frame = null;

      function paint() {
        var s = Math.floor(sec);
        if (s !== shownSec) {
          shownSec = s;
          if (timeEl) {
            var m = Math.floor(s / 60);
            var r = s % 60;
            timeEl.textContent = m + ':' + (r < 10 ? '0' : '') + r;
          }
          /* scaleX, not width: a percentage width relayouts the meter every
             tick, a transform is composited. */
          if (meterEl) meterEl.style.transform = 'scaleX(' + (s / total).toFixed(4) + ')';
        }
        if (period !== shownPeriod) {
          shownPeriod = period;
          if (perEl) perEl.textContent = word + ' ' + period + ' ' + of + ' ' + periods;
        }
      }

      function tick(now) {
        frame = null;
        if (!running) return;
        if (!last) last = now;
        sec += ((now - last) / 1000) * speed;
        last = now;
        if (sec >= total) { sec = 0; period = period % periods + 1; }
        paint();
        frame = requestAnimationFrame(tick);
      }

      function start() {
        if (frame) return;
        last = 0;
        frame = requestAnimationFrame(tick);
      }

      function stop() {
        if (!frame) return;
        cancelAnimationFrame(frame);
        frame = null;
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            running = e.isIntersecting;
            if (running) start(); else stop();
          });
        }, { threshold: 0.2 }).observe(root);
      } else {
        start();
      }

      /* A backgrounded tab throttles rAF to a stop; resume cleanly instead of
         jumping by however long the phone was locked. */
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else if (running) start();
      });

      paint();
    });
  }

  /* Animation clocks + arrival sequencing.

     Separate from reveal on purpose: reveal fires early (so nothing pops in),
     but a looping figure must not start counting until the thing it animates is
     actually on screen.

       data-drye-anim           selector for the element to watch (section is fallback)
       data-drye-anim-steps     how many cards arrive in sequence (omit = no sequence)
       data-drye-anim-step-ms   ms between arrivals, default 3000

     Sets .is-seq at bind time (the collapsed start state — gated on it so that
     if this never runs, everything renders normally), then .is-running plus a
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

  /* Continuous quote marquee — drye-hockey-peer-voices.

     Native scroll, not transform. The old version moved the track with
     translateX, which is pure paint: there is no scroll container, so a finger
     has nothing to grab. Writing scrollLeft per frame instead means swipe,
     momentum and gesture direction-locking are the browser's job, and the
     marquee is a normal horizontal scroller that happens to drift.

     The section renders its blocks TWICE. Half the track width is therefore one
     full set, and wrapping by that amount is invisible. Wrapping works in both
     directions, so the reader can also swipe backwards forever.

     Deliberately not the carousel() pattern: this has no pages, no dots and no
     arrows, so paginated stepping would fight the drift. */
  function marquees(scope) {
    scope.querySelectorAll('[data-drye-marquee]:not([data-drye-marquee-bound])').forEach(function (port) {
      port.setAttribute('data-drye-marquee-bound', '1');
      var track = port.querySelector('[data-drye-marquee-track]');
      if (!track) return;

      /* Half the track, remeasured on resize: the cards are sized in vw. */
      var half = 0;
      function measure() { half = track.scrollWidth / 2; }
      measure();
      window.addEventListener('resize', measure);

      /* Start one set in, so a backwards swipe has somewhere to go immediately. */
      port.scrollLeft = 0;

      /* Reduced motion: no drift, still a swipeable row. Nothing else to do. */
      if (reduce) return;

      /* Signed: positive drifts the cards right-to-left (scrollLeft grows, so the
         viewport travels rightward through the content and the cards slide left,
         entering from the right edge). Negative reverses it. */
      var speed = parseFloat(port.getAttribute('data-drye-marquee-speed'));
      if (isNaN(speed)) speed = 26;
      if (!speed) return; // 0 = plain swipeable row, no drift
      var pos = 0;
      var last = 0;
      var mine = -1;
      var frame = null;
      var onscreen = false;
      var held = false;
      var idle = null;

      function wrap() {
        if (!half) return;
        if (pos >= half) pos -= half;
        else if (pos < 0) pos += half;
      }

      function tick(now) {
        frame = null;
        if (!onscreen || held) return;
        if (!last) last = now;
        pos += speed * ((now - last) / 1000);
        last = now;
        wrap();
        /* Keep the float ourselves — scrollLeft rounds, and re-reading it every
           frame would make the drift stutter at sub-pixel speeds. */
        port.scrollLeft = pos;
        mine = port.scrollLeft;
        frame = requestAnimationFrame(tick);
      }

      function start() {
        if (frame || held || !onscreen) return;
        last = 0;
        frame = requestAnimationFrame(tick);
      }

      function stop() {
        if (!frame) return;
        cancelAnimationFrame(frame);
        frame = null;
      }

      /* Hand control over the moment the reader touches it, and take it back
         only once they have been still for a beat. Resuming mid-momentum would
         yank the row out from under the finger. */
      function hold() {
        held = true;
        stop();
        if (idle) clearTimeout(idle);
      }

      function release(delay) {
        if (idle) clearTimeout(idle);
        idle = setTimeout(function () {
          held = false;
          pos = port.scrollLeft;
          wrap();
          mine = -1;
          start();
        }, delay);
      }

      ['pointerdown', 'touchstart', 'wheel'].forEach(function (ev) {
        port.addEventListener(ev, hold, { passive: true });
      });
      ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'mouseleave'].forEach(function (ev) {
        port.addEventListener(ev, function () { release(1600); }, { passive: true });
      });

      /* Momentum scrolling on iOS fires no pointer event at all, so a raw scroll
         that we did not write also counts as the reader taking over. */
      port.addEventListener('scroll', function () {
        /* Compare against the exact value WE last wrote, not against the rAF
           state: a scroll event is queued, so it can land in a frame where
           frame === null and be misread as the reader taking over — which would
           stall the drift a beat after every wrap. */
        if (Math.abs(port.scrollLeft - mine) < 2) return;
        hold();
        release(1600);
      }, { passive: true });

      /* Hover pause on desktop, as before. */
      port.addEventListener('mouseenter', hold, { passive: true });

      /* Never animate a section nobody is looking at — and never keep a rAF loop
         alive in a backgrounded tab. */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            onscreen = e.isIntersecting;
            if (onscreen) start(); else stop();
          });
        }, { threshold: 0 }).observe(port);
      } else {
        onscreen = true;
        start();
      }

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
    });
  }

  window.DRYEHockey = {
    init: function (scope) {
      var t = scope || document;
      reveal(t); rails(t); strips(t); carousels(t); clocks(t); anims(t); marquees(t);
    }
  };

  document.addEventListener('DOMContentLoaded', function () { window.DRYEHockey.init(); });
  document.addEventListener('shopify:section:load', function (e) { window.DRYEHockey.init(e.target); });
  if (document.readyState !== 'loading') window.DRYEHockey.init();
})();
