# 💞 Nosso Cantinho

Aplicativo de organização pessoal para casal — feito para vocês dois organizarem a vida
juntos: mensagens fofas, finanças, tarefas diárias, lazer e uns joguinhos para os
momentos de tédio.

## Pastas do painel

- **🛖 Painel** — a visão geral: saldo, missões do dia, último recadinho e atalhos.
- **💌 Recadinhos** — declarações e elogios um para o outro.
- **💎 Tesouro** — receitas, despesas, saldo e quem gastou mais.
- **⚔️ Missões** — as tarefas do dia, com responsável e recomeço diário.
- **🗺️ Aventuras** — programas e viagens (ideia → planejado → feito).
- **🕹️ Arcade** — pergunta do dia, roleta, cara ou coroa e "quem decide hoje".
- **🫧 Refúgio** — o canto anti-estresse (respiração guiada, fidgets, humor do casal).
- **🏆 Troféus** — nível, XP, sequência de dias e a coleção de medalhas.
- **⚙️ Ajustes** — os nomes de cada pessoa.

Todos os dados ficam salvos apenas no `localStorage` do navegador — nada é enviado para
nenhum servidor.

## Estética de jogo

A interface é um HUD de RPG: céu noturno com aurora e poeira estelar animadas, painéis de
vidro com fio de luz no topo, emblema de nível, barra de XP com varredura de brilho e menu
lateral com marcador luminoso deslizante.

Cada ação rende XP, que sobe o nível do casal e desbloqueia troféus — com confete e
notificações animadas. As cores vêm de um conjunto de tokens (`--color-night-*`,
`blush`, `iris`, `mint`, `gold`) declarados em `src/index.css`.

## Anti-estresse

A proposta é que a tela inteira acalme, não só uma página:

- **Paleta escura** de baixo contraste agressivo, para uso à noite sem cansar a vista.
- **Tudo o que se toca responde** — botões com onda que nasce no ponto do clique, painéis
  que reagem ao mouse, listas com física de mola.
- **Refúgio**: respiração guiada com três padrões (Calma 4-6, Quadrado 4-4-4-4, Sono
  4-7-8), plástico bolha, lago de ondas e o termômetro de humor do casal.
- **`prefers-reduced-motion`** é respeitado — quem pede menos movimento recebe a interface
  praticamente estática, inclusive o fundo animado.

## Stack

React + TypeScript + Vite + Tailwind CSS v4 + React Router + Framer Motion + canvas-confetti.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```
