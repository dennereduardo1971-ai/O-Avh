interface MotivoGlowProps {
  src: string
  className?: string
}

/**
 * Selo/motivo decorativo gerado com fundo preto (mandala, impacto) —
 * `mix-blend-mode: screen` faz o preto sumir contra o fundo escuro do
 * painel e sobra só o brilho do traço, sem precisar recortar a imagem.
 * Não serve para imagem de fundo branco (usar <img> normal com alpha
 * pra essas, como onda-missoes.png e moldura-trofeu.png).
 */
export default function MotivoGlow({ src, className = '' }: MotivoGlowProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute mix-blend-screen select-none ${className}`}
    />
  )
}
