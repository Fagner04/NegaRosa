# AGENTS.md — NegaRosa (tema Shopify)

## Regra de ouro
- Quando terminar uma tarefa (fix, feature ou ajuste), **sempre faça o push** para `origin/main` (`git add` só dos arquivos intencionais + `git commit` com mensagem clara + `git push`).

## Convenções do repo
- Tema Shopify (Liquid + CSS/JS em `assets/`). Sem build — `npm run build` é no-op.
- CSS por componente em `assets/` (`component-*.css`, `section-*.css`, `responsive.css` para mobile).
- JS com `node --check` antes de commitar quando mexer em scripts.
- Não commitar `config/settings_data.json` (está no `.gitignore`).
