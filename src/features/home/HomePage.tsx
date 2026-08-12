import { motion } from 'framer-motion'
import FolderCard from '../../components/FolderCard'
import { useProfile } from '../../context/ProfileContext'
import { useGame } from '../../context/GameContext'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function HomePage() {
  const { profile } = useProfile()
  const { level, streak } = useGame()
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <header className="mb-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-rose-400"
        >
          {saudacao}, {profile.names[profile.active]} 💕
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl"
        >
          Bem-vindos ao cantinho de vocês
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 max-w-2xl text-slate-500"
        >
          Escolham uma pasta para começar a organizar a vida a dois: mensagens, dinheiro, tarefas,
          lazer e, claro, um espaço só pra brincar quando bater o tédio.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-4 flex flex-wrap gap-2 text-sm"
        >
          <span className="rounded-full bg-fuchsia-100 px-3 py-1 font-medium text-fuchsia-700">
            ⭐ Nível {level}
          </span>
          {streak > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-600">
              🔥 {streak} dia{streak === 1 ? '' : 's'} seguidos
            </span>
          )}
        </motion.div>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FolderCard
          to="/mensagens"
          icon="💌"
          title="Mensagens Fofas"
          description="Deixem recadinhos, elogios e declarações um para o outro."
          accent="bg-rose-100"
        />
        <FolderCard
          to="/financas"
          icon="💰"
          title="Finanças"
          description="Controlem gastos, receitas e o saldo do casal."
          accent="bg-emerald-100"
        />
        <FolderCard
          to="/tarefas"
          icon="✅"
          title="Tarefas Diárias"
          description="Organizem o que precisa ser feito hoje, cada um no seu ritmo."
          accent="bg-sky-100"
        />
        <FolderCard
          to="/lazer"
          icon="🎈"
          title="Lazer"
          description="Ideias de programas, viagens e planos para curtir juntos."
          accent="bg-amber-100"
        />
        <FolderCard
          to="/diversao"
          icon="🎲"
          title="Diversão"
          description="Perguntas, sorteios e brincadeiras para os momentos de tédio."
          accent="bg-fuchsia-100"
        />
        <FolderCard
          to="/conquistas"
          icon="🏆"
          title="Conquistas"
          description="Vejam o nível, XP e as medalhas que já desbloquearam."
          accent="bg-yellow-100"
        />
      </motion.div>
    </div>
  )
}
