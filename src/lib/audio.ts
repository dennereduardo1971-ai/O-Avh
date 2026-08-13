import { useCallback, useEffect } from 'react'
import { useLocalStorage, valorAtual } from './storage'

/**
 * Sons do Refúgio.
 *
 * Funciona em dois níveis: se houver **gravação de verdade** em
 * `src/assets/sons/`, ela toca; se não houver, o som é **sintetizado na hora**
 * pela Web Audio API. O app nunca fica mudo por falta de arquivo, e nenhum
 * arquivo é obrigatório.
 *
 * A síntese não é plano B improvisado: um mp3 de ambiente pesa mais que o app
 * inteiro, precisa entrar no cache do `sw.js` (senão o offline quebra) e não
 * existe dentro do artifact de HTML único. Sintetizado, custa zero byte e o
 * "ploc" sai no mesmo instante do toque.
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
/* Gravações de verdade (opcionais)                                    */
/* ------------------------------------------------------------------ */

/**
 * Solte um arquivo em `src/assets/sons/` com um destes nomes e ele passa a
 * tocar no lugar do sintetizado: `ploc`, `gota`, `agua`, `respirar`
 * (`.mp3`, `.ogg` ou `.wav`).
 *
 * A lista é montada pelo Vite **na hora do build**, não por tentativa e erro
 * em tempo de execução: sem arquivo nenhum, esta lista nasce vazia e o app não
 * dispara uma única requisição perdida — nada de 404 no console de quem abrir
 * o app. `agua` e `respirar` são tocados em laço, então precisam emendar bem.
 */
const ARQUIVOS = import.meta.glob<string>('../assets/sons/*.{mp3,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const CAMINHOS = new Map<string, string>(
  Object.entries(ARQUIVOS).map(([caminho, url]) => [
    caminho.split('/').pop()!.replace(/\.\w+$/, ''),
    url,
  ]),
)

const amostras = new Map<string, AudioBuffer>()
let carregando: Promise<void> | null = null

/**
 * Baixa e decodifica as gravações uma única vez. Se alguma falhar (rede ruim,
 * formato que o navegador não abre), aquele som simplesmente cai para o
 * sintetizado, em vez de ficar mudo.
 */
export function carregarAmostras(): Promise<void> {
  if (carregando) return carregando
  const c = garantirContexto()
  if (!c || CAMINHOS.size === 0) return Promise.resolve()

  carregando = Promise.all(
    [...CAMINHOS].map(async ([nome, url]) => {
      try {
        const resposta = await fetch(url)
        if (!resposta.ok) return
        amostras.set(nome, await c.decodeAudioData(await resposta.arrayBuffer()))
      } catch {
        // Fica com o sintetizado — o app não pode depender do arquivo.
      }
    }),
  ).then(() => undefined)

  return carregando
}

/** Toca uma gravação, se ela existir. Devolve false para a síntese assumir. */
function tocarAmostra(nome: string, taxa = 1, ganho = 1): boolean {
  const buffer = amostras.get(nome)
  if (!buffer) return false
  const a = pronto()
  if (!a) return false

  const { c, saida } = a
  const fonte = c.createBufferSource()
  fonte.buffer = buffer
  fonte.playbackRate.value = taxa

  const volume = c.createGain()
  volume.gain.value = ganho

  fonte.connect(volume).connect(saida)
  fonte.start(c.currentTime)
  return true
}

/* ------------------------------------------------------------------ */
/* Ruídos base da síntese                                              */
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
  // Cada bolha sai num tom um pouco diferente — uma cartela inteira no mesmo
  // tom vira máquina, e o encanto do plástico bolha é justamente ser irregular.
  // Vale para a gravação (velocidade) e para a síntese (frequência).
  if (tocarAmostra('ploc', 0.88 + Math.random() * 0.24)) return

  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime
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
  const alt = Math.min(Math.max(altura, 0), 1)

  // Na gravação a variação vem da velocidade de reprodução: mais rápido soa
  // mais agudo, exatamente como a frequência faz na síntese.
  if (tocarAmostra('gota', 1.25 - alt * 0.5)) return

  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime
  const base = 900 - alt * 420

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

let ambiente: {
  fonte: AudioBufferSourceNode
  ganho: GainNode
  lfo: OscillatorNode | null
} | null = null

/**
 * Conta os pedidos em voo. O ambiente é o único som que começa uma vez só e
 * fica: se ele partisse antes de a gravação da água terminar de baixar, ficaria
 * presa no sintetizado para sempre. Os outros sons se corrigem sozinhos no
 * toque seguinte; este não teria segunda chance.
 */
let pedidoAmbiente = 0

/** Água de fundo, bem baixinha. Entra em dois segundos para não assustar. */
export function iniciarAmbiente() {
  const meu = ++pedidoAmbiente
  void carregarAmostras().then(() => {
    // Saiu da tela ou desligou o som enquanto a gravação baixava.
    if (meu === pedidoAmbiente) iniciarAmbienteAgora()
  })
}

