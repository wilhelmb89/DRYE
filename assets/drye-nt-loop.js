/* drye-nt-loop.js — automatic right-to-left marquee for .loop-grid.
   Works ON TOP of the existing scroll-snap swipe carousel:
   - Duplicates each .loop-item once (aria-hidden) so the loop is seamless.
   - Ticks scrollLeft forward at ~40px/s using requestAnimationFrame.
   - Wraps back to 0 when it reaches the duplicated half.
   - Pauses on hover / focus / touch / when tab is hidden.
   - Respects prefers-reduced-motion.
   - Desktop (>=860px) uses the CSS grid — the marquee is disabled there.
*/
(function () {
  var MQ_DESKTOP = '(min-width: 860px)';
  var MQ_REDUCE  = '(prefers-reduced-motion: reduce)';
  var SPEED_PX_PER_S = 40;

  function initGrid(grid) {
    if (grid.__dryeLoopInit) return;
    grid.__dryeLoopInit = true;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.loop-item'));
    if (items.length < 2) return;

    // Duplicate items once for a seamless loop
    items.forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      grid.appendChild(clone);
    });

    var paused = false;
    var lastT  = 0;

    function halfWidth() {
      // total scroll length of the ORIGINAL set (grid.scrollWidth is 2x since we cloned)
      return grid.scrollWidth / 2;
    }

    function tick(t) {
      if (!lastT) lastT = t;
      var dt = (t - lastT) / 1000;
      lastT = t;

      if (!paused &&
          !window.matchMedia(MQ_DESKTOP).matches &&
          !window.matchMedia(MQ_REDUCE).matches &&
          !document.hidden) {
        var next = grid.scrollLeft + SPEED_PX_PER_S * dt;
        var h = halfWidth();
        if (next >= h) next -= h;
        grid.scrollLeft = next;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Pause on user interaction
    ['mouseenter', 'touchstart', 'focusin'].forEach(function (evt) {
      grid.addEventListener(evt, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'touchend', 'focusout'].forEach(function (evt) {
      grid.addEventListener(evt, function () { paused = false; }, { passive: true });
    });
  }

  function initAll() {
    document.querySelectorAll('.drye-nt-loop .loop-grid').forEach(initGrid);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Shopify theme editor: re-init when the section is re-rendered
  document.addEventListener('shopify:section:load', initAll);
})();
