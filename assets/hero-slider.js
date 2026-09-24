/* ==========================================================================
   ConectWhats - Hero Slider JavaScript
   Vanilla JS carousel with autoplay, progress, touch support
   ========================================================================== */

(function() {
  'use strict';

  class HeroSlider {
    constructor(element) {
      this.slider = element;
      this.slides = element.querySelectorAll('.hero-banner__slide');
      this.dots = element.querySelectorAll('.hero-banner__dot');
      this.progressDots = element.querySelectorAll('.hero-banner__progress-dot');
      this.prevBtn = element.querySelector('.hero-banner__nav--prev');
      this.nextBtn = element.querySelector('.hero-banner__nav--next');

      this.currentIndex = 0;
      this.totalSlides = this.slides.length;
      this.autoplayInterval = null;
      this.autoplayDelay = parseInt(element.dataset.autoplay) || 5000;
      this.isAutoplay = element.dataset.autoplayEnabled !== 'false';
      this.isTransitioning = false;
      this.touchStartX = 0;
      this.touchEndX = 0;

      if (this.totalSlides <= 1) return;

      this.init();
    }

    init() {
      // Set initial state
      this.goToSlide(0);

      // Bind navigation
      this.prevBtn?.addEventListener('click', () => this.prev());
      this.nextBtn?.addEventListener('click', () => this.next());

      // Bind dots
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => this.goToSlide(index));
      });

      this.progressDots.forEach((dot, index) => {
        dot.addEventListener('click', () => this.goToSlide(index));
      });

      // Touch support
      this.slider.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.pauseAutoplay();
      }, { passive: true });

      this.slider.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.startAutoplay();
      }, { passive: true });

      // Pause on hover
      this.slider.addEventListener('mouseenter', () => this.pauseAutoplay());
      this.slider.addEventListener('mouseleave', () => this.startAutoplay());

      // Pause when tab not visible
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAutoplay();
        } else {
          this.startAutoplay();
        }
      });

      // Start autoplay
      if (this.isAutoplay) {
        this.startAutoplay();
      }

      // Keyboard navigation
      this.slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });
    }

    goToSlide(index) {
      if (this.isTransitioning || index === this.currentIndex) return;
      this.isTransitioning = true;

      // Remove active from current
      this.slides[this.currentIndex].classList.remove('active');
      this.dots[this.currentIndex]?.classList.remove('active');

      // Reset progress animation on previous dot
      if (this.progressDots[this.currentIndex]) {
        const prevFill = this.progressDots[this.currentIndex].querySelector('.hero-banner__progress-dot-fill');
        if (prevFill) {
          prevFill.style.animation = 'none';
          prevFill.style.width = '0';
        }
        this.progressDots[this.currentIndex].classList.remove('active');
      }

      // Set new active
      this.currentIndex = index;
      this.slides[this.currentIndex].classList.add('active');
      this.dots[this.currentIndex]?.classList.add('active');

      // Start progress animation on new dot
      if (this.progressDots[this.currentIndex]) {
        this.progressDots[this.currentIndex].classList.add('active');
        const fill = this.progressDots[this.currentIndex].querySelector('.hero-banner__progress-dot-fill');
        if (fill) {
          // Force reflow to restart animation
          fill.style.animation = 'none';
          fill.offsetHeight; // Trigger reflow
          fill.style.animation = `progressFill ${this.autoplayDelay}ms linear forwards`;
        }
      }

      // Reset autoplay timer
      if (this.isAutoplay) {
        this.pauseAutoplay();
        this.startAutoplay();
      }

      // Allow transition
      setTimeout(() => {
        this.isTransitioning = false;
      }, 600);
    }

    next() {
      const nextIndex = (this.currentIndex + 1) % this.totalSlides;
      this.goToSlide(nextIndex);
    }

    prev() {
      const prevIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
      this.goToSlide(prevIndex);
    }

    startAutoplay() {
      if (!this.isAutoplay) return;
      this.pauseAutoplay();
      this.autoplayInterval = setInterval(() => this.next(), this.autoplayDelay);
    }

    pauseAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
      }
    }

    handleSwipe() {
      const threshold = 50;
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.next(); // Swipe left
        } else {
          this.prev(); // Swipe right
        }
      }
    }
  }

  // Initialize all hero sliders
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.hero-banner').forEach(function(slider) {
      new HeroSlider(slider);
    });
  });

})();
