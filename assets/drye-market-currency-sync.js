/* ==========================================================================
   DRYE — Shopify Markets currency sync
   Guarantees the Ajax cart's presentment currency matches the buyer's market
   currency (the reason a US buyer on /en-us/ could see SEK in the drawer).

   Root cause (per the Markets research): the cart's currency is resolved
   server-side from the persistent localization (country) context — NOT from
   the URL prefix. If that context is still the store default (SE), cart.js
   returns SEK even on /en-us/. The ONLY sanctioned fix is to set the country
   context via POST /localization (form.submit, full navigation), which switches
   BOTH cart and checkout. We never relabel a SEK amount as USD (mis-selling).

   Logic: compare intended currency ({{ localization.country.currency.iso_code }},
   exposed as window.__marketIntent.currency in theme.liquid, reflecting the
   URL-prefix market) against the cart's actual currency. If they differ, PUT the
   country context once (GUARD flag prevents redirect loops), then reload. Runs
   BEFORE prices are trusted. Never runs in the theme editor.
   ========================================================================== */
(function () {
  var intent = window.__marketIntent;
  if (!intent || !intent.currency) return;                       // nothing to compare against
  if (window.Shopify && window.Shopify.designMode) return;       // never redirect the editor preview

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || intent.root || '/';
  var GUARD = 'mkt_sync_attempted';   // one localization-PUT per navigation
  var BACKUP = 'mkt_cart_backup';

  async function getCart() {
    // Cache-bust + no-store: cart.js can be served stale (max-age up to 4h) from
    // CDN/browser cache, which would hand back the old (wrong) currency.
    var res = await fetch(root + 'cart.js?ts=' + Date.now(), {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });
    return res.json();
  }

  function putLocalization(countryCode, languageCode, returnTo) {
    var f = document.createElement('form');
    f.method = 'POST';
    f.action = root + 'localization';   // locale-aware root
    f.hidden = true;
    f.innerHTML =
      '<input name="_method" value="PUT">' +
      '<input name="country_code" value="' + countryCode + '">' +
      (languageCode ? '<input name="language_code" value="' + languageCode + '">' : '') +
      '<input name="return_to" value="' + returnTo + '">';
    document.body.appendChild(f);
    f.submit(); // full navigation — the only reliable way to switch presentment currency
  }

  async function syncCurrency() {
    var cart;
    try { cart = await getCart(); } catch (e) { return; }

    // 1. Already in the right currency → clear guard, let prices render.
    if (cart.currency === intent.currency) {
      try { sessionStorage.removeItem(GUARD); } catch (e) {}
      return;
    }
    // 2. Already attempted this navigation → stop (avoid redirect loop). This is
    //    also where we land if the market has no matching Shopify Payments
    //    currency — a config issue, not something more JS can fix.
    try {
      if (sessionStorage.getItem(GUARD)) {
        console.warn('[DRYE mkt] currency still', cart.currency, 'expected', intent.currency, '- aborting to avoid loop');
        return;
      }
    } catch (e) {}

    // 3. Snapshot the cart in case the currency switch drops line items (edge case).
    try {
      sessionStorage.setItem(BACKUP, JSON.stringify(
        (cart.items || []).map(function (i) { return { id: i.id, quantity: i.quantity, properties: i.properties }; })
      ));
    } catch (e) {}

    // 4. Set the country context, return to this same page.
    try { sessionStorage.setItem(GUARD, '1'); } catch (e) {}
    putLocalization(intent.country, intent.language, window.location.pathname + window.location.search);
  }

  async function afterReturn() {
    var backup;
    try { backup = sessionStorage.getItem(BACKUP); } catch (e) { backup = null; }
    if (!backup) return;

    var cart;
    try { cart = await getCart(); } catch (e) { return; }
    if (cart.currency !== intent.currency) return;                 // switch didn't take — leave it
    if (cart.items && cart.items.length) {                         // cart preserved — done
      try { sessionStorage.removeItem(BACKUP); } catch (e) {}
      return;
    }
    // Cart emptied during the switch → re-add in the correct currency.
    var items;
    try { items = JSON.parse(backup); } catch (e) { items = []; }
    if (items.length) {
      try {
        await fetch(root + 'cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          credentials: 'same-origin',
          body: JSON.stringify({ items: items })
        });
      } catch (e) {}
    }
    try { sessionStorage.removeItem(BACKUP); } catch (e) {}
    document.dispatchEvent(new CustomEvent('drye:cart:added'));    // let the drawer refresh
  }

  function run() { afterReturn().then(syncCurrency); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
