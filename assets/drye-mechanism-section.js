(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Toggle reduced motion class
  const syncReduceMotion = () => {
    root.classList.toggle('reduce-motion', reduceMotion.matches);
  };

  syncReduceMotion();

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', syncReduceMotion);
  } else if (reduceMotion.addListener) {
    reduceMotion.addListener(syncReduceMotion);
  }

  // Pause animations when out of view (performance)
  const sections = document.querySelectorAll('.dryeMechanism');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  }, {
    rootMargin: '120px 0px 120px 0px',
    threshold: 0.05
  });

  sections.forEach((section) => observer.observe(section));
})();