/* DRYE — buy-zone CTAs
   Sections such as the risk-reversal and closing CTA link to the product URL.
   On any other page that navigation is correct, but on the product page itself
   it reloads the page the customer is already reading. Here we intercept only
   those links whose target resolves to the current page and scroll to the buy
   zone instead. Everything else keeps its normal behaviour. */
(function () {
  if (window.__dryeBuyzoneCtaInit) return;
  window.__dryeBuyzoneCtaInit = true;

  var BUY_ZONE_SELECTORS = ['#product-top', '[data-product-section]', '.hero'];
  var HEADER_SELECTORS = ['[data-drye-header]', '.drye-header', '.site-header', 'header[role="banner"]'];

  function firstMatch(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function stickyOffset() {
    var header = firstMatch(HEADER_SELECTORS);
    if (!header) return 0;
    var position = window.getComputedStyle(header).position;
    if (position !== 'fixed' && position !== 'sticky') return 0;
    return header.getBoundingClientRect().height;
  }

  function isSamePage(link) {
    return link.host === window.location.host && link.pathname === window.location.pathname;
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest('a[data-buyzone-cta][href]');
    if (!link || link.target === '_blank') return;
    if (!isSamePage(link)) return;

    var buyZone = firstMatch(BUY_ZONE_SELECTORS);
    if (!buyZone) return;

    event.preventDefault();

    var top = buyZone.getBoundingClientRect().top + window.pageYOffset - stickyOffset() - 12;
    window.scrollTo({ top: top > 0 ? top : 0, behavior: 'smooth' });
  });
})();
