(function () {
  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  var tabButtons = qsa('.drye-policy-tab-bar__button');
  var panels = {
    shipping: qs('#panel-shipping'),
    returns: qs('#panel-returns'),
    privacy: qs('#panel-privacy'),
    terms: qs('#panel-terms')
  };

  function setActiveTab(tabName) {
    tabButtons.forEach(function (button) {
      button.classList.toggle(
        'is-active',
        button.getAttribute('data-tab') === tabName
      );
    });

    Object.keys(panels).forEach(function (key) {
      if (!panels[key]) return;
      panels[key].classList.toggle('active', key === tabName);
    });

    qsa('[data-policy-group]').forEach(function (group) {
      group.hidden = group.getAttribute('data-policy-group') !== tabName;
    });
  }

  tabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var tabName = button.getAttribute('data-tab');
      setActiveTab(tabName);

      var firstSection = qs('#panel-' + tabName + ' .policy-section');
      if (firstSection) {
        firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  qsa('.drye-policy-side-nav__link').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var href = link.getAttribute('href');
      var section = href ? qs(href) : null;
      if (!section) return;

      event.preventDefault();

      qsa('.drye-policy-side-nav__link').forEach(function (navLink) {
        navLink.classList.remove('is-active');
      });

      link.classList.add('is-active');
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  setActiveTab('shipping');
})();