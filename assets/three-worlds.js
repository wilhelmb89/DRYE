document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.worlds-section[data-section-id]');

  sections.forEach((section) => {
    const sectionId = section.getAttribute('data-section-id');
    const revealEls = section.querySelectorAll('.reveal');
    const scroll = section.querySelector(`#worldsScroll-${sectionId}`);
    const dotsWrap = section.querySelector(`#scrollDots-${sectionId}`);
    const dots = dotsWrap ? dotsWrap.querySelectorAll('.scroll-dot') : [];

    if (revealEls.length) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.06,
        rootMargin: '0px 0px -20px 0px'
      });

      revealEls.forEach((el) => obs.observe(el));
    }

    if (scroll && dots.length) {
      scroll.addEventListener('scroll', () => {
        if (window.innerWidth >= 768) return;

        const cards = scroll.querySelectorAll('.world-card');
        if (!cards.length) return;

        const cardWidth = scroll.scrollWidth / cards.length;
        const idx = Math.round(scroll.scrollLeft / cardWidth);

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === idx);
        });
      });
    }
  });
});