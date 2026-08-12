# Nosso Cantinho — contexto do projeto

App de organização pessoal **para um casal** (o usuário e sua esposa **Sara**).
Tudo — interface, copy, commits, comentários de código — é escrito **em português
do Brasil**. Mantenha assim.

Repositório: `dennereduardo1971-ai/O-Avh` · branch de trabalho:
`claude/personal-org-app-sara-41l36a` (não existe `main` ainda).

---

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

Stack: React 19 + TypeScript + Vite + **Tailwind v4** + React Router (HashRouter)
+ Framer Motion + canvas-confetti.

O lint emite avisos `react(only-export-components)` em arquivos que exportam
componente **e** constante (contexts, `Panel`, `MoodCheck`, `BreathingOrb`).
São benignos e esperados — não "conserte" quebrando os arquivos.

---

## Onde está publicado

| Destino | URL | Atualiza |
|---|---|---|
| GitHub Pages | https://dennereduardo1971-ai.github.io/O-Avh/ | sozinho, a cada push na branch |
| Artifact (Claude) | `claude.ai/code/artifact/bb739a16-7aa6-4b77-8c3c-027364b5235f` | só ao republicar |

**Pages** roda via `.github/workflows/deploy.yml`. O Pages já está habilitado no
repo; nenhum passo manual é necessário.

**Artifact**: `node scripts/build-artifact.mjs` (após `npm run build`) gera
`artifact.html`, um HTML único com JS/CSS inline. É gitignorado — é build, não
fonte. Para atualizar o artifact existente, republique **com a mesma URL** acima,
senão cria um artifact novo e o link antigo fica velho.

---

## Arquitetura

```
src/
  index.css              tokens (@theme), classes .panel/.field/.hud-*, keyframes
  App.tsx                providers + rotas
  components/
    Layout.tsx           shell: fundo, menu lateral, HUD, área de conteúdo
    AmbientBackground.tsx  auroras CSS + poeira estelar em canvas
    PlayerHUD.tsx        nível, barra de XP, streak, os dois jogadores
    AnimatedNumber.tsx   número que conta até o valor
    ui/                  Panel, GameButton, SectionTitle
  context/
    ProfileContext       nomes dos dois + quem está usando agora (p1/p2)
    ToastContext         notificações animadas (xp | achievement | levelup)
    GameContext          XP, nível, streak, contadores, conquistas
  features/<área>/       uma pasta por área do app
  lib/
    storage.ts           useLocalStorage + generateId
    gameMath.ts          levelInfo/xpForLevel, todayISO/yesterdayISO
    achievements.ts      ACHIEVEMENTS, GameCounts, EMPTY_COUNTS
    confetti.ts          confettiPop (pequeno) / confettiBurst (grande)
```

Rotas → pasta: `/` Painel · `/mensagens` Recadinhos · `/financas` Tesouro ·
`/tarefas` Missões · `/lazer` Aventuras · `/diversao` Arcade · `/calma` Refúgio ·
`/conquistas` Troféus · `/config` Ajustes.

O vocabulário é de jogo (Tesouro, Missões, Aventuras…). Mantenha ao criar telas.

---

## Dados

Tudo em `localStorage`, **sem backend**. Nada sai do aparelho — isso é uma
promessa feita ao usuário na tela de Ajustes; não introduza envio de dados sem
pedir autorização explícita.

Chaves: `casal:perfil` · `casal:game` · `casal:mensagens` · `casal:tarefas` ·
`casal:financas` · `casal:lazer` · `casal:humor`.

**Consequência conhecida:** os dados são por dispositivo/navegador. O que um
adiciona não aparece no aparelho do outro. O usuário sabe disso; sincronização
entre os dois é o próximo passo natural, ainda não pedido.

---

## Sistema de jogo

`trigger({ xp, xpLabel, xpIcon?, countKey?, countDelta? })` do `useGame()` é o
único caminho para dar XP. Valores atuais: recadinho 10 · curtida 2 · missão
concluída 8 · lançamento 5 · aventura anotada 3 · aventura vivida 10 · jogada no
Arcade 3 · respiração (a cada 3 ciclos) 6.

