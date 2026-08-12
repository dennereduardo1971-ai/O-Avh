# 💞 Nosso Cantinho

Aplicativo de organização pessoal para casal — feito para vocês dois organizarem a vida
juntos: mensagens fofas, finanças, tarefas diárias, lazer e uns joguinhos para os
momentos de tédio.

## Pastas / tópicos do app

- **💌 Mensagens Fofas** — recadinhos e declarações um para o outro.
- **💰 Finanças** — controle de receitas, despesas e saldo do casal.
- **✅ Tarefas Diárias** — lista de afazeres do dia, com responsável e reset diário.
- **🎈 Lazer** — banco de ideias de programas, viagens e planos (ideia → planejado → feito).
- **🎲 Diversão** — pergunta do dia, sorteio de decisões, cara ou coroa e "quem decide hoje".
- **🏆 Conquistas** — nível, XP, sequência de dias e medalhas desbloqueadas.
- **⚙️ Configurações** — ajuste dos nomes de cada pessoa.

Todos os dados ficam salvos apenas no `localStorage` do navegador — nada é enviado para
nenhum servidor.

## Tema de jogo

O app funciona como um mini RPG do casal: cada ação (mandar mensagem, concluir tarefa,
registrar lançamento, marcar um programa de lazer como feito, jogar na pasta Diversão) dá
XP, que sobe o nível do casal e desbloqueia conquistas — com confete, toasts animados e
uma barra de XP na barra lateral. Tudo com animações via Framer Motion (transições de
página, cartões com hover/tap, listas com entrada/saída animada, moeda 3D, roleta de
sorteio) para deixar a navegação mais viva e interativa.

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

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router + Framer Motion + canvas-confetti.
