/* DRYE Proof Wall — interaction.
   - Media row: a real scroll container that ALSO auto-scrolls right -> left.
     Auto-scroll uses a float accumulator (setting scrollLeft += <1px directly
     rounds to 0 and never moves), pauses on touch/hover/wheel so the user can
     swipe, and loops seamlessly because the cards are duplicated in Liquid.
     With reduce-motion it simply doesn't auto-scroll, but stays swipeable.
   - Review row: prev/next arrows.
   Binds on load and on Shopify section load. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function autoScroll(scroller) {
    if (!scroller || scroller.dataset.dpwAuto) return;
    scroller.dataset.dpwAuto = '1';

    var speed = parseFloat(scroller.getAttribute('data-dpw-speed')) || 0.5;
    var acc = scroller.scrollLeft || 0;
    var paused = false;
    var resumeTO = null;
    var rafId = null;
    var inView = false;

    function loopPoint() { return scroller.scrollWidth / 2; } // content is duplicated
    function eligible() {
      // Only animate while the row is on screen AND the tab is in the foreground.
      // Previously the rAF loop changed scrollLeft ~60x/sec forever (even off-screen
      // or in a background tab), which floods session recorders like Microsoft Clarity
      // with scroll events and makes them exceed their per-session cap and drop the
      // recording. Gating the loop keeps the visual behaviour but stops the flood.
      return inView && !reduce && document.visibilityState === 'visible';
    }
    function start() { if (rafId == null && eligible()) { rafId = requestAnimationFrame(frame); } }
    function stop() { if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; } }
    function pause() { paused = true; if (resumeTO) { clearTimeout(resumeTO); } }
    function resumeSoon() {
      if (resumeTO) { clearTimeout(resumeTO); }
      resumeTO = setTimeout(function () { acc = scroller.scrollLeft; paused = false; }, 1100);
    }

    scroller.addEventListener('pointerenter', pause);
    scroller.addEventListener('pointerleave', resumeSoon);
    scroller.addEventListener('touchstart', pause, { passive: true });
    scroller.addEventListener('touchend', resumeSoon, { passive: true });
    scroller.addEventListener('touchcancel', resumeSoon, { passive: true });
    scroller.addEventListener('wheel', function () { pause(); resumeSoon(); }, { passive: true });
    // Keep the accumulator in sync while the user is dragging.
    scroller.addEventListener('scroll', function () { if (paused) { acc = scroller.scrollLeft; } }, { passive: true });

    function frame() {
      rafId = null;
      if (!eligible()) { return; } // stop the loop; observers below will restart it
      if (!paused) {
        acc += speed;
        var half = loopPoint();
        if (half > 0 && acc >= half) { acc -= half; }
        // Round to whole pixels: a fractional scrollLeft re-rasterises text glyphs
        // on the sub-pixel grid every frame, which makes the overlay labels appear
        // to shimmer/wobble horizontally. Integer scroll positions render crisply.
        scroller.scrollLeft = Math.round(acc);
      }
      rafId = requestAnimationFrame(frame);
    }

    // Run only while the row is visible in the viewport.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) { acc = scroller.scrollLeft; start(); } else { stop(); }
      }, { threshold: 0 }).observe(scroller);
    } else {
      inView = true;
      start();
    }

    // Pause when the tab goes to the background, resume when it returns.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { acc = scroller.scrollLeft; start(); } else { stop(); }
    });
  }

  function setup(sec) {
    if (!sec || sec.dataset.dpwBound) return;
    sec.dataset.dpwBound = '1';

    sec.querySelectorAll('[data-dpw-autoscroll]').forEach(autoScroll);

    // Review row: prev / next arrows scroll one card at a time.
    var track = sec.querySelector('.dpw__row--reviews');
    var prev = sec.querySelector('[data-dpw-prev]');
    var next = sec.querySelector('[data-dpw-next]');
    function step(dir) {
      if (!track) { return; }
      var card = track.querySelector('.dpw__review');
      var amount = card ? (card.getBoundingClientRect().width + 14) : Math.round(track.clientWidth * 0.85);
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }
    if (prev) { prev.addEventListener('click', function () { step(-1); }); }
    if (next) { next.addEventListener('click', function () { step(1); }); }
  }

  function initAll(root) {
    (root || document).querySelectorAll('[data-dpw]').forEach(setup);
  }

  if (document.readyState !== 'loading') { initAll(); }
  else { document.addEventListener('DOMContentLoaded', function () { initAll(); }); }
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
