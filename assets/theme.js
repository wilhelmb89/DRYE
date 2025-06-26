// utility

function toggle(e) {
    e.classList.toggle('active');
}
function isActive(e) {
    return e.classList.contains('active');
}
function hide(e) {
    e.classList.remove('active');
}
function show(e) {
    e.classList.add('active');
}
function hideLangs() {
    const langs = document.querySelectorAll('#langPopover.active');
    if (langs.length > 0) {
        langs.forEach((e) => {
            hide(e);
        });
    }
}

function fadeOut(element, duration) {
    var start = performance.now();

    function animate(currentTime) {
        var elapsed = currentTime - start;
        var progress = elapsed / duration;

        element.style.opacity = Math.max(1 - progress, 0);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }

    requestAnimationFrame(animate);
}

function fadeIn(element, duration, type) {
    element.style.display = type;
    element.style.opacity = 0;
    var start = performance.now();

    function animate(currentTime) {
        var elapsed = currentTime - start;
        var progress = elapsed / duration;

        element.style.opacity = Math.min(progress, 1);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// inverse header colors for dark sections

function invertHeader(trigger) {
    return;
    const elements = document.querySelectorAll('#inverseHeader');
    const header = document.querySelector('header');
    let inversed = trigger ? true : false;
    elements.forEach((element) => {
        const parent = element.parentElement;
        const bounding = parent.getBoundingClientRect();
        if (
            !inversed &&
            bounding.top <= header.clientHeight / 2 &&
            bounding.bottom >= header.clientHeight / 2
        ) {
            header.classList.add('inversed');
            parent.dataset.inversed = true;
            inversed = true;
        } else if (trigger) {
            const currentBounding =
                document.getElementById(trigger) &&
                document.getElementById(trigger).getBoundingClientRect();
            if (
                currentBounding &&
                currentBounding.top <= header.clientHeight / 2 &&
                currentBounding.bottom >= header.clientHeight / 2
            ) {
                header.classList.add('inversed');
            } else {
                header.classList.remove('inversed');
                parent.dataset.inversed = false;
            }
        }
    });
}

// window load

document.addEventListener('DOMContentLoaded', function () {
    // this.document.querySelector('body').style.opacity = 1;
    invertHeader(false);
    reviewSlider();
    shippingSlider();
    blogSlider();
    heroSlider();
    beforeAfter();
    tabs();
    share();
    hotSpot();
});

// delegated click

window.addEventListener('click', function (evt) {
    // debug
    // console.log(evt.target);

    // lang switcher

    evt.target.id === 'langSwitcher' && !isActive(evt.target.nextElementSibling)
        ? show(evt.target.nextElementSibling)
        : hideLangs();

    // mobile menu

    evt.target.id === 'menuSwitcher' && show(document.querySelector('#menuDrawer'));
    evt.target.id === 'menuClose' && hide(document.querySelector('#menuDrawer'));

    // cart slide action

    if (evt.target.id === 'triggerSlider') {
        show(document.querySelector('.overlay'));
        show(document.querySelector('.cart-drawer'));
    }

    if (evt.target.id === 'closeCart') {
        hide(document.querySelector('#si-overlay'));
        hide(document.querySelector('.cart-drawer'));
    }

    // overlay action

    if (evt.target.id === 'si-overlay') {
        hide(document.querySelector('.cart-drawer'));
        document.querySelector('.size-drawer') && hide(document.querySelector('.size-drawer'));
        hide(evt.target);
    }

    // Size chart

    if (evt.target.id === 'sizeChart') {
        show(document.querySelector('.size-drawer'));
        show(document.querySelector('#si-overlay'));
    }

    if (evt.target.id === 'closeSize') {
        hide(document.querySelector('#si-overlay'));
        hide(document.querySelector('.size-drawer'));
    }

    // increase qty

    if (evt.target.id === 'increaseQty') {
        const row = evt.target.closest('.row');
        const id = row.id;
        const qty = Number(row.dataset.qty) + 1;
        updateQty(id, qty, row);
    }

    // decrease qty

    if (evt.target.id === 'decreaseQty') {
        const row = evt.target.closest('.row');
        const id = row.id;
        const qty = Number(row.dataset.qty) - 1;
        updateQty(id, qty, row);
    }

    if (evt.target.id === 'removeQty') {
        const row = evt.target.closest('.row');
        const id = row.id;
        const qty = 0;
        updateQty(id, qty, row);
    }

    // account

    if (evt.target.id === 'recoverPassword') {
        // console.log('test');
        show(document.querySelector('.reset-password'));
        hide(document.querySelector('.login-area'));
    }

    if (evt.target.id === 'cancelRecover') {
        // console.log('test');
        hide(document.querySelector('.reset-password'));
        show(document.querySelector('.login-area'));
    }

    if (evt.target.id === 'accountSwitcher') {
        if (!evt.target.classList.contains('active')) {
            const toShow = document.querySelector(`.info .${evt.target.dataset.switch}`);
            const toHide = document.querySelector('.info .active');
            const buttonToShow = evt.target;
            const buttonToHide = document.querySelector('.mobile-switchers .active');
            hide(toHide);
            hide(buttonToHide);
            show(toShow);
            show(buttonToShow);
        }
    }

    if (evt.target.id === 'addNewAddress') {
        const targetPage = document.querySelector('#newAddress');
        const currentPage = document.querySelector('#mainAddress');
        targetPage.style.display = 'block';
        currentPage.style.display = 'none';
    }

    if (evt.target.id === 'backAddress') {
        const targetPage = document.querySelector('#newAddress');
        const currentPage = document.querySelector('#mainAddress');
        targetPage.style.display = 'none';
        currentPage.style.display = 'block';
    }

    if (evt.target.id === 'backAddressEdit') {
        const targetPage = document.querySelector('#mainAddress');
        const currentPage = evt.target.closest('.edit-add');
        targetPage.style.display = 'block';
        currentPage.style.display = 'none';
    }

    if (evt.target.id === 'editAddress') {
        const targetPage = document.querySelector(`#edit${evt.target.dataset.id}`);
        const currentPage = document.querySelector('#mainAddress');
        targetPage.style.display = 'block';
        currentPage.style.display = 'none';
    }
});

// scroll events

window.addEventListener('scroll', function (evt) {
    let inversionTriggerId = null;
    document.querySelector('[data-inversed="true"]')
        ? (inversionTriggerId = document.querySelector('[data-inversed="true"]').id)
        : null;
    invertHeader(inversionTriggerId);
});

// account

// Sliders

function reviewSlider() {
    const sliders = document.querySelectorAll('.reviews-slider');
    if (sliders.length > 0) {
        sliders.forEach((slider) => {
            const swiperParams = {
                navigation: {
                    nextEl: slider.nextElementSibling.querySelector('.next'),
                    prevEl: slider.nextElementSibling.querySelector('.prev')
                },
                breakpoints: {
                    1150: {
                        slidesPerView: 3,
                        spaceBetween: 50
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 40
                    },
                    0: {
                        slidesPerView: 1
                    }
                }
            };
            Object.assign(slider, swiperParams);
            slider.initialize();
        });
    }
}

function blogSlider() {
    const sliders = document.querySelectorAll('.blog-slider');
    if (sliders.length > 0) {
        sliders.forEach((slider) => {
            const swiperParams = {
                navigation: {
                    nextEl: slider.nextElementSibling.querySelector('.next'),
                    prevEl: slider.nextElementSibling.querySelector('.prev')
                },
                breakpoints: {
                    1150: {
                        slidesPerView: 3,
                        spaceBetween: 30
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                        pagination: {
                            el: slider.nextElementSibling.querySelector('.pagination'),
                            type: 'bullets'
                        }
                    },
                    0: {
                        slidesPerView: 1,
                        pagination: {
                            el: slider.nextElementSibling.querySelector('.pagination'),
                            type: 'bullets'
                        }
                    }
                },
                on: {
                    init() {
                        const image = slider.querySelector('img');
                        if (image) {
                            slider.nextElementSibling.style.top = image.clientHeight / 2 + 'px';
                        }
                    }
                }
            };
            Object.assign(slider, swiperParams);
            slider.initialize();
        });
    }
}

function heroSlider() {
    const heroVideo = document.querySelectorAll('.hero-wrapper .video-wrapper');
    if (heroVideo.length > 0) {
        heroVideo.forEach((e) => {
            const video = e.querySelector('video');
            video.play();
        });
    }
    const sliders = document.querySelectorAll('.hero-slider');
    sliders.forEach((slider) => {
        const swiperParams = {
            spaceBetween: 0,
            centeredSlides: true,
            speed: 5000,
            autoplay: {
                delay: 1
            },
            loop: true,
            slidesPerView: 'auto',
            allowTouchMove: false,
            disableOnInteraction: false
        };
        Object.assign(slider, swiperParams);
        slider.initialize();
    });
}

function shippingSlider() {
    const sliders = document.querySelectorAll('.announce-slider');
    sliders.forEach((slider) => {
        const swiperParams = {
            spaceBetween: 50,
            centeredSlides: true,
            autoplay: {
                delay: 1
            },
            loop: true,
            slidesPerView: 'auto',
            allowTouchMove: false,
            disableOnInteraction: false,
            breakpoints: {
                1440: {
                    speed: 20000
                },
                1024: {
                    speed: 10000
                },
                0: {
                    speed: 6000
                }
            }
        };
        Object.assign(slider, swiperParams);
        slider.initialize();
        document.querySelector('.announce').style.display = 'block';
    });
}

// before after
function beforeAfter() {
    const sliders = document.querySelectorAll('.before-after-slider');
    if (sliders.length > 0) {
        sliders.forEach((slider) => {
            const before = slider.querySelector('.before-image');
            const beforeImage = before.getElementsByTagName('img')[0];
            const resizer = slider.querySelector('.resizer');
            const resizerTrigger = resizer.querySelector('resizer-trigger');

            let active = false;
            //Sort overflow out for Overlay Image
            let width = slider.offsetWidth;
            beforeImage.style.width = width + 'px';

            //Adjust width of image on resize
            window.addEventListener('resize', function () {
                let width = slider.offsetWidth;
                beforeImage.style.width = width + 'px';
            });

            resizer.addEventListener('mousedown', function () {
                active = true;
                resizer.classList.add('resize');
            });

            document.body.addEventListener('mouseup', function () {
                active = false;
                resizer.classList.remove('resize');
            });

            document.body.addEventListener('mouseleave', function () {
                active = false;
                resizer.classList.remove('resize');
            });

            document.body.addEventListener('mousemove', function (e) {
                if (!active) return;
                let x = e.pageX;
                x -= slider.getBoundingClientRect().left;
                slideIt(x);
                pauseEvent(e);
            });

            resizer.addEventListener('touchstart', function () {
                active = true;
                resizer.classList.add('resize');
            });

            document.body.addEventListener('touchend', function () {
                active = false;
                resizer.classList.remove('resize');
            });

            document.body.addEventListener('touchcancel', function () {
                active = false;
                resizer.classList.remove('resize');
            });

            //calculation for dragging on touch devices
            document.body.addEventListener('touchmove', function (e) {
                if (!active) return;
                let x;

                let i;
                for (i = 0; i < e.changedTouches.length; i++) {
                    x = e.changedTouches[i].pageX;
                }

                x -= slider.getBoundingClientRect().left;
                slideIt(x);
                pauseEvent(e);
            });

            function slideIt(x) {
                let transform = Math.max(0, Math.min(x, slider.offsetWidth));
                before.style.width = transform + 'px';
                resizer.style.left = transform - 0 + 'px';
            }

            //stop divs being selected.
            function pauseEvent(e) {
                if (e.stopPropagation) e.stopPropagation();
                if (e.preventDefault) e.preventDefault();
                e.cancelBubble = true;
                e.returnValue = false;
                return false;
            }
        });
    }
}
// tabs
function tabs() {
    const tabs = document.querySelectorAll('.tabs-section');
    if (tabs.length > 0) {
        tabs.forEach((tabSection) => {
            const buttons = tabSection.querySelectorAll('.tab');
            buttons.forEach((button) => {
                button.addEventListener('click', function () {
                    const target = tabSection.querySelector(
                        `.tabs-contents [data-index="${button.dataset.index}"]`
                    );
                    const current = tabSection.querySelector('.tabs-contents .active');
                    const activeButton = tabSection.querySelector('.tabs-titles .active');
                    if (target != current) {
                        hide(activeButton);
                        show(button);
                        show(target);
                        hide(current);
                    }
                });
            });
        });
    }
}
// shares
function share() {
    const button = document.querySelector('.share-button');
    if (button) {
        button.addEventListener('click', function () {
            toggle(button.nextElementSibling);
        });
    }
}
// product qty

// hotspot
function hotSpot() {
    const hotSpot = document.querySelector('.hot-spot');
    if (hotSpot) {
        const spots = hotSpot.querySelectorAll('#hotSpot');
        spots.forEach((spot, i) => {
            spot.addEventListener('click', function () {
                const wrapper = spot.closest(`.hot-wrapper`).nextElementSibling;
                const currentSpot = hotSpot.querySelector('#hotSpot.active');
                const targetElement = wrapper.querySelector(`[data-index="${spot.dataset.index}"]`);
                const currentElement = wrapper.querySelector(`.active`);
                if (targetElement != currentElement) {
                    hide(currentSpot);
                    show(spot);
                    show(targetElement);
                    hide(currentElement);
                }
            });
        });
    }
}
// checkout

class MainCarousel extends HTMLElement {
    constructor() {
        super();

        this.delay_load =
            this.getAttribute('data-load-delay') && this.getAttribute('data-load-delay') === 'true'
                ? true
                : false;

        this.defaultOptions = {
            loop: true
        };

        this.elements = {
            swiper: this.querySelector('.main-carousel'),
            pagination: this.querySelector('.main-carousel__pagination'),
            prevButton: this.querySelector('.main-carousel__button-prev'),
            nextButton: this.querySelector('.main-carousel__button-next')
        };

        this.swiperOptions = {
            ...this.defaultOptions
        };
        if (this.elements.swiper.dataset.carouselOptions) {
            this.swiperOptions = {
                ...this.defaultOptions,
                ...JSON.parse(this.elements.swiper.dataset.carouselOptions)
            };
        }

        if (this.elements.prevButton && this.elements.nextButton) {
            this.swiperOptions.navigation = {
                nextEl: this.elements.nextButton,
                prevEl: this.elements.prevButton
            };
        }

        if (this.elements.pagination) {
            this.swiperOptions.pagination = {
                el: this.elements.pagination
            };
        }
    }

    connectedCallback() {
        this.addEventListeners();
    }

    addEventListeners() {
        if (this.delay_load) {
            this.init();
        } else {
            document.addEventListener('DOMContentLoaded', this.init.bind(this));
        }
    }

    init() {
        if (!this.elements.swiper) return;
        this.swiper = new Swiper(this.elements.swiper, this.swiperOptions);
    }
}
customElements.define('main-carousel', MainCarousel);

// Masonry Reviews

document.addEventListener('DOMContentLoaded', function () {
    console.log('loading masonry for reviews');

    let tries = 0;

    const masonry = document.getElementById('masonry-script');

    if (masonry.dataset.loaded === 'false') {
        masonry.addEventListener('load', function () {
            masonry.dataset.loaded = 'true';
            applyMasonry();
        });
    } else {
        applyMasonry();
    }

    function applyMasonry() {
        tries++;
        if (tries > 10) return;
        if (window.innerWidth < 768) return;

        const grid = document.querySelector(
            '.kl_reviews__list_container > div:has(.kl_reviews__review_item)'
        );
        if (!grid) return setTimeout(applyMasonry, 100);

        const items = grid.querySelectorAll('.kl_reviews__review_item');

        items.forEach((item) => {
            item.style.width = 'calc(33.33% - 16px)';
        });

        console.log('applying masonry to grid', grid);

        new Masonry(grid, {
            itemSelector: '.kl_reviews__review_item',
            gutter: 16
        });
    }
});