Nível: `xpForLevel(n) = 100 + (n-1)*25`. 16 conquistas em `lib/achievements.ts`.

**Ao adicionar um contador novo** em `GameCounts`, adicione-o também em
`EMPTY_COUNTS` — ver a armadilha do NaN abaixo.

---

## Design

Painel escuro estilo HUD de RPG. O escuro é decisão de produto (estética de jogo
**e** conforto visual à noite), não preferência estética solta.

Tokens em `src/index.css` via `@theme`: `night-950…700` (fundo), `blush`
(recadinhos/primário), `iris` (missões), `mint` (tesouro/refúgio), `gold`
(troféus/XP), `parch`/`parch-dim`/`parch-faint` (texto).

Classes utilitárias próprias: `.panel` (+ `.panel-lit` fio de luz no topo,
`.panel-interactive` brilho no hover), `.field` (inputs), `.hud-label`
(maiúsculas espaçadas), `.hud-value` (números tabulares), `.text-glow`.

Cada painel recebe um tom via `<Panel glow="mint">`, que alimenta a variável CSS
`--glow`. Use `Panel`/`GameButton`/`SectionTitle` em telas novas em vez de
recriar estilos.

**Anti-estresse é requisito, não enfeite:** tudo que se toca responde (GameButton
tem onda no ponto do clique), e `prefers-reduced-motion` é respeitado
globalmente em `index.css` — não adicione animação que ignore isso.

---

## Armadilhas já pagas (não reintroduzir)

**1. `AnimatePresence mode="wait"` em volta do `<Outlet/>` destrói dados.**
Causava remontagem dupla da página ao navegar; o estado era descartado antes de
persistir no localStorage — o usuário digitava e perdia. O Layout hoje usa
animação **só de entrada**, com `key={location.pathname}`. Não volte a envolver
o Outlet em `AnimatePresence`.

**2. Ordem de efeitos re-anunciava conquistas.** O efeito que marcava as
conquistas salvas como "já notificadas" rodava **depois** do que dispara os
toasts (efeitos rodam na ordem de declaração), então o app comemorava tudo de
novo, com confete, a cada abertura. Hoje `notifiedAchievements` e `notifiedLevel`
são semeados **durante a renderização**, não em `useEffect`. Mantenha assim.

**3. Contadores ausentes viram NaN.** Saves antigos não têm chaves novas de
`GameCounts`; `undefined + 1 = NaN` contamina o XP. `GameContext` faz merge com
`EMPTY_COUNTS` na leitura e na escrita.

**4. Caminho do GitHub Pages é sensível a maiúsculas.** O repo é `O-Avh`, então
`vite.config.ts` usa `base: '/O-Avh/'` quando `GH_PAGES=true`. Com `/o-avh/` os
assets dão 404 e a página fica branca.

**5. Plurais em português.** Já quebraram duas vezes (`2 missãoões`,
`1 abertas`). Troque a palavra inteira, não concatene sufixo.

---

## Testando no navegador (aprendido na marra)

Playwright não está no `package.json`; instale sob demanda com
`npm install -D playwright --no-save` e use
`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` com
`--no-sandbox`. **Remova antes de commitar.**

- **Mudar só o hash não recarrega o documento.** Ao semear `localStorage` e
  navegar para `/#/rota`, o app não remonta e sobrescreve o que você semeou.
  Chame `page.reload()` depois do `goto`.
- **`serve -s` (modo SPA) reescreve tudo para o `index.html` da raiz**, que em
  dev aponta para `/src/main.tsx` e não existe como arquivo estático. Para testar
  `artifact.html`, sirva **sem** `-s`.
- Locators que dependem de estado (ex.: `[aria-label="Estourar bolha"]`)
  re-indexam a cada clique — o alvo "n" muda de identidade no meio do laço.
- **Este sandbox bloqueia `github.io`** no proxy de rede. Não dá para verificar o
  deploy daqui; confirme pelos logs do Actions e peça ao usuário para abrir.

---

## Próximos passos possíveis (nenhum pedido ainda)

- Sincronizar dados entre os dois aparelhos (hoje é local por dispositivo).
- Instalar como app no celular (PWA: manifest + service worker).
- Ajustar intensidade das animações, se o usuário achar demais ou de menos.
