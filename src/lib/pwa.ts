import { useEffect, useState } from 'react'

/**
 * Instalação do app no celular.
 *
 * O caminho é diferente em cada sistema, e isso importa: no Android o Chrome
 * avisa o site que dá para instalar (evento `beforeinstallprompt`) e o app
 * abre um diálogo nativo. No iPhone não existe esse evento — o único caminho
 * é o usuário usar "Compartilhar → Adicionar à Tela de Início" na mão.
 *
 * E instalar no iPhone não é enfeite: é a única forma de o push funcionar lá.
 */

interface EventoDeInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** O app está rodando instalado (tela cheia), e não numa aba do navegador? */
export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari no iOS não implementa display-mode; usa esta propriedade própria.
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export function ehIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function useInstalacao() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null)
  const [instalado, setInstalado] = useState(estaInstalado)

  useEffect(() => {
    const aoPoderInstalar = (e: Event) => {
      // Sem o preventDefault o Chrome mostra a própria barrinha e o evento
      // se perde — aí o botão dos Ajustes nunca teria o que disparar.
      e.preventDefault()
      setEvento(e as EventoDeInstalacao)
    }
    const aoInstalar = () => {
      setInstalado(true)
      setEvento(null)
    }

    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  const instalar = async () => {
    if (!evento) return false
    await evento.prompt()
    const { outcome } = await evento.userChoice
    setEvento(null)
    return outcome === 'accepted'
  }

  return {
    instalado,
    /** Android/Chrome: dá para abrir o diálogo nativo de instalação. */
    podeInstalar: evento !== null,
    /** iPhone: não dá para automatizar, só explicar o passo a passo. */
    precisaPassoAPasso: !instalado && evento === null && ehIOS(),
    instalar,
  }
}

/**
 * Registra o service worker. Sem ele não há cache offline nem push.
 *
 * `import.meta.env.BASE_URL` já vem com o base do Vite ('/' em dev, '/O-Avh/'
 * no GitHub Pages), e é ele que define o escopo do worker. Registrar com um
 * caminho fixo quebraria no Pages.
 */
export function registrarServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Falha esperada no artifact (HTML único, sem sw.js) e em file://.
      // O app funciona igual, só sem offline e sem push.
    })
  })
}
