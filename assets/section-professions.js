document.addEventListener('DOMContentLoaded', function () {
  var sections = document.querySelectorAll('[data-professions-section]');

  sections.forEach(function (section) {
    var tabs = Array.prototype.slice.call(section.querySelectorAll('[data-prof-tab]'));
    var panels = Array.prototype.slice.call(section.querySelectorAll('.drye-prof__panel'));

    if (!tabs.length || !panels.length) return;

    function activateTab(tab) {
      var targetId = tab.getAttribute('data-target');
      if (!targetId) return;

      tabs.forEach(function (otherTab) {
        var isActive = otherTab === tab;
        otherTab.classList.toggle('is-active', isActive);
        otherTab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        otherTab.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      panels.forEach(function (panel) {
        var isMatch = panel.id === targetId;
        panel.classList.toggle('is-active', isMatch);

        if (isMatch) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    }

    tabs.forEach(function (tab, index) {
      if (!tab.hasAttribute('tabindex')) {
        tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      }

      tab.addEventListener('click', function () {
        activateTab(tab);
      });

      tab.addEventListener('keydown', function (event) {
        var currentIndex = tabs.indexOf(tab);
        var nextIndex = currentIndex;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        activateTab(tabs[nextIndex]);
        tabs[nextIndex].focus();
      });
    });
  });
});