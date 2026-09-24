# 📦 Cálculo de Frete via Google Sheets — Instruções Completas

Este guia explica como configurar o cálculo de frete usando o Google Sheets como
banco de dados e o Google Apps Script como API.

---

## Como funciona

```
Loja Shopify → frete-calculator.js → Google Apps Script → Google Sheets (tabela de CEPs/fretes)
                                                         ↘ API dos Correios (opcional)
```

O widget lê o CEP do cliente, envia para o seu Apps Script, que consulta
sua planilha (e/ou os Correios) e retorna as opções de frete em JSON.

---

## PASSO 1 — Criar a Planilha Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma nova planilha.
2. Renomeie a aba para **`Fretes`**.
3. Adicione os cabeçalhos na linha 1 exatamente assim:

| A          | B         | C        | D       | E               |
|------------|-----------|----------|---------|-----------------|
| CEP_INICIO | CEP_FIM   | SERVICO  | PRECO   | PRAZO           |
| 01000000   | 09999999  | PAC      | 1990    | 7               |
| 01000000   | 09999999  | SEDEX    | 3490    | 2               |
| 10000000   | 19999999  | PAC      | 2490    | 10              |
| 10000000   | 19999999  | SEDEX    | 4290    | 3               |
| 00000000   | 99999999  | PAC      | 3990    | 15              |
| 00000000   | 99999999  | SEDEX    | 6990    | 5               |

**Dicas:**
- `CEP_INICIO` e `CEP_FIM` definem a faixa de CEPs (somente números, 8 dígitos)
- `PRECO` em centavos (ex: `1990` = R$19,90). Use `0` para frete grátis.
- `PRAZO` em dias úteis
- Coloque faixas mais específicas nas primeiras linhas (têm prioridade)
- A última linha com `00000000`/`99999999` funciona como fallback (qualquer CEP)

---

## PASSO 2 — Criar o Google Apps Script

1. Na planilha, clique em **Extensões → Apps Script**
2. Apague o código existente e cole o código abaixo:

```javascript
// ============================================================
// Google Apps Script — API de Cálculo de Frete (VERSÃO CORRIGIDA)
// Cole este código em Extensões > Apps Script da sua planilha
// ============================================================

var NOME_ABA = 'Fretes'; // Nome da aba na planilha

function doGet(e) {
  // Adiciona headers CORS para permitir acesso da loja
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // Lê parâmetros — garante que e.parameter existe
  var params = (e && e.parameter) ? e.parameter : {};
  
  // Lê o CEP e remove qualquer caractere não numérico
  var cep = String(params.cep || params.CEP || '').replace(/\D/g, '');
  var peso  = parseInt(params.peso  || '300', 10);
  var valor = parseInt(params.valor || '0',   10);

  // Log para debug no Apps Script
  Logger.log('CEP recebido: ' + cep);
  Logger.log('Params: ' + JSON.stringify(params));

  // Validação
  if (!cep || cep.length !== 8) {
    var respErro = JSON.stringify({
      success: false,
      error: 'CEP inválido. Recebido: "' + cep + '" (deve ter 8 dígitos)'
    });

    // Suporte a JSONP (callback)
    if (params.callback) {
      output.setContent(params.callback + '(' + respErro + ')');
    } else {
      output.setContent(respErro);
    }
    return output;
  }

  try {
    var resultado = calcularFrete(cep, peso, valor);
    var json = JSON.stringify(resultado);

    // Suporte a JSONP
    if (params.callback) {
      output.setContent(params.callback + '(' + json + ')');
    } else {
      output.setContent(json);
    }
  } catch (err) {
    Logger.log('Erro: ' + err.message);
    var respErro2 = JSON.stringify({ success: false, error: 'Erro interno: ' + err.message });
    if (params.callback) {
      output.setContent(params.callback + '(' + respErro2 + ')');
    } else {
      output.setContent(respErro2);
    }
  }

  return output;
}

function calcularFrete(cep, peso, valorPedido) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(NOME_ABA);

  if (!aba) {
    throw new Error('Aba "' + NOME_ABA + '" não encontrada na planilha.');
  }

  var dados  = aba.getDataRange().getValues();
  var cepNum = parseInt(cep, 10);
  var opcoes = [];

  // Itera pelas linhas (pula cabeçalho na linha 0)
  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0] && !linha[1]) continue;

    var cepInicio = parseInt(String(linha[0]).replace(/\D/g, ''), 10);
    var cepFim    = parseInt(String(linha[1]).replace(/\D/g, ''), 10);
    var servico   = String(linha[2] || '').trim();
    var preco     = parseInt(String(linha[3] || '0').replace(/\D/g, ''), 10);
    var prazo     = parseInt(String(linha[4] || '0'), 10);

    if (!servico) continue;

    if (cepNum >= cepInicio && cepNum <= cepFim) {
      // Frete grátis por valor mínimo (coluna F, opcional)
      var valorMinimoGratis = linha[5]
        ? parseInt(String(linha[5]).replace(/\D/g, ''), 10)
        : 0;

      if (valorMinimoGratis > 0 && valorPedido >= valorMinimoGratis) {
        preco = 0;
      }

      opcoes.push({
        servico: servico,
        preco:   preco,
        prazo:   prazo,
        gratis:  (preco === 0)
      });
    }
  }

  if (opcoes.length === 0) {
    return {
      success: false,
      error: 'Nenhuma opção de frete encontrada para o CEP ' + cep + '.'
    };
  }

  // Ordena: grátis primeiro, depois por preço
  opcoes.sort(function (a, b) {
    if (a.preco === 0 && b.preco !== 0) return -1;
    if (b.preco === 0 && a.preco !== 0) return 1;
    return a.preco - b.preco;
  });

  return { success: true, opcoes: opcoes };
}
```

