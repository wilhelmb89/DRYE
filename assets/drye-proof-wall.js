/* DRYE Proof Wall — progressive enhancement only.
   The media row auto-scrolls via a pure CSS marquee (no JS needed for motion).
   This file just adds: touch/drag pause for the marquee, and prev/next arrow
   navigation for the review row. Binds on load and on Shopify section load. */
(function () {
  function setup(sec) {
    if (!sec || sec.dataset.dpwBound) return;
    sec.dataset.dpwBound = '1';

    // Pause the auto marquee while a finger is on it.
    sec.querySelectorAll('[data-dpw-marquee]').forEach(function (mq) {
      var resumeTO = null;
      function pause() { mq.classList.add('is-paused'); if (resumeTO) { clearTimeout(resumeTO); } }
      function resumeSoon() { if (resumeTO) { clearTimeout(resumeTO); } resumeTO = setTimeout(function () { mq.classList.remove('is-paused'); }, 1200); }
      mq.addEventListener('touchstart', pause, { passive: true });
      mq.addEventListener('touchend', resumeSoon, { passive: true });
      mq.addEventListener('touchcancel', resumeSoon, { passive: true });
    });

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
