/**
 * frete-calculator.js
 * Cálculo de frete via Google Apps Script + API oficial dos Correios.
 * Parâmetros: destination_cep + cart_weight (igual ao padrão que funciona).
 */

(function () {
  'use strict';

  // ─── Formata CEP: máscara XXXXX-XXX ──────────────────────────────────────
  function formatarCEP(valor) {
    var digits = valor.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
  }

  // ─── Valida CEP com 8 dígitos ─────────────────────────────────────────────
  function cepValido(cep) {
    return /^\d{8}$/.test(cep.replace(/\D/g, ''));
  }

  // ─── Renderiza resultados ─────────────────────────────────────────────────
  function renderResultado(container, data, mostrarPrazo) {
    container.style.display = 'block';

    if (!data.success || data.error) {
      var msg = data.error || 'Não foi possível calcular o frete para este CEP.';
      container.innerHTML =
        '<p class="frete-calc__erro">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">' +
        '<circle cx="12" cy="12" r="10"></circle>' +
        '<line x1="12" y1="8" x2="12" y2="12"></line>' +
        '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
        '</svg> ' + msg + '</p>';
      return;
    }

    var lista = data.options || data.opcoes || [];

    if (lista.length === 0) {
      container.innerHTML = '<p class="frete-calc__erro">Nenhuma opção de frete encontrada para este CEP.</p>';
      return;
    }

    var html = '<ul class="frete-calc__lista">';
    lista.forEach(function (item) {
      var nome  = item.name    || item.servico || item.nome || 'Entrega';
      var preco = item.price   !== undefined   ? item.price : item.preco;
      var prazo = item.estimated_days          || item.prazo || '';

      var prazoHtml = (mostrarPrazo && prazo)
        ? '<span class="frete-calc__prazo">' + prazo + '</span>'
        : '';

      var precoHtml;
      var precoNum = parseFloat(preco);
      if (isNaN(precoNum) || precoNum === 0 || item.gratis) {
        precoHtml = '<strong class="frete-calc__preco frete-calc__preco--gratis">Grátis</strong>';
      } else {
        var precoFormatado = (Number.isInteger(precoNum) && precoNum >= 100)
          ? 'R$ ' + (precoNum / 100).toFixed(2).replace('.', ',')
          : 'R$ ' + precoNum.toFixed(2).replace('.', ',');
        precoHtml = '<strong class="frete-calc__preco">' + precoFormatado + '</strong>';
      }

      html +=
        '<li class="frete-calc__item">' +
          '<span class="frete-calc__servico">' + nome + '</span>' +
          '<div class="frete-calc__item-right">' + prazoHtml + precoHtml + '</div>' +
        '</li>';
    });
    html += '</ul>';
    container.innerHTML = html;
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  function renderLoading(container) {
    container.style.display = 'block';
    container.innerHTML =
      '<div class="frete-calc__loading">' +
        '<span class="frete-calc__spinner"></span>' +
        '<span>Calculando...</span>' +
      '</div>';
  }

  // ─── Inicializa widget ────────────────────────────────────────────────────
  function initWidget(widget) {
    var apiUrl           = widget.getAttribute('data-api');
    var pesoGramas       = parseFloat(widget.getAttribute('data-peso') || '300');
    var pesoKg           = (pesoGramas / 1000).toFixed(3);
    var btnTextoOriginal = widget.getAttribute('data-btn-texto') || 'Calcular';
    var mostrarPrazo     = (window.freteMostrarPrazo !== false);

    var inputEl     = widget.querySelector('.frete-calc__input');
    var btnEl       = widget.querySelector('.frete-calc__btn');
    var resultadoEl = widget.querySelector('.frete-calc__resultado');

    if (!apiUrl || !apiUrl.trim()) {
      console.warn('[Frete] URL da API não configurada.');
      return;
    }
    if (!inputEl || !btnEl || !resultadoEl) return;

    console.info('[Frete] Widget iniciado. API:', apiUrl);

    // Máscara CEP
    inputEl.addEventListener('input', function () {
      var pos = inputEl.selectionStart;
      inputEl.value = formatarCEP(inputEl.value);
      try { inputEl.setSelectionRange(pos, pos); } catch (e) {}
    });

    // Enter
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); btnEl.click(); }
    });

    // Clique Calcular
    btnEl.addEventListener('click', function () {
      var cepRaw = inputEl.value.replace(/\D/g, '');

      if (!cepValido(cepRaw)) {
        resultadoEl.style.display = 'block';
        resultadoEl.innerHTML = '<p class="frete-calc__erro">Por favor, digite um CEP válido com 8 dígitos.</p>';
        inputEl.focus();
        return;
      }

      renderLoading(resultadoEl);
      btnEl.disabled    = true;
      btnEl.textContent = '...';

      // URL exatamente igual ao padrão que funciona nos outros sites
      var url = apiUrl + '?destination_cep=' + cepRaw;
      if (pesoKg > 0) {
        url += '&cart_weight=' + pesoKg;
      }

      console.info('[Frete] Chamando:', url);

      fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          console.info('[Frete] Resposta:', data);
          renderResultado(resultadoEl, data, mostrarPrazo);
        })
        .catch(function (err) {
          console.error('[Frete] Erro:', err);
          renderResultado(resultadoEl, {
            success: false,
            error: 'Não foi possível conectar ao serviço de frete. Tente novamente.'
          }, false);
        })
        .finally(function () {
          btnEl.disabled    = false;
          btnEl.textContent = btnTextoOriginal;
        });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('.frete-calc').forEach(function (w) { initWidget(w); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
