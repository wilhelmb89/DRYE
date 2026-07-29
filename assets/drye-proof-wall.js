/* DRYE Proof Wall
   Infinite media scroll without duplicated cards.
   Existing cards are recycled from the start to the end.
*/
(function () {
  'use strict';

  var reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function autoScroll(scroller) {
    if (!scroller || scroller.dataset.dpwAuto) return;

    scroller.dataset.dpwAuto = '1';

    var track = scroller.querySelector('[data-dpw-marquee]');

    if (!track || track.children.length < 2) return;

    var speed =
      parseFloat(scroller.getAttribute('data-dpw-speed')) || 0.5;

    var acc = scroller.scrollLeft || 0;
    var paused = false;
    var resumeTO = null;
    var rafId = null;
    var inView = false;

    /*
      Prevent browser scroll anchoring from fighting against
      cards being moved inside the track.
    */
    scroller.style.overflowAnchor = 'none';

    function firstCardWidth() {
      var first = track.firstElementChild;

      if (!first) return 0;

      var style = window.getComputedStyle(first);

      return (
        first.getBoundingClientRect().width +
        (parseFloat(style.marginLeft) || 0) +
        (parseFloat(style.marginRight) || 0)
      );
    }

    function eligible() {
      return (
        inView &&
        !reduce &&
        !paused &&
        document.visibilityState === 'visible'
      );
    }

    function start() {
      if (rafId === null && eligible()) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function pause() {
      paused = true;

      if (resumeTO) {
        window.clearTimeout(resumeTO);
        resumeTO = null;
      }

      stop();
    }

    function resumeSoon() {
      if (resumeTO) {
        window.clearTimeout(resumeTO);
      }

      resumeTO = window.setTimeout(function () {
        acc = scroller.scrollLeft;
        paused = false;
        start();
      }, 1100);
    }

    function recycleCards() {
      var width = firstCardWidth();

      /*
        Once the first card has fully left the viewport,
        move that same element to the end of the track.

        Subtracting its width keeps the visual position stable.
      */
      while (width > 0 && acc >= width) {
        acc -= width;
        track.appendChild(track.firstElementChild);
        width = firstCardWidth();
      }
    }

    function frame() {
      rafId = null;

      if (!eligible()) return;

      acc += speed;

      recycleCards();

      scroller.scrollLeft = Math.round(acc);

      rafId = window.requestAnimationFrame(frame);
    }

    scroller.addEventListener('pointerenter', pause);
    scroller.addEventListener('pointerleave', resumeSoon);

    scroller.addEventListener('touchstart', pause, {
      passive: true
    });

    scroller.addEventListener('touchend', resumeSoon, {
      passive: true
    });

    scroller.addEventListener('touchcancel', resumeSoon, {
      passive: true
    });

    scroller.addEventListener(
      'wheel',
      function () {
        pause();
        resumeSoon();
      },
      { passive: true }
    );

    scroller.addEventListener(
      'scroll',
      function () {
        if (paused) {
          acc = scroller.scrollLeft;
        }
      },
      { passive: true }
    );

    /*
      Do not move the row while someone is watching a video.
    */
    track.querySelectorAll('video').forEach(function (video) {
      video.addEventListener('play', pause);
      video.addEventListener('pause', resumeSoon);
      video.addEventListener('ended', resumeSoon);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          inView = entries[0].isIntersecting;

          if (inView) {
            acc = scroller.scrollLeft;
            start();
          } else {
            stop();
          }
        },
        { threshold: 0 }
      ).observe(scroller);
    } else {
      inView = true;
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        acc = scroller.scrollLeft;
        start();
      } else {
        stop();
      }
    });
  }

  function setup(section) {
    if (!section || section.dataset.dpwBound) return;

    section.dataset.dpwBound = '1';

    section
      .querySelectorAll('[data-dpw-autoscroll]')
      .forEach(autoScroll);

    var track = section.querySelector('.dpw__row--reviews');
    var prev = section.querySelector('[data-dpw-prev]');
    var next = section.querySelector('[data-dpw-next]');

    function step(direction) {
      if (!track) return;

      var card = track.querySelector('.dpw__review');

      var amount = card
        ? card.getBoundingClientRect().width + 14
        : Math.round(track.clientWidth * 0.85);

      track.scrollBy({
        left: direction * amount,
        behavior: 'smooth'
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        step(-1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        step(1);
      });
    }
  }

  function initAll(root) {
    (root || document)
      .querySelectorAll('[data-dpw]')
      .forEach(setup);
  }

  if (document.readyState !== 'loading') {
    initAll(document);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();