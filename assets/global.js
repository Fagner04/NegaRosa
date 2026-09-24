/* ==========================================================================
   ConectWhats - Global JavaScript
   Sticky header, mobile menu, search overlay, cart drawer, smooth scroll
   ========================================================================== */

(function() {
  'use strict';

  /* ---------- Fixed Header: hide on scroll down, show on scroll up ---------- */
  const fixedTop = document.querySelector('.fixed-top');
  const headerSpacer = document.querySelector('.header-spacer');
  let lastScrollY = 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 50;

  // Set spacer height to match the actual fixed-top height
  function updateSpacerHeight() {
    if (fixedTop && headerSpacer) {
      const height = fixedTop.offsetHeight;
      headerSpacer.style.height = height + 'px';
    }
  }

  // Update on load and on resize
  updateSpacerHeight();
  window.addEventListener('resize', updateSpacerHeight);

  function updateHeader() {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;

    // Add scrolled class for background blur on header
    const header = document.querySelector('.header');
    if (header) {
      if (currentScrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Hide/show fixed-top based on scroll direction
    if (fixedTop) {
      if (currentScrollY > SCROLL_THRESHOLD) {
        if (scrollingDown) {
          fixedTop.classList.add('hidden');
        } else {
          fixedTop.classList.remove('hidden');
        }
      } else {
        fixedTop.classList.remove('hidden');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  /* ---------- Mobile Menu ---------- */
  const menuBtn = document.querySelector('.header__menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuClose = document.querySelector('.mobile-menu__close');
  const overlay = document.getElementById('overlay');

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    document.body.classList.add('menu-open');
    menuBtn?.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }

  menuBtn?.addEventListener('click', function() {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuClose?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  // Mobile category accordion — delegated so it still works after Shopify section refreshes
  document.addEventListener('click', function(e) {
    const toggle = e.target.closest?.('.mobile-menu__toggle');
    if (!toggle) return;

    e.preventDefault();
    const group = toggle.closest('.mobile-menu__group');
    if (!group) return;

    const isOpen = group.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMenu();
      closeSearch();
    }
  });

  /* ---------- Search Overlay ---------- */
  const searchBtn = document.querySelector('.header__search-btn');
  const searchContainer = document.querySelector('.header__search');
  const searchInput = document.querySelector('.header__search-input');

  function openSearch() {
    if (!searchContainer) return;
    searchContainer.classList.add('active');
    searchInput?.focus();
  }

  function closeSearch() {
    if (!searchContainer) return;
    searchContainer.classList.remove('active');
    if (searchInput) searchInput.value = '';
  }

  searchBtn?.addEventListener('click', function(e) {
    if (searchContainer.classList.contains('active')) {
      if (searchInput && searchInput.value.trim() !== '') {
        // Allow form submission (do not call preventDefault)
      } else {
        e.preventDefault();
        closeSearch();
      }
    } else {
      e.preventDefault();
      openSearch();
    }
  });

  // Close search on click outside
  document.addEventListener('click', function(e) {
    if (searchContainer && !searchContainer.contains(e.target)) {
      closeSearch();
    }
  });

  /* ---------- Mega Menu (Desktop) ---------- */
  const navItems = document.querySelectorAll('.header__nav-item[data-mega-menu]');

  navItems.forEach(function(item) {
    const megaMenu = item.querySelector('.mega-menu');
    if (!megaMenu) return;

    let timeout;

    item.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
      // Close other mega menus
      document.querySelectorAll('.mega-menu.active').forEach(function(menu) {
        if (menu !== megaMenu) menu.classList.remove('active');
      });
      megaMenu.classList.add('active');
    });

    item.addEventListener('mouseleave', function() {
      timeout = setTimeout(function() {
        megaMenu.classList.remove('active');
      }, 150);
    });
  });



  /* ---------- Footer Accordion (Mobile) ---------- */
  const footerToggles = document.querySelectorAll('.footer__accordion-toggle');

  footerToggles.forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      const column = this.closest('.footer__column');
      const links = column ? column.querySelector('.footer__links') : null;
      if (!links) return;
      const isOpen = links.classList.contains('open');

      footerToggles.forEach(function(otherToggle) {
        const otherColumn = otherToggle.closest('.footer__column');
        const otherLinks = otherColumn ? otherColumn.querySelector('.footer__links') : null;
        otherToggle.classList.remove('active');
        if (otherLinks) otherLinks.classList.remove('open');
      });

      if (!isOpen) {
        this.classList.add('active');
        links.classList.add('open');
      }
    });
  });

  /* ---------- Smooth Scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- Lazy Loading Images ---------- */
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px'
    });

    lazyImages.forEach(function(img) {
      imageObserver.observe(img);
    });
  }

  /* ---------- Add to Cart (AJAX) ---------- */
  window.addToCart = function(variantId, quantity) {
    quantity = quantity || 1;

    return fetch(window.routes.cart_add_url + '.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: variantId,
          quantity: quantity
        }]
      })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      // Update cart count
      updateCartCount();
      return data;
    })
    .catch(function(error) {
      console.error('Error adding to cart:', error);
      throw error;
    });
  };

  function updateCartCount() {
    fetch(window.routes.cart_url + '.js')
      .then(function(response) { return response.json(); })
      .then(function(cart) {
        const countEls = document.querySelectorAll('.header__cart-count');
        countEls.forEach(function(el) {
          el.textContent = cart.item_count;
          el.style.display = cart.item_count > 0 ? 'flex' : 'none';
        });
      });
  }

  /* ---------- Color Swatch → Image Swap on Product Card ---------- */
  const swatchCss = document.createElement('style');
  swatchCss.textContent =
    '.product-card__swatches{display:flex;gap:4px;padding:6px 8px;position:absolute;bottom:0;left:0;right:0;z-index:3;background:linear-gradient(transparent,rgba(0,0,0,.45));pointer-events:none}' +
    '.product-card__swatches .swatch-item{pointer-events:auto;cursor:pointer}' +
    '.swatch-radio{position:absolute;opacity:0;width:0;height:0}' +
    '.swatch-color{display:block;width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.7);transition:border-color .2s,transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}' +
    '.swatch-radio:checked+.swatch-color,.swatch-color:hover{border-color:#fff;transform:scale(1.15)}' +
    '.swatch-radio:focus-visible+.swatch-color{outline:2px solid var(--color-primary,#fe7e41);outline-offset:2px}';
  document.head.appendChild(swatchCss);

  document.addEventListener('change', function(e) {
    var radio = e.target.closest('.swatch-radio');
    if (!radio) return;
    var card = radio.closest('[data-product-handle]');
    if (!card) card = radio.closest('.product-card');
    if (!card) return;
    var img = card.querySelector('.product-card__image--primary');
    if (!img) return;
    var imgUrl = radio.getAttribute('data-variant-image');
    if (imgUrl) img.src = imgUrl;
  });

})();
