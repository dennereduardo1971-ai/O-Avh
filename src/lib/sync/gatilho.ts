/**
 * Ponte entre as telas e o motor de sincronização.
 *
 * As telas não conhecem o Supabase: elas só avisam "mudou alguma coisa". Quem
 * estiver conectado no momento decide o que fazer com esse aviso. Assim o app
 * continua funcionando idêntico quando não há sincronização configurada.
 */

let agendarEnvio: (() => void) | null = null

export function definirGatilhoDeEnvio(fn: (() => void) | null) {
  agendarEnvio = fn
}

export function pedirEnvio() {
  agendarEnvio?.()
}
