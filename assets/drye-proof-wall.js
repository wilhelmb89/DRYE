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

    function loopPoint() { return scroller.scrollWidth / 2; } // content is duplicated
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
      if (!paused && !reduce) {
        acc += speed;
        var half = loopPoint();
        if (half > 0 && acc >= half) { acc -= half; }
        scroller.scrollLeft = acc;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(function () { requestAnimationFrame(frame); });
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
