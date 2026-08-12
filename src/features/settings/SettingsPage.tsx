import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProfile } from '../../context/ProfileContext'
import { useSync } from '../../context/SyncContext'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'
import SectionTitle from '../../components/ui/SectionTitle'
import ConexaoPanel from './ConexaoPanel'
import NotificacoesPanel from './NotificacoesPanel'

export default function SettingsPage() {
  const { profile, setName } = useProfile()
  const { email } = useSync()
  const [p1, setP1] = useState(profile.names.p1)
  const [p2, setP2] = useState(profile.names.p2)
  const [salvo, setSalvo] = useState(false)

  const salvar = () => {
    setName('p1', p1.trim())
    setName('p2', p2.trim())
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2200)
  }

  return (
    <div>
      <SectionTitle
        icon="⚙️"
        title="Ajustes"
        subtitle="Como o app chama vocês, e como os dois celulares conversam."
      />

      <Panel glow="iris" className="max-w-lg p-6">
        <label className="hud-label mb-1.5 block">Pessoa 1</label>
        <input value={p1} onChange={(e) => setP1(e.target.value)} className="field mb-4" />

        <label className="hud-label mb-1.5 block">Pessoa 2</label>
        <input value={p2} onChange={(e) => setP2(e.target.value)} className="field mb-5" />

        <div className="flex items-center gap-3">
          <GameButton onClick={salvar}>Salvar</GameButton>
          {salvo && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-semibold text-mint-300"
            >
              Salvo! ✅
            </motion.span>
          )}
        </div>
      </Panel>

      <ConexaoPanel />
      <NotificacoesPanel />

      <Panel glow="none" className="mt-4 max-w-lg p-5">
        <p className="hud-label mb-2">Privacidade</p>
        {email ? (
          <>
            <p className="text-sm leading-relaxed text-parch-dim">
              Com a conexão ligada, o que vocês escrevem sai do aparelho: fica guardado no banco
              de dados do casal, na conta que{' '}
              <span className="font-semibold text-parch">vocês mesmos criaram</span>, para poder
              chegar no outro celular. Só quem entra com essa conta enxerga esses dados — nenhuma
              outra pessoa que use o app tem acesso.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-parch-dim">
              Sendo direto: o conteúdo não vai embaralhado, então quem administra esse banco
              consegue lê-lo. Não há anúncios, rastreamento nem envio para mais ninguém.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-parch-dim">
              Para voltar ao modo em que nada sai daqui, é só desconectar acima.
            </p>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-parch-dim">
            Tudo o que vocês escrevem aqui — recadinhos, finanças, missões, aventuras e humor —
            fica salvo somente neste navegador, no armazenamento local do aparelho. Nada é
            enviado para nenhum servidor enquanto a conexão entre os celulares estiver
            desligada.
          </p>
        )}
      </Panel>
    </div>
  )
}
