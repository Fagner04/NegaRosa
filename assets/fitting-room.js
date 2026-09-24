/* Fitting Room — bolinhas + modal Stories + drag & snap */
(function () {
  var FRConfig = window.__FRConfig;
  if (!FRConfig || !FRConfig.videos || !FRConfig.videos.length) return;

  var videos = FRConfig.videos;

  /* ── Bolinhas sobre a galeria ── */
  var galleryMain = document.querySelector('.product-gallery__main');
  if (galleryMain) {
    galleryMain.style.position = 'relative';
    var bubblesWrap = document.createElement('div');
    bubblesWrap.className = 'fr-bubbles';
    galleryMain.appendChild(bubblesWrap);

    // Apenas UMA bolinha que abre o carrossel inteiro a partir do primeiro vídeo
    (function () {
      var src = videos[0];
      var btn = document.createElement('button');
      btn.className = 'fr-bubble';
      btn.setAttribute('aria-label', 'Abrir provador virtual');

      var previewVid = document.createElement('video');
      previewVid.src = src; previewVid.muted = true; previewVid.loop = true;
      previewVid.playsInline = true; previewVid.autoplay = true; previewVid.preload = 'metadata';
      btn.appendChild(previewVid);

      var playIcon = document.createElement('div');
      playIcon.className = 'fr-bubble__play';
      playIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>';
      btn.appendChild(playIcon);

      btn.addEventListener('click', function () { openModal(0); });
      bubblesWrap.appendChild(btn);
    })();
  }

  /* ── Modal Stories ── */
  var modal    = document.getElementById('FRModal');
  var backdrop = document.getElementById('FRBackdrop');
  var wrap     = modal ? modal.querySelector('.fr-modal__wrap') : null;
  var videoEl  = document.getElementById('FRVideo');
  var closeBtn = document.getElementById('FRClose');
  var muteBtn  = document.getElementById('FRMute');
  var muteIcon = document.getElementById('FRMuteIcon');
  var tapPrev  = document.getElementById('FRTapPrev');
  var tapNext  = document.getElementById('FRTapNext');
  var barsWrap = document.getElementById('FRBars');
  if (!modal || !wrap || !videoEl) return;
  // Move modal para o <body> para escapar de containers com transform/overflow
  // que quebram o position:fixed (modal aparecia no canto da galeria)
  if (modal.parentNode !== document.body) document.body.appendChild(modal);

  var currentIdx = 0, isMuted = true;

  var bars = videos.map(function () {
    var bar = document.createElement('div'); bar.className = 'fr-modal__bar';
    var f   = document.createElement('div'); f.className   = 'fr-modal__bar-fill';
    bar.appendChild(f); barsWrap.appendChild(bar); return f;
  });

  function resetBars(upTo) {
    bars.forEach(function (b, i) {
      b.classList.remove('playing', 'done');
      b.style.animation = 'none'; b.offsetHeight;
      if (i < upTo) b.classList.add('done');
    });
  }

  function playBar(idx) {
    var f = bars[idx];
    f.style.removeProperty('animation');
    f.style.setProperty('--fr-duration', (videoEl.duration || 10) + 's');
    f.classList.add('playing');
    f.addEventListener('animationend', function onEnd() {
      f.removeEventListener('animationend', onEnd);
      f.classList.remove('playing'); f.classList.add('done');
      if (idx < videos.length - 1) loadVideo(idx + 1); else closeModal();
    });
  }

  var products = (FRConfig.products && FRConfig.products.length) ? FRConfig.products : null;

  function getMonogram(title) {
    if (!title) return '';
    return title.trim().substring(0, 2).toUpperCase();
  }

  function updateFooter(idx) {
    if (!products || !products.length) return;

    // Mostra sempre os mesmos produtos (independente do vídeo atual)
    // até 2 cards
    var toShow = products.slice(0, 2);

    toShow.forEach(function (p, i) {
      var card      = document.getElementById('FRCard' + i);
      var cardImg   = document.getElementById('FRCardImg' + i);
      var cardMonogram = document.getElementById('FRCardMonogram' + i);
      var cardTitle = document.getElementById('FRCardTitle' + i);
      var cardPrice = document.getElementById('FRCardPrice' + i);
      if (!card) return;
      card.href            = p.url || '#';
      card.style.display   = 'flex';
      if (cardTitle) cardTitle.textContent = p.title || '';
      if (cardPrice) cardPrice.textContent = p.price || '';

      if (p.image) {
        if (cardImg) {
          cardImg.src = p.image;
          cardImg.alt = p.title || '';
          cardImg.style.display = 'block';
        }
        if (cardMonogram) {
          cardMonogram.style.display = 'none';
        }
      } else {
        if (cardImg) {
          cardImg.style.display = 'none';
        }
        if (cardMonogram) {
          cardMonogram.textContent = getMonogram(p.title);
          cardMonogram.style.display = 'flex';
        }
      }
    });

    // Esconde card 2 se só tiver 1 produto
    if (toShow.length < 2) {
      var card1 = document.getElementById('FRCard1');
      if (card1) card1.style.display = 'none';
    }
  }

  function loadVideo(idx) {
    currentIdx = idx;
    videoEl.src = videos[idx]; videoEl.muted = isMuted; videoEl.load();
    resetBars(idx);
    updateFooter(idx);
    videoEl.addEventListener('loadedmetadata', function onMeta() {
      videoEl.removeEventListener('loadedmetadata', onMeta);
      bars[idx].style.setProperty('--fr-duration', videoEl.duration + 's');
      videoEl.play().catch(function () {});
      playBar(idx);
    });
    if (tapPrev) { tapPrev.style.opacity = idx === 0 ? '0' : '1'; tapPrev.style.pointerEvents = idx === 0 ? 'none' : 'auto'; }
  }

  function openModal(idx) {
    modal.removeAttribute('hidden'); wrap.classList.remove('closing');
    document.body.style.overflow = 'hidden'; loadVideo(idx);
    if (bubblesWrap) bubblesWrap.style.display = 'none';
  }

  function closeModal() {
    wrap.classList.add('closing');
    wrap.addEventListener('animationend', function onEnd() {
      wrap.removeEventListener('animationend', onEnd);
      modal.setAttribute('hidden', ''); wrap.classList.remove('closing');
      document.body.style.overflow = '';
      videoEl.pause(); videoEl.src = ''; resetBars(0);
      if (bubblesWrap) bubblesWrap.style.display = 'flex';
    });
  }

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  if (tapPrev) tapPrev.addEventListener('click', function () { if (currentIdx > 0) loadVideo(currentIdx - 1); });
  if (tapNext) tapNext.addEventListener('click', function () { if (currentIdx < videos.length - 1) loadVideo(currentIdx + 1); else closeModal(); });

  document.addEventListener('keydown', function (e) {
    if (!modal.hasAttribute('hidden')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && currentIdx > 0) loadVideo(currentIdx - 1);
      if (e.key === 'ArrowRight' && currentIdx < videos.length - 1) loadVideo(currentIdx + 1);
    }
  });

  var muteOnSVG  = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  var muteOffSVG = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  if (muteBtn) muteBtn.addEventListener('click', function () {
    isMuted = !isMuted; videoEl.muted = isMuted;
    if (muteIcon) muteIcon.innerHTML = isMuted ? muteOnSVG : muteOffSVG;
  });

  var touchY0 = 0;
  wrap.addEventListener('touchstart', function (e) { touchY0 = e.touches[0].clientY; }, { passive: true });
  wrap.addEventListener('touchend',   function (e) { if (e.changedTouches[0].clientY - touchY0 > 80) closeModal(); });

  /* ── Drag-to-scroll horizontal nos cards do rodapé (mouse) ── */
  var footerCards = document.getElementById('FRFooterCards');
  if (footerCards) {
    var isDragging = false, startX = 0, scrollStart = 0, dragMoved = false;

    footerCards.addEventListener('mousedown', function (e) {
      isDragging = true;
      dragMoved = false;
      startX = e.pageX - footerCards.offsetLeft;
      scrollStart = footerCards.scrollLeft;
      footerCards.style.cursor = 'grabbing';
      footerCards.style.userSelect = 'none';
      e.preventDefault();
    });

    footerCards.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var x = e.pageX - footerCards.offsetLeft;
      var walk = x - startX;
      if (Math.abs(walk) > 5) dragMoved = true;
      footerCards.scrollLeft = scrollStart - walk;
    });

    function stopDrag() {
      if (!isDragging) return;
      isDragging = false;
      footerCards.style.cursor = 'grab';
      footerCards.style.removeProperty('user-select');
    }

    footerCards.addEventListener('mouseup', stopDrag);
    footerCards.addEventListener('mouseleave', stopDrag);

    /* Impede navegação do link se arrastou */
    footerCards.addEventListener('click', function (e) {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);

    footerCards.style.cursor = 'grab';

    /* ── Efeito de transição ativa com IntersectionObserver ── */
    if (window.IntersectionObserver) {
      var observerOptions = {
        root: footerCards,
        threshold: 0.6
      };

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-active');
          } else {
            entry.target.classList.remove('is-active');
          }
        });
      }, observerOptions);

      var cards = footerCards.querySelectorAll('.fr-modal__footer-card');
      cards.forEach(function (card) {
        observer.observe(card);
      });
    } else {
      // Fallback para navegadores sem suporte
      var cards = footerCards.querySelectorAll('.fr-modal__footer-card');
      cards.forEach(function (card) {
        card.classList.add('is-active');
      });
    }
  }
})();
