const sliders = document.querySelectorAll('.js-review-slider');

sliders.forEach(slider => {
  const slides = slider.querySelectorAll('.swiper-slide');

  slides.forEach(slide => {
    const playButton = slide.querySelector('.js-review-slider-play');
    const video = slide.querySelector('.js-review-slide-video');
    const body = document.querySelector('body');
    const videoEl = video.cloneNode(true);
    let isPopupOpen = false;
    let popup;

    videoEl.setAttribute('controls', true);
    videoEl.removeAttribute('playsinline');
    videoEl.removeAttribute('autoplay');
    videoEl.classList.add('review-slider__popup-video');
    
    playButton.addEventListener('click', () => {
      if (!isPopupOpen) {
        popup = document.createElement('div');
        popup.style.minHeight = window.innerHeight + 'px';
        popup.style.maxHeight = window.innerHeight + 'px';
        const popupContent = document.createElement('div');
        const closeButton = document.createElement('button');
        closeButton.classList.add('review-slider__popup-close');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('title', 'Close popup');
        closeButton.innerHTML = '<span class="review-slider__popup-close-icon"></span><span class="review-slider__popup-close-icon"></span>';
        popup.classList.add('review-slider__popup');
        popupContent.classList.add('review-slider__popup-content');
        popupContent.appendChild(closeButton);
        popupContent.appendChild(videoEl);
        popup.appendChild(popupContent);
        body.appendChild(popup);
        body.classList.add('scroll-disabled');
        isPopupOpen = true;
        videoEl.muted = false;
        videoEl.currentTime = 0;
        videoEl.play();

        closeButton.addEventListener('click' , () => {
          popup.remove();
          body.classList.remove('scroll-disabled');
          isPopupOpen = false;
        });
      }
    });

    document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      if (isPopupOpen) {
        popup.remove();
        body.classList.remove('scroll-disabled');
        isPopupOpen = false;
      }
    }
  });
  })
  
  const slidesOnDesktop = slider.getAttribute('data-slides');
  const swiper = new Swiper(slider.querySelector('.swiper'), {
    // Optional parameters
    direction: 'horizontal',
    loop: false,
    spaceBetween: 10,

    breakpoints: {
      320: {
        slidesPerView: 1
      },
      768: {
        slidesPerView: 2
      },
      1200: {
        slidesPerView: slidesOnDesktop
      }
    },
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },
  
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  
    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });
})