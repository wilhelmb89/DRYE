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
        fetch('/cart.js')
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

    // Check for iOS devices specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Check for desktop (non-mobile) devices
    const isDesktop = window.innerWidth > 1024;

    // For non-iOS devices, handle scrollbar compensation
    if (!isIOS) {
        const scrollbarWidth = getScrollbarWidth();
        if (
            document.documentElement.scrollHeight > document.documentElement.clientHeight &&
            scrollbarWidth > 0
        ) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.dataset.scrollbarPadding = scrollbarWidth;
        }
    }

    // iOS-specific approach
    if (isIOS) {
        document.body.classList.add('fixed');
        // Save current viewport height before we lock
        document.body.dataset.iosScrollLock = 'true';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${window.unlockedScrollY}px`;
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
    }
    // Desktop devices - minimal locking to prevent keyboard issues
    else if (isDesktop) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }
    // Android and other mobile devices
    else {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('fixed');
        document.body.style.position = 'fixed';
        document.body.style.top = `-${window.unlockedScrollY}px`;
        document.body.style.width = '100%';
    }
}

export function unlockBodyScroll() {
    console.log('unlocking body scroll');

    // Check for iOS devices specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const scrollY = window.unlockedScrollY || 0;

    // Clean up scrollbar padding if it was added
    if (document.body.dataset.scrollbarPadding) {
        document.body.style.paddingRight = '';
        delete document.body.dataset.scrollbarPadding;
    }

    // Restore overflow styles
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Clean up all fixed positioning properties
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.position = '';
    document.body.classList.remove('fixed');

    // iOS specific cleanup
    if (document.body.dataset.iosScrollLock) {
        delete document.body.dataset.iosScrollLock;
        // For iOS, immediately scroll to the stored position
        window.scrollTo(0, scrollY);
    }
    // Other devices
    else if (typeof window.unlockedScrollY === 'number') {
        const isDesktop = window.innerWidth > 1024;
        // Only restore scroll on mobile non-iOS devices
        if (!isDesktop && !isIOS) {
            window.scrollTo(0, scrollY);
        }
    }

    // Always clean up the stored scroll position
    delete window.unlockedScrollY;

    // Force a small delay to ensure smooth transition back to scrollable state
    setTimeout(() => {
        // Trigger a small scroll to ensure iOS fully restores scrolling
        if (isIOS) {
            window.scrollTo(0, window.scrollY + 1);
        }
    }, 100);
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
