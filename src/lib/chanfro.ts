/**
 * Clip-path de "janela de status" de RPG japonês: corta os cantos
 * superior-esquerdo e inferior-direito em vez de arredondar. É a forma que
 * substitui o `rounded-2xl` genérico de dashboard no layout novo — usada em
 * todo painel, botão e aba do protótipo.
 */
export function chanfro(corner: number): string {
  return `polygon(${corner}px 0, 100% 0, 100% calc(100% - ${corner}px), calc(100% - ${corner}px) 100%, 0 100%, 0 ${corner}px)`
}
