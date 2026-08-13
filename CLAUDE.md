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
+ Framer Motion + canvas-confetti + **@supabase/supabase-js**.

O lint emite avisos `react(only-export-components)` em arquivos que exportam
componente **e** constante (os quatro contexts, `Panel`, `MoodCheck`,
`BreathingOrb`). São benignos e esperados — não "conserte" quebrando os arquivos.

---

## Onde está publicado

| Destino | URL | Atualiza |
|---|---|---|
| GitHub Pages | https://dennereduardo1971-ai.github.io/O-Avh/ | sozinho, a cada push na branch |
| Artifact (Claude) | `claude.ai/code/artifact/bb739a16-7aa6-4b77-8c3c-027364b5235f` | só ao republicar |

**Pages** roda via `.github/workflows/deploy.yml`. Em *Settings → Pages*, o
**Source precisa ser "GitHub Actions"** — se voltar para "Deploy from a branch",
o site quebra de um jeito difícil de diagnosticar (ver armadilha 7).

**Artifact**: `node scripts/build-artifact.mjs` (após `npm run build`) gera
`artifact.html`, um HTML único com JS/CSS inline. É gitignorado — é build, não
fonte. Para atualizar o artifact existente, republique **com a mesma URL** acima,
senão cria um artifact novo e o link antigo fica velho. No artifact o service
worker não registra (não existe `sw.js` num HTML único): sem offline e sem push,
o resto funciona igual.

---

## Arquitetura

```
src/
  index.css              tokens (@theme), classes .panel/.field/.hud-*, keyframes
  App.tsx                providers (Sync > Profile > Toast > Game) + rotas
  env.d.ts               tipos das VITE_* (todas opcionais)
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
    SyncContext          sessão, estado da conexão, tempo real, push
  features/<área>/       uma pasta por área do app
    settings/            SettingsPage + ConexaoPanel + NotificacoesPanel
  lib/
    storage.ts           useLocalStorage + valorAtual/definirValorGlobal
    gameMath.ts          levelInfo/xpForLevel, todayISO/yesterdayISO
    achievements.ts      ACHIEVEMENTS, GameCounts, EMPTY_COUNTS
    confetti.ts          confettiPop (pequeno) / confettiBurst (grande)
    pwa.ts               instalação no celular + registro do service worker
    audio.ts             sons do Refúgio, sintetizados (sem arquivo de áudio)
    sync/
      config.ts          lê as VITE_*, SYNC_CONFIGURADO, id do aparelho
      areas.ts           adaptadores: valor guardado <-> lista de itens
      fila.ts            fila de saída (offline + desempate por hora)
      motor.ts           diferença, mescla, sincronização completa
      hooks.ts           useSyncedArea / useSyncedDoc
      gatilho.ts         ponte "mudou algo" entre telas e SyncContext
      push.ts            assinar/desassinar notificação
public/
  manifest.webmanifest   PWA
  sw.js                  cache offline + recebimento do push (não passa no Vite)
  icone-*.png            ícones gerados por scripts/gerar-icones.mjs
supabase/
  esquema.sql            tabelas + RLS + triggers + realtime (colar no SQL Editor)
  functions/notificar/   Edge Function que dispara o push (Deno)
```

Rotas → pasta: `/` Painel · `/mensagens` Recadinhos · `/financas` Tesouro ·
`/tarefas` Missões · `/lazer` Aventuras · `/diversao` Arcade · `/calma` Refúgio ·
`/conquistas` Troféus · `/config` Ajustes.

O vocabulário é de jogo (Tesouro, Missões, Aventuras…). Mantenha ao criar telas.

---

## Dados

**Local primeiro, sincronização opcional por cima.** O app funciona 100% sem
backend; a sincronização é uma camada que só liga se houver chaves no build
**e** o casal entrar numa conta. Sem isso, `SYNC_CONFIGURADO` é falso, nenhuma
tela muda e nada sai do aparelho.

Chaves do localStorage: `casal:perfil` · `casal:game` · `casal:mensagens` ·
`casal:tarefas` · `casal:financas` · `casal:lazer` · `casal:humor` ·
`casal:fila` · `casal:fila-docs` · `casal:dispositivo` · `casal:som`.

`storage.ts` mantém **um valor por chave em memória**, com ouvintes. Isso não é
enfeite: antes cada `useLocalStorage` tinha a própria cópia e duas telas lendo a
mesma chave não se falavam. É também o que deixa a sincronização empurrar dados
recebidos direto para dentro das telas (`definirValorGlobal`) sem que as telas
saibam que sync existe.

### Como a sincronização foi desenhada (as decisões que importam)

- **Item a item, nunca o bloco inteiro.** Se cada celular mandasse o array
  completo de recadinhos, o último a salvar apagaria o que o outro escreveu.
  `areas.ts` quebra cada área em itens com `id`; o humor (que é um mapa
  dia→pessoa) é achatado em `"dia|pessoa"` pelo mesmo motivo.
- **Ordenação determinística.** Todo critério de ordenação termina desempatando
  pelo `id`, senão a mesma lista apareceria embaralhada em cada celular.
- **Apagar vira lápide, não `delete`.** Sem a marca `removido` no servidor, o
  outro celular reenviaria o item apagado na próxima sincronização e ele
  voltaria do além.
- **Fila de saída com hora local.** Resolve offline e desempate de uma vez: o
  que está na fila e é mais novo sempre vence o que chega do servidor, senão uma
  sincronização no meio do caminho desfaria o que você acabou de digitar.
- **XP não usa "o mais recente vence".** Se os dois ganhassem XP ao mesmo tempo,
  a última gravação zeraria o progresso do outro. `mesclarJogo` fica com o
  **maior** de cada número (todos só crescem) e a **união** das conquistas.
- **Do perfil só sobem os nomes.** `active` é "quem está com o celular na mão
  agora" — sincronizar isso faria o app trocar de pessoa sozinho no outro
  aparelho.
- **A primeira sincronização sobe calada** (`silencioso: true`), senão conectar
  pela primeira vez faria o celular da Sara apitar uma vez por recadinho antigo.
- O envio é agrupado num respiro de 700ms — as telas avisam "mudou" a cada
  tecla.

No banco, `esquema.sql` cria `itens` / `estado` / `dispositivos`, liga **RLS**
(cada conta só enxerga o próprio `casal_id`), põe um trigger que **ignora
escrita mais antiga** que a linha atual, e adiciona as tabelas ao realtime.

---

## Sistema de jogo

`trigger({ xp, xpLabel, xpIcon?, countKey?, countDelta? })` do `useGame()` é o
único caminho para dar XP. Valores atuais: recadinho 10 · curtida 2 · missão
concluída 8 · lançamento 5 · aventura anotada 3 · aventura vivida 10 · jogada no
Arcade 3 · respiração (a cada 3 ciclos) 6.

Nível: `xpForLevel(n) = 100 + (n-1)*25`. 16 conquistas em `lib/achievements.ts`.

**Ao adicionar um contador novo** em `GameCounts`, adicione-o também em
`EMPTY_COUNTS` — ver a armadilha do NaN abaixo. `mesclarJogo` percorre as
chaves de `EMPTY_COUNTS`, então o contador novo entra na mescla de graça.

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

## Som (Refúgio)

`lib/audio.ts` sintetiza tudo na hora pela Web Audio API. **Não existe arquivo
de áudio no projeto, e não deve passar a existir:** um mp3 de ambiente pesaria
mais que o app inteiro, teria de entrar no cache do `sw.js` (senão o offline
quebra) e ainda ser embutido em base64 no artifact de HTML único. Sintetizado,
custa zero byte e o "ploc" sai no mesmo instante do toque.

| Som | Onde | Como é feito |
|---|---|---|
| `ploc()` | plástico bolha | seno despencando de agudo a grave + estalo de ruído branco |
| `gota(altura)` | lago de ondas | seno **subindo** rápido; tocar mais em cima soa mais agudo |
| `iniciarAmbiente()` | lago de ondas | ruído marrom em laço, filtro grave aberto/fechado por um LFO de 0,08 Hz |
| `tomDeRespiracao(fase, seg, alto)` | esfera da respiração | seno + harmônico uma oitava acima; sobe ao inspirar, desce ao soltar |

Decisões que importam:

- **Começa desligado, sempre** (`casal:som`, padrão `false`). Som que começa
  sozinho é o oposto de anti-estresse — e navegador nenhum libera áudio antes de
  um gesto do usuário, então o botão do `SomToggle` é o que destrava o
  `AudioContext`.
- **Preferência é do aparelho, não do casal.** Não sincroniza, pela mesma razão
  do `active` do perfil: um ligaria o som no celular do outro.
- **O ruído do ambiente tem os últimos 0,25 s misturados com os primeiros.** Sem
  essa emenda o laço estala a cada 6 s — um clique periódico bem no som feito
  para acalmar.
- **A subida de tom da gota é o que soa como água.** Descendo vira bolha
  estourando; é literalmente o mesmo desenho do `ploc()` ao contrário.
- **A fase da respiração é campo próprio (`fase`) no `BreathStep`**, não o
  `label` reaproveitado — mudar o texto da tela não pode calar o som sem
  ninguém perceber.
- Tudo passa por `pronto()`, que devolve `null` com o som desligado: nenhuma
  chamada precisa checar antes.

Níveis medidos na saída (pico): ploc 0,30 · gota 0,25 · respiração 0,10 ·
ambiente 0,02. O ambiente fica ~12× abaixo do resto de propósito — é cama, não
protagonista. Se mexer nos ganhos, confira que nada passe de 1,0 (satura).

---

## PWA e notificações

- `manifest.webmanifest` + `sw.js` (em `public/`, copiados crus — nada ali pode
  depender de bundler). O escopo do worker vem de `import.meta.env.BASE_URL`,
  que já é `/` em dev e `/O-Avh/` no Pages; caminho fixo quebraria no Pages.
- Navegação usa **rede primeiro, cache como reserva**, para o deploy novo
  aparecer. Suba o `VERSAO` do `sw.js` para invalidar cache antigo.
- **No iPhone o push só funciona com o app instalado** na tela de início — no
  Safari em aba a API `Notification` nem existe. Por isso os Ajustes mandam
  instalar antes de oferecer o botão. No Android há o evento
  `beforeinstallprompt` e dá para abrir o diálogo nativo; no iPhone não existe
  evento equivalente, só explicar "Compartilhar → Adicionar à Tela de Início".
- O push é disparado por um Database Webhook → Edge Function `notificar`, que
  não avisa o aparelho que originou a escrita (por isso o `dispositivo` na
  linha) nem as marcadas como `silencioso`.

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

**6. Fechar sobre o `valor` do render perde gravações.** Dois `set` no mesmo
clique (comum ao concluir uma missão: muda a tarefa **e** dá XP) fariam o
segundo sobrescrever o primeiro. `useSyncedArea` lê `valorAtual(chave)` na hora
de gravar, em vez de usar o valor capturado no render.

**7. Dois deploys disputando o Pages = tela preta intermitente.** O *Source* do
Pages estava em "Deploy from a branch", então o workflow `pages-build-deployment`
(do próprio GitHub, invisível no `.github/`) publicava o **repositório cru** no
mesmo segundo do nosso `deploy.yml`. Quem terminasse por último ganhava. Quando
ganhava o do GitHub, o navegador recebia o `index.html` de desenvolvimento, que
aponta para `/src/main.tsx` (só existe compilado) e busca o manifesto na raiz do
domínio em vez de `/O-Avh/` — nenhum JS carregava, a página ficava vazia e, com
`color-scheme: dark`, vazio aparece **preto liso**. Sintomas que despistam: os
dois workflows dizem *success*, reproduz em aba anônima (não é cache) e às vezes
funciona (quando o nosso ganha a corrida). Diagnóstico rápido: se o console
acusar 404 em `main.tsx`, é isto — nenhum build de produção referencia esse
arquivo. Conserto: *Settings → Pages → Source → **GitHub Actions***.

Sinal de alerta para o futuro: `actions_list` com `method: list_workflows`
deve mostrar **só** "Deploy no GitHub Pages". Se `pages-build-deployment`
reaparecer, o Source voltou para branch.

---

## Testando no navegador (aprendido na marra)

Playwright não está no `package.json`; instale sob demanda com
`npm install -D playwright --no-save` e use
`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'` com
`--no-sandbox`. **Remova antes de commitar** (o mesmo vale para scripts
`teste-*.mjs` de bancada — já houve uma limpeza desses).

- **Mudar só o hash não recarrega o documento.** Ao semear `localStorage` e
  navegar para `/#/rota`, o app não remonta e sobrescreve o que você semeou.
  Chame `page.reload()` depois do `goto`.
- **`serve -s` (modo SPA) reescreve tudo para o `index.html` da raiz**, que em
  dev aponta para `/src/main.tsx` e não existe como arquivo estático. Para testar
  `artifact.html`, sirva **sem** `-s`.
- Locators que dependem de estado (ex.: `[aria-label="Estourar bolha"]`)
  re-indexam a cada clique — o alvo "n" muda de identidade no meio do laço.
- **Dá para testar som sem ouvir**, e vale a pena, porque o TypeScript não vê
  nada disso. Duas técnicas, ambas via `page.addInitScript`: (1) espionar
  `OscillatorNode.prototype.start` / `AudioBufferSourceNode.prototype.start`
  para contar o que disparou; (2) para provar que **sai som** e não silêncio,
  embrulhar `AudioNode.prototype.connect` e, quando o destino for o
  `AudioDestinationNode`, enfiar um `AnalyserNode` no caminho — aí
  `getFloatTimeDomainData` dá o pico real da saída. Chromium headless roda a
  Web Audio API normalmente, sem placa de som.
- **Este sandbox bloqueia `github.io`** e o blob de artifacts do Actions
  (`*.blob.core.windows.net`, usado para baixar artifacts de workflow) no proxy
  de rede. Não dá para verificar o deploy nem inspecionar o conteúdo publicado
  daqui. Confirme pelos logs do Actions (`mcp__github__get_job_logs`) que o
  build/deploy passou, e para o resultado visual — inclusive se as chaves de
  sincronização "pegaram" — peça ao usuário para checar um sinal na própria UI
  (ex.: Ajustes mostrar o login em vez de "não configurada") em vez de tentar
  baixar o artifact e grepar.

---

## Estado da sincronização

Chaves lidas no build (todas opcionais, em `.env` local ou secrets do Actions):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`. A chave
`anon` do Supabase é pública por projeto — quem protege os dados é o login do
casal + as regras RLS. O `deploy.yml` já repassa as três; se os secrets não
existirem, chegam vazias e o app publicado roda em modo local.

O passo a passo para o usuário ligar tudo está em **`CONFIGURACAO.md`** (criar o
projeto, rodar o `esquema.sql`, criar a conta única do casal, gerar VAPID com
`node scripts/gerar-vapid.mjs`, publicar a Edge Function, ligar o webhook).

### O que já foi verificado

- **Modo local (sem chaves), no navegador:** adicionar missão, concluir
  (as duas gravações do mesmo clique), recadinho, Painel refletindo sem
  recarregar, persistência após reload, fila vazia, e os textos corretos em
  Ajustes. Zero erro de console.
- **Lógica de mescla, fora do navegador:** diferença item a item, lápide,
  escrita local pendente vencendo versão antiga do servidor, versão mais nova
  do servidor entrando, ordem idêntica nos dois aparelhos, XP ficando com o
  maior (não o mais recente), união das conquistas, e `active` do perfil não
  viajando entre aparelhos.

### Contra o Supabase real

O usuário concluiu o `CONFIGURACAO.md` (projeto criado, `esquema.sql` rodado,
conta do casal criada, secrets do GitHub preenchidos) e **confirmou que a
sincronização está funcionando** — a tela de Ajustes passou a mostrar o login
em vez de "não configurada", e ele testou conectar e sincronizar. Isso foi
verificado pelo usuário, não por mim: eu não tenho como abrir o site publicado
nem inspecionar o Supabase dele a partir daqui (ver a limitação de rede logo
abaixo).

**Notificações push (passos 5–7 do `CONFIGURACAO.md`) ainda não foram
confirmadas** — exigem gerar VAPID, publicar a Edge Function e ligar o webhook,
passos que não foram mencionados como concluídos. Se o usuário pedir para
mexer em algo de push, pergunte se esses passos já foram feitos antes de supor
que sim.

> Os testes de modo local e de mescla foram feitos com bancada temporária
> (Playwright sob demanda + um bundle esbuild com `localStorage` de mentira) e
> removidos depois, seguindo a convenção do repo. Não há suíte de testes
> permanente — vale propor uma (vitest) se a lógica de mescla for mexida de
> novo.
