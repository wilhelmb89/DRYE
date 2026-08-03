/* ==========================================================================
   DRYE Cart Drawer — Section Rendering (currency-safe)
   Mirrors the proven old drawer: mutate the cart via the Ajax API, then
   re-render THIS section via ?section_id= and inject the server-rendered HTML.
   All prices come from Liquid money_with_currency under the page's market
   localization — so the drawer currency is ALWAYS the market currency
   (USD /en-us/, CAD /en-ca/, …). We never format prices client-side.

   Model: one cart line per pair (quantity 1) so each pair carries its own size
   variant. A unique _pair line-item property keeps same-size pairs on separate
   lines. Currency correctness end-to-end also relies on drye-market-currency-
   sync.js (localization context) for checkout.
   ========================================================================== */
(function () {
  var HANDLE = (typeof window !== 'undefined' && window.DRYE_CART_HANDLE) || 'drye-moisture-routing-glove-liners';
  var busy = false;
  var pairSeq = 0;

  // ---- routing / ajax ----
  function root() { return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/'; }
  function cartUrl(path) {
    var r = root(); if (r.charAt(r.length - 1) !== '/') r += '/';
    return r + String(path).replace(/^\/+/, '');
  }
  async function fetchCart() {
    var res = await fetch(cartUrl('cart.js') + '?ts=' + Date.now(), {
      headers: { 'Accept': 'application/json' }, cache: 'no-store', credentials: 'same-origin'
    });
    return res.json();
  }
  async function changeByKey(key, qty) {
    var res = await fetch(cartUrl('cart/change.js'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store', credentials: 'same-origin', body: JSON.stringify({ id: key, quantity: qty })
    });
    return res.json();
  }
  async function addItems(items) {
    var res = await fetch(cartUrl('cart/add.js'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store', credentials: 'same-origin', body: JSON.stringify({ items: items })
    });
    return res.json();
  }
  async function clearCart() {
    // Atomic empty in ONE request. Per-line cart/change.js loops were 400ing
    // (Bad Request) because third-party fetch wrappers (pixel listener / market
    // app) race the rapid sequential change calls, leaving old pairs un-removed
    // → stacking / off-by-one. clear.js takes no line id, so it can't race a key.
    var res = await fetch(cartUrl('cart/clear.js'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store', credentials: 'same-origin'
    });
    return res.json();
  }
  async function updateByKeys(updates) {
    // Atomic multi-line quantity set in ONE request (keyed by line-item key) —
    // replaces the 400-prone per-line cart/change.js loop for removals/reductions.
    var res = await fetch(cartUrl('cart/update.js'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store', credentials: 'same-origin', body: JSON.stringify({ updates: updates })
    });
    return res.json();
  }
  function pairProps() { return { _pair: String(Date.now()) + '-' + (++pairSeq) }; }
  function dryeLines(cart) {
    return (cart.items || []).filter(function (l) { return !HANDLE || l.handle === HANDLE; });
  }
  function dryeCount(cart) { return dryeLines(cart).reduce(function (s, l) { return s + l.quantity; }, 0); }

  // ---- size variants (from the Liquid JSON island) ----
  function sizeVariants() {
    var el = document.getElementById('drye-size-variants');
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }
  function sizeOrder() { return Object.keys(sizeVariants()); }
  function defaultVariant() { return window.DRYE_DEFAULT_VARIANT || null; }

  // ---- DOM ----
  function drawer() { return document.querySelector('[data-drye-cart-drawer]'); }
  function overlay() { return document.querySelector('[data-drye-cart-overlay]'); }
  function sectionEl() { var d = drawer(); return d ? d.closest('.shopify-section') : null; }
  function sectionId() {
    var s = sectionEl();
    if (!s || !s.id || s.id.indexOf('shopify-section-') !== 0) return null;
    return s.id.replace('shopify-section-', '');
  }

  function open() {
    var d = drawer(), o = overlay();
    if (d) { d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); }
    if (o) o.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    var d = drawer(), o = overlay();
    if (d) { d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); }
    if (o) o.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function isOpen() { var d = drawer(); return !!(d && d.classList.contains('is-open')); }

  // ---- shipping ETA (dates only; not a price, so client-side is fine) ----
  function addBusinessDays(date, days) {
    var d = new Date(date.getTime()), added = 0;
    while (added < days) { d.setDate(d.getDate() + 1); var wd = d.getDay(); if (wd !== 0 && wd !== 6) added++; }
    return d;
  }
  function fmtDate(d) {
    try { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    catch (e) { return (d.getMonth() + 1) + '/' + d.getDate(); }
  }
  function fillShipEta() {
    var wrap = document.querySelector('.drye-cart-ship-badge');
    var eta = document.querySelector('[data-drye-ship-eta]');
    if (!wrap || !eta) return;
    var min = parseInt(wrap.getAttribute('data-drye-ship-min'), 10) || 2;
    var max = parseInt(wrap.getAttribute('data-drye-ship-max'), 10) || 3;
    var now = new Date();
    var lo = fmtDate(addBusinessDays(now, min)), hi = fmtDate(addBusinessDays(now, max));
    eta.textContent = (lo === hi) ? lo : (lo + ' – ' + hi);
  }

  // ---- Section Rendering: re-render the whole drawer server-side ----
  async function refresh(keepOpen) {
    var section = sectionEl(), id = sectionId();
    if (!section || !id) { if (keepOpen) open(); return; }
    try {
      var url = window.location.pathname + '?section_id=' + encodeURIComponent(id) + '&ts=' + Date.now();
      var res = await fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'text/html' }, cache: 'no-store' });
      if (!res.ok) throw new Error('section fetch ' + res.status);
      var html = await res.text();
      if (html && html.trim()) section.innerHTML = html;
      fillShipEta();
      if (keepOpen) open();
    } catch (e) {
      console.warn('[DRYE cart] refresh failed', e);
      if (keepOpen) open();
    }
  }

  // ---- mutations ----
  async function setCartToPack(variantId, count) {   // PDP add: idempotent replace
    await clearCart();                                // atomic empty — no 400-prone per-line loop
    var items = [];
    for (var j = 0; j < count; j++) items.push({ id: Number(variantId), quantity: 1, properties: pairProps() });
    return addItems(items);
  }
  async function addOnePair() {
    var cart = await fetchCart();
    if (dryeCount(cart) >= 6) return;
    var v = defaultVariant();
    if (!v) { var ls = dryeLines(cart); v = ls.length ? ls[ls.length - 1].variant_id : null; }
    if (!v) return;
    await addItems([{ id: Number(v), quantity: 1, properties: pairProps() }]);
  }
  async function removeLastPair() {
    var cart = await fetchCart();
    var lines = dryeLines(cart);
    if (dryeCount(cart) <= 1 || !lines.length) return;
    var last = lines[lines.length - 1];
    var upd = {}; upd[last.key] = last.quantity - 1;
    await updateByKeys(upd);
  }
  async function setPairs(target) {
    target = Math.max(1, Math.min(6, target));
    var cart = await fetchCart();
    var lines = dryeLines(cart);
    var cur = dryeCount(cart);
    if (target > cur) {
      var items = [], v = defaultVariant() || (lines.length ? lines[lines.length - 1].variant_id : null);
      if (!v) return;
      for (var i = 0; i < target - cur; i++) items.push({ id: Number(v), quantity: 1, properties: pairProps() });
      await addItems(items);
    } else if (target < cur) {
      var toRemove = cur - target, upd = {};
      for (var k = lines.length - 1; k >= 0 && toRemove > 0; k--) {
        var take = Math.min(lines[k].quantity, toRemove);
        upd[lines[k].key] = lines[k].quantity - take;
        toRemove -= take;
      }
      await updateByKeys(upd);
    }
  }
  async function stepPairSize(key, dir) {
    var order = sizeOrder(), vars = sizeVariants();
    if (!order.length) return;
    // Match by raw key in a quoted attribute selector — cart line keys are
    // "<digits>:<hex>", safe unquoted; CSS.escape would wrongly escape the ':'.
    var row = null, rows = document.querySelectorAll('.drye-cart-pair[data-drye-pair-key]');
    for (var r = 0; r < rows.length; r++) { if (rows[r].getAttribute('data-drye-pair-key') === key) { row = rows[r]; break; } }
    var curSize = row ? row.getAttribute('data-drye-pair-size') : null;
    var i = order.indexOf(curSize);
    if (i === -1) return;
    var ni = Math.max(0, Math.min(order.length - 1, i + dir));
    if (ni === i) return;
    var newVariant = vars[order[ni]];
    if (!newVariant) return;
    var upd = {}; upd[key] = 0;
    await updateByKeys(upd);                                     // drop the old-size line (atomic)
    await addItems([{ id: Number(newVariant), quantity: 1, properties: pairProps() }]); // add the new size
  }

  // ---- GA4 (best-effort) ----
  async function pushAddToCart(variantId, qty) {
    try {
      var cart = await fetchCart();
      var line = cart.items.find(function (i) { return Number(i.variant_id) === Number(variantId); });
      if (!line) return;
      var unit = Number(line.final_price) / 100;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'add_to_cart', event_source: 'drye_cart_drawer',
        ecommerce: { currency: cart.currency || 'SEK', value: unit * qty, items: [{
          item_id: String(line.sku || line.variant_id), item_name: line.product_title,
          item_brand: 'DRYE', item_variant: line.variant_title || '', price: unit, quantity: qty }] }
      });
    } catch (e) {}
  }
  function pushBeginCheckout() {
    fetchCart().then(function (cart) {
      if (!cart || !cart.items) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'begin_checkout', event_source: 'drye_cart_drawer',
        ecommerce: { currency: cart.currency || 'SEK', value: cart.total_price / 100,
          items: cart.items.map(function (i) { return {
            item_id: String(i.sku || i.variant_id), item_name: i.product_title, item_brand: 'DRYE',
            item_variant: i.variant_title || '', price: i.final_price / 100, quantity: i.quantity }; }) }
      });
    }).catch(function () {});
  }

  // ---- run a mutation, then re-render (serialised so taps can't race) ----
  async function mutate(fn, opts) {
    if (busy) return;
    busy = true;
    try { await fn(); await refresh(!(opts && opts.silent)); }
    catch (e) { console.warn('[DRYE cart] mutation failed', e); }
    finally { busy = false; }
  }

  // ---- events (delegated on document → survive innerHTML re-render) ----
  document.addEventListener('click', function (e) {
    var t = e.target;

    if (t.closest('[data-drye-cart-open], [data-cart-open], [data-open="new-cart"]')) { e.preventDefault(); open(); return; }
    if (t.closest('[data-drye-cart-close]') || t === overlay()) { e.preventDefault(); close(); return; }

    var packStep = t.closest('[data-drye-cart-pack-step]');
    if (packStep) {
      var dir = Number(packStep.getAttribute('data-drye-cart-pack-step'));
      mutate(dir > 0 ? addOnePair : removeLastPair);
      return;
    }
    var setBtn = t.closest('[data-drye-cart-set-pairs]');
    if (setBtn) { mutate(function () { return setPairs(Number(setBtn.getAttribute('data-drye-cart-set-pairs'))); }); return; }

    var sizeStep = t.closest('[data-drye-pair-size-step]');
    if (sizeStep) {
      var key = sizeStep.getAttribute('data-drye-pair-key');
      var sdir = Number(sizeStep.getAttribute('data-drye-pair-size-step'));
      mutate(function () { return stepPairSize(key, sdir); });
      return;
    }

    var sizesToggle = t.closest('[data-drye-cart-sizes-toggle]');
    if (sizesToggle) {
      var box = sizesToggle.closest('[data-drye-cart-sizes]');
      if (box) box.classList.toggle('is-open');
      return;
    }

    if (t.closest('[data-drye-checkout]')) { pushBeginCheckout(); return; } // navigation proceeds
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });

  // ---- add-to-cart from the PDP product form (idempotent SET → open drawer) ----
  function isProductForm(form) {
    if (!form || form.nodeName !== 'FORM') return false;
    var action = form.getAttribute('action') || '';
    return form.hasAttribute('data-product-form') ||
           action.indexOf('/cart/add') !== -1 ||
           (form.matches && form.matches('product-form form'));
  }
  function runProductAdd(form, submitter) {
    if (busy) return;
    var fd = new FormData(form);
    var variantId = fd.get('id');
    var addQty = parseInt(fd.get('quantity'), 10) || 1;
    if (!variantId) { form.submit(); return; }
    busy = true;
    if (submitter) submitter.setAttribute('disabled', 'disabled');
    setCartToPack(variantId, addQty)
      .then(function () { return refresh(true); })
      .then(function () { pushAddToCart(variantId, addQty); })
      .catch(function (err) { console.warn('[DRYE cart] add failed', err); })
      .then(function () { busy = false; if (submitter) submitter.removeAttribute('disabled'); });
  }

  // Primary guard — intercept the CLICK on the submit button in capture phase.
  // This stops the browser from ever starting the native POST → /cart redirect
  // (what sent buyers to the bare /cart page), independent of the submit event.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button[type="submit"], input[type="submit"]');
    if (!btn || btn.name === 'checkout') return;               // Buy now passthrough
    var form = btn.form || (btn.closest && btn.closest('form'));
    if (!isProductForm(form)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    runProductAdd(form, btn);
  }, true);

  // Fallback guard — programmatic requestSubmit() (e.g. the sticky bar) fires a
  // submit event without a button click, so we catch that path too.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!isProductForm(form)) return;
    var submitter = e.submitter || form.querySelector('[type="submit"]');
    if (submitter && submitter.name === 'checkout') return;    // Buy now passthrough
    e.preventDefault();
    e.stopImmediatePropagation();
    runProductAdd(form, submitter);
  }, true);

  // ---- external refresh hook (e.g. currency-sync re-add) ----
  document.addEventListener('drye:cart:added', function () { refresh(true); });
  window.DRYE_CartDrawer = { open: open, close: close, refresh: refresh };

  // first paint: fill the ETA on the server-rendered markup
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillShipEta);
  else fillShipEta();
})();
