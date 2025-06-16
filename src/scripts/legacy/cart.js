document.addEventListener("DOMContentLoaded", function() {
    addToCart(); 
});

// Function to update the quantity in the cart drawer and main cart
function updateQty(id, qty, row) {
    row.style.opacity = 0.5;
    let update = {
        sections: 'main-cart,header,drawer-cart'
    };
    let updates = {};
    updates[id] = qty;
    update.updates = updates;

    fetch(window.Shopify.routes.root + 'cart/update.js', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
    })
    .then(res => res.json())
    .then(data => {
        const parser = new DOMParser();
        const resDrawer = parser.parseFromString(data.sections['drawer-cart'], 'text/html');
        const resHeader = parser.parseFromString(data.sections['header'], 'text/html');
        const resCart = parser.parseFromString(data.sections['main-cart'], 'text/html');
        const liveDrawer = document.querySelector('.cart-drawer');
        const liveBubble = document.querySelector('#liveBubble');
        const mainCart = document.querySelector('.main-cart');

        // Update header cart bubble
        if (liveBubble) {
            liveBubble.querySelector('#liveBubble .cart').innerHTML = resHeader.querySelector('#liveBubble .cart').innerHTML; 
        }
        
        // Update drawer and main cart
        if (liveDrawer.querySelector('.row')) {
            liveDrawer.querySelector('.below-qty').innerHTML = resDrawer.querySelector('.below-qty').innerHTML; 
            liveDrawer.querySelector('.cart-body').innerHTML = resDrawer.querySelector('.cart-body').innerHTML; 
            liveDrawer.querySelector('.cart-footer').innerHTML = resDrawer.querySelector('.cart-footer').innerHTML;   
        }
        
        if (mainCart) {
            mainCart.querySelector('.cart-body').innerHTML = resCart.querySelector('.cart-body').innerHTML; 
            mainCart.querySelector('.cart-footer').innerHTML = resCart.querySelector('.cart-footer').innerHTML;   
        }
    });
}

// Function to add items to the cart and update the UI afterward
async function addToCart() {
  const form = document.querySelector('.shopify-product-form');
  const button = document.querySelector('.shopify-product-form .button');

  if (form) {
    button.removeAttribute('disabled');

    form.addEventListener('submit', async function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      const id = this.id.value;

      try {
        // Fetch cart data in the background
        const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [
              {
                id: id,
                quantity: 1
              }
            ],
            sections: 'cart-drawer' // Fetch only what you need to update
          })
        });

        const data = await response.json();
        console.log('response', data);

        this.dispatchEvent(
          new CustomEvent('on:cart:add', {
              bubbles: true,
              detail: {
                  variantId: id,
                  sections: data.sections
              }
          })
      );
      } catch (error) {
        console.error('Error adding item to cart:', error);
        window.location.href = '/cart'; // Fallback to cart page
      }
    });
  }
}

