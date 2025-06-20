class QuantityInput extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.input = this.querySelector('input');
        this.currentQty = this.input.value;
        this.changeEvent = new Event('change', { bubbles: true });

        this.addEventListener('click', this.handleClick.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handles 'click' events on the quantity input element.
     * @param {object} evt - Event object.
     */
    handleClick(evt) {
        const button = evt.target.closest('button');
        if (!button) return;
        evt.preventDefault();

        if (button.name === 'plus') {
            this.input.stepUp();
        } else if (button.name === 'minus') {
            this.input.stepDown();
        }

        if (this.input.value !== this.currentQty) {
            this.input.dispatchEvent(this.changeEvent);
            this.currentQty = this.input.value;
        }
    }

    /**
     * Handles 'keydown' events on the input field.
     * @param {object} evt - Event object.
     */
    handleKeydown(evt) {
        if (evt.key !== 'Enter') return;
        evt.preventDefault();

        if (this.input.value !== this.currentQty) {
            this.input.blur();
            this.input.focus();
            this.currentQty = this.input.value;
        }
    }
}

customElements.define('quantity-input', QuantityInput);
