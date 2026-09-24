/* ==========================================================================
   ConectWhats - Animations JavaScript
   Intersection Observer reveal, parallax, stagger, counters,
   scroll progress, clip reveals, image reveals, and more
   ========================================================================== */

(function() {
  'use strict';

  /* ---------- Helpers ---------- */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isShopifyEditor() {
    return window.Shopify && window.Shopify.designMode;
  }

  /* ---------- Scroll Progress Bar ---------- */
  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    if (isShopifyEditor()) { bar.style.display = 'none'; return; }

    var ticking = false;
    function updateProgress() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  /* ---------- Scroll Reveal (Intersection Observer) ---------- */
  function initScrollReveal() {
    var selectors = [
      '.reveal:not(.revealed)',
      '.reveal-left:not(.revealed)',
      '.reveal-right:not(.revealed)',
      '.reveal-scale:not(.revealed)',
      '.reveal-clip:not(.revealed)',
      '.reveal-blur:not(.revealed)',
      '.reveal-zoom:not(.revealed)',
      '.image-reveal:not(.revealed)',
      '.text-split-reveal:not(.revealed)'
    ];
    var revealElements = document.querySelectorAll(selectors.join(','));

    if (!revealElements.length) return;

    if (prefersReducedMotion() || isShopifyEditor()) {
      revealElements.forEach(function(el) {
        el.classList.add('revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');

          var children = entry.target.querySelectorAll('[data-stagger]');
          children.forEach(function(child, index) {
            child.style.transitionDelay = (index * 0.08) + 's';
            child.classList.add('revealed');
          });

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  /* ---------- Stagger Grid Children ---------- */
  function initStaggerReveal() {
    var staggerContainers = document.querySelectorAll('[data-stagger-container]:not(.stagger-initialized)');

    if (!staggerContainers.length) return;

    if (isShopifyEditor()) {
      staggerContainers.forEach(function(container) {
        container.classList.add('stagger-initialized');
        Array.from(container.children).forEach(function(child) {
          child.classList.add('revealed');
        });
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var children = entry.target.children;
          Array.from(children).forEach(function(child, index) {
            setTimeout(function() {
              child.classList.add('revealed');
            }, index * 100);
          });
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    staggerContainers.forEach(function(container) {
      container.classList.add('stagger-initialized');
      Array.from(container.children).forEach(function(child) {
        child.style.opacity = '0';
        child.style.transform = 'translateY(20px)';
        child.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      });
      observer.observe(container);
    });

    if (!document.getElementById('stagger-reveal-styles')) {
      var style = document.createElement('style');
      style.id = 'stagger-reveal-styles';
      style.textContent = `
        [data-stagger-container] > .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ---------- Parallax Effect ---------- */
  function initParallax() {
    var parallaxElements = document.querySelectorAll('[data-parallax]:not(.parallax-initialized)');

    if (!parallaxElements.length) return;

    if (prefersReducedMotion()) return;

    var ticking = false;

    function updateParallax() {
      var activeElements = document.querySelectorAll('[data-parallax].parallax-initialized');
      activeElements.forEach(function(el) {
        var speed = parseFloat(el.dataset.parallax) || 0.3;
        var rect = el.getBoundingClientRect();
        var windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
          var scrollPercent = (windowHeight - rect.top) / (windowHeight + rect.height);
          var translateY = (scrollPercent - 0.5) * speed * 100;
          el.style.transform = 'translate3d(0, ' + translateY + 'px, 0)';
        }
      });
      ticking = false;
    }

    parallaxElements.forEach(function(el) {
      el.classList.add('parallax-initialized');
    });

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    updateParallax();
  }

  /* ---------- Multi-Layer Parallax ---------- */
  function initLayeredParallax() {
    var layers = document.querySelectorAll('[data-parallax-layer]:not(.layer-initialized)');
    if (!layers.length || prefersReducedMotion()) return;

    layers.forEach(function(layer) {
      layer.classList.add('layer-initialized');
    });

    var ticking = false;
    function updateLayers() {
      var activeLayers = document.querySelectorAll('[data-parallax-layer].layer-initialized');
      var scrollY = window.scrollY;

      activeLayers.forEach(function(layer) {
        var speed = parseFloat(layer.dataset.parallaxLayer) || 0.2;
        var offset = scrollY * speed;
        layer.style.transform = 'translate3d(0, ' + offset + 'px, 0)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateLayers);
        ticking = true;
      }
    }, { passive: true });

    updateLayers();
  }

  /* ---------- Counter Animation ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]:not(.counter-initialized)');

    if (!counters.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.dataset.counter);
          var duration = parseInt(el.dataset.counterDuration) || 2000;
          animateCounter(el, 0, target, duration);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function(counter) {
      counter.classList.add('counter-initialized');
      observer.observe(counter);
    });
  }

  function animateCounter(element, start, end, duration) {
    var startTime = performance.now();

    function update(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easeOut = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(start + (end - start) * easeOut);

      element.textContent = current.toLocaleString('pt-BR');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end.toLocaleString('pt-BR');
      }
    }

    requestAnimationFrame(update);
  }

  /* ---------- Countdown Timer ---------- */
  function initCountdowns() {
    var countdowns = document.querySelectorAll('[data-countdown]:not(.countdown-initialized)');

    countdowns.forEach(function(countdown) {
      countdown.classList.add('countdown-initialized');
      var targetDate = new Date(countdown.dataset.countdown).getTime();

      function updateCountdown() {
        var now = Date.now();
        var distance = targetDate - now;

        if (distance < 0) {
          countdown.innerHTML = '<span class="countdown__expired">Dispon\u00edvel!</span>';
          return;
        }

        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        var daysEl = countdown.querySelector('[data-days]');
        var hoursEl = countdown.querySelector('[data-hours]');
        var minutesEl = countdown.querySelector('[data-minutes]');
        var secondsEl = countdown.querySelector('[data-seconds]');

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) {
          var prevValue = secondsEl.textContent;
          secondsEl.textContent = String(seconds).padStart(2, '0');
          if (prevValue !== secondsEl.textContent) {
            secondsEl.classList.add('ticking');
            setTimeout(function() { secondsEl.classList.remove('ticking'); }, 300);
          }
        }
      }

      updateCountdown();
      setInterval(updateCountdown, 1000);
    });
  }

  /* ---------- Text Reveal Animation ---------- */
  function initTextReveal() {
    var textReveals = document.querySelectorAll('.text-reveal:not(.revealed)');

    if (!textReveals.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    textReveals.forEach(function(el) {
      observer.observe(el);
    });
  }

  /* ---------- Text Split Reveal (word by word) ---------- */
  function initTextSplitReveal() {
    var containers = document.querySelectorAll('.text-split-reveal:not(.split-initialized)');
    if (!containers.length) return;

    containers.forEach(function(container) {
      container.classList.add('split-initialized');
      var text = container.textContent.trim();
      var words = text.split(/\s+/);
      container.textContent = '';

      words.forEach(function(word, index) {
        var span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        span.style.transitionDelay = (index * 0.04) + 's';
        container.appendChild(span);
        if (index < words.length - 1) {
          container.appendChild(document.createTextNode('\u00A0'));
        }
      });
    });

    initScrollReveal();
  }

  /* ---------- Image Hover Parallax ---------- */
  function initImageHoverParallax() {
    var cards = document.querySelectorAll('[data-hover-parallax]:not(.parallax-initialized)');

    cards.forEach(function(card) {
      card.classList.add('parallax-initialized');
      var image = card.querySelector('img');
      if (!image) return;

      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;

        var moveX = (x - 0.5) * 10;
        var moveY = (y - 0.5) * 10;

        image.style.transform = 'scale(1.05) translate(' + moveX + 'px, ' + moveY + 'px)';
      });

      card.addEventListener('mouseleave', function() {
        image.style.transform = '';
      });
    });
  }

  /* ---------- Smooth Anchor Scroll ---------- */
  function initSmoothScroll() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 60;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  }

  /* ---------- Scroll Velocity Detection ---------- */
  function initScrollVelocity() {
    // Velocity tracking kept for future use, but cursor manipulation removed —
    // adding/removing 'scrolling-fast' on <body> was causing the grab cursor
    // to appear across the entire page during fast scrolls.
  }

  /* ---------- Scroll-Based Scale Effect ---------- */
  function initScrollScale() {
    var elements = document.querySelectorAll('[data-scroll-scale]:not(.scale-initialized)');
    if (!elements.length || prefersReducedMotion()) return;

    elements.forEach(function(el) {
      el.classList.add('scale-initialized');
    });

    var ticking = false;
    function updateScale() {
      var activeElements = document.querySelectorAll('[data-scroll-scale].scale-initialized');
      activeElements.forEach(function(el) {
        var rect = el.getBoundingClientRect();
        var windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
          var progress = 1 - (rect.top / windowHeight);
          var scale = 0.85 + (progress * 0.15);
          el.style.transform = 'scale(' + Math.min(scale, 1) + ')';
        }
      });
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateScale);
        ticking = true;
      }
    }, { passive: true });

    updateScale();
  }

  /* ---------- Sticky Scroll Sections ---------- */
  function initStickyScroll() {
    var sections = document.querySelectorAll('[data-sticky-scroll]:not(.sticky-initialized)');
    if (!sections.length) return;

    sections.forEach(function(section) {
      section.classList.add('sticky-initialized');
      var panels = section.querySelectorAll('.sticky-scroll__panel');
      var totalHeight = panels.length * 100;

      if (panels.length <= 1) return;

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position: relative; height: ' + totalHeight + 'vh;';

      var panelsWrapper = document.createElement('div');
      panelsWrapper.style.cssText = 'position: sticky; top: 0; height: 100vh; overflow: hidden; display: flex; align-items: center;';

      Array.from(panels).forEach(function(panel) {
        panel.style.cssText = 'position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.6s ease;';
        panelsWrapper.appendChild(panel);
      });

      section.innerHTML = '';
      wrapper.appendChild(panelsWrapper);
      section.appendChild(wrapper);

      var ticking = false;
      function updateSticky() {
        var rect = section.getBoundingClientRect();
        var scrollPercent = -rect.top / rect.height;
        var activeIndex = Math.min(Math.floor(scrollPercent * panels.length), panels.length - 1);

        Array.from(panels).forEach(function(panel, index) {
          panel.style.opacity = index === activeIndex ? '1' : '0';
          panel.style.transform = index === activeIndex ? 'translateY(0)' : 'translateY(20px)';
        });
        ticking = false;
      }

      window.addEventListener('scroll', function() {
        if (!ticking) {
          requestAnimationFrame(updateSticky);
          ticking = true;
        }
      }, { passive: true });

      if (panels.length > 0) panels[0].style.opacity = '1';
    });
  }

  /* ---------- Magnetic Buttons (cursor follow) ---------- */
  function initMagneticButtons() {
    var buttons = document.querySelectorAll('.btn-magnetic:not(.magnetic-initialized)');
    if (!buttons.length) return;

    buttons.forEach(function(btn) {
      btn.classList.add('magnetic-initialized');

      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px) scale(1.04)';
      });

      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Ripple Click Effect ---------- */
  function initRippleButtons() {
    var buttons = document.querySelectorAll('.btn-ripple:not(.ripple-initialized)');
    if (!buttons.length) return;

    buttons.forEach(function(btn) {
      btn.classList.add('ripple-initialized');

      btn.addEventListener('click', function(e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function() {
          ripple.remove();
        });
      });
    });
  }

  /* ---------- Button Loading State (data-btn-loading) ---------- */
  function initButtonLoading() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-btn-loading]');
      if (!btn) return;
      btn.classList.add('btn-loading');
    });
  }

  /* ---------- Initialize All Animations ---------- */
  function initAll() {
    initScrollProgress();
    initScrollReveal();
    initStaggerReveal();
    initParallax();
    initLayeredParallax();
    initCounters();
    initCountdowns();
    initTextReveal();
    initTextSplitReveal();
    initImageHoverParallax();
    initSmoothScroll();
    initScrollVelocity();
    initScrollScale();
    initStickyScroll();
    initMagneticButtons();
    initRippleButtons();
    initButtonLoading();
  }

  document.addEventListener('DOMContentLoaded', initAll);

  document.addEventListener('shopify:section:load', initAll);

})();
