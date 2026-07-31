/* ==========================================================================
   DRYE Cart Drawer — handoff JS (additive, cart-driven)
   Talks to Shopify's Ajax Cart API only (/cart.js, /cart/add.js,
   /cart/change.js). Never computes discounted prices itself — every kr
   value rendered comes straight from cart.js so it always matches
   checkout. Copy (pack name / "what's included" checklist) is static,
   keyed by pair count, matching the approved design.

   MODEL: each pair = one cart line, quantity 1, so each pair can carry its
   own size variant (Shopify can't split one line's quantity across
   variants). The pack stepper adds/removes whole pair-lines. The per-pair
   size stepper removes that pair's line and re-adds the neighbouring size
   variant — two Ajax calls, see setPairSize().
   ========================================================================== */
(function () {
  var DRYE_PRODUCT_HANDLE = 'drye-moisture-routing-glove-liners'; // must match the liquid snippet's setting
  var FREE_SHIPPING_THRESHOLD_CENTS = 3 * 55000; // 3 pairs @ 550kr — adjust to your real free-shipping threshold
  var SIZE_KEYS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  var SIZE_CODES = { XXS: 5, XS: 6, S: 7, M: 8, L: 9, XL: 10, XXL: 11, XXXL: 12 };
  var DEFAULT_SIZE = 'M';

  // Static display copy per pair count — pricing itself always comes from cart.js.
  var COPY = {
    1: { name: 'Starter Pair', benefit: null, includes: ['Test under your own gloves', 'Economy delivery: 10–20 business days', 'Duties & taxes included', '30-day money-back guarantee'] },
    2: { name: 'Work Rotation', benefit: 'One on. One drying.', includes: ['One on. One drying.', 'Economy delivery: 10–20 business days (Tracked)', 'Duties & taxes included', '30-day money-back guarantee'] },
    3: { name: 'Express Workweek Pack', benefit: 'Full week rotation · Express delivery · No surprise fees', includes: ['3 pairs for full workweek rotation', 'UPS Express: 2–3 business days', 'No brokerage fee on delivery', 'Wrong size guarantee included', 'Free shipping', 'Duties & taxes included', '30-day money-back guarantee'] },
    4: { name: 'Extra Rotation', benefit: null, includes: ['Full week rotation + spare pair', 'UPS Express: 2–3 business days', 'No brokerage fee on delivery', 'Wrong size guarantee included', 'Free shipping', 'Duties & taxes included', '30-day money-back guarantee'] },
    5: { name: 'Team Starter', benefit: null, includes: ['Team starter rotation', 'UPS Express: 2–3 business days', 'No brokerage fee on delivery', 'Wrong size guarantee included', 'Free shipping', 'Duties & taxes included', '30-day money-back guarantee'] },
    6: { name: 'Team Rotation', benefit: null, includes: ['Full team rotation', 'UPS Express: 2–3 business days', 'No brokerage fee on delivery', 'Wrong size guarantee included', 'Free shipping', 'Duties & taxes included', '30-day money-back guarantee'] }
  };

  var sizeVariantsEl = document.getElementById('drye-size-variants');
  var SIZE_VARIANTS = sizeVariantsEl ? JSON.parse(sizeVariantsEl.textContent) : {};

  var overlay = document.querySelector('[data-drye-cart-overlay]');
  var drawer = document.querySelector('[data-drye-cart-drawer]');
  var body = document.querySelector('[data-drye-cart-body]');
  var openBtn = document.querySelector('[data-drye-cart-open]');
  var sizesOpenState = false;

  function money(cents) {
    // Swap for your theme's Shopify.formatMoney(cents, money_format) if available.
    return (cents / 100).toLocaleString('sv-SE') + ' kr';
  }

  function openDrawer() {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    if (openBtn) openBtn.hidden = true;
  }
  function closeDrawer() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    if (openBtn) openBtn.hidden = false;
  }

  function drueLines(cart) {
    return cart.items.filter(function (i) { return i.handle === DRYE_PRODUCT_HANDLE; });
  }

  function sizeFromLine(line) {
    // Assumes Size is variant option1 — adjust to option2/3 if it sits elsewhere.
    return line.options_with_values && line.options_with_values[0]
      ? line.options_with_values[0].value
      : (line.variant_title || DEFAULT_SIZE);
  }

  async function fetchCart() {
    var res = await fetch('/cart.js');
    return res.json();
  }

  function renderIncludes(list) {
    return list.map(function (t) {
      return '<div class="drye-cart-includes__row"><span class="drye-cart-includes__check">✓</span><span class="drye-cart-includes__text">' + t + '</span></div>';
    }).join('');
  }

  function renderPairRows(lines) {
    return lines.map(function (line, i) {
      var sz = sizeFromLine(line);
      var code = SIZE_CODES[sz] || '';
      return '' +
        '<div class="drye-cart-pair" data-drye-pair-key="' + line.key + '">' +
          '<img class="drye-cart-pair__img" src="' + (line.image || '') + '" alt="" />' +
          '<span class="drye-cart-pair__label">Pair ' + (i + 1) + '</span>' +
          '<div class="drye-cart-pair__stepper">' +
            '<button type="button" data-drye-pair-size-step="-1" data-drye-pair-key="' + line.key + '">−</button>' +
            '<div class="drye-cart-pair__size">' + sz + ' (' + code + ')</div>' +
            '<button type="button" data-drye-pair-size-step="1" data-drye-pair-key="' + line.key + '">+</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function renderCart(cart) {
    var lines = drueLines(cart);
    var pairs = lines.reduce(function (n, l) { return n + l.quantity; }, 0);
    var countEl = document.querySelector('[data-drye-cart-count]');
    if (countEl) countEl.textContent = pairs + ' ' + (pairs === 1 ? 'item' : 'items');

    // free shipping bar
    var shipMsg = document.querySelector('[data-drye-cart-ship-msg]');
    var shipFill = document.querySelector('[data-drye-cart-ship-fill]');
    var qualifies = cart.total_price >= FREE_SHIPPING_THRESHOLD_CENTS;
    if (shipMsg) {
      shipMsg.innerHTML = qualifies
        ? '<span class="drye-cart-ship__msg--qualified">You qualify for free shipping</span>'
        : 'Add <strong>' + money(Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - cart.total_price)) + '</strong> more for free shipping';
    }
    if (shipFill) shipFill.style.width = Math.min(100, Math.round((cart.total_price / FREE_SHIPPING_THRESHOLD_CENTS) * 100)) + '%';

    // summary
    var subtotalEl = document.querySelector('[data-drye-cart-subtotal]');
    var discountRow = document.querySelector('[data-drye-cart-discount-row]');
    var discountEl = document.querySelector('[data-drye-cart-discount]');
    var totalEl = document.querySelector('[data-drye-cart-total]');
    if (subtotalEl) subtotalEl.textContent = money(cart.original_total_price);
    if (totalEl) totalEl.textContent = money(cart.total_price);
    var discount = cart.original_total_price - cart.total_price;
    if (discountRow) discountRow.hidden = discount <= 0;
    if (discountEl) discountEl.textContent = '−' + money(discount);

    var upsell = document.querySelector('[data-drye-cart-upsell]');
    if (upsell) upsell.hidden = pairs === 0;

    if (!body) return;
    if (pairs === 0) {
      body.innerHTML =
        '<div class="drye-cart-empty">' +
          '<div class="drye-cart-empty__icon">🛒</div>' +
          '<div class="drye-cart-empty__title">Your cart is empty</div>' +
          '<div class="drye-cart-empty__sub">Add a pair to continue.</div>' +
          '<a href="/collections/all" class="drye-cart-empty__cta">Shop now</a>' +
        '</div>';
      return;
    }

    var copy = COPY[Math.min(6, pairs)] || COPY[6];
    body.innerHTML =
      '<div class="drye-cart-pack">' +
        '<div class="drye-cart-pack__title">' + pairs + (pairs === 1 ? ' Pair' : ' Pairs') + ' · ' + copy.name + '</div>' +
        '<div class="drye-cart-pack__price">' + money(cart.total_price) + '</div>' +
        (discount > 0 ? '<div class="drye-cart-pack__save"><strong>Save ' + money(discount) + '</strong></div>' : '') +
        (copy.benefit ? '<div class="drye-cart-pack__benefit">' + copy.benefit + '</div>' : '') +
        '<div class="drye-cart-includes">' + renderIncludes(copy.includes) + '</div>' +
        '<div class="drye-cart-stepper-row">' +
          '<div class="drye-cart-stepper">' +
            '<button type="button" data-drye-cart-pack-step="-1">−</button>' +
            '<div class="drye-cart-stepper__val">' + pairs + '</div>' +
            '<button type="button" data-drye-cart-pack-step="1">+</button>' +
          '</div>' +
          '<div class="drye-cart-tiers">' + [1,2,3,4,5,6].map(function (n) { return '<div class="drye-cart-tiers__seg' + (n <= pairs ? ' is-filled' : '') + '"></div>'; }).join('') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="drye-cart-sizes" data-drye-cart-sizes>' +
        '<button type="button" class="drye-cart-sizes__toggle" data-drye-cart-sizes-toggle>' +
          '<span><span class="drye-cart-sizes__title">Adjust your sizes</span>' +
          '<span class="drye-cart-sizes__summary">' + pairs + ' ' + (pairs === 1 ? 'pair' : 'pairs') + ': ' + lines.map(sizeFromLine).join(', ') + '</span></span>' +
          '<span class="drye-cart-sizes__chevron">⌄</span>' +
        '</button>' +
        '<div class="drye-cart-sizes__panel">' + renderPairRows(lines) +
          '<div class="drye-cart-sizeguide-link">Unsure of your size? <a href="/pages/size-guide">See size guide</a></div>' +
        '</div>' +
      '</div>';

    var sizesBlock = document.querySelector('[data-drye-cart-sizes]');
    if (sizesBlock) sizesBlock.classList.toggle('is-open', sizesOpenState);
  }

  async function changeLineQty(key, qty) {
    var res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    });
    return res.json();
  }

  async function addVariant(variantId, qty) {
    var res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty || 1 })
    });
    return res.json();
  }

  async function refresh() {
    var cart = await fetchCart();
    renderCart(cart);
    return cart;
  }

  async function setPackSize(target) {
    var cart = await fetchCart();
    var lines = drueLines(cart);
    var pairs = lines.reduce(function (n, l) { return n + l.quantity; }, 0);
    if (target > pairs) {
      var defaultVariant = SIZE_VARIANTS[DEFAULT_SIZE];
      if (defaultVariant) await addVariant(defaultVariant, target - pairs);
    } else if (target < pairs) {
      var toRemove = pairs - target;
      // remove from the end of the line list first
      for (var i = lines.length - 1; i >= 0 && toRemove > 0; i--) {
        var take = Math.min(lines[i].quantity, toRemove);
        await changeLineQty(lines[i].key, lines[i].quantity - take);
        toRemove -= take;
      }
    }
    await refresh();
  }

  async function stepPackSize(dir) {
    var cart = await fetchCart();
    var pairs = drueLines(cart).reduce(function (n, l) { return n + l.quantity; }, 0);
    var next = Math.max(1, Math.min(6, pairs + dir));
    await setPackSize(next);
  }

  async function stepPairSize(key, dir) {
    var cart = await fetchCart();
    var line = cart.items.find(function (l) { return l.key === key; });
    if (!line) return;
    var current = sizeFromLine(line);
    var idx = SIZE_KEYS.indexOf(current);
    var next = SIZE_KEYS[Math.max(0, Math.min(SIZE_KEYS.length - 1, idx + dir))];
    if (next === current) return;
    var nextVariant = SIZE_VARIANTS[next];
    if (!nextVariant) return;
    await changeLineQty(key, 0); // drop this pair's line
    await addVariant(nextVariant, 1); // re-add as a new line at the new size
    await refresh();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-drye-cart-open], [data-cart-open]')) { e.preventDefault(); openDrawer(); return; }
    if (e.target.closest('[data-drye-cart-close]') || e.target === overlay) { closeDrawer(); return; }

    var packStep = e.target.closest('[data-drye-cart-pack-step]');
    if (packStep) { stepPackSize(Number(packStep.dataset.dryeCartPackStep)); return; }

    var setPairs = e.target.closest('[data-drye-cart-set-pairs]');
    if (setPairs) { setPackSize(Number(setPairs.dataset.dryeCartSetPairs)); return; }

    var sizesToggle = e.target.closest('[data-drye-cart-sizes-toggle]');
    if (sizesToggle) {
      sizesOpenState = !sizesOpenState;
      var block = sizesToggle.closest('[data-drye-cart-sizes]');
      if (block) block.classList.toggle('is-open', sizesOpenState);
      return;
    }

    var pairStep = e.target.closest('[data-drye-pair-size-step]');
    if (pairStep) { stepPairSize(pairStep.dataset.dryePairKey, Number(pairStep.dataset.dryePairSizeStep)); return; }
  });

  // Open automatically after your existing add-to-cart handler resolves —
  // e.g. document.addEventListener('drye:cart:added', openDrawer) if you
  // dispatch that event from the PDP's add-to-cart submit handler.
  document.addEventListener('drye:cart:added', function () { refresh().then(openDrawer); });

  refresh();
})();
