// Gera um único arquivo HTML autocontido (JS + CSS inline) a partir do
// build de produção, para publicar como Artifact de teste rápido.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const distDir = new URL('../dist', import.meta.url).pathname
const assetsDir = join(distDir, 'assets')
const files = readdirSync(assetsDir)

const jsFile = files.find((f) => f.endsWith('.js'))
const cssFile = files.find((f) => f.endsWith('.css'))
if (!jsFile || !cssFile) throw new Error('build incompleto: js ou css não encontrados em dist/assets')

let js = readFileSync(join(assetsDir, jsFile), 'utf8').replaceAll('</script', '<\\/script')
const css = readFileSync(join(assetsDir, cssFile), 'utf8')

// Mídia (imagens, vídeo dos sons/ilustrações) vira URL relativa tipo
// "/assets/arquivo-hash.png" no bundle — fora de um HTML único isso é
// link quebrado, não existe servidor pra responder. Embute como data URI
// direto no JS: mesmo texto que a Vite gerou, só troca o valor da string.
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webm': 'video/webm', '.svg': 'image/svg+xml' }
const midias = files.filter((f) => f !== jsFile && f !== cssFile)
for (const nome of midias) {
  const mime = MIME[extname(nome)]
  if (!mime) continue // tipo desconhecido: deixa como está em vez de arriscar
  const b64 = readFileSync(join(assetsDir, nome)).toString('base64')
  const antes = js.length
  js = js.replaceAll(`/assets/${nome}`, `data:${mime};base64,${b64}`)
  if (js.length === antes) console.warn(`aviso: ${nome} não foi referenciado no bundle (sobrou sem uso?)`)
}

const html = `<title>Nosso Cantinho</title>
<meta name="theme-color" content="#05040d" />
<meta name="color-scheme" content="dark" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`

writeFileSync(new URL('../artifact.html', import.meta.url), html)
console.log(`artifact.html gerado (${(html.length / 1024).toFixed(0)} KB)`)
