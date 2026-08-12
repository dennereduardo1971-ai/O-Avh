import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSync } from '../../context/SyncContext'
import Panel from '../../components/ui/Panel'
import GameButton from '../../components/ui/GameButton'

/** "há 2 minutos", "agora mesmo" — sem biblioteca de datas só para isto. */
function quandoFoi(iso: string): string {
  const segundos = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (segundos < 45) return 'agora mesmo'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return minutos === 1 ? 'há 1 minuto' : `há ${minutos} minutos`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConexaoPanel() {
  const {
    disponivel,
    estado,
    erro,
    email,
    ultimaSync,
    pendentes,
    online,
    entrar,
    sair,
    sincronizarAgora,
  } = useSync()

  const [campoEmail, setCampoEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erroLogin, setErroLogin] = useState<string | null>(null)

  /* ---------- Build sem sincronização configurada ---------- */
  if (!disponivel) {
    return (
      <Panel glow="none" className="mt-4 max-w-lg p-5">
        <p className="hud-label mb-2">Conexão entre os celulares</p>
        <p className="text-sm leading-relaxed text-parch-dim">
          Ainda não configurada nesta versão do app. Enquanto isso, tudo continua salvo só
          neste aparelho — nada deixa de funcionar. O passo a passo para ligar a conexão está
          no arquivo <span className="font-semibold text-parch">CONFIGURACAO.md</span> do
          repositório.
        </p>
      </Panel>
    )
  }

  /* ---------- Ainda não entrou ---------- */
  if (!email) {
    const conectar = async () => {
      setEntrando(true)
      setErroLogin(null)
      try {
        await entrar(campoEmail, senha)
        setSenha('')
      } catch (e) {
        setErroLogin(e instanceof Error ? e.message : 'Não deu para entrar.')
      } finally {
        setEntrando(false)
      }
    }

    return (
      <Panel glow="mint" className="mt-4 max-w-lg p-6">
        <p className="hud-label mb-1.5">Conexão entre os celulares</p>
        <p className="mb-4 text-sm leading-relaxed text-parch-dim">
          Entrem com a <span className="font-semibold text-parch">mesma conta do casal</span> nos
          dois aparelhos. A partir daí, o que um escrever aparece no outro.
        </p>

        <label className="hud-label mb-1.5 block">E-mail do casal</label>
        <input
          type="email"
          inputMode="email"
          autoComplete="username"
          value={campoEmail}
          onChange={(e) => setCampoEmail(e.target.value)}
          className="field mb-3"
        />

        <label className="hud-label mb-1.5 block">Senha</label>
        <input
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && campoEmail && senha && void conectar()}
          className="field mb-5"
        />

        <div className="flex flex-wrap items-center gap-3">
          <GameButton
            onClick={() => void conectar()}
            disabled={entrando || !campoEmail.trim() || !senha}
          >
            {entrando ? 'Conectando…' : 'Conectar 🔗'}
          </GameButton>
          {erroLogin && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-semibold text-blush-300"
            >
              {erroLogin}
            </motion.span>
          )}
        </div>
      </Panel>
    )
  }

  /* ---------- Conectado ---------- */
  const rotulo = !online
    ? { texto: 'Sem internet', cor: 'text-gold-300', ponto: 'bg-gold-400' }
    : estado === 'sincronizando'
      ? { texto: 'Sincronizando…', cor: 'text-iris-300', ponto: 'bg-iris-400' }
      : estado === 'erro'
        ? { texto: 'Deu problema', cor: 'text-blush-300', ponto: 'bg-blush-400' }
        : { texto: 'Conectado', cor: 'text-mint-300', ponto: 'bg-mint-400' }

  return (
    <Panel glow="mint" className="mt-4 max-w-lg p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="hud-label">Conexão entre os celulares</p>
        <span className={`flex items-center gap-2 text-sm font-semibold ${rotulo.cor}`}>
          <motion.span
            className={`h-2 w-2 rounded-full ${rotulo.ponto}`}
            animate={estado === 'sincronizando' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1.1, repeat: estado === 'sincronizando' ? Infinity : 0 }}
          />
          {rotulo.texto}
        </span>
      </div>

      <dl className="mb-5 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-parch-faint">Conta</dt>
          <dd className="truncate font-semibold text-parch">{email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-parch-faint">Última sincronização</dt>
          <dd className="font-semibold text-parch">
            {ultimaSync ? quandoFoi(ultimaSync) : '—'}
          </dd>
        </div>
        {pendentes > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-parch-faint">Esperando para subir</dt>
            {/* Troca a palavra inteira: "1 alterações" já apareceu aqui antes. */}
            <dd className="font-semibold text-gold-300">
              {pendentes === 1 ? '1 alteração' : `${pendentes} alterações`}
            </dd>
          </div>
        )}
      </dl>

      {erro && <p className="mb-4 text-sm leading-relaxed text-blush-300">{erro}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <GameButton
          variant="soft"
          onClick={() => void sincronizarAgora()}
          disabled={estado === 'sincronizando' || !online}
        >
          Sincronizar agora 🔄
        </GameButton>
        <GameButton variant="ghost" size="sm" onClick={() => void sair()}>
          Desconectar
        </GameButton>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-parch-faint">
        Desconectar não apaga nada: o que está neste celular continua aqui.
      </p>
    </Panel>
  )
}
