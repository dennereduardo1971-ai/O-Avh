// Gera os ícones PNG do app (PWA) sem depender de nenhuma biblioteca:
// o PNG é montado na mão com o zlib que já vem no Node.
//
// Rode com `node scripts/gerar-icones.mjs` sempre que quiser mudar o desenho.
// A saída vai para public/ e É COMMITADA — o Vite precisa dela no build, e
// não queremos exigir que o deploy rode este script.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

/* ------------------------------------------------------------------ */
/* Codificador PNG mínimo (RGBA, 8 bits, sem entrelaçamento)          */
/* ------------------------------------------------------------------ */

const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, crc])
}

function codificarPNG(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  // 10, 11, 12 = compressão / filtro / entrelaçamento, todos 0

  // Cada linha do PNG começa com um byte de filtro; 0 = sem filtro.
  const bruto = Buffer.alloc(altura * (1 + largura * 4))
  for (let y = 0; y < altura; y++) {
    const destino = y * (1 + largura * 4)
    bruto[destino] = 0
    rgba.copy(bruto, destino + 1, y * largura * 4, (y + 1) * largura * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(bruto, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ */
/* Desenho do ícone                                                    */
/* ------------------------------------------------------------------ */

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
]

// Mesmos tokens de src/index.css.
const NIGHT_950 = hex('#05040d')
const NIGHT_850 = hex('#0f0c20')
const BLUSH_300 = hex('#ffa8c2')
const BLUSH_500 = hex('#ff5c8a')
const BLUSH_600 = hex('#e63f70')
const IRIS_500 = hex('#8b5cf6')

const mistura = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const limitar = (v, min, max) => Math.min(max, Math.max(min, v))

/** Dentro do coração quando <= 0. Coordenadas em torno de (0,0), y para cima. */
function coracao(x, y) {
  const a = x * x + y * y - 1
  return a * a * a - x * x * y * y * y
}

// A curva acima não é centrada na origem: vai de y ≈ 1,0 (topo) até y ≈ -1,35
// (a ponta). Sem levar isso em conta o desenho fica torto e a ponta escapa da
// imagem — foi o que aconteceu na primeira versão.
const CORACAO_CY = -0.175
const CORACAO_MEIA = 1.175

/**
 * @param {number} tamanho  lado do PNG em pixels
 * @param {number} escala   tamanho do coração; menor no ícone "maskable",
 *                          porque o Android recorta as bordas.
 */
function desenhar(tamanho, escala) {
  const rgba = Buffer.alloc(tamanho * tamanho * 4)
  const AMOSTRAS = 3 // supersampling: suaviza a borda do coração

  // Quanto da imagem o coração ocupa, e onde fica o centro dele.
  const meiaAltura = 0.37 * escala
  const CENTRO_Y = 0.51
  const unidade = CORACAO_MEIA / meiaAltura // unidades do coração por pixel

  for (let py = 0; py < tamanho; py++) {
    for (let px = 0; px < tamanho; px++) {
      // ---- Fundo: céu noturno com duas auroras, como o app ----
      const u = px / tamanho
      const v = py / tamanho
      let cor = mistura(NIGHT_850, NIGHT_950, limitar(v * 1.15, 0, 1))

      const dIris = Math.hypot(u - 0.26, v - 0.24)
      cor = mistura(cor, IRIS_500, limitar(1 - dIris / 0.62, 0, 1) ** 2 * 0.42)

      const dBlush = Math.hypot(u - 0.78, v - 0.8)
      cor = mistura(cor, BLUSH_500, limitar(1 - dBlush / 0.6, 0, 1) ** 2 * 0.34)

      // ---- Brilho difuso atrás do coração ----
      const dCentro = Math.hypot(u - 0.5, v - CENTRO_Y)
      cor = mistura(cor, BLUSH_500, limitar(1 - dCentro / (0.5 * meiaAltura), 0, 1) ** 2.4 * 0.5)

      // ---- Coração, com borda suavizada por supersampling ----
      let cobertura = 0
      let alturaMedia = 0
      for (let sy = 0; sy < AMOSTRAS; sy++) {
        for (let sx = 0; sx < AMOSTRAS; sx++) {
          const ax = (px + (sx + 0.5) / AMOSTRAS) / tamanho
          const ay = (py + (sy + 0.5) / AMOSTRAS) / tamanho
          const hx = (ax - 0.5) * unidade
          const hy = CORACAO_CY + (CENTRO_Y - ay) * unidade
          if (coracao(hx, hy) <= 0) {
            cobertura++
            alturaMedia += ay
          }
        }
      }

      if (cobertura > 0) {
        const t = cobertura / (AMOSTRAS * AMOSTRAS)
        // Gradiente vertical dentro do coração: claro em cima, fundo embaixo.
        const topo = CENTRO_Y - meiaAltura
        const rel = limitar((alturaMedia / cobertura - topo) / (meiaAltura * 2), 0, 1)
        const corpo = rel < 0.5
          ? mistura(BLUSH_300, BLUSH_500, rel * 2)
          : mistura(BLUSH_500, BLUSH_600, (rel - 0.5) * 2)
        cor = mistura(cor, corpo, t)
      }

      const i = (py * tamanho + px) * 4
      rgba[i] = limitar(Math.round(cor[0]), 0, 255)
      rgba[i + 1] = limitar(Math.round(cor[1]), 0, 255)
      rgba[i + 2] = limitar(Math.round(cor[2]), 0, 255)
      rgba[i + 3] = 255
    }
  }

  return codificarPNG(tamanho, tamanho, rgba)
}

const saidas = [
  ['public/icone-192.png', 192, 1],
  ['public/icone-512.png', 512, 1],
  // O Android recorta o ícone "maskable" num círculo/squircle: o desenho
  // precisa caber na zona segura central (~80%), por isso o coração menor.
  ["public/icone-maskable-512.png", 512, 0.74],
  ['public/apple-touch-icon.png', 180, 1],
]

for (const [caminho, tamanho, escala] of saidas) {
  const png = desenhar(tamanho, escala)
  writeFileSync(new URL(`../${caminho}`, import.meta.url), png)
  console.log(`${caminho} — ${tamanho}px, ${(png.length / 1024).toFixed(1)} KB`)
}
