import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  comErro: boolean
}

/**
 * Rede de segurança do app inteiro.
 *
 * Sem isto, qualquer exceção síncrona durante a renderização (por exemplo:
 * uma VITE_SUPABASE_URL mal colada no secret do GitHub fazendo o
 * `createClient` do Supabase explodir) derruba a árvore inteira do React e
 * sobra só o fundo escuro do CSS — uma tela preta sem nada, sem F12 no
 * celular pra saber o motivo. Envolve o <App/> lá no main.tsx: mesmo que o
 * SyncProvider (o provider mais externo) quebre, isto ainda pega o erro.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { comErro: false }

  static getDerivedStateFromError() {
    return { comErro: true }
  }

  componentDidCatch(erro: unknown) {
    // eslint-disable-next-line no-console
    console.error('Erro não tratado ao renderizar o Cantinho:', erro)
  }

  render() {
    if (this.state.comErro) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            background: '#05040d',
            color: '#eceafa',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          }}
        >
          <p style={{ fontSize: '2.5rem', margin: 0 }}>💔</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            Algo deu errado ao abrir o Cantinho
          </p>
          <p style={{ fontSize: '0.9rem', color: '#a7a1cc', maxWidth: '26rem', margin: 0 }}>
            Nada foi perdido — o que já está salvo neste aparelho continua aqui. Tenta recarregar
            a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '999px',
              background: '#5eead4',
              color: '#05040d',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
