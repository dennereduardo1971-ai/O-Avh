import { motion } from 'framer-motion'
import { useSom } from '../../lib/audio'

/** Liga e desliga o som do Refúgio. Começa desligado, sempre. */
export default function SomToggle() {
  const { ligado, alternar } = useSom()

  return (
    <button
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={ligado ? 'Desligar o som' : 'Ligar o som'}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        ligado
          ? 'border-mint-400/45 bg-mint-500/15 text-mint-300'
          : 'border-white/10 bg-white/4 text-parch-dim hover:bg-white/8 hover:text-parch'
      }`}
    >
      <span aria-hidden className="text-sm">
        {ligado ? '🔊' : '🔇'}
      </span>
      {ligado ? 'Som ligado' : 'Som desligado'}
      {/* Três barrinhas respirando: mostra que o som está vivo mesmo quando o
          ambiente está baixo demais para se notar num lugar barulhento. */}
      {ligado && (
        <span className="flex items-end gap-0.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-0.5 rounded-full bg-mint-300"
              animate={{ height: [4, 10, 4] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.18,
              }}
            />
          ))}
        </span>
      )}
    </button>
  )
}
