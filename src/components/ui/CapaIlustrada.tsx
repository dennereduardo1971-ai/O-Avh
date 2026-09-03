import type { ReactNode } from 'react'

interface CapaIlustradaProps {
  src: string
  children?: ReactNode
  className?: string
}

/**
 * Banner de capa full-bleed para o topo de uma área — a ilustração ocupa
 * a largura toda, com um gradiente escurecendo por cima para o que vier
 * dentro (texto, botão) continuar legível sobre qualquer trecho da
 * imagem. Mesmo tratamento que o vídeo do rio no Lago de ondas.
 */
export default function CapaIlustrada({ src, children, className = '' }: CapaIlustradaProps) {
  return (
    <div
      className={`relative mb-4 h-36 overflow-hidden rounded-2xl border border-white/10 sm:h-44 ${className}`}
    >
      <img src={src} alt="" aria-hidden className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-night-950/35 via-night-950/15 to-night-950/75" />
      {children && <div className="absolute inset-0 flex items-end p-4">{children}</div>}
    </div>
  )
}
