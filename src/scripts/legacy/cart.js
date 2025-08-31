document.addEventListener('DOMContentLoaded', function () {
    addToCart();
});

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

            // Dispatch loading start event
            document.dispatchEvent(
                new CustomEvent('cart:add:loading:start', {
                    detail: { id, form: this }
                })
            );

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

                const token = await getCartToken();
                TriplePixel('AddToCart', {
                    item: id,
                    q: 1,
                    v: '9898162258244',
                    token: token
                });
            } catch (error) {
                console.error('Error adding item to cart:', error);

                window.location.href = '/cart'; // Fallback to cart page
            }
        });
    }
}

async function getCartToken() {
    const response = await fetch(window.Shopify.routes.root + '/cart.json').then((res) => res.json());
    return response.token;
}
