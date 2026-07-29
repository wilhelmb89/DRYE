/* DRYE Proof Wall
   Stable, duplication-free media autoscroll for Shopify.

   - Does not clone or reorder media cards.
   - Keeps native touch/swipe scrolling.
   - Scrolls back and forth between the two ends of the row.
   - Runs only while the media row is visible.
   - Pauses during touch, hover, wheel use and video playback.
   - Respects prefers-reduced-motion.
   - Review arrows move one review card at a time.
*/
(function () {
  'use strict';

  var reduceMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function prefersReducedMotion() {
    return !!(reduceMotionQuery && reduceMotionQuery.matches);
  }

  function setupAutoScroll(scroller) {
    if (!scroller || scroller.dataset.dpwAutoBound === 'true') return;
    scroller.dataset.dpwAutoBound = 'true';

    var track = scroller.querySelector('[data-dpw-marquee]');
    if (!track || track.children.length < 2) return;

    /*
      Existing Liquid uses data-dpw-speed="0.5".
      Treat that as pixels per frame at 60 fps:
      0.5 × 60 = 30 pixels per second.
    */
    var configuredSpeed = parseFloat(
      scroller.getAttribute('data-dpw-speed')
    );

    var pixelsPerSecond = Number.isFinite(configuredSpeed)
      ? Math.max(6, configuredSpeed * 60)
      : 30;

    var direction = 1;
    var inView = false;
    var userPaused = false;
    var playingVideos = 0;
    var rafId = null;
    var resumeTimer = null;
    var lastTimestamp = 0;
    var position = scroller.scrollLeft || 0;

    function maxScrollLeft() {
      return Math.max(
        0,
        scroller.scrollWidth - scroller.clientWidth
      );
    }

    function canRun() {
      return (
        inView &&
        !userPaused &&
        playingVideos === 0 &&
        !prefersReducedMotion() &&
        document.visibilityState === 'visible' &&
        maxScrollLeft() > 2
      );
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }

      lastTimestamp = 0;
    }

    function start() {
      if (rafId === null && canRun()) {
        position = scroller.scrollLeft;
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function pauseForUser() {
      userPaused = true;

      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }

      stop();
    }

    function resumeAfterDelay() {
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
      }

      resumeTimer = window.setTimeout(function () {
        resumeTimer = null;
        position = scroller.scrollLeft;
        userPaused = false;
        start();
      }, 1200);
    }

    function frame(timestamp) {
      rafId = null;

      if (!canRun()) {
        lastTimestamp = 0;
        return;
      }

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      var elapsedSeconds = Math.min(
        (timestamp - lastTimestamp) / 1000,
        0.05
      );

      lastTimestamp = timestamp;

      var max = maxScrollLeft();

      position += (
        direction *
        pixelsPerSecond *
        elapsedSeconds
      );

      if (position >= max) {
        position = max;
        direction = -1;
      } else if (position <= 0) {
        position = 0;
        direction = 1;
      }

      scroller.scrollLeft = Math.round(position);

      rafId = window.requestAnimationFrame(frame);
    }

    scroller.addEventListener(
      'pointerenter',
      pauseForUser
    );

    scroller.addEventListener(
      'pointerleave',
      resumeAfterDelay
    );

    scroller.addEventListener(
      'touchstart',
      pauseForUser,
      { passive: true }
    );

    scroller.addEventListener(
      'touchend',
      resumeAfterDelay,
      { passive: true }
    );

    scroller.addEventListener(
      'touchcancel',
      resumeAfterDelay,
      { passive: true }
    );

    scroller.addEventListener(
      'wheel',
      function () {
        pauseForUser();
        resumeAfterDelay();
      },
      { passive: true }
    );

    scroller.addEventListener(
      'scroll',
      function () {
        if (userPaused || rafId === null) {
          position = scroller.scrollLeft;
        }
      },
      { passive: true }
    );

    track.querySelectorAll('video').forEach(
      function (video) {
        var countedAsPlaying = false;

        function onPlay() {
          if (!countedAsPlaying) {
            countedAsPlaying = true;
            playingVideos += 1;
          }

          stop();
        }

        function onStop() {
          if (countedAsPlaying) {
            countedAsPlaying = false;
            playingVideos = Math.max(
              0,
              playingVideos - 1
            );
          }

          position = scroller.scrollLeft;
          start();
        }

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onStop);
        video.addEventListener('ended', onStop);
        video.addEventListener('emptied', onStop);
      }
    );

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          inView = !!entries[0].isIntersecting;

          if (inView) {
            position = scroller.scrollLeft;
            start();
          } else {
            stop();
          }
        },
        {
          threshold: 0.01
        }
      );

      observer.observe(scroller);
    } else {
      inView = true;
      start();
    }

    document.addEventListener(
      'visibilitychange',
      function () {
        if (document.visibilityState === 'visible') {
          position = scroller.scrollLeft;
          start();
        } else {
          stop();
        }
      }
    );

    if (
      reduceMotionQuery &&
      typeof reduceMotionQuery.addEventListener === 'function'
    ) {
      reduceMotionQuery.addEventListener(
        'change',
        function () {
          if (prefersReducedMotion()) {
            stop();
          } else {
            start();
          }
        }
      );
    }

    window.addEventListener(
      'resize',
      function () {
        var max = maxScrollLeft();

        position = Math.min(
          scroller.scrollLeft,
          max
        );

        scroller.scrollLeft = position;
        start();
      },
      { passive: true }
    );
  }

  function setupSection(section) {
    if (
      !section ||
      section.dataset.dpwBound === 'true'
    ) {
      return;
    }

    section.dataset.dpwBound = 'true';

    section
      .querySelectorAll('[data-dpw-autoscroll]')
      .forEach(setupAutoScroll);

    var reviewTrack = section.querySelector(
      '.dpw__row--reviews'
    );

    var previousButton = section.querySelector(
      '[data-dpw-prev]'
    );

    var nextButton = section.querySelector(
      '[data-dpw-next]'
    );

    function reviewStep(direction) {
      if (!reviewTrack) return;

      var card = reviewTrack.querySelector(
        '.dpw__review'
      );

      var styles = window.getComputedStyle(
        reviewTrack
      );

      var gap = parseFloat(
        styles.columnGap || styles.gap
      ) || 14;

      var distance = card
        ? card.getBoundingClientRect().width + gap
        : Math.round(reviewTrack.clientWidth * 0.85);

      reviewTrack.scrollBy({
        left: direction * distance,
        behavior: prefersReducedMotion()
          ? 'auto'
          : 'smooth'
      });
    }

    if (previousButton) {
      previousButton.addEventListener(
        'click',
        function () {
          reviewStep(-1);
        }
      );
    }

    if (nextButton) {
      nextButton.addEventListener(
        'click',
        function () {
          reviewStep(1);
        }
      );
    }
  }

  function initAll(root) {
    var scope = root || document;

    if (
      scope.matches &&
      scope.matches('[data-dpw]')
    ) {
      setupSection(scope);
    }

    scope
      .querySelectorAll('[data-dpw]')
      .forEach(setupSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        initAll(document);
      }
    );
  } else {
    initAll(document);
  }

  document.addEventListener(
    'shopify:section:load',
    function (event) {
      initAll(event.target);
    }
  );
})();