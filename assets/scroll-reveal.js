/* ==========================================================================
   Scroll Reveal — Observa elementos e revela suavemente ao entrar na viewport.
   Ao sair, remove a classe para reanimar quando voltar (scroll para cima).
   ========================================================================== */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Marca todos como visíveis imediatamente
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll(
        '[data-reveal], .product-card, .snippet-card, .trending__item, .drops-card, .lookbook__item, .category-card, .trust-badges__item, .about-us__content, .newsletter__inner, .featured-collection__grid > *, .category-grid__item, .shopify-section > .section, .shopify-section > section'
      ).forEach(function (el) { el.classList.add('is-visible'); });
    });
    return;
  }

  var SELECTOR = [
    '[data-reveal]',
    '.product-card',
    '.snippet-card',
    '.trending__item',
    '.drops-card',
    '.lookbook__item',
    '.category-card',
    '.trust-badges__item',
    '.about-us__content',
    '.newsletter__inner',
    '.featured-collection__grid > *',
    '.category-grid__item'
  ].join(',');

  // Elementos excluídos (fixed / critical / acima da dobra)
  var EXCLUDE = '.header, .fixed-top, .top-bar, .announcement-bar, .mobile-menu, .back-to-top, .social-proof-container, .zap-widget, .hero-banner, .hero, .hero-slider, [data-no-reveal]';

  function shouldSkip(el) {
    if (!el) return true;
    if (el.matches && el.matches(EXCLUDE)) return true;
    if (el.closest && el.closest('[data-no-reveal]')) return true;
    return false;
  }

  var observer;
  function init() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(SELECTOR).forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.08) {
          // Revela uma única vez e para de observar: evita re-animar
          // (o card "subia para dentro") ao rolar com o mouse em cima
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: [0, 0.1, 0.25]
    });

    document.querySelectorAll(SELECTOR).forEach(function (el) {
      if (shouldSkip(el)) {
        el.classList.add('is-visible');
        return;
      }
      observer.observe(el);
    });
  }

  // Re-observa quando novas seções são carregadas (theme editor / AJAX)
  function refresh() {
    if (!observer) return;
    document.querySelectorAll(SELECTOR).forEach(function (el) {
      if (shouldSkip(el)) { el.classList.add('is-visible'); return; }
      if (!el.dataset.__revealed) {
        observer.observe(el);
        el.dataset.__revealed = '1';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('shopify:section:select', refresh);
  window.addEventListener('load', refresh);
})();
