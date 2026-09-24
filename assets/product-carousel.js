/* ==========================================================================
   ConectWhats - Product Carousel JavaScript
   Horizontal scroll carousel with drag support
   ========================================================================== */

(function() {
  'use strict';

  class ProductCarousel {
    constructor(element) {
      this.container = element;
      this.carousel = element.querySelector('.carousel');
      this.prevBtn = element.querySelector('.trending-section__nav-btn--prev');
      this.nextBtn = element.querySelector('.trending-section__nav-btn--next');

      if (!this.carousel) return;

      this.isDragging = false;
      this.startX = 0;
      this.scrollLeft = 0;
      this.velocity = 0;
      this.lastX = 0;
      this.lastTime = 0;
      this.autoplayTimer = null;

      // Touch devices scroll horizontally natively — JS drag is only for mouse.
      this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      this.init();
    }

    init() {
      // Navigation buttons
      this.prevBtn?.addEventListener('click', () => { this.scrollPrev(); this.resetAutoplay(); });
      this.nextBtn?.addEventListener('click', () => { this.scrollNext(); this.resetAutoplay(); });

      // Drag to scroll (desktop mouse only)
      // Touch devices: browser handles horizontal swipe natively via overflow-x: auto.
      // We must NOT attach any touch listeners — doing so hijacks vertical page scroll.
      this.carousel.addEventListener('mousedown', (e) => this.startDrag(e));
      document.addEventListener('mousemove', (e) => this.drag(e));
      document.addEventListener('mouseup', () => this.endDrag());

      // Block link navigation only when a real drag happened
      this.carousel.addEventListener('click', (e) => {
        if (this.hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          this.hasDragged = false;
        }
      }, true);

      // Update button states on scroll
      this.carousel.addEventListener('scroll', () => this.updateButtons(), { passive: true });

      // Initial button state
      this.updateButtons();

      // Start autoplay (desktop only — isTouchDevice check inside startAutoplay)
      this.startAutoplay();
    }

    startAutoplay() {
      this.stopAutoplay();
      // No autoplay on touch devices — there is no :hover to pause it, so it
      // would keep sliding the carousel on its own while the user scrolls.
      if (this.isTouchDevice) return;
      this.autoplayTimer = setInterval(() => {
        if (this.carousel.matches(':hover')) return;
        var maxScroll = this.carousel.scrollWidth - this.carousel.clientWidth;
        var atEnd = this.carousel.scrollLeft >= maxScroll - 5;
        if (atEnd) {
          this.carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          this.scrollNext();
        }
      }, 4000);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    resetAutoplay() {
      this.stopAutoplay();
      this.startAutoplay();
    }

    startDrag(e) {
      this.hasDragged = false;
      this.dragActive = true;
      this.carousel.classList.remove('dragging');

      if (e.type === 'mousedown') {
        this.startX = e.pageX;
        // Don't call preventDefault here — it would block link clicks
      } else {
        this.startX = e.touches[0].pageX;
      }

      this.scrollLeft = this.carousel.scrollLeft;
      this.lastX = this.startX;
      this.lastTime = Date.now();
      this.velocity = 0;
    }

    drag(e) {
      if (!this.dragActive) return;

      let currentX;
      if (e.type === 'mousemove') {
        currentX = e.pageX;
      } else {
        currentX = e.touches[0].pageX;
      }

      const diff = currentX - this.startX;

      // Only start dragging after moving more than 5px (avoids blocking clicks)
      if (!this.hasDragged && Math.abs(diff) < 5) return;

      this.hasDragged = true;
      this.isDragging = true;
      this.carousel.classList.add('dragging');

      // Calculate velocity for momentum
      const now = Date.now();
      const dt = now - this.lastTime;
      if (dt > 0) {
        this.velocity = (currentX - this.lastX) / dt;
      }
      this.lastX = currentX;
      this.lastTime = now;

      this.carousel.scrollLeft = this.scrollLeft - diff;
    }

    endDrag() {
      if (!this.dragActive) return;
      this.dragActive = false;
      this.isDragging = false;
      this.carousel.classList.remove('dragging');

      this.resetAutoplay();

      if (!this.hasDragged) return; // Was just a click, let it through

      // Apply momentum
      if (Math.abs(this.velocity) > 0.5) {
        const momentum = this.velocity * 150;
        this.carousel.scrollBy({
          left: -momentum,
          behavior: 'smooth'
        });
      }
    }

    scrollPrev() {
      const itemWidth = this.getItemWidth();
      this.carousel.scrollBy({
        left: -itemWidth * 2,
        behavior: 'smooth'
      });
    }

    scrollNext() {
      const itemWidth = this.getItemWidth();
      this.carousel.scrollBy({
        left: itemWidth * 2,
        behavior: 'smooth'
      });
    }

    getItemWidth() {
      const firstItem = this.carousel.querySelector('.carousel__item');
      if (!firstItem) return 300;
      return firstItem.offsetWidth + parseInt(getComputedStyle(this.carousel).gap) || 16;
    }

    updateButtons() {
      const { scrollLeft, scrollWidth, clientWidth } = this.carousel;
      const atStart = scrollLeft <= 5;
      const atEnd = scrollLeft >= scrollWidth - clientWidth - 5;

      if (this.prevBtn) {
        this.prevBtn.disabled = atStart;
        this.prevBtn.style.opacity = atStart ? '0.3' : '1';
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = atEnd;
        this.nextBtn.style.opacity = atEnd ? '0.3' : '1';
      }
    }
  }

  // Initialize all carousels
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.trending-section, .carousel-section').forEach(function(section) {
      new ProductCarousel(section);
    });
  });

})();
