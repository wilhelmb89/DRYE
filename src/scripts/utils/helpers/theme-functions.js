import { afterAnimationEnd, afterCallstack, debounce } from '../utils.js';

//+ Helper function to calculate scrollbar width
function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child's width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}

//+ Updating cart
document.addEventListener('cart:updated', (e) => {
    const itemCount = e.detail.cart.item_count;

    if (itemCount) {
        updateCartLength(itemCount);
    } else {
        fetch(window.Shopify.routes.root + '/cart.js')
            .then((res) => res.json())
            .then((data) => updateCartLength(data.item_count));
    }
});

function updateCartLength(amount) {
    document.querySelectorAll('[data-cart-length]').forEach((el) => (el.textContent = amount));
}

//! Lock Body Scroll

export function lockBodyScroll() {
    // Save current scroll position
    window.unlockedScrollY = window.scrollY;
    console.log('locking body scroll at', window.unlockedScrollY);

    // Apply simple scroll lock styles
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.unlockedScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.paddingRight = '0px';
}

export function unlockBodyScroll() {
    console.log('unlocking body scroll');

    const scrollY = window.unlockedScrollY || 0;

    // Remove all scroll lock styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';

    // Restore scroll position
    window.scrollTo(0, scrollY);

    // Clean up stored scroll position
    delete window.unlockedScrollY;
}

/**
 * Detects if the current device is running iOS and adds an "is-ios" class to the html element
 */
function detectIOSDevice() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        document.documentElement.classList.add('is-ios');
    }
}

// Run detection on page load
document.addEventListener('DOMContentLoaded', detectIOSDevice);
