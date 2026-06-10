console.log('[DRYE] cart-drawer addToCart RUNNING');

(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function shopifyRoot() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  function rootUrl(path) {
    return shopifyRoot() + String(path || '').replace(/^\/+/, '');
  }

  function getDrawer() {
    return qs('.cart-drawer');
  }

  function getOverlay() {
    return qs('.overlay');
  }

  function getScroller() {
    var drawer = getDrawer();
    return drawer ? qs('.cart-items', drawer) : null;
  }

  function isOpen() {
    var drawer = getDrawer();
    return !!(drawer && drawer.classList.contains('open'));
  }

  function open() {
    var drawer = getDrawer();
    var overlay = getOverlay();

    if (!drawer) return;

    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');

    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    var drawer = getDrawer();
    var overlay = getOverlay();

    if (!drawer) return;

    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function getDrawerSectionContainer() {
    var drawer = getDrawer();
    if (!drawer) return null;
    return drawer.closest('.shopify-section');
  }

  function getDrawerSectionId() {
    var container = getDrawerSectionContainer();
    if (!container || !container.id) return null;

    if (container.id.indexOf('shopify-section-') === 0) {
      return container.id.replace('shopify-section-', '');
    }

    return null;
  }

  async function fetchJson(url, options) {
    var res = await fetch(url, options || {});
    if (!res.ok) {
      var text = '';
      try {
        text = await res.text();
      } catch (err) {}
      throw new Error(text || ('Request failed: ' + url));
    }
    return res.json();
  }

  async function fetchCart() {
    return fetchJson(rootUrl('cart.js'), {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
  }

  async function changeLine(line, quantity) {
    return fetchJson(rootUrl('cart/change.js'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        line: Number(line),
        quantity: Number(quantity)
      })
    });
  }

  async function addItems(items) {
    return fetchJson(rootUrl('cart/add.js'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ items: items })
    });
  }

  async function refresh(keepOpen) {
    var sectionId = getDrawerSectionId();
    var container = getDrawerSectionContainer();

    if (!sectionId || !container) {
      if (keepOpen) open();
      return;
    }

    try {
      var savedScrollTop = 0;
      var scroller = getScroller();

      if (scroller) {
        savedScrollTop = scroller.scrollTop || 0;
      }

      var url = window.location.pathname + '?section_id=' + encodeURIComponent(sectionId);

      var res = await fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'text/html' },
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('Section fetch failed');
      }

      var html = await res.text();

      if (!html || !html.trim()) {
        throw new Error('Empty section HTML');
      }

      container.innerHTML = html;

      bindInternalEvents();

      if (keepOpen) {
        open();

        window.requestAnimationFrame(function () {
          var newScroller = getScroller();
          if (newScroller) {
            newScroller.scrollTop = savedScrollTop;
          }
        });
      }
    } catch (err) {
      console.error('[DRYE Cart Drawer] refresh error', err);
      if (keepOpen) open();
    }
  }

  function pushBeginCheckout() {
    fetchCart().then(function (cart) {
      if (!cart || !cart.items) return;

      var items = cart.items.map(function (item) {
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
        ecommerce: {
          currency: cart.currency || 'SEK',
          value: cart.total_price / 100,
          items: items
        }
      });

      console.log('[DRYE] begin_checkout fired', items);
    });
  }

  async function addToCart(form, submitter) {
    var btn = submitter || form.querySelector('[type="submit"]');
    var originalText = btn ? btn.textContent : null;

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding...';
      }

      var formData = new FormData(form);
      var variantId = Number(formData.get('id'));
      var desiredQty = Number(formData.get('quantity') || 1);

      if (!variantId || !Number.isFinite(desiredQty) || desiredQty < 1) {
        throw new Error('Missing variant or invalid quantity');
      }

      var cart = await fetchCart();

      var existingIndex = cart.items.findIndex(function (item) {
        return Number(item.variant_id) === variantId;
      });

      if (existingIndex > -1) {
        var currentQty = Number(cart.items[existingIndex].quantity || 0);
        await changeLine(existingIndex + 1, currentQty + desiredQty);
      } else {
        await addItems([
          {
            id: variantId,
            quantity: desiredQty
          }
        ]);
      }

      // ===== dataLayer push for add_to_cart =====
      try {
        var updatedCart = await fetchCart();
        var addedItem = updatedCart.items.find(function (item) {
          return Number(item.variant_id) === variantId;
        });

        if (addedItem) {
          var unitPrice = Number(addedItem.final_price) / 100;

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'add_to_cart',
            event_source: 'drye_cart_drawer',
            ecommerce: {
              currency: updatedCart.currency || 'SEK',
              value: unitPrice * desiredQty,
              items: [{
                item_id: String(addedItem.sku || addedItem.variant_id),
                item_name: addedItem.product_title,
                item_brand: 'DRYE',
                item_variant: addedItem.variant_title || '',
                price: unitPrice,
                quantity: desiredQty
              }]
            }
          });

          console.log('[DRYE] add_to_cart fired', addedItem);
        }
      } catch (trackErr) {
        console.warn('[DRYE Cart Drawer] add_to_cart tracking skipped', trackErr);
      }
      // ===== end dataLayer push =====

      await refresh(true);
    } catch (err) {
      console.error('[DRYE Cart Drawer] addToCart error', err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText || 'Add to cart';
      }
    }
  }

  function bindInternalEvents() {
    var drawer = getDrawer();
    if (!drawer) return;

    var overlay = getOverlay();
    var closeBtn = qs('#cart-close', drawer);
    var continueBtn = qs('#continue-shopping', drawer);
    var upsellBtn = qs('#upsell-add', drawer);

    var checkoutBtn = qs('.btn-checkout', drawer);
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        pushBeginCheckout();
      });
    }

    if (closeBtn) {
      closeBtn.onclick = function (e) {
        e.preventDefault();
        close();
      };
    }

    if (continueBtn) {
      continueBtn.onclick = function (e) {
        e.preventDefault();
        close();
      };
    }

    if (overlay) {
      overlay.onclick = function (e) {
        e.preventDefault();
        close();
      };
    }

    if (upsellBtn) {
      upsellBtn.onclick = async function (e) {
        e.preventDefault();

        var variantId = upsellBtn.getAttribute('data-upsell-variant-id');
        if (!variantId || variantId === '0') return;

        try {
          var cart = await fetchCart();

          var existingIndex = cart.items.findIndex(function (item) {
            return String(item.variant_id) === String(variantId) || String(item.id) === String(variantId);
          });

          if (existingIndex > -1) {
            var currentQty = Number(cart.items[existingIndex].quantity || 0);
            await changeLine(existingIndex + 1, currentQty + 1);
          } else {
            await addItems([
              {
                id: Number(variantId),
                quantity: 1
              }
            ]);
          }

          // ===== dataLayer push for add_to_cart (upsell) =====
          try {
            var updatedCart = await fetchCart();
            var addedItem = updatedCart.items.find(function (item) {
              return String(item.variant_id) === String(variantId);
            });

            if (addedItem) {
              var unitPrice = Number(addedItem.final_price) / 100;

              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: 'add_to_cart',
                event_source: 'drye_cart_drawer_upsell',
                ecommerce: {
                  currency: updatedCart.currency || 'SEK',
                  value: unitPrice,
                  items: [{
                    item_id: String(addedItem.sku || addedItem.variant_id),
                    item_name: addedItem.product_title,
                    item_brand: 'DRYE',
                    item_variant: addedItem.variant_title || '',
                    price: unitPrice,
                    quantity: 1
                  }]
                }
              });

              console.log('[DRYE] add_to_cart (upsell) fired', addedItem);
            }
          } catch (trackErr) {
            console.warn('[DRYE Cart Drawer] upsell tracking skipped', trackErr);
          }
          // ===== end dataLayer push =====

          await refresh(true);
        } catch (err) {
          console.error('[DRYE Cart Drawer] upsell error', err);
        }
      };
    }

    qsa('[data-cart-open]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        open();
      };
    });

    qsa('[data-qty-change]', drawer).forEach(function (btn) {
      btn.onclick = async function (e) {
        e.preventDefault();

        try {
          var line = Number(btn.getAttribute('data-line'));
          var delta = Number(btn.getAttribute('data-qty-change'));
          var itemRow = btn.closest('.cart-item');

          if (!itemRow) return;

          var currentQty = Number(itemRow.getAttribute('data-current-qty'));

          if (!Number.isFinite(currentQty)) {
            var qtyEl = itemRow.querySelector('[data-qty-num]');
            currentQty = Number(qtyEl ? qtyEl.textContent.trim() : 1);
          }

          if (!Number.isFinite(currentQty)) currentQty = 1;

          var nextQty = Math.max(0, currentQty + delta);

          await changeLine(line, nextQty);
          await refresh(true);
        } catch (err) {
          console.error('[DRYE Cart Drawer] qty error', err);
        }
      };
    });

    qsa('[data-remove]', drawer).forEach(function (btn) {
      btn.onclick = async function (e) {
        e.preventDefault();

        try {
          var line = Number(btn.getAttribute('data-line'));
          await changeLine(line, 0);
          await refresh(true);
        } catch (err) {
          console.error('[DRYE Cart Drawer] remove error', err);
        }
      };
    });
  }

  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!form || typeof form.matches !== 'function') return;

      var isATC =
        form.matches('form[action*="/cart/add"]') ||
        form.matches('product-form form') ||
        form.matches('form[data-type="add-to-cart"]') ||
        form.hasAttribute('data-product-form');

      if (!isATC) return;

      var submitter = e.submitter || form.querySelector('[type="submit"]');

      if (submitter && submitter.name === 'checkout') return;

      e.preventDefault();
      e.stopImmediatePropagation();

      addToCart(form, submitter);
    },
    true
  );

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      close();
    }
  });

  document.addEventListener('click', function (e) {
    var openTrigger = e.target.closest('[data-open="new-cart"], [data-cart-open]');
    if (openTrigger) {
      e.preventDefault();
      open();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    bindInternalEvents();
  });

  window.DRYE_CartDrawer = {
    open: open,
    close: close,
    refresh: refresh
  };
})();