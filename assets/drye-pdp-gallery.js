(function () {
  if (typeof document === 'undefined') return;

  function initAllGalleries(scope) {
    const root = scope || document;
    root.querySelectorAll('[data-gallery-root]').forEach(initGallery);
  }

  function initGallery(galleryRoot) {
    if (!galleryRoot) return;
    if (galleryRoot.dataset.galleryInited === '1') return;

    const viewport = galleryRoot.querySelector('[data-gallery-viewport]');
    const track = galleryRoot.querySelector('[data-gallery-track]');
    const slides = Array.from(galleryRoot.querySelectorAll('[data-gallery-slide]'));
    const prev = galleryRoot.querySelector('[data-gallery-prev]');
    const next = galleryRoot.querySelector('[data-gallery-next]');
    const thumbs = Array.from(galleryRoot.querySelectorAll('[data-gallery-thumb]'));

    if (!viewport || !track || slides.length === 0) return;

    galleryRoot.dataset.galleryInited = '1';

    let index = 0;
    const max = slides.length - 1;

    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let dragging = false;
    let locked = false;
    let startTime = 0;
    let suppressClick = false;

    function getWidth() {
      return Math.max(1, Math.round(viewport.getBoundingClientRect().width || 0));
    }

    function updateButtons() {
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === max;
    }

    function syncThumbs() {
      if (!thumbs.length) return;

      thumbs.forEach(function (thumb, thumbIndex) {
        const isActive = thumbIndex === index;
        thumb.classList.toggle('is-active', isActive);
        thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      /*
        Critical:
        Do NOT use scrollIntoView() here.
        It can scroll the whole page down to the PDP/gallery section.
      */
    }

    function syncActiveMedia() {
      slides.forEach(function (slide, slideIndex) {
        const videos = slide.querySelectorAll('video');

        videos.forEach(function (video) {
          if (slideIndex === index) {
            const shouldAutoplay = video.autoplay || video.hasAttribute('autoplay');

            if (shouldAutoplay) {
              try {
                const playPromise = video.play();

                if (playPromise && typeof playPromise.catch === 'function') {
                  playPromise.catch(function () {});
                }
              } catch (err) {}
            }
          } else {
            try {
              video.pause();
            } catch (err) {}
          }
        });
      });
    }

    function syncReviewCtaState() {
      const activeSlide = slides[index];
      const isReviewCtaSlide =
        activeSlide &&
        activeSlide.classList.contains('hero-gallery-slide--review-cta');

      galleryRoot.classList.toggle('is-review-cta-active', !!isReviewCtaSlide);
    }

    function setSlide(nextIndex, immediate) {
      index = Math.max(0, Math.min(max, nextIndex));

      track.style.transition = immediate ? 'none' : 'transform 0.28s ease';
      track.style.transform = 'translate3d(' + (-index * getWidth()) + 'px, 0, 0)';

      syncReviewCtaState();
      updateButtons();
      syncThumbs();
      syncActiveMedia();

      if (immediate) {
        requestAnimationFrame(function () {
          track.style.transition = 'transform 0.28s ease';
        });
      }
    }

    if (prev) {
      prev.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setSlide(index - 1, false);
      });
    }

    if (next) {
      next.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setSlide(index + 1, false);
      });
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const thumbIndex = parseInt(thumb.dataset.galleryThumbIndex, 10);

        if (!Number.isNaN(thumbIndex)) {
          setSlide(thumbIndex, false);
        }
      });
    });

    function onPointerDown(e) {
      if (max <= 0) return;
      if (e.pointerType === 'mouse') return;

      dragging = true;
      locked = false;
      dx = 0;
      dy = 0;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      track.style.transition = 'none';

      try {
        viewport.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    function onPointerMove(e) {
      if (!dragging) return;

      dx = e.clientX - startX;
      dy = e.clientY - startY;

      if (!locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        locked = Math.abs(dx) > Math.abs(dy) * 1.15;
      }

      if (!locked) return;

      e.preventDefault();

      const baseX = -index * getWidth();
      let nextX = baseX + dx;

      if (index === 0 && dx > 0) nextX = baseX + dx * 0.35;
      if (index === max && dx < 0) nextX = baseX + dx * 0.35;

      track.style.transform = 'translate3d(' + nextX + 'px, 0, 0)';
    }

    function onPointerUp() {
      if (!dragging) return;

      dragging = false;
      track.style.transition = 'transform 0.28s ease';

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        suppressClick = true;

        window.setTimeout(function () {
          suppressClick = false;
        }, 250);
      }

      if (!locked) {
        setSlide(index, false);
        return;
      }

      const elapsed = Math.max(1, performance.now() - startTime);
      const velocity = Math.abs(dx) / elapsed;

      if (dx <= -24 || (dx < 0 && velocity > 0.35)) {
        setSlide(index + 1, false);
      } else if (dx >= 24 || (dx > 0 && velocity > 0.35)) {
        setSlide(index - 1, false);
      } else {
        setSlide(index, false);
      }
    }

    viewport.style.touchAction = 'pan-y';

    viewport.addEventListener('pointerdown', onPointerDown, { passive: true });
    viewport.addEventListener('pointermove', onPointerMove, { passive: false });
    viewport.addEventListener('pointerup', onPointerUp, { passive: true });
    viewport.addEventListener('pointercancel', onPointerUp, { passive: true });
    viewport.addEventListener('pointerleave', onPointerUp, { passive: true });
    viewport.addEventListener('lostpointercapture', onPointerUp, { passive: true });

    viewport.addEventListener(
      'click',
      function (event) {
        if (!suppressClick) return;

        const link = event.target.closest('a');

        if (link) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    window.addEventListener(
      'resize',
      function () {
        setSlide(index, true);
      },
      { passive: true }
    );

    track.querySelectorAll('img').forEach(function (img) {
      if (img.complete) return;

      img.addEventListener(
        'load',
        function () {
          setSlide(index, true);
        },
        { passive: true }
      );

      img.addEventListener(
        'error',
        function () {
          setSlide(index, true);
        },
        { passive: true }
      );
    });

    track.querySelectorAll('video').forEach(function (video) {
      video.addEventListener(
        'loadeddata',
        function () {
          setSlide(index, true);
        },
        { passive: true }
      );
    });

    setSlide(index, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAllGalleries(document);
  });

  document.addEventListener('shopify:section:load', function (event) {
    initAllGalleries(event.target);
  });
})();