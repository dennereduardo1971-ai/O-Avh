---
name: new-feature
description: Estrutura uma área/tela nova do Nosso Cantinho (uma pasta em src/features/) seguindo o mesmo esqueleto das existentes — rota, design system, XP, sincronização opcional. Use quando o pedido for "cria uma tela para X" ou "adiciona uma área de Y" no app.
---

# Criar uma área nova

Antes de escrever qualquer código, decida três coisas com o usuário se não
estiverem claras: **nome em português** que combine com o vocabulário de jogo
já usado (Tesouro, Missões, Aventuras, Refúgio, Arcade, Troféus...), se a área
**precisa sincronizar** entre os dois celulares, e se algo nela **dá XP**.

## Esqueleto de arquivos

```
src/features/<area>/
  <Area>Page.tsx      # componente principal da rota
  (outros componentes da própria área, se a tela crescer)
```

## Passo a passo

1. **Página** em `src/features/<area>/<Area>Page.tsx`. Comece por
   `SectionTitle` (ícone + título + subtítulo) e um ou mais `Panel` com o
   `glow` temático da área — não invente cor nova sem necessidade; siga blush
   (recadinhos), iris (missões), mint (tesouro/refúgio), gold (troféus/XP).
   Use `GameButton` para toda ação clicável, nunca `<button>` cru — é o que dá
   o feedback de toque que o app promete (`.panel`/`.field`/`.hud-label`/
   `.hud-value` de `index.css` para o resto).

2. **Estado.** Se a área **não** precisa sincronizar:
   `useLocalStorage<T>('casal:<chave>', inicial)`. Se precisa (o normal para
   qualquer coisa que os dois editam): `useSyncedArea` (lista de itens com
   `id`) ou `useSyncedDoc` (um bloco só, como o estado de jogo) de
   `src/lib/sync/hooks.ts`. **Toda chave nova entra na lista documentada no
   `CLAUDE.md`** (seção "Dados") — não esqueça de atualizar.

   Se for `useSyncedArea`, precisa de um adaptador simétrico em
   `src/lib/sync/areas.ts` (`chave` + como transformar item ↔ registro) e a
   tabela já existente `itens` no Supabase cobre o formato — normalmente não
   precisa mexer no `esquema.sql`. **Depois de mexer aqui, use o agente
   `sync-guardian`** antes de considerar pronto.

3. **XP**, se a área concede algum: `useGame().trigger({ xp, xpLabel, xpIcon,
   countKey, countDelta })`. Nunca grave XP direto. Se `countKey` for novo:

   - adicione o campo em `GameCounts` **e** em `EMPTY_COUNTS`
     (`src/lib/achievements.ts`) — esquecer o segundo produz `NaN` em saves
     antigos (armadilha 3 do `CLAUDE.md`);
   - considere se merece uma conquista nova em `ACHIEVEMENTS`.

4. **Rota** em `src/App.tsx`: uma linha `<Route path="<slug>"
   element={<AreaPage />} />` dentro do `<Route element={<Layout />}>`
   existente. Adicione também o link/ícone no menu do `Layout` (veja como as
   rotas atuais aparecem lá).

5. **Copy em português do Brasil**, sempre — inclusive nomes de variável e
   comentário, seguindo a convenção do resto do repo. Cuidado com plural
   (armadilha 5): troque a palavra inteira, não concatene `s`.

6. **Anti-estresse.** Qualquer animação nova precisa respeitar
   `prefers-reduced-motion` (já é global em `index.css`, mas confirme que
   você não está usando algo fora do Framer Motion / CSS que ignore isso).

## Ao terminar

Rode `npm run lint && npm run build`. Se a tela tem qualquer interação visual
não trivial, use a skill `browser-test` antes de dar por pronto. Depois de
mudanças em `lib/sync/`, rode o agente `sync-guardian`; para o visual geral,
`visual-designer` pode revisar consistência com o resto do app.
