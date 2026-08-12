import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSync } from '../../context/SyncContext'
import { useInstalacao } from '../../lib/pwa'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'

/**
 * Instalação no celular e notificações — na mesma tela porque, no iPhone, uma
 * depende da outra: o Safari só entrega push para app instalado na tela de
 * início. Separar as duas coisas deixaria o usuário travado sem entender por
 * quê.
 */
export default function NotificacoesPanel() {
  const { disponivel, email, pushDisponivel, pushAtivo, ativarNotificacoes, desativarNotificacoes } =
    useSync()
  const { instalado, podeInstalar, precisaPassoAPasso, instalar } = useInstalacao()

  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!disponivel) return null

  const alternar = async () => {
    setOcupado(true)
    setErro(null)
    try {
      if (pushAtivo) await desativarNotificacoes()
      else await ativarNotificacoes()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para mudar as notificações.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Panel glow="gold" className="mt-4 max-w-lg p-6">
      <p className="hud-label mb-1.5">Avisos no celular</p>
      <p className="mb-4 text-sm leading-relaxed text-parch-dim">
        Recebam um aviso quando o outro deixar um recadinho, concluir uma missão, lançar algo no
        Tesouro ou anotar uma aventura.
      </p>

      {/* ---- Passo 1: instalar ---- */}
      {!instalado && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/4 px-4 py-3.5">
          <p className="mb-1.5 text-sm font-semibold text-parch">
            Primeiro, instale o app no celular
          </p>
          {podeInstalar ? (
            <>
              <p className="mb-3 text-sm leading-relaxed text-parch-dim">
                Assim o Cantinho ganha ícone próprio e abre sem a barra do navegador.
              </p>
              <GameButton variant="soft" size="sm" onClick={() => void instalar()}>
                Instalar 📲
              </GameButton>
            </>
          ) : precisaPassoAPasso ? (
            <p className="text-sm leading-relaxed text-parch-dim">
              No iPhone, toque em <span className="font-semibold text-parch">Compartilhar</span>{' '}
              (o quadradinho com a seta para cima) e depois em{' '}
              <span className="font-semibold text-parch">Adicionar à Tela de Início</span>. Abra o
              app pelo ícone novo e volte aqui —{' '}
              <span className="text-parch">
                no iPhone as notificações só funcionam com o app instalado
              </span>
              .
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-parch-dim">
              Use o menu do navegador e procure por{' '}
              <span className="font-semibold text-parch">Instalar aplicativo</span> ou{' '}
              <span className="font-semibold text-parch">Adicionar à tela de início</span>.
            </p>
          )}
        </div>
      )}

      {/* ---- Passo 2: ligar o aviso ---- */}
      {!email ? (
        <p className="text-sm leading-relaxed text-parch-faint">
          Conecte a conta do casal acima para poder ligar os avisos.
        </p>
      ) : !pushDisponivel ? (
        <p className="text-sm leading-relaxed text-parch-faint">
          Este navegador não entrega notificações.{' '}
          {!instalado && 'Instalando o app pelo passo acima, costuma passar a funcionar.'}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <GameButton
            variant={pushAtivo ? 'soft' : 'gold'}
            onClick={() => void alternar()}
            disabled={ocupado}
          >
            {ocupado ? 'Um instante…' : pushAtivo ? 'Desligar avisos' : 'Ligar avisos 🔔'}
          </GameButton>
          {pushAtivo && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-semibold text-mint-300"
            >
              Ligado neste aparelho ✅
            </motion.span>
          )}
        </div>
      )}

      {erro && <p className="mt-3 text-sm leading-relaxed text-blush-300">{erro}</p>}

      <p className="mt-4 text-xs leading-relaxed text-parch-faint">
        O aviso precisa ser ligado em cada celular, separadamente.
      </p>
    </Panel>
  )
}
