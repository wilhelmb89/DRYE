document.addEventListener("DOMContentLoaded", function() {
    addToCart(); 
    checkout();
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

      // Show a loading spinner or animation immediately
      showCartDrawerLoadingState();

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
            sections: 'drawer-cart' // Fetch only what you need to update
          })
        });

        const data = await response.json();

        if (data.sections) {
          // Use a minimal DOM update approach to inject cart contents
          const parser = new DOMParser();
          const resDrawer = parser.parseFromString(data.sections['drawer-cart'], 'text/html');
          const liveDrawer = document.querySelector('.cart-drawer');

          if (liveDrawer) {
            // Update cart contents using animation or a smooth transition
            const drawerBody = liveDrawer.querySelector('.cart-body');
            const drawerFooter = liveDrawer.querySelector('.cart-footer');

            // Replace content with fetched data
            requestAnimationFrame(() => {
              drawerBody.innerHTML = resDrawer.querySelector('.cart-body').innerHTML;
              drawerFooter.innerHTML = resDrawer.querySelector('.cart-footer').innerHTML;

              // Hide loading state and reveal updated cart drawer
              hideCartDrawerLoadingState();
              show(liveDrawer);

              // Call the function to update the total quantity after updating the cart drawer
              // updateTotalQty();
            });
          }
        } else {
          console.error('Error: Cart drawer sections not found in the response.');
          window.location.href = '/cart'; // Fallback to cart page
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
        window.location.href = '/cart'; // Fallback to cart page
      }
    });
  }
}

// Helper functions to manage perceived performance
function showCartDrawerLoadingState() {
  const liveDrawer = document.querySelector('.cart-drawer');
  if (liveDrawer) {
    // Show drawer immediately with a spinner or placeholder
    liveDrawer.classList.add('loading'); // Add a loading class to trigger CSS animations
    show(document.querySelector('#si-overlay'));
    show(liveDrawer);
  }
}

function hideCartDrawerLoadingState() {
  const liveDrawer = document.querySelector('.cart-drawer');
  if (liveDrawer) {
    // Remove loading state to reveal the actual cart contents
    liveDrawer.classList.remove('loading');
  }
}


// Function to update the total quantity after the product is added to the cart
function updateTotalQty() {
    const qtyWrappers = document.querySelectorAll('.qty-wrapper');
    let totalQty = 0;
    
    qtyWrappers.forEach(wrapper => {
        const qty = parseInt(wrapper.querySelector('.quantity').textContent, 10);
        totalQty += qty;
    });

    const belowQtyElement = document.querySelector('.below-qty-text');
    if (belowQtyElement) {
        belowQtyElement.textContent = totalQty;
    }
}

// Function to handle checkout
function checkout() {
    const form = document.querySelector('.shopify-cart-form');
    if (form) {
        form.addEventListener('submit', function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            location.href = window.shopUrl + `/checkout?locale=${window.Shopify.locale}`;
        });
    }
}