/* ==========================================================================
   DRYE PDP — Buy Zone patch JS (additive only)
   Drives the new Step 2 pack-tier selector. Does NOT duplicate or replace
   the existing size-dropdown / variant / price-sync script further down
   drye-pdp-hero.liquid (the one that parses the productData JSON) — that
   script keeps owning variant selection and the actual cart submit.
   This file only:
     1. Toggles is-selected / expands the clicked pack card.
     2. Writes the chosen "pairs" count into the existing hidden
        `.qty-val` quantity input and fires an `input` event so the
        existing script's quantity listeners pick it up unchanged.
     3. Swaps the Add-to-cart button's label to the pack's data-cta.
   ========================================================================== */
(function () {
  function bind(scope) {
    var packs = Array.prototype.slice.call(scope.querySelectorAll('[data-pack]'));
    if (!packs.length) return;

    var qtyInput = scope.querySelector('.qty-val');
    var mainAtc = scope.querySelector('[data-main-atc]');

    // Select by CARD (element) so equal-pairs cards don't all open; ATC label
    // is computed from the pack so it always reflects the choice.
    function selectPack(pack) {
      packs.forEach(function (p) { p.classList.toggle('is-selected', p === pack); });
      var pairs = Number(pack.dataset.pairs) || 1;
      if (qtyInput) {
        qtyInput.value = pairs;
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (mainAtc && !mainAtc.disabled) {
        mainAtc.textContent = 'Add ' + pairs + (pairs === 1 ? ' Pair' : ' Pairs');
      }
    }

    packs.forEach(function (p) {
      var btn = p.querySelector('.pack__btn');
      if (btn) {
        btn.addEventListener('click', function () { selectPack(p); });
      }
    });

    var initial = packs.filter(function (p) { return p.classList.contains('is-selected'); })[0] || packs[0];
    if (initial) selectPack(initial);
  }

  document.querySelectorAll('.hero[data-product-section]:not([data-packsel-bound])').forEach(function (scope) {
    scope.setAttribute('data-packsel-bound', '1');
    bind(scope);
  });
})();
