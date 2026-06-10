document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.drye-blog-filter-section .filter-btn');
  const cards = document.querySelectorAll('.post-card');
  const count = document.getElementById('post-count');

  if (!buttons.length || !cards.length) return;

  function updateCount() {
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');

    if (count) {
      count.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? 'article' : 'articles'}`;
    }
  }

  function setActiveButton(activeButton) {
    buttons.forEach(button => {
      const isActive = button === activeButton;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function filterCards(category) {
    cards.forEach(card => {
      const cardCategory = card.dataset.cat || '';
      const shouldShow = category === 'all' || cardCategory === category;
      card.style.display = shouldShow ? '' : 'none';
    });

    updateCount();
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.cat || 'all';
      setActiveButton(button);
      filterCards(category);
    });
  });

  const activeButton =
    document.querySelector('.drye-blog-filter-section .filter-btn.active') ||
    document.querySelector('.drye-blog-filter-section .filter-btn[data-cat="all"]');

  if (activeButton) {
    setActiveButton(activeButton);
    filterCards(activeButton.dataset.cat || 'all');
  } else {
    filterCards('all');
  }
});