document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = Array.from(document.querySelectorAll('.track-btn'));
  const trackCards = Array.from(document.querySelectorAll('.track-card'));
  const formPanels = Array.from(document.querySelectorAll('.form-panel'));

  if (!tabButtons.length && !trackCards.length && !formPanels.length) return;

  const getTrackValue = (element) => {
    if (!element) return '';
    return (element.getAttribute('data-track') || '').trim();
  };

  const setActiveTrack = (trackKey) => {
    if (!trackKey) return;

    tabButtons.forEach((button) => {
      const isMatch = getTrackValue(button) === trackKey;
      button.classList.toggle('active', isMatch);
      button.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    trackCards.forEach((card) => {
      const isMatch = getTrackValue(card) === trackKey;
      card.classList.toggle('active', isMatch);
    });

    formPanels.forEach((panel) => {
      const isMatch = getTrackValue(panel) === trackKey;
      panel.classList.toggle('active', isMatch);
      panel.hidden = !isMatch;
    });
  };

  const findInitialTrack = () => {
    const activeTab = tabButtons.find((button) => button.classList.contains('active'));
    if (activeTab) return getTrackValue(activeTab);

    const activeCard = trackCards.find((card) => card.classList.contains('active'));
    if (activeCard) return getTrackValue(activeCard);

    const activePanel = formPanels.find((panel) => panel.classList.contains('active'));
    if (activePanel) return getTrackValue(activePanel);

    if (tabButtons[0]) return getTrackValue(tabButtons[0]);
    if (trackCards[0]) return getTrackValue(trackCards[0]);
    if (formPanels[0]) return getTrackValue(formPanels[0]);

    return '';
  };

  const initialTrack = findInitialTrack();
  if (initialTrack) {
    setActiveTrack(initialTrack);
  }

  tabButtons.forEach((button) => {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', button.classList.contains('active') ? 'true' : 'false');

    button.addEventListener('click', () => {
      const trackKey = getTrackValue(button);
      setActiveTrack(trackKey);
    });
  });

  trackCards.forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.addEventListener('click', () => {
      const trackKey = getTrackValue(card);
      setActiveTrack(trackKey);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const trackKey = getTrackValue(card);
        setActiveTrack(trackKey);
      }
    });
  });
});