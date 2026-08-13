import { useCallback } from 'react'
import Panel from '../../components/ui/Panel'
import SectionTitle from '../../components/ui/SectionTitle'
import { useGame } from '../../context/GameContext'
import BreathingOrb from './BreathingOrb'
import BubblePop from './BubblePop'
import ZenPond from './ZenPond'
import MoodCheck from './MoodCheck'
import SomToggle from './SomToggle'

export default function ZenPage() {
  const { trigger } = useGame()

  // XP a cada 3 ciclos de respiração — recompensa sem transformar
  // o descanso numa corrida por pontos.
  const aoCompletarCiclo = useCallback(
    (total: number) => {
      if (total % 3 === 0) {
        trigger({ xp: 6, xpLabel: 'Respiração guiada', xpIcon: '🫧', countKey: 'calmMinutes' })
      }
    },
    [trigger],
  )

  return (
    <div>
      <SectionTitle
        icon="🫧"
        title="Refúgio"
        subtitle="Um canto sem cobrança. Respire, estoure bolhas, mexa na água."
        right={<SomToggle />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel glow="mint" className="p-6 xl:col-span-2">
          <p className="hud-label mb-1">Respiração guiada</p>
          <h2 className="mb-5 text-lg font-bold text-parch">Acompanhe a esfera</h2>
          <BreathingOrb onCycle={aoCompletarCiclo} />
        </Panel>

        <Panel glow="iris" className="p-5">
          <p className="hud-label mb-1">Termômetro do casal</p>
          <h2 className="mb-3 text-lg font-bold text-parch">Humor de hoje</h2>
          <MoodCheck />
        </Panel>

        <Panel glow="mint" className="p-5">
          <p className="hud-label mb-1">Fidget</p>
          <h2 className="mb-3 text-lg font-bold text-parch">Lago de ondas</h2>
          <ZenPond />
        </Panel>

        <Panel glow="mint" className="p-5 xl:col-span-2">
          <p className="hud-label mb-1">Fidget</p>
          <h2 className="mb-4 text-lg font-bold text-parch">Plástico bolha</h2>
          <BubblePop />
        </Panel>
      </div>
    </div>
  )
}
