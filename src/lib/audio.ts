import { useCallback, useEffect } from 'react'
import { useLocalStorage, valorAtual } from './storage'

/**
 * Sons do Refúgio.
 *
 * Tudo é sintetizado na hora pela Web Audio API — não existe um único arquivo
 * de áudio no projeto, e isso é decisão, não preguiça: um mp3 de ambiente
 * pesaria mais que o app inteiro, teria de entrar no cache do service worker
 * (senão o offline quebra) e ainda ser embutido em base64 no artifact de HTML
 * único. Sintetizado, o custo é zero byte, funciona offline de graça e o
 * "ploc" sai no mesmo instante do toque, sem espera de decodificação.
 *
 * Nada toca sozinho: começa desligado e só liga por toque do usuário — que é
 * também o que os navegadores exigem para liberar áudio. Num app cuja proposta
 * é anti-estresse, som que começa sem pedir licença é o oposto do objetivo.
 */

/** Preferência por aparelho: não sobe para a nuvem (ver `casal:perfil.active`). */
const CHAVE = 'casal:som'

let ctx: AudioContext | null = null
let master: GainNode | null = null

export function somLigado(): boolean {
  return valorAtual<boolean>(CHAVE, false) === true
}

function garantirContexto(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
  }
  return ctx
}

/**
 * Portaria de todo som: devolve null quando está desligado ou o navegador não
 * tem áudio. Se o contexto estiver suspenso (aba que voltou do segundo plano),
 * tenta destravar — as chamadas sempre nascem de um toque, que é o gesto que o
 * navegador exige.
 */
function pronto(): { c: AudioContext; saida: GainNode } | null {
  if (!somLigado()) return null
  const c = garantirContexto()
  if (!c || !master) return null
  if (c.state === 'suspended') void c.resume()
  return { c, saida: master }
}

/* ------------------------------------------------------------------ */
/* Ruídos base                                                         */
/* ------------------------------------------------------------------ */

let bufferBranco: AudioBuffer | null = null
let bufferAgua: AudioBuffer | null = null

/** Ruído branco curto — o estalo seco do plástico. */
function ruidoBranco(c: AudioContext): AudioBuffer {
  if (!bufferBranco) {
    const n = Math.floor(c.sampleRate * 0.4)
    bufferBranco = c.createBuffer(1, n, c.sampleRate)
    const dados = bufferBranco.getChannelData(0)
    for (let i = 0; i < n; i++) dados[i] = Math.random() * 2 - 1
  }
  return bufferBranco
}

/**
 * Ruído marrom (grave, sem chiado) — a base da água corrente.
 *
 * Os últimos instantes são misturados com os primeiros: sem essa emenda o
 * laço estala a cada volta, e um clique periódico num som feito para acalmar
 * seria justamente o que mais incomoda.
 */
function ruidoDeAgua(c: AudioContext): AudioBuffer {
  if (!bufferAgua) {
    const n = Math.floor(c.sampleRate * 6)
    bufferAgua = c.createBuffer(1, n, c.sampleRate)
    const dados = bufferAgua.getChannelData(0)

    let anterior = 0
    for (let i = 0; i < n; i++) {
      const branco = Math.random() * 2 - 1
      anterior = (anterior + 0.02 * branco) / 1.02
      dados[i] = anterior * 3.5
    }

    const emenda = Math.floor(c.sampleRate * 0.25)
    for (let i = 0; i < emenda; i++) {
      const k = i / emenda
      dados[n - emenda + i] = dados[n - emenda + i] * (1 - k) + dados[i] * k
    }
  }
  return bufferAgua
}

/* ------------------------------------------------------------------ */
/* Plástico bolha                                                      */
/* ------------------------------------------------------------------ */

/** O "ploc": um estalo seco por cima de um corpo que despenca de agudo a grave. */
export function ploc() {
  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime

  // Cada bolha sai num tom um pouco diferente — uma cartela inteira no mesmo
  // tom vira máquina, e o encanto do plástico bolha é justamente ser irregular.
  const base = 560 + Math.random() * 380

  const corpo = c.createOscillator()
  corpo.type = 'sine'
  corpo.frequency.setValueAtTime(base, t)
  corpo.frequency.exponentialRampToValueAtTime(base * 0.3, t + 0.085)

  const ganhoCorpo = c.createGain()
  ganhoCorpo.gain.setValueAtTime(0.0001, t)
  ganhoCorpo.gain.exponentialRampToValueAtTime(0.32, t + 0.005)
  ganhoCorpo.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)

  corpo.connect(ganhoCorpo).connect(saida)
  corpo.start(t)
  corpo.stop(t + 0.15)

  const estalo = c.createBufferSource()
  estalo.buffer = ruidoBranco(c)
  estalo.playbackRate.value = 1.5

  const filtro = c.createBiquadFilter()
  filtro.type = 'bandpass'
  filtro.frequency.value = 1900
  filtro.Q.value = 1.1

  const ganhoEstalo = c.createGain()
  ganhoEstalo.gain.setValueAtTime(0.18, t)
  ganhoEstalo.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)

  estalo.connect(filtro).connect(ganhoEstalo).connect(saida)
  estalo.start(t)
  estalo.stop(t + 0.05)
}

/* ------------------------------------------------------------------ */
/* Lago                                                                */
/* ------------------------------------------------------------------ */

/**
 * Gota d'água. `altura` vai de 0 (topo do lago) a 1 (fundo): tocar mais em
 * cima soa mais agudo, o que faz a superfície inteira responder ao toque em
 * vez de repetir sempre a mesma nota.
 */
