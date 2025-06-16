import SideDrawer from '../components/side-drawer.js';
import { debounce } from '../utils/utils.js';
import { initLazyImages } from '../utils/lazy-images.js';

class CartDrawer extends SideDrawer {
    static sections = ['cart-drawer', 'cart-icon-bubble'];

    constructor() {
        super();
    }

    init() {
        super.init();

        document.addEventListener('on:cart:add', this.handleCartAddEvent.bind(this));

        this.addEventListener('change', debounce(this.handleChange.bind(this)));
        this.addEventListener('click', this.handleClick.bind(this));
    }

    /**
     * Handles 'change' events on the cart drawer element.
     * @param {object} evt - Event object.
     */
    handleChange(evt) {
        this.updateQuantity(evt.target.dataset.index, evt.target.value);
    }

    /**
     * Handles 'click' events on the cart drawer element.
     * @param {object} evt - Event object.
     */
    handleClick(evt) {
        const button = evt.target.closest('.js-remove-item');
        if (!button) return;
        evt.preventDefault();
        this.updateQuantity(button.dataset.index, 0);
    }

    async updateQuantity(line, quantity) {
        try {
            const cartItemEl = this.querySelector(`#line-item-${line}`);
            cartItemEl.classList.add('is-loading');

            const response = await fetch(theme.routes.cartChange, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    line,
                    quantity,
                    sections: CartDrawer.sections,
                    sections_url: window.location.pathname
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.errors || response.status);

            this.renderContents(data.sections);
        } catch (error) {
            //display error for line
            console.error(error);
        }
    }

    handleCartAddEvent(e) {
        if (e.detail?.sections && e.detail?.sections['cart-drawer']) {
            this.renderContents(e.detail.sections);
        } else {
            this.refresh();
        }
    }

    async refresh() {
        const response = await fetch('?sections=cart-drawer').then((res) => res.json());
        this.renderContents(response, false);
    }

    renderContents(sections, openCart = true) {
        if (sections['cart-drawer']) {
            this.innerHTML = CartDrawer.getSafeElementHTML(sections['cart-drawer']);

            if (openCart && !this.isOpen) {
                setTimeout(() => this.open());
            }
        }

        if (sections['cart-icon-bubble']) {
            CartDrawer.updateCartIcon(sections);
        }

        initLazyImages();
    }

    /**
     * Gets the safe innerHTML of the updated cart drawer.
     * @param {string} html - Section HTML.
     * @returns {string}
     */
    static getSafeElementHTML(html) {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = html;

        return tmpl.content.querySelector('cart-drawer').innerHTML;
    }

    static updateCartIcon(sections) {
        const cartIconBubble = document.getElementById('cart-icon-bubble');
        if (cartIconBubble) {
            cartIconBubble.innerHTML = sections['cart-icon-bubble'];
        }
    }
}

customElements.define('cart-drawer', CartDrawer);
