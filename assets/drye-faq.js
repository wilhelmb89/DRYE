document.addEventListener('DOMContentLoaded', function () {
  var sections = document.querySelectorAll('.drye-faq');

  sections.forEach(function (section) {
    var buttons = section.querySelectorAll('.drye-faq__question');

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var item = button.closest('.drye-faq__item');
        var isOpen = item.classList.contains('open');

        section.querySelectorAll('.drye-faq__item').forEach(function (otherItem) {
          otherItem.classList.remove('open');

          var otherButton = otherItem.querySelector('.drye-faq__question');
          if (otherButton) {
            otherButton.setAttribute('aria-expanded', 'false');
          }
        });

        if (!isOpen) {
          item.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });
});