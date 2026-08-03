/* ==========================================================================
   DRYE Cart Drawer — cart-driven, optimistic UI
   Talks to Shopify's Ajax Cart API only (/cart.js, /cart/add.js,
   /cart/change.js). Never computes discounted prices itself — every kr
   value rendered comes straight from cart.js so it always matches checkout.

   MODEL: each pair = one cart line, quantity 1, so each pair can carry its
   own size variant. The UI keeps an OPTIMISTIC array of size labels
   (`pairs`) that updates instantly on every tap; a single debounced sync()
   reconciles the server cart to that array (minimal add/remove/change), so
   rapid taps coalesce into ONE round of Ajax calls and no tap is ever
   dropped. Prices come from the authoritative cart returned by that sync.
   ========================================================================== */
(function () {
  var DRYE_PRODUCT_HANDLE = 'drye-moisture-routing-glove-liners';
  var FREE_SHIPPING_PAIRS = 3; // free shipping on 3+ pairs (quantity-based, market-agnostic)
  var SYNC_DEBOUNCE_MS = 220;

  // Static display copy per pair count — pricing itself always comes from cart.js.
  var COPY = {
    1: { name: 'Starter Pair', benefit: 'Test under your own gloves' },
    2: { name: 'Work Rotation', benefit: 'One on. One drying.' },
    3: { name: 'Express Workweek Pack', benefit: 'Full week rotation · Express delivery · No surprise fees' },
    4: { name: 'Extra Rotation', benefit: 'Full week rotation + spare pair · Express delivery · No surprise fees' },
    5: { name: 'Team Starter', benefit: 'Team starter rotation · Express delivery · No surprise fees' },
    6: { name: 'Team Rotation', benefit: 'Full team rotation · Express delivery · No surprise fees' }
  };

  var CHEVRON = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Shipping estimate shown in the green badge on the pack card. Method + transit
  // window mirror the Buy Zone offer: 3+ pairs ship Express (2–3 business days,
  // matches "UPS Express: 2–3 business days"); 1–2 pairs ship Economy. Adjust the
  // day windows here if the offer copy changes. All orders are tracked.
  var SHIP = {
    express: { method: 'Express', minDays: 2, maxDays: 3 },
    economy: { method: 'Economy', minDays: 6, maxDays: 10 }
  };
  function shipTierFor(n) { return n >= 3 ? SHIP.express : SHIP.economy; }
  function addBusinessDays(date, days) {
    var d = new Date(date.getTime()), added = 0;
    while (added < days) { d.setDate(d.getDate() + 1); var wd = d.getDay(); if (wd !== 0 && wd !== 6) added++; }
    return d;
  }
  function fmtShipDate(d) {
    try { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    catch (e) { return (d.getMonth() + 1) + '/' + d.getDate(); }
  }
  function shipEtaText(n) {
    var t = shipTierFor(n), now = new Date();
    var loS = fmtShipDate(addBusinessDays(now, t.minDays));
    var hiS = fmtShipDate(addBusinessDays(now, t.maxDays));
    return loS === hiS ? loS : (loS + ' – ' + hiS);
  }

  var sizeVariantsEl = document.getElementById('drye-size-variants');
  var SIZE_VARIANTS = sizeVariantsEl ? JSON.parse(sizeVariantsEl.textContent) : {};
  var SIZE_ORDER = Object.keys(SIZE_VARIANTS); // actual option values in variant order (e.g. "M (8)")
  var PRODUCT_IMAGE = (typeof window !== 'undefined' && window.DRYE_PRODUCT_IMAGE) ? window.DRYE_PRODUCT_IMAGE : '';

  function pickDefaultSize() {
    for (var i = 0; i < SIZE_ORDER.length; i++) { if (/\(8\)/.test(SIZE_ORDER[i]) || /^M\b/.test(SIZE_ORDER[i])) return SIZE_ORDER[i]; }
    return SIZE_ORDER[Math.floor(SIZE_ORDER.length / 2)] || SIZE_ORDER[0] || '';
  }
  var DEFAULT_SIZE = pickDefaultSize();

  // ---- DOM ----
  function qs(s) { return document.querySelector(s); }
  var overlay = qs('[data-drye-cart-overlay]');
  var drawer = qs('[data-drye-cart-drawer]');
  var body = qs('[data-drye-cart-body]');
  var openBtn = qs('[data-drye-cart-open]');

  // ---- state ----
  var pairs = [];        // optimistic array of size labels, one per pair
  var priceCart = null;  // last authoritative cart.js (source of truth for prices)
  var sizesOpen = true;  // "Adjust your sizes" open by default
  var syncing = false;
  var syncTimer = null;
  var dirty = 0; // bumps on every user action; guards the sync from clobbering newer intent

  function money(cents) {
    // Market-aware: format in the CART's currency (cart.js `currency`), never
    // a hardcoded "kr". Falls back to Shopify's active currency, then SEK.
    var cur = (priceCart && priceCart.currency)
      || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active)
      || 'SEK';
    var amount = Math.round(cents) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(amount);
    } catch (e) {
      return amount.toLocaleString() + ' ' + cur;
    }
  }
  function byHandle(l) { return l.handle === DRYE_PRODUCT_HANDLE; }
  function sizeFromLine(line) {
    return (line.options_with_values && line.options_with_values[0])
      ? line.options_with_values[0].value
      : (line.variant_title || DEFAULT_SIZE);
  }
  function pairCountOf(cart) {
    if (!cart || !cart.items) return 0;
    return cart.items.filter(byHandle).reduce(function (n, l) { return n + l.quantity; }, 0);
  }

  // ---- open / close ----
  function openDrawer() { if (overlay) overlay.classList.add('is-open'); if (drawer) drawer.classList.add('is-open'); if (openBtn) openBtn.hidden = true; }
  function closeDrawer() { if (overlay) overlay.classList.remove('is-open'); if (drawer) drawer.classList.remove('is-open'); if (openBtn) openBtn.hidden = false; }

  // ---- Ajax ----
  // Prefix every cart route with Shopify.routes.root so operations hit the
  // BUYER'S MARKET cart (e.g. /en-us/cart.js), not the default-market cart —
  // that mismatch made a US buyer's drawer show SEK while the PDP showed USD.
  function cartUrl(path) {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    if (root.charAt(root.length - 1) !== '/') root += '/';
    return root + String(path).replace(/^\/+/, '');
  }
  async function fetchCart() { var r = await fetch(cartUrl('cart.js'), { headers: { 'Accept': 'application/json' } }); return r.json(); }
  async function changeLineQty(key, qty) {
    var r = await fetch(cartUrl('cart/change.js'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) });
    return r.json();
  }
  var pairSeq = 0;
  function pairProps() { return { _pair: String(Date.now()) + '-' + (++pairSeq) }; }
  async function setCartToPack(variantId, count) {
    var cart = await fetchCart();
    var dryeLines = cart.items.filter(byHandle);
    for (var i = 0; i < dryeLines.length; i++) { await changeLineQty(dryeLines[i].key, 0); }
    return addPairs(variantId, count);
  }
  async function addPairs(variantId, count) {
    var items = [];
    for (var i = 0; i < count; i++) items.push({ id: variantId, quantity: 1, properties: pairProps() });
    var r = await fetch(cartUrl('cart/add.js'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items }) });
    return r.json();
  }

  // ---- render ----
  function packHtml(n, copy, total, disc, pending) {
    return '' +
      '<div class="drye-cart-pack">' +
        '<span class="drye-cart-pack__tag">Your pack</span>' +
        '<div class="drye-cart-ship-badge">' +
          '<span class="drye-cart-ship-badge__label">Shipping time</span>' +
          '<span class="drye-cart-ship-badge__eta">' + shipEtaText(n) + '</span>' +
          '<span class="drye-cart-ship-badge__method">' + shipTierFor(n).method + '</span>' +
          '<span class="drye-cart-ship-badge__tracked">Tracked</span>' +
        '</div>' +
        '<div class="drye-cart-pack__title">' + n + (n === 1 ? ' Pair' : ' Pairs') + ' · ' + copy.name + '</div>' +
        '<div class="drye-cart-pack__price' + (pending ? ' is-pending' : '') + '">' + (total != null ? money(total) : '…') + '</div>' +
        (!pending && disc > 0 ? '<div class="drye-cart-pack__save"><strong>Save ' + money(disc) + '</strong></div>' : '') +
        (copy.benefit ? '<div class="drye-cart-pack__benefit">' + copy.benefit + '</div>' : '') +
        '<div class="drye-cart-stepper-row">' +
          '<div class="drye-cart-stepper">' +
            '<button type="button" data-drye-cart-pack-step="-1"' + (n <= 1 ? ' disabled' : '') + '>−</button>' +
            '<div class="drye-cart-stepper__val">' + n + '</div>' +
            '<button type="button" data-drye-cart-pack-step="1"' + (n >= 6 ? ' disabled' : '') + '>+</button>' +
          '</div>' +
          '<div class="drye-cart-tiers">' + [1, 2, 3, 4, 5, 6].map(function (k) { return '<div class="drye-cart-tiers__seg' + (k <= n ? ' is-filled' : '') + '"></div>'; }).join('') + '</div>' +
        '</div>' +
      '</div>';
  }

  function pairRowsHtml() {
    return pairs.map(function (sz, i) {
      var idx = SIZE_ORDER.indexOf(sz);
      return '' +
        '<div class="drye-cart-pair">' +
          (PRODUCT_IMAGE ? '<img class="drye-cart-pair__img" src="' + PRODUCT_IMAGE + '" alt="DRYE glove liner" />' : '<span class="drye-cart-pair__img"></span>') +
          '<div class="drye-cart-pair__stepper">' +
            '<button type="button" data-drye-pair-size-step="-1" data-drye-pair-index="' + i + '"' + (idx <= 0 ? ' disabled' : '') + '>−</button>' +
            '<div class="drye-cart-pair__size">' + sz + '</div>' +
            '<button type="button" data-drye-pair-size-step="1" data-drye-pair-index="' + i + '"' + (idx >= SIZE_ORDER.length - 1 ? ' disabled' : '') + '>+</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function sizesHtml() {
    return '' +
      '<div class="drye-cart-sizes' + (sizesOpen ? ' is-open' : '') + '" data-drye-cart-sizes>' +
        '<button type="button" class="drye-cart-sizes__toggle" data-drye-cart-sizes-toggle>' +
          '<span class="drye-cart-sizes__title">Adjust your sizes</span>' +
          '<span class="drye-cart-sizes__chevron" aria-hidden="true">' + CHEVRON + '</span>' +
        '</button>' +
        '<div class="drye-cart-sizes__panel">' +
          pairRowsHtml() +
          '<div class="drye-cart-sizeguide-link">Unsure of your size? <a href="/pages/size-guide">See size guide</a></div>' +
        '</div>' +
      '</div>';
  }

  function setVal(sel, text, pending) {
    var el = qs(sel);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-pending', !!pending);
  }

  function updateChrome(pending) {
    var total = priceCart ? priceCart.total_price : null;
    var original = priceCart ? priceCart.original_total_price : null;
    var disc = (original != null && total != null) ? (original - total) : 0;

    var countEl = qs('[data-drye-cart-count]');
    if (countEl) countEl.textContent = pairs.length + ' ' + (pairs.length === 1 ? 'item' : 'items');

    // Free shipping is quantity-based ("3+ pairs"), so drive the bar off the
    // pair count — market-agnostic, no currency involved.
    var shipMsg = qs('[data-drye-cart-ship-msg]');
    var shipFill = qs('[data-drye-cart-ship-fill]');
    var need = Math.max(0, FREE_SHIPPING_PAIRS - pairs.length);
    if (shipMsg) {
      shipMsg.innerHTML = need === 0
        ? '<span class="drye-cart-ship__msg--qualified">You qualify for free shipping</span>'
        : 'Add <strong>' + need + ' more ' + (need === 1 ? 'pair' : 'pairs') + '</strong> for free shipping';
    }
    if (shipFill) shipFill.style.width = Math.min(100, Math.round((pairs.length / FREE_SHIPPING_PAIRS) * 100)) + '%';

    setVal('[data-drye-cart-subtotal]', original != null ? money(original) : '…', pending);
    var dRow = qs('[data-drye-cart-discount-row]');
    if (dRow) dRow.hidden = !(disc > 0) || pending;
    setVal('[data-drye-cart-discount]', '−' + money(disc), pending);
    setVal('[data-drye-cart-total]', total != null ? money(total) : '…', pending);

    var upsell = qs('[data-drye-cart-upsell]');
    if (upsell) upsell.hidden = pairs.length === 0;
  }

  function render() {
    var n = pairs.length;
    var pending = syncing || priceCart == null || pairCountOf(priceCart) !== n;
    updateChrome(pending);

    if (!body) return;
    if (n === 0) {
      body.innerHTML =
        '<div class="drye-cart-empty">' +
          '<div class="drye-cart-empty__icon">🛒</div>' +
          '<div class="drye-cart-empty__title">Your cart is empty</div>' +
          '<div class="drye-cart-empty__sub">Add a pair to continue.</div>' +
          '<a href="/collections/all" class="drye-cart-empty__cta">Shop now</a>' +
        '</div>';
      return;
    }
    var copy = COPY[Math.min(6, n)] || COPY[6];
    var total = priceCart ? priceCart.total_price : null;
    var original = priceCart ? priceCart.original_total_price : null;
    var disc = (original != null && total != null) ? (original - total) : 0;
    body.innerHTML = packHtml(n, copy, total, disc, pending) + sizesHtml();
  }

  // ---- optimistic mutations ----
  function stepPack(dir) {
    if (dir > 0) { if (pairs.length >= 6) return; pairs.push(DEFAULT_SIZE); }
    else { if (pairs.length <= 1) return; pairs.pop(); }
    dirty++; render(); scheduleSync();
  }
  function setPack(target) {
    target = Math.max(1, Math.min(6, target));
    while (pairs.length < target) pairs.push(DEFAULT_SIZE);
    while (pairs.length > target) pairs.pop();
    dirty++; render(); scheduleSync();
  }
  function stepPairSize(index, dir) {
    var cur = pairs[index];
    var i = SIZE_ORDER.indexOf(cur);
    if (i === -1) return;
    var ni = Math.max(0, Math.min(SIZE_ORDER.length - 1, i + dir));
    if (ni === i) return;
    pairs[index] = SIZE_ORDER[ni];
    dirty++; render(); scheduleSync();
  }

  // ---- sync: reconcile server cart to the optimistic `pairs` multiset ----
  function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(runSync, SYNC_DEBOUNCE_MS);
  }
  async function runSync() {
    syncTimer = null;
    if (syncing) { scheduleSync(); return; } // a sync is mid-flight — retry after it settles
    syncing = true;
    var startDirty = dirty; // snapshot: did the user change anything WHILE we synced?

    try {
      var target = {}; // variantId -> desired count
      pairs.forEach(function (sz) { var v = SIZE_VARIANTS[sz]; if (v) target[v] = (target[v] || 0) + 1; });

      var cart = await fetchCart();
      var current = {}; // variantId -> [lines]
      cart.items.filter(byHandle).forEach(function (l) { (current[l.variant_id] = current[l.variant_id] || []).push(l); });

      // removals first (frees identical variants), then additions
      var vId;
      for (vId in current) {
        var have = current[vId].length;
        var want = target[vId] || 0;
        for (var k = have - 1; k >= want; k--) { await changeLineQty(current[vId][k].key, 0); }
      }
      for (vId in target) {
        var have2 = current[vId] ? current[vId].length : 0;
        if (target[vId] > have2) { await addPairs(Number(vId), target[vId] - have2); }
      }

      priceCart = await fetchCart();
      // Only adopt the server's pair list if the user did NOT tap during the
      // sync. Otherwise `pairs` already holds newer intent — don't clobber it
      // (this was the "can't go backward" bug: a slow sync overwrote a fresh −).
      if (dirty === startDirty) reconcilePairs(priceCart);
    } catch (e) {
      console.warn('[DRYE cart sync]', e);
    }
    syncing = false;
    render();
    // Re-sync if the user changed things mid-flight, or the server still
    // doesn't match the desired pair count.
    if (dirty !== startDirty || pairCountOf(priceCart) !== pairs.length) scheduleSync();
  }

  function sameMultiset(a, b) {
    if (a.length !== b.length) return false;
    var m = {};
    a.forEach(function (x) { m[x] = (m[x] || 0) + 1; });
    for (var i = 0; i < b.length; i++) { if (!m[b[i]]) return false; m[b[i]]--; }
    return true;
  }
  function reconcilePairs(cart) {
    var sizes = [];
    cart.items.filter(byHandle).forEach(function (l) { var s = sizeFromLine(l); for (var i = 0; i < l.quantity; i++) sizes.push(s); });
    if (!sameMultiset(sizes, pairs)) pairs = sizes;
  }

  // ---- GA4 (ported from the previous drawer) ----
  function pushBeginCheckout() {
    try {
      if (!priceCart || !priceCart.items) return;
      var items = priceCart.items.map(function (item) {
        return {
          item_id: String(item.sku || item.variant_id),
          item_name: item.product_title,
          item_brand: 'DRYE',
          item_variant: item.variant_title || '',
          price: item.final_price / 100,
          quantity: item.quantity
        };
      });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'begin_checkout',
        event_source: 'drye_cart_drawer',
        ecommerce: { currency: priceCart.currency || 'SEK', value: priceCart.total_price / 100, items: items }
      });
    } catch (e) { console.warn('[DRYE begin_checkout skipped]', e); }
  }
  async function pushAddToCart(variantId, qty) {
    try {
      var cart = await fetchCart();
      var added = cart.items.find(function (i) { return Number(i.variant_id) === Number(variantId); });
      if (!added) return;
      var unit = Number(added.final_price) / 100;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'add_to_cart',
        event_source: 'drye_cart_drawer',
        ecommerce: {
          currency: cart.currency || 'SEK',
          value: unit * qty,
          items: [{
            item_id: String(added.sku || added.variant_id),
            item_name: added.product_title,
            item_brand: 'DRYE',
            item_variant: added.variant_title || '',
            price: unit,
            quantity: qty
          }]
        }
      });
    } catch (e) { console.warn('[DRYE add_to_cart skipped]', e); }
  }

  // ---- events ----
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-drye-cart-open], [data-cart-open]')) { e.preventDefault(); openDrawer(); return; }
    if (e.target.closest('[data-drye-cart-close]') || e.target === overlay) { closeDrawer(); return; }

    var packStep = e.target.closest('[data-drye-cart-pack-step]');
    if (packStep) { stepPack(Number(packStep.getAttribute('data-drye-cart-pack-step'))); return; }

    var setPairsBtn = e.target.closest('[data-drye-cart-set-pairs]');
    if (setPairsBtn) { setPack(Number(setPairsBtn.getAttribute('data-drye-cart-set-pairs'))); return; }

    var sizesToggle = e.target.closest('[data-drye-cart-sizes-toggle]');
    if (sizesToggle) {
      sizesOpen = !sizesOpen;
      var block = sizesToggle.closest('[data-drye-cart-sizes]');
      if (block) block.classList.toggle('is-open', sizesOpen);
      return;
    }

    var pairStep = e.target.closest('[data-drye-pair-size-step]');
    if (pairStep) { stepPairSize(Number(pairStep.getAttribute('data-drye-pair-index')), Number(pairStep.getAttribute('data-drye-pair-size-step'))); return; }

    var checkout = e.target.closest('.drye-cart-checkout');
    if (checkout) { pushBeginCheckout(); return; } // navigation proceeds normally
  });

  // Intercept the PDP add-to-cart form so it Ajax-adds and opens THIS drawer.
  // submitInFlight makes the add IDEMPOTENT: setCartToPack already SETS the cart
  // to exactly `count` (clear-then-add), but a duplicate submit event or a second
  // submit handler could still fire a parallel add and leave stacked pairs
  // (the "select 3 → 5 in cart" bug). We stop other submit handlers for THIS
  // form and ignore re-entrant submits so a pair is added exactly once.
  var submitInFlight = false;
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.nodeName !== 'FORM') return;
    var action = form.getAttribute('action') || '';
    var isProductForm =
      form.hasAttribute('data-product-form') ||
      action.indexOf('/cart/add') !== -1 ||
      (form.matches && form.matches('product-form form'));
    if (!isProductForm) return;
    var submitter = e.submitter || form.querySelector('[type="submit"]');
    if (submitter && submitter.name === 'checkout') return; // let dynamic "Buy now" pass through
    // We own this submit — stop the native submit AND any other (e.g. theme
    // product-form) submit handler so the pair can't be added twice.
    e.preventDefault();
    e.stopImmediatePropagation();
    if (submitInFlight) return; // a previous add is still settling — drop the dupe
    var fd = new FormData(form);
    var variantId = fd.get('id');
    var addQty = parseInt(fd.get('quantity'), 10) || 1;
    if (!variantId) { form.submit(); return; }
    submitInFlight = true;
    if (submitter) submitter.setAttribute('disabled', 'disabled');
    setCartToPack(variantId, addQty)
      .then(function () {
        submitInFlight = false;
        if (submitter) submitter.removeAttribute('disabled');
        pushAddToCart(variantId, addQty);
        document.dispatchEvent(new CustomEvent('drye:cart:added'));
      })
      .catch(function () { submitInFlight = false; if (submitter) submitter.removeAttribute('disabled'); form.submit(); });
  }, true);

  document.addEventListener('drye:cart:added', function () { init().then(openDrawer); });

  async function init() {
    try {
      var cart = await fetchCart();
      priceCart = cart;
      pairs = [];
      cart.items.filter(byHandle).forEach(function (l) { var s = sizeFromLine(l); for (var i = 0; i < l.quantity; i++) pairs.push(s); });
    } catch (e) { console.warn('[DRYE cart init]', e); }
    render();
  }

  init();
})();