3. Salve o arquivo (Ctrl+S) com o nome **FreteAPI**.

---

## PASSO 3 — Publicar como Web App

1. Clique em **Implantar → Nova implantação**
2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecionar tipo" → escolha **Aplicativo da Web**
3. Configure:
   - **Descrição:** API de Frete
   - **Executar como:** Eu (seu e-mail)
   - **Quem tem acesso:** **Qualquer pessoa** ⚠️ (necessário para a loja acessar)
4. Clique em **Implantar**
5. **Autorize o acesso** quando solicitado (clique em "Autorizar acesso" → escolha sua conta → "Avançado" → "Acessar FreteAPI (não seguro)" → "Permitir")
6. Copie a **URL do aplicativo da Web** — ela será algo como:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## PASSO 4 — Configurar no Shopify

1. No Shopify Admin, vá em **Temas → Personalizar** (engrenagem)
2. No menu lateral esquerdo, clique em **Configurações do tema**
3. Encontre a seção **"Frete via Planilha"**
4. Ative o toggle **"Ativar cálculo de frete via planilha"**
5. Cole a URL copiada no campo **"URL da API do Google Sheets"**
6. Salve

---

## PASSO 5 — Testar

1. Abra qualquer página de produto ou o carrinho na sua loja
2. O widget de frete aparecerá automaticamente
3. Digite um CEP e clique em Calcular

---

## Coluna extra: Frete grátis por valor mínimo (opcional)

Você pode adicionar uma coluna **F** chamada `VALOR_MINIMO_GRATIS` na planilha.  
Se o valor do pedido for maior ou igual a esse valor (em centavos), o frete fica grátis automaticamente.

| F                   |
|---------------------|
| VALOR_MINIMO_GRATIS |
| 29900               |
| 29900               |

---

## Estrutura de resposta da API (JSON)

**Sucesso:**
```json
{
  "opcoes": [
    { "servico": "PAC",   "preco": 1990, "prazo": 7, "gratis": false },
    { "servico": "SEDEX", "preco": 3490, "prazo": 2, "gratis": false }
  ]
}
```

**Frete grátis:**
```json
{
  "opcoes": [
    { "servico": "PAC", "preco": 0, "prazo": 7, "gratis": true }
  ]
}
```

**Erro:**
```json
{
  "error": "Não encontramos opções de frete para o CEP informado."
}
```

---

## Dúvidas frequentes

**O widget não aparece na loja:**
→ Verifique se a opção "Ativar cálculo de frete" está marcada nas configurações do tema.

**Aparece "Erro ao conectar com o serviço de frete":**
→ Verifique se a URL do Apps Script está correta e se o acesso é "Qualquer pessoa".
→ Verifique se autorizou corretamente o script.

**Os preços estão errados:**
→ Lembre que `PRECO` é em centavos. `1990` = R$19,90.

**Preciso atualizar os valores de frete:**
→ Basta editar a planilha. A API lê os valores em tempo real, sem precisar republicar.

**Como adicionar integração real com os Correios:**
→ Substitua a função `calcularFrete` por uma chamada à API oficial:
   `https://viacep.com.br/ws/{CEP}/json/` para validar o CEP e
   a API dos Correios para calcular frete com serviços reais.

---

*Arquivo gerado automaticamente pelo tema ConectWhats.*
