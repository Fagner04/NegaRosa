/* ==========================================================================
   Quick Add — Modal (desktop) + Drawer (mobile)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var overlay = document.getElementById('quick-add-overlay');
  var modal   = document.getElementById('quick-add-modal');
  var drawer  = document.getElementById('quick-add-drawer');

  if (!overlay || !modal || !drawer) return;

  /* ---------- State ---------- */
  var currentProduct  = null;
  var currentVariants = [];
  var selectedOptions = {};
  var isOpen          = false;
  var qaColorMap      = null;

  function parseColorMap(val) {
    var map = {};
    if (!val) return map;
    if (typeof val === 'string' && val.charAt(0) === '[') {
      try { val = JSON.parse(val); } catch (e) { val = val; }
    }
    if (Array.isArray(val)) {
      val.forEach(function (entry) {
        var parts = entry.split('#');
        if (parts.length === 2) {
          var name = parts[0].trim().replace(/:$/, '');
          var hex  = '#' + parts[1].trim();
          map[name.toLowerCase()] = hex;
        }
      });
    } else {
      String(val).split('|').forEach(function (entry) {
        var parts = entry.split('#');
        if (parts.length === 2) {
          var name = parts[0].trim().replace(/:$/, '');
          var hex  = '#' + parts[1].trim();
          map[name.toLowerCase()] = hex;
        }
      });
    }
    return map;
  }

  /* ---------- Helpers ---------- */
  function isMobile() { return window.innerWidth <= 768; }
  function getPanel()  { return isMobile() ? drawer : modal; }

  function money(val) {
    // .json returns prices as strings like "15.00", .js returns integers in cents
    var num = parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) return 'R$ 0,00';
    // If value looks like cents (integer > 100 and no decimal point in original)
    if (Number.isInteger(num) && num > 100) num = num / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function colorFromName(name) {
    var n = String(name).toLowerCase();
    if (qaColorMap && qaColorMap[n]) return qaColorMap[n];
    if (/preto|black/.test(n))           return '#111111';
    if (/branco|white/.test(n))          return '#ffffff';
    if (/azul.royal|royal.blue/.test(n)) return '#4169e1';
    if (/verm|red/.test(n))              return '#e60000';
    if (/azul|blue/.test(n))             return '#0044ff';
    if (/verde|green/.test(n))           return '#00aa33';
    if (/rosa|pink/.test(n))             return '#ff69b4';
    if (/amarelo|yellow/.test(n))        return '#f5c518';
    if (/laranja|orange/.test(n))        return '#ff6600';
    if (/cinza|grey|gray/.test(n))       return '#888888';
    if (/roxo|purple|violeta/.test(n))   return '#7b00ff';
    if (/marrom|brown/.test(n))          return '#8b4513';
    if (/bege|beige|creme|off/.test(n))  return '#f5f0dc';
    if (/vinho/.test(n))                 return '#722F37';
    return '#cccccc';
  }

  function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    return url;
  }

  function optionName(idx) {
    var opt = currentProduct.options[idx];
    return (opt && typeof opt === 'object') ? opt.name : String(opt);
  }

  function optionValues(idx) {
    var opt = currentProduct.options[idx];
    if (opt && typeof opt === 'object' && Array.isArray(opt.values)) return opt.values;
    return currentVariants
      .map(function (v) { return v.options[idx]; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function findVariant() {
    if (!currentProduct) return null;
    return currentVariants.find(function (v) {
      return v.options.every(function (opt, i) {
        return selectedOptions[optionName(i)] === opt;
      });
    }) || null;
  }

  function renderPrice(variant) {
    if (!variant) return '<span class="qa-price">—</span>';
    var price = parseFloat(String(variant.price).replace(',', '.'));
    var compare = variant.compare_at_price ? parseFloat(String(variant.compare_at_price).replace(',', '.')) : null;
    if (compare && compare > price) {
      var pct = Math.round((compare - price) / compare * 100);
      return '<span class="qa-price qa-price--sale">' + money(price) + '</span> ' +
             '<span class="qa-price--compare">' + money(compare) + '</span> ' +
             '<span class="qa-price--badge">-' + pct + '%</span>';
    }
    return '<span class="qa-price">' + money(price) + '</span>';
  }

  /* ---------- Render options (sempre bloco) ---------- */
  function renderOptions(container) {
    var html = '';
    for (var idx = 0; idx < currentProduct.options.length; idx++) {
      var name    = optionName(idx);
      var values  = optionValues(idx);
      var sel     = selectedOptions[name] || values[0];
      var isColor = /cor|color/i.test(name);

      html += '<div class="qa-option" data-option-name="' + esc(name) + '" data-option-index="' + idx + '" style="margin-bottom:16px;">';
      html += '<span class="qa-option__label">' + esc(name) + ': ' + (isColor ? '<span data-selected-label style="font-weight:400;color:#757575;text-transform:none;letter-spacing:0;">' + esc(sel) + '</span>' : '') + '</span>';
      html += '<div class="qa-size-grid" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">';
      for (var si = 0; si < values.length; si++) {
        var sval  = values[si];
        var avail = currentVariants.some(function (v) { return v.options[idx] === sval && v.available; });
        html += '<button class="qa-size-btn' + (sval === sel ? ' selected' : '') + (!avail ? ' unavailable' : '') + '" ' +
                'data-value="' + esc(sval) + '">' + esc(sval) + '</button>';
      }
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.qa-size-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wrap = btn.closest('[data-option-name]');
        var optionNameVal = wrap.dataset.optionName;
        var isColor = optionNameVal && (optionNameVal.toLowerCase().indexOf('cor') === 0 || optionNameVal.toLowerCase().indexOf('color') === 0);
        if (isColor && btn.classList.contains('unavailable')) return;

        wrap.querySelectorAll('.qa-size-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedOptions[wrap.dataset.optionName] = btn.dataset.value;
        var lbl = wrap.querySelector('[data-selected-label]');
        if (lbl) lbl.textContent = btn.dataset.value;
        syncPanel(getPanel());
        updateOptionAvailability();
        updateGalleryForVariant();
      });
    });
  }

  function updatePriceInfo(panel, variant) {
    var pe = panel.querySelector('[data-qa-price]');
    if (pe) pe.innerHTML = renderPrice(variant);

    var pixEl = panel.querySelector('[data-qa-pix]');
    var instEl = panel.querySelector('[data-qa-installments]');

    if (!variant) {
      if (pixEl) pixEl.innerHTML = '';
      if (instEl) instEl.innerHTML = '';
      return;
    }

    var priceVal = parseFloat(String(variant.price).replace(',', '.'));
    if (priceVal > 100) priceVal = priceVal / 100;

    // PIX Calculations (5% discount)
    if (pixEl) {
      var pixPriceVal = priceVal * 0.95;
      var pixFormatted = money(pixPriceVal);
      pixEl.innerHTML = '<img src="https://cdn.simpleicons.org/pix/32BCAD" width="16" height="16" alt="Pix" aria-hidden="true" style="flex-shrink:0;display:inline-block;vertical-align:middle;margin-right:6px;">' +
                        '<span>ou <strong>' + pixFormatted + '</strong> à vista no PIX (5% off)</span>';
    }

    // Installments Calculations (6x sem juros)
    if (instEl) {
      var maxParcelas = 6;
      var parcelaVal = priceVal / maxParcelas;
      var parcelaFormatted = money(parcelaVal);
      instEl.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:6px;color:var(--color-text-light);"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' +
                         '<span>ou até <strong>' + maxParcelas + 'x</strong> de <strong>' + parcelaFormatted + '</strong> <em>sem juros</em></span>';
    }
  }

  function syncPanel(panel) {
    var v = findVariant();
    updatePriceInfo(panel, v);
    setButton(panel, v);
  }

  function setButton(panel, variant) {
    var btn = panel.querySelector('.qa-add-btn');
    var textEl = btn && btn.querySelector('[data-btn-text]');
    if (!btn || !textEl) return;
    if (variant && variant.available) {
      btn.disabled = false;
      btn.dataset.variantId = variant.id;
      textEl.textContent = 'Adicionar à Sacola';
    } else {
      btn.disabled = true;
      btn.dataset.variantId = '';
      textEl.textContent = variant ? 'Esgotado' : '—';
    }
  }

  function updateOptionAvailability() {
    var panels = [modal, drawer];
    panels.forEach(function (panel) {
      panel.querySelectorAll('[data-option-index]').forEach(function (wrap) {
        var idx = parseInt(wrap.dataset.optionIndex, 10);
        wrap.querySelectorAll('.qa-size-btn').forEach(function (btn) {
          var val = btn.dataset.value;
          var avail = currentVariants.some(function (v) {
            for (var oi = 0; oi < currentProduct.options.length; oi++) {
              if (oi === idx) continue;
              var sel = selectedOptions[optionName(oi)];
              if (sel != null && v.options[oi] !== sel) return false;
            }
            return v.options[idx] === val && v.available;
          });
          btn.classList.toggle('unavailable', !avail);
        });
      });
    });
  }

  function populatePanel(panel, product) {
    var variant = findVariant() || currentVariants[0];
    var t = panel.querySelector('[data-qa-type]');    if (t) t.textContent = product.type || '';
    var ti = panel.querySelector('[data-qa-title]');  if (ti) ti.textContent = product.title;
    
    updatePriceInfo(panel, variant);
    
    var oe = panel.querySelector('[data-qa-options]'); if (oe) renderOptions(oe);
    setButton(panel, variant);
    var thumb = panel.querySelector('[data-qa-thumb]');
    if (thumb && product.images && product.images[0]) {
      var thumbImg = product.images[0];
      var thumbSrc = typeof thumbImg === 'string' ? thumbImg : (thumbImg.src || thumbImg.url || '');
      thumb.src = fixUrl(thumbSrc);
      thumb.alt = product.title;
    }
  }

  /* ---------- Update gallery image when color changes ---------- */
  function updateGalleryForVariant() {
    if (isMobile()) return; // drawer doesn't have a gallery
    var variant = findVariant();
    if (!variant || !currentProduct) return;

    var mainImg = modal.querySelector('[data-qa-main-image]');
    if (!mainImg) return;

    var images = currentProduct.images || [];
    var targetImage = null;

    // 1. Try variant's own featured image first
    if (variant.featured_image) {
      targetImage = typeof variant.featured_image === 'string' ? variant.featured_image : (variant.featured_image.src || variant.featured_image.url);
    }

    // 2. Fallback to image linked via image_id
    if (!targetImage && variant.image_id) {
      var matchedImg = images.find(function (img) {
        return (typeof img === 'object' && img !== null) ? img.id === variant.image_id : false;
      });
      if (matchedImg) {
        targetImage = typeof matchedImg === 'string' ? matchedImg : (matchedImg.src || matchedImg.url);
      }
    }

    // 3. Fallback to variant_ids matching
    if (!targetImage) {
      var matchedImg = images.find(function (img) {
        return (typeof img === 'object' && img !== null && img.variant_ids) ? img.variant_ids.indexOf(variant.id) !== -1 : false;
      });
      if (matchedImg) {
        targetImage = typeof matchedImg === 'string' ? matchedImg : (matchedImg.src || matchedImg.url);
      }
    }

    // 4. Default to first image
    if (!targetImage && images.length > 0) {
      targetImage = typeof images[0] === 'string' ? images[0] : (images[0].src || images[0].url);
    }

    if (targetImage) {
      var src = fixUrl(targetImage);
      mainImg.style.opacity = '0';
      setTimeout(function () {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 150);

      var prev = modal.querySelector('[data-qa-prev]');
      var next = modal.querySelector('[data-qa-next]');
      var imgIndex = images.findIndex(function (img) {
        var imgUrl = typeof img === 'string' ? img : (img.src || img.url || '');
        return fixUrl(imgUrl) === src;
      });
      currentImgIdx = imgIndex >= 0 ? imgIndex : 0;
      if (prev) prev.disabled = currentImgIdx === 0;
      if (next) next.disabled = currentImgIdx === images.length - 1;

      var dots = modal.querySelectorAll('.quick-add-modal__thumb-dot');
      dots.forEach(function (d, i) { d.classList.toggle('active', i === currentImgIdx); });
    }
  }

  var galleryImages = [];
  var currentImgIdx = 0;

  function showImage(idx, images) {
    if (idx < 0 || idx >= images.length) return;
    currentImgIdx = idx;
    var img  = modal.querySelector('[data-qa-main-image]');
    var dots = modal.querySelector('[data-qa-dots]');
    var prev = modal.querySelector('[data-qa-prev]');
    var next = modal.querySelector('[data-qa-next]');
    if (!img) return;
    img.style.opacity = '0';
    var imgUrl = typeof images[idx] === 'string' ? images[idx] : (images[idx].src || images[idx].url || '');
    setTimeout(function () { img.src = fixUrl(imgUrl); img.style.opacity = '1'; }, 150);
    if (dots) dots.querySelectorAll('.quick-add-modal__thumb-dot').forEach(function (d, di) { d.classList.toggle('active', di === idx); });
    if (prev) prev.disabled = idx === 0;
    if (next) next.disabled = idx === images.length - 1;
  }

  function populateGallery(images) {
    galleryImages = images;
    currentImgIdx = 0;
    var img  = modal.querySelector('[data-qa-main-image]');
    var dots = modal.querySelector('[data-qa-dots]');
    var prev = modal.querySelector('[data-qa-prev]');
    var next = modal.querySelector('[data-qa-next]');
    if (!img || !images.length) return;
    var mainSrc = typeof images[0] === 'string' ? images[0] : (images[0].src || images[0].url || '');
    img.src = fixUrl(mainSrc);
    img.style.opacity = '1';
    img.alt = currentProduct ? currentProduct.title : '';

    if (prev) { prev.disabled = true; prev.onclick = function (e) { e.stopPropagation(); showImage(currentImgIdx - 1, galleryImages); }; }
    if (next) { next.disabled = images.length <= 1; next.onclick = function (e) { e.stopPropagation(); showImage(currentImgIdx + 1, galleryImages); }; }

    if (!dots) return;
    dots.innerHTML = '';
    if (images.length > 1) {
      images.slice(0, 6).forEach(function (image, i) {
        var dot = document.createElement('button');
        dot.className = 'quick-add-modal__thumb-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Imagem ' + (i + 1));
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          showImage(i, galleryImages);
        });
        dots.appendChild(dot);
      });
    }
  }

  /* ---------- Open ---------- */
  function openQuickAdd(handle) {
    isOpen = true;
    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    var panel = getPanel();
    var ti = panel.querySelector('[data-qa-title]'); if (ti) ti.textContent = 'Carregando…';
    var pe = panel.querySelector('[data-qa-price]');  if (pe) pe.innerHTML = '';
    var oe = panel.querySelector('[data-qa-options]'); if (oe) oe.innerHTML = '';

    if (!isMobile()) {
      var mi = modal.querySelector('[data-qa-main-image]'); if (mi) mi.src = '';
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    } else {
      /* Force display:block first, then next frame add .active so transform transitions */
      drawer.style.display = 'block';
      drawer.setAttribute('aria-hidden', 'false');
      // eslint-disable-next-line no-unused-expressions
      drawer.offsetHeight; /* force reflow */
      requestAnimationFrame(function () { drawer.classList.add('active'); });
    }

    fetch('/products/' + handle + '.js')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var product     = data.product || data;
        currentProduct  = product;
        currentVariants = product.variants || [];

        console.log('[QuickAdd] Product:', product.title, 'Options:', JSON.stringify(product.options), 'Variants:', product.variants ? product.variants.length : 0);
        currentVariants.forEach(function (v) {
          if (v.available === undefined) {
            v.available = (v.inventory_management == null || v.inventory_management === '') || v.inventory_policy === 'continue' || Number(v.inventory_quantity) > 0;
          }
          console.log('[QuickAdd] Variant:', v.id, v.title, 'options:', v.options ? JSON.stringify(v.options) : JSON.stringify([v.option1, v.option2, v.option3]), 'mgmt:', v.inventory_management, 'policy:', v.inventory_policy, 'qty:', v.inventory_quantity, 'available:', v.available);
          if (!Array.isArray(v.options)) {
            var opts = [v.option1, v.option2, v.option3];
            v.options = [];
            for (var oi = 0; oi < currentProduct.options.length; oi++) {
              v.options.push(opts[oi] != null ? opts[oi] : '');
            }
          }
        });

        selectedOptions = {};

        var first = currentVariants[0];
        if (first) {
          for (var i = 0; i < currentProduct.options.length; i++) {
            selectedOptions[optionName(i)] = first.options[i];
          }
        }

        var images = product.images || [];
        if (!isMobile()) { populateGallery(images); populatePanel(modal, product); }
        else              { populatePanel(drawer, product); }
        updateOptionAvailability();
      })
      .catch(function (err) { console.error('[QuickAdd]', err); });
  }

  /* ---------- Close ---------- */
  function closeQuickAdd() {
    isOpen = false;
    overlay.classList.remove('active');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    /* clear inline display after slide-out finishes so CSS default (none) takes over */
    setTimeout(function () { if (!isOpen) drawer.style.display = ''; }, 400);
    document.body.classList.remove('modal-open');
    currentProduct = null;
    selectedOptions = {};
    qaColorMap = null;
  }

  /* ---------- Add to cart ---------- */
  function handleAddToCart(btn) {
    var variantId = parseInt(btn.dataset.variantId, 10);
    if (!variantId) return;
    var panel    = btn.closest('#quick-add-modal') || btn.closest('#quick-add-drawer');
    var qtyInput = panel ? panel.querySelector('.qa-qty__input') : null;
    var qty      = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
    var textEl   = btn.querySelector('[data-btn-text]');
    var origText = textEl.textContent;
    btn.classList.add('loading'); btn.disabled = true; textEl.textContent = '';
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: variantId, quantity: qty }] })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      btn.classList.remove('loading');
      if (data.status) { btn.disabled = false; textEl.textContent = data.description || 'Erro'; return; }
      btn.classList.add('success'); textEl.textContent = 'Adicionado ✓';
      updateCartCount();
      setTimeout(function () { btn.classList.remove('success'); btn.disabled = false; textEl.textContent = origText; closeQuickAdd(); }, 1200);
    })
    .catch(function () { btn.classList.remove('loading'); btn.disabled = false; textEl.textContent = 'Erro'; });
  }

  function updateCartCount() {
    fetch('/cart.js').then(function (r) { return r.json(); }).then(function (cart) {
      document.querySelectorAll('.header__cart-count').forEach(function (el) {
        el.textContent = cart.item_count;
        el.style.display = cart.item_count > 0 ? 'flex' : 'none';
      });
    });
  }

  /* ---------- Qty ---------- */
  [modal, drawer].forEach(function (panel) {
    var input = panel.querySelector('.qa-qty__input');
    var minus = panel.querySelector('[data-qa-qty-minus]');
    var plus  = panel.querySelector('[data-qa-qty-plus]');
    if (minus && input) minus.addEventListener('click', function (e) { e.stopPropagation(); var v = parseInt(input.value)||1; if(v>1) input.value=v-1; });
    if (plus  && input) plus.addEventListener('click',  function (e) { e.stopPropagation(); var v = parseInt(input.value)||1; input.value=v+1; });
  });

  /* ---------- Clicks INSIDE modal/drawer — stop propagation ---------- */
  modal.addEventListener('click', function (e) {
    e.stopPropagation();
    if (e.target.closest('#quick-add-modal-close')) { closeQuickAdd(); return; }
    var btn = e.target.closest('.qa-add-btn');
    if (btn && !btn.disabled) handleAddToCart(btn);
  });

  drawer.addEventListener('click', function (e) {
    e.stopPropagation();
    var btn = e.target.closest('.qa-add-btn');
    if (btn && !btn.disabled) handleAddToCart(btn);
  });

  /* ---------- Clicks OUTSIDE — document listener ---------- */
  document.addEventListener('click', function (e) {
    /* Open quick-add */
    var qaBtn = e.target.closest('.product-card__quick-add');
    if (qaBtn) {
      e.preventDefault();
      e.stopPropagation();
      var handle = qaBtn.dataset.productHandle;
      qaColorMap = parseColorMap(qaBtn.dataset.colorMap);
      if (handle) openQuickAdd(handle);
      return;
    }

    /* Close on overlay click */
    if (isOpen && e.target === overlay) {
      closeQuickAdd();
    }
  });

  /* Escape */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) closeQuickAdd(); });

  /* Swipe down to close drawer */
  var ty = 0, tx = 0;
  drawer.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
  drawer.addEventListener('touchend',   function (e) {
    var dy = e.changedTouches[0].clientY - ty;
    var dx = Math.abs(e.changedTouches[0].clientX - tx);
    if (dy > 80 && dx < 40) closeQuickAdd();
  }, { passive: true });

});
