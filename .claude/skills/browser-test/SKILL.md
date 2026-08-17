---
name: browser-test
description: Monta uma bancada Playwright temporária para testar de verdade no navegador uma mudança de UI, animação, som ou fluxo entre telas do Nosso Cantinho — em vez de confiar só em lint/build, que não veem nada disso. Use antes de considerar pronta qualquer mudança visual ou de interação não trivial.
---

# Testar no navegador de verdade

O TypeScript e o `oxlint` não veem se uma animação anima, se um som soa, ou se
uma tela sobrevive a um reload. Esta rotina monta e desmonta uma bancada
Playwright sob demanda — ela não é dependência do projeto.

## Preparar

```bash
npm install -D playwright --no-save
npm run build      # ou GH_PAGES=true npm run build, se o teste depender do base path
cd dist && python3 -m http.server 5199 &
```

Use `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`
com `args: ['--no-sandbox']` — o Chromium já vem instalado no ambiente, não
rode `playwright install`.

## Armadilhas já conhecidas (não redescobrir)

- **Só trocar o hash não recarrega o documento.** Depois de
  `page.goto('http://localhost:5199/#/rota')`, chame `page.reload()` — sem
  isso o app não remonta e qualquer `localStorage` semeado antes não é lido.
- **`serve -s` (modo SPA) reescreve tudo para o `index.html` da raiz.** Para
  testar `dist/`, sirva sem `-s` (o exemplo acima já faz isso). Para testar
  `artifact.html`, o mesmo cuidado se aplica.
- **Locators que dependem de estado re-indexam a cada clique** — ex.:
  `[aria-label="Estourar bolha"]` muda de alvo no meio de um laço de cliques.
  Prefira `.nth(i)` fixo por iteração, não recalcular o locator supondo que o
  índice N continua sendo o mesmo elemento.
- **Este sandbox bloqueia `github.io`** e o blob de artifacts do Actions —
  não tente testar o site publicado direto daqui, só `localhost`.

## Provar som sem ouvir

Som passa limpo por `tsc` mesmo mudo — não pule esta parte se a mudança tocar
`lib/audio.ts` ou qualquer tela do Refúgio. Duas técnicas via
`page.addInitScript`, antes do `page.goto`:

1. **Contar o que disparou:** substitua `OscillatorNode.prototype.start` e
   `AudioBufferSourceNode.prototype.start` por versões que incrementam um
   contador em `window` antes de chamar a original. Prova que o código certo
   rodou (síntese vs. gravação, por exemplo).
2. **Provar que sai som de verdade, não silêncio:** substitua
   `AudioNode.prototype.connect` — quando o destino for
   `AudioDestinationNode`, insira um `AnalyserNode` no caminho antes de
   conectar. Depois, `getFloatTimeDomainData` num buffer dá o pico real da
   saída. Chromium headless roda a Web Audio API normalmente, sem placa de
   som — não precisa de áudio de verdade na máquina.

## Depois de testar

```bash
pkill -f "http.server 5199"
npm uninstall playwright --no-save
git status --short   # confirma que nenhum teste-*.mjs ou diag*.mjs sobrou
```

**Nunca commite a bancada.** Scripts de teste temporário (`teste-*.mjs`,
`diag*.mjs`) existem só durante a sessão — já houve limpeza desses antes.
