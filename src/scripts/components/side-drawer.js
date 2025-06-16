import { lockBodyScroll, unlockBodyScroll } from '../utils/theme-functions.js';

export default class SideDrawer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.init();
        // Add the listener for Shopify section select event
        if (Shopify.designMode) {
            // Check if in theme editor
            document.addEventListener('shopify:section:select', this.handleSectionSelect.bind(this));
            document.addEventListener('shopify:section:deselect', this.handleSectionDeselect.bind(this));
        }
    }

    disconnectedCallback() {
        // Clean up event listeners when the element is removed from the DOM
        if (Shopify.designMode) {
            document.removeEventListener('shopify:section:select', this.handleSectionSelect.bind(this));
            document.removeEventListener('shopify:section:deselect', this.handleSectionDeselect.bind(this));
        }
    }

    init() {
        this.toggleSelector = `[${this.dataset.toggleAttribute}]`;
        document.querySelectorAll(this.toggleSelector).forEach((el) => {
            //if inside drawer it's handled by drawer click
            if (!this.contains(el)) {
                el.addEventListener('click', () => {
                    this.toggle();
                });
            }
        });

        this.addEventListener('click', this.handleDrawerClick.bind(this));

        this.addEventListener('keyup', (evt) => {
            if (evt.key === 'Escape') this.close();
        });
    }

    handleDrawerClick(evt) {
        const button = evt.target.closest(this.toggleSelector);

        if (!button) return;

        evt.preventDefault();
        this.toggle();
    }

    handleSectionSelect(event) {
        // Check if the selected section is the one containing this side drawer
        const sectionId = this.closest('.shopify-section')?.id;
        if (sectionId && event.detail.sectionId === sectionId) {
            this.open();
        }
    }

    handleSectionDeselect(event) {
        // Optionally close the drawer when its section is deselected
        const sectionId = this.closest('.shopify-section')?.id;
        if (sectionId && event.detail.sectionId === sectionId) {
            this.close();
        }
    }

    get isOpen() {
        return this.getAttribute('open') !== null;
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.toggleAttribute('open', true);
        lockBodyScroll();
    }

    close() {
        this.toggleAttribute('open', false);
        unlockBodyScroll();
    }
}

customElements.define('side-drawer', SideDrawer);
