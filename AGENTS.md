# AGENTS.md — NegaRosa (tema Shopify)

## Regra de ouro
- Quando terminar uma tarefa (fix, feature ou ajuste), **sempre faça o push** para `origin/main` (`git add` só dos arquivos intencionais + `git commit` com mensagem clara + `git push`).

## Convenções do repo
- Tema Shopify (Liquid + CSS/JS em `assets/`). Sem build — `npm run build` é no-op.
- CSS por componente em `assets/` (`component-*.css`, `section-*.css`, `responsive.css` para mobile).
- JS com `node --check` antes de commitar quando mexer em scripts.
- Não commitar `config/settings_data.json` (está no `.gitignore`).

## ⚠️ Diretrizes obrigatórias de desenvolvimento

### 1. Isolamento e blindagem de escopo
- **Correção cirúrgica:** modifiquem única e estritamente o componente, arquivo ou função diretamente afetada pelo problema.
- **Proibição de impacto lateral:** é terminantemente proibido alterar o escopo global ou arquivos de configuração alheios ao erro. Garantam que o ajuste seja isolado para que nenhuma funcionalidade estável do sistema seja corrompida.

### 2. Reaproveitamento inteligente e parametrização
- **Análise de arquitetura:** antes de gerar novos códigos, analisem o ecossistema atual para reaproveitar funções, classes, hooks e componentes que já estão homologados. Não criem caminhos redundantes ou paralelos.
- **Zero hardcode:** é obrigatório parametrizar o sistema. Externalizem variáveis, chaves, URLs, taxas e endpoints em arquivos de configuração ou estados gerenciáveis (no tema: `config/settings_schema.json` + `settings.*`, nunca valores fixos espalhados).
- **Modularidade e retrocompatibilidade:** desenvolvam de forma modular, assegurando que a expansão de uma função seja totalmente retrocompatível e jamais interfira na estabilidade de outras ferramentas do sistema.
