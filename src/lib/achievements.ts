export interface GameCounts {
  messages: number
  hearts: number
  tasksDone: number
  financeEntries: number
  leisureDone: number
  funPlays: number
  calmMinutes: number
}

export const EMPTY_COUNTS: GameCounts = {
  messages: 0,
  hearts: 0,
  tasksDone: 0,
  financeEntries: 0,
  leisureDone: 0,
  funPlays: 0,
  calmMinutes: 0,
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  check: (counts: GameCounts, level: number, streak: number) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_message',
    title: 'Primeiro recadinho',
    description: 'Envie sua primeira mensagem fofa.',
    icon: '💌',
    check: (c) => c.messages >= 1,
  },
  {
    id: 'ten_messages',
    title: 'Poeta do amor',
    description: 'Envie 10 mensagens fofas.',
    icon: '📜',
    check: (c) => c.messages >= 10,
  },
  {
    id: 'hearts_20',
    title: 'Coração quentinho',
    description: 'Distribua 20 curtidas em mensagens.',
    icon: '❤️',
    check: (c) => c.hearts >= 20,
  },
  {
    id: 'first_task',
    title: 'Produtivo(a)',
    description: 'Conclua sua primeira tarefa do dia.',
    icon: '✅',
    check: (c) => c.tasksDone >= 1,
  },
  {
    id: 'ten_tasks',
    title: 'Mestre das tarefas',
    description: 'Conclua 10 tarefas.',
    icon: '🏅',
    check: (c) => c.tasksDone >= 10,
  },
  {
    id: 'first_finance',
    title: 'Cofrinho em ordem',
    description: 'Registre seu primeiro lançamento financeiro.',
    icon: '💰',
    check: (c) => c.financeEntries >= 1,
  },
  {
    id: 'finance_15',
    title: 'Contador(a) oficial',
    description: 'Registre 15 lançamentos financeiros.',
    icon: '📊',
    check: (c) => c.financeEntries >= 15,
  },
  {
    id: 'first_leisure',
    title: 'Primeiro rolê',
    description: 'Marquem um programa de lazer como feito.',
    icon: '🎈',
    check: (c) => c.leisureDone >= 1,
  },
  {
    id: 'leisure_5',
    title: 'Casal aventureiro',
    description: 'Concluam 5 programas de lazer.',
    icon: '🗺️',
    check: (c) => c.leisureDone >= 5,
  },
  {
    id: 'fun_10',
    title: 'Viciados em diversão',
    description: 'Joguem 10 vezes na pasta Diversão.',
    icon: '🎲',
    check: (c) => c.funPlays >= 10,
  },
  {
    id: 'first_breath',
    title: 'Primeiro respiro',
    description: 'Complete um ciclo de respiração guiada no Refúgio.',
    icon: '🫧',
    check: (c) => c.calmMinutes >= 1,
  },
  {
    id: 'calm_10',
    title: 'Mente serena',
    description: 'Complete 10 sessões de respiração guiada.',
    icon: '🧘',
    check: (c) => c.calmMinutes >= 10,
  },
  {
    id: 'streak_3',
    title: 'Presença de fogo',
    description: 'Usem o app em 3 dias diferentes seguidos.',
    icon: '🔥',
    check: (_c, _l, s) => s >= 3,
  },
  {
    id: 'streak_7',
    title: 'Uma semana juntos',
    description: 'Usem o app em 7 dias diferentes seguidos.',
    icon: '🔥🔥',
    check: (_c, _l, s) => s >= 7,
  },
  {
    id: 'level_5',
    title: 'Nível 5!',
    description: 'Alcancem o nível 5 do casal.',
    icon: '⭐',
    check: (_c, l) => l >= 5,
  },
  {
    id: 'level_10',
    title: 'Dupla lendária',
    description: 'Alcancem o nível 10 do casal.',
    icon: '👑',
    check: (_c, l) => l >= 10,
  },
]
