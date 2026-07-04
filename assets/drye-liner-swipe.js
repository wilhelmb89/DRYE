/**
 * Shared swipe-carousel behavior for DRYE Liner landing sections.
 * Tracks native scroll position, syncs dot indicators, wires optional
 * desktop prev/next arrows, and does a one-time "nudge" scroll so
 * first-time visitors feel that the row moves.
 *
 * Usage: call initDryeLinerSwipe with a config object once per carousel
 * instance. Safe to call multiple times on a page (e.g. two sections
 * both using this script) since each call scopes to its own elements.
 */
function initDryeLinerSwipe(config) {
  var track = document.getElementById(config.trackId);
  if (!track) return;
  var wrap = track.closest('[data-drye-liner-swipe-wrap]') || track.parentElement;
  if (!wrap) return;

  var dots = config.dotsId ? document.querySelectorAll('#' + config.dotsId + ' [data-drye-liner-dot]') : [];
  var nav = config.navId ? document.getElementById(config.navId) : null;
  var cardSelector = config.cardSelector;

  function getCardStep() {
    var cards = track.querySelectorAll(cardSelector);
    if (!cards.length) return 0;
    return cards[0].offsetWidth + (config.gap || 8);
  }

  wrap.addEventListener(
    'scroll',
    function () {
      var step = getCardStep();
      if (!step) return;
      var cards = track.querySelectorAll(cardSelector);
      var idx = Math.min(Math.round(wrap.scrollLeft / step), cards.length - 1);
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === idx);
      });
    },
    { passive: true }
  );

  function applyBreakpoint() {
    var isDesktop = window.innerWidth >= 768;
    if (nav) nav.style.display = isDesktop ? 'flex' : 'none';
  }
  applyBreakpoint();
  window.addEventListener('resize', applyBreakpoint);

  if (config.prevId) {
    var prevBtn = document.getElementById(config.prevId);
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        wrap.scrollBy({ left: -getCardStep(), behavior: 'smooth' });
      });
    }
  }
  if (config.nextId) {
    var nextBtn = document.getElementById(config.nextId);
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        wrap.scrollBy({ left: getCardStep(), behavior: 'smooth' });
      });
    }
  }

  if (config.nudge !== false) {
    nudgeDryeLinerSwipe(wrap, config.nudgeDelay || 700);
  }
}

/**
 * One-time gentle scroll-right-then-back so first-time visitors physically
 * feel that a row is swipeable, without a persistent icon or text hint.
 * Skips prefers-reduced-motion and rows with nothing to scroll.
 */
function nudgeDryeLinerSwipe(wrap, delay) {
  if (!wrap) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  if (wrap.scrollWidth <= wrap.clientWidth + 4) return;
  setTimeout(function () {
    var prevSnap = wrap.style.scrollSnapType;
    wrap.style.scrollSnapType = 'none'; // mandatory snap would otherwise cancel scrollTo instantly
    wrap.scrollTo({ left: 46, behavior: 'smooth' });
    setTimeout(function () {
      wrap.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(function () {
        wrap.style.scrollSnapType = prevSnap;
      }, 500);
    }, 480);
  }, delay);
}