export function gota(altura = 0.5) {
  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime

  const base = 900 - Math.min(Math.max(altura, 0), 1) * 420

  // A subida rápida de tom é o que o ouvido reconhece como pingo caindo
  // n'água; descendo soaria como bolha estourando.
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(base * 0.5, t)
  osc.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.09)

  const ganho = c.createGain()
  ganho.gain.setValueAtTime(0.0001, t)
  ganho.gain.exponentialRampToValueAtTime(0.28, t + 0.008)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)

  const filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 2600

  osc.connect(filtro).connect(ganho).connect(saida)
  osc.start(t)
  osc.stop(t + 0.35)
}

let ambiente: { fonte: AudioBufferSourceNode; ganho: GainNode; lfo: OscillatorNode } | null = null

/** Água de fundo, bem baixinha. Entra em dois segundos para não assustar. */
export function iniciarAmbiente() {
  if (ambiente) return
  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime

  const fonte = c.createBufferSource()
  fonte.buffer = ruidoDeAgua(c)
  fonte.loop = true

  const filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 480
  filtro.Q.value = 0.7

  // Um oscilador lentíssimo abre e fecha o filtro: é o vai e vem que separa
  // "onda quebrando" de "chiado de rádio fora do ar".
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.08
  const profundidade = c.createGain()
  profundidade.gain.value = 260
  lfo.connect(profundidade).connect(filtro.frequency)

  const ganho = c.createGain()
  ganho.gain.setValueAtTime(0.0001, t)
  ganho.gain.exponentialRampToValueAtTime(0.05, t + 2.2)

  fonte.connect(filtro).connect(ganho).connect(saida)
  fonte.start(t)
  lfo.start(t)

  ambiente = { fonte, ganho, lfo }
}

export function pararAmbiente() {
  if (!ambiente || !ctx) return
  const { fonte, ganho, lfo } = ambiente
  ambiente = null

  const t = ctx.currentTime
  ganho.gain.cancelScheduledValues(t)
  ganho.gain.setValueAtTime(Math.max(ganho.gain.value, 0.0001), t)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  fonte.stop(t + 0.9)
  lfo.stop(t + 0.9)
}

/* ------------------------------------------------------------------ */
/* Respiração                                                          */
/* ------------------------------------------------------------------ */

export type FaseDaRespiracao = 'inspire' | 'segure' | 'solte'

let tomAtual: { osc: OscillatorNode; harmonico: OscillatorNode; ganho: GainNode } | null = null

/** Corta o tom em curva, nunca no talho — desligar no seco dá um clique. */
export function pararRespiracao() {
  if (!tomAtual || !ctx) return
  const { osc, harmonico, ganho } = tomAtual
  tomAtual = null

  const t = ctx.currentTime
  ganho.gain.cancelScheduledValues(t)
  ganho.gain.setValueAtTime(Math.max(ganho.gain.value, 0.0001), t)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  osc.stop(t + 0.2)
  harmonico.stop(t + 0.2)
}

/**
 * Um tom que acompanha o passo: sobe ao inspirar, desce ao soltar, fica parado
 * ao segurar. A ideia é poder fechar os olhos e ainda saber em que fase está,
 * sem depender de olhar a esfera.
 */
export function tomDeRespiracao(fase: FaseDaRespiracao, segundos: number, alto = true) {
  pararRespiracao()

  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime
  const duracao = Math.max(0.6, segundos)

  const grave = 174
  const agudo = grave * 1.5
  const [de, para] =
    fase === 'inspire'
      ? [grave, agudo]
      : fase === 'solte'
        ? [agudo, grave]
        : alto
          ? [agudo, agudo]
          : [grave, grave]

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(de, t)
  osc.frequency.linearRampToValueAtTime(para, t + duracao)

  // Uma oitava acima, quase inaudível: dá corpo ao tom sem deixá-lo pesado.
  const harmonico = c.createOscillator()
  harmonico.type = 'sine'
  harmonico.frequency.setValueAtTime(de * 2, t)
  harmonico.frequency.linearRampToValueAtTime(para * 2, t + duracao)

  const ganhoHarmonico = c.createGain()
  ganhoHarmonico.gain.value = 0.25

  const filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 900

  const ganho = c.createGain()
  const pico = fase === 'segure' ? 0.05 : 0.09
  ganho.gain.setValueAtTime(0.0001, t)
  ganho.gain.exponentialRampToValueAtTime(pico, t + duracao * 0.35)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao)

  osc.connect(filtro)
  harmonico.connect(ganhoHarmonico).connect(filtro)
  filtro.connect(ganho).connect(saida)

  osc.start(t)
  harmonico.start(t)
  osc.stop(t + duracao + 0.1)
  harmonico.stop(t + duracao + 0.1)

  tomAtual = { osc, harmonico, ganho }
}

/* ------------------------------------------------------------------ */
/* Liga/desliga                                                        */
/* ------------------------------------------------------------------ */

export function useSom() {
  const [ligado, definir] = useLocalStorage<boolean>(CHAVE, false)

  // Quem já tinha o som ligado de uma visita anterior volta com a preferência
  // salva, mas o navegador ainda exige um gesto para liberar o áudio: o
  // primeiro toque na página destrava, sem precisar mexer no botão de novo.
  useEffect(() => {
    if (!ligado) return
    const destravar = () => {
      const c = garantirContexto()
      if (c && c.state === 'suspended') void c.resume()
    }
    window.addEventListener('pointerdown', destravar, { once: true })
    return () => window.removeEventListener('pointerdown', destravar)
  }, [ligado])

  const alternar = useCallback(() => {
    definir((anterior) => {
      const proximo = !anterior
      if (proximo) {
        const c = garantirContexto()
        if (c && c.state === 'suspended') void c.resume()
      } else {
        pararAmbiente()
        pararRespiracao()
      }
      return proximo
    })
  }, [definir])

  return { ligado, alternar }
}