function iniciarAmbienteAgora() {
  if (ambiente) return
  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime

  const gravacao = amostras.get('agua')
  const fonte = c.createBufferSource()
  fonte.buffer = gravacao ?? ruidoDeAgua(c)
  fonte.loop = true

  const ganho = c.createGain()
  ganho.gain.setValueAtTime(0.0001, t)
  // A gravação já vem com a textura pronta; o ruído sintetizado precisa do
  // filtro para deixar de ser chiado. Por isso o nível também difere.
  ganho.gain.exponentialRampToValueAtTime(gravacao ? 0.25 : 0.05, t + 2.2)

  let lfo: OscillatorNode | null = null

  if (gravacao) {
    fonte.connect(ganho).connect(saida)
  } else {
    const filtro = c.createBiquadFilter()
    filtro.type = 'lowpass'
    filtro.frequency.value = 480
    filtro.Q.value = 0.7

    // Um oscilador lentíssimo abre e fecha o filtro: é o vai e vem que separa
    // "onda quebrando" de "chiado de rádio fora do ar".
    lfo = c.createOscillator()
    lfo.frequency.value = 0.08
    const profundidade = c.createGain()
    profundidade.gain.value = 260
    lfo.connect(profundidade).connect(filtro.frequency)

    fonte.connect(filtro).connect(ganho).connect(saida)
    lfo.start(t)
  }

  fonte.start(t)
  ambiente = { fonte, ganho, lfo }
}

export function pararAmbiente() {
  pedidoAmbiente++ // invalida um início que ainda esteja esperando a gravação
  if (!ambiente || !ctx) return
  const { fonte, ganho, lfo } = ambiente
  ambiente = null

  const t = ctx.currentTime
  ganho.gain.cancelScheduledValues(t)
  ganho.gain.setValueAtTime(Math.max(ganho.gain.value, 0.0001), t)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  fonte.stop(t + 0.9)
  lfo?.stop(t + 0.9)
}

/* ------------------------------------------------------------------ */
/* Respiração                                                          */
/* ------------------------------------------------------------------ */

export type FaseDaRespiracao = 'inspire' | 'segure' | 'solte'

let tomAtual: { ganho: GainNode; encerrar: (quando: number) => void } | null = null

/** Corta o tom em curva, nunca no talho — desligar no seco dá um clique. */
export function pararRespiracao() {
  if (!tomAtual || !ctx) return
  const { ganho, encerrar } = tomAtual
  tomAtual = null

  const t = ctx.currentTime
  ganho.gain.cancelScheduledValues(t)
  ganho.gain.setValueAtTime(Math.max(ganho.gain.value, 0.0001), t)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  encerrar(t + 0.2)
}

/**
 * Um tom que acompanha o passo: sobe ao inspirar, desce ao soltar, fica parado
 * ao segurar. A ideia é poder fechar os olhos e ainda saber em que fase está,
 * sem depender de olhar a esfera.
 *
 * O passo dura de 4 a 8 segundos conforme o padrão escolhido, então nem a
 * gravação nem a síntese podem ter duração fixa: a gravação toca em laço com
 * a velocidade subindo ou descendo de leve, e a síntese varre a frequência.
 */
export function tomDeRespiracao(fase: FaseDaRespiracao, segundos: number, alto = true) {
  pararRespiracao()

  const a = pronto()
  if (!a) return
  const { c, saida } = a
  const t = c.currentTime
  const duracao = Math.max(0.6, segundos)
  const pico = fase === 'segure' ? 0.05 : 0.09

  const ganho = c.createGain()
  ganho.gain.setValueAtTime(0.0001, t)
  ganho.gain.exponentialRampToValueAtTime(pico, t + duracao * 0.35)
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao)
  ganho.connect(saida)

  const gravacao = amostras.get('respirar')
  if (gravacao) {
    // Variação pequena de propósito: passar disso vira "fita acelerada".
    const [de, para] =
      fase === 'inspire' ? [0.94, 1.06] : fase === 'solte' ? [1.06, 0.94] : alto ? [1.06, 1.06] : [0.94, 0.94]

    const fonte = c.createBufferSource()
    fonte.buffer = gravacao
    fonte.loop = true
    fonte.playbackRate.setValueAtTime(de, t)
    fonte.playbackRate.linearRampToValueAtTime(para, t + duracao)
    // A gravação chega com o próprio volume; o envelope acima é relativo.
    ganho.gain.cancelScheduledValues(t)
    ganho.gain.setValueAtTime(0.0001, t)
    ganho.gain.exponentialRampToValueAtTime(fase === 'segure' ? 0.3 : 0.5, t + duracao * 0.35)
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao)

    fonte.connect(ganho)
    fonte.start(t)
    tomAtual = { ganho, encerrar: (quando) => fonte.stop(quando) }
    return
  }

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

  osc.connect(filtro)
  harmonico.connect(ganhoHarmonico).connect(filtro)
  filtro.connect(ganho)

  osc.start(t)
  harmonico.start(t)
  osc.stop(t + duracao + 0.1)
  harmonico.stop(t + duracao + 0.1)

  tomAtual = {
    ganho,
    encerrar: (quando) => {
      osc.stop(quando)
      harmonico.stop(quando)
    },
  }
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
    void carregarAmostras()
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
        void carregarAmostras()
      } else {
        pararAmbiente()
        pararRespiracao()
      }
      return proximo
    })
  }, [definir])

  return { ligado, alternar }
}
