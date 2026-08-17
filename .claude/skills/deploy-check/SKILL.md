---
name: deploy-check
description: Verifica se o deploy do Nosso Cantinho no GitHub Pages está saudável — sem o workflow concorrente, com o último push publicado com sucesso. Use depois de um push na branch de trabalho, ou quando o usuário reportar tela em branco/preta/comportamento estranho no link publicado.
---

# Checar o deploy do GitHub Pages

Rotina para confirmar que o site publicado corresponde ao código atual, sem
precisar que o usuário abra o F12 (nem sempre dá — já aconteceu de o teclado
dele estar quebrado).

## Passos

1. **Confirme que só existe um workflow de publicação.**

   ```
   mcp__github__actions_list method:list_workflows
   ```

   Deve aparecer **só** "Deploy no GitHub Pages". Se `pages-build-deployment`
   reaparecer na lista, o *Source* do Pages voltou para "Deploy from a
   branch" — isso já causou tela preta intermitente (armadilha 7 do
   `CLAUDE.md`: os dois workflows disputam o mesmo deploy, e quando o do
   GitHub ganha, ele publica o repositório cru, sem build). A correção não é
   deste agente: só o usuário pode trocar em *Settings → Pages → Source →
   GitHub Actions*. Avise e pare aqui até ele confirmar que trocou.

2. **Confira a última execução do nosso workflow** na branch de trabalho:

   ```
   mcp__github__actions_list method:list_workflow_runs, resource_id: "deploy.yml"
   ```

   Procure o run do commit mais recente. `conclusion: success` e pronto seguem
   para o passo 3. Se falhou, pegue os logs do job (`mcp__github__get_job_logs`)
   antes de reportar qualquer coisa ao usuário.

3. **Se não houver run para o commit atual** (ex.: você quer confirmar sem
   esperar o push dar gatilho), dispare manualmente:

   ```
   mcp__github__actions_run_trigger method:run_workflow, workflow_id: "deploy.yml", ref: "<branch>"
   ```

4. **Não tente abrir o link publicado direto** (`curl`, `WebFetch`, Playwright
   apontando pra internet) — este sandbox bloqueia `github.io` e o blob de
   artifacts do Actions. Verificação real de conteúdo publicado só pelos
   passos acima (logs) ou pedindo ao usuário um sinal da própria UI (ex.:
   Ajustes mostrando o login em vez de "não configurada").

5. Se a mudança tocou `index.html`, `vite.config.ts`, `public/sw.js` ou
   `public/manifest.webmanifest`, rode `GH_PAGES=true npm run build` local e
   confira que todo `href`/`src` do `dist/index.html` está prefixado com
   `/O-Avh/` (case exato — o repo é `O-Avh`, não `o-avh`).

## Ao reportar para o usuário

Seja direto: "deploy concluído com sucesso, pode testar" ou "falhou por X, aqui
está o log" — sem jargão de CI que ele não pediu. Se sugerir teste no
celular dele, prefira aba anônima nova (elimina cache/service worker antigo
como variável) antes de qualquer diagnóstico mais fundo.
