import FolderCard from '../../components/FolderCard'
import { useProfile } from '../../context/ProfileContext'

export default function HomePage() {
  const { profile } = useProfile()
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm font-medium text-rose-400">
          {saudacao}, {profile.names[profile.active]} 💕
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
          Bem-vindos ao cantinho de vocês
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Escolham uma pasta para começar a organizar a vida a dois: mensagens, dinheiro, tarefas,
          lazer e, claro, um espaço só pra brincar quando bater o tédio.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          to="/config"
          icon="⚙️"
          title="Configurações"
          description="Ajustem os nomes de vocês dois no aplicativo."
          accent="bg-slate-100"
        />
      </div>
    </div>
  )
}
