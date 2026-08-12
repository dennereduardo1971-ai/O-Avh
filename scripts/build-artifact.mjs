// Gera um único arquivo HTML autocontido (JS + CSS inline) a partir do
// build de produção, para publicar como Artifact de teste rápido.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const distDir = new URL('../dist', import.meta.url).pathname
const assetsDir = join(distDir, 'assets')
const files = readdirSync(assetsDir)

const jsFile = files.find((f) => f.endsWith('.js'))
const cssFile = files.find((f) => f.endsWith('.css'))
if (!jsFile || !cssFile) throw new Error('build incompleto: js ou css não encontrados em dist/assets')

const js = readFileSync(join(assetsDir, jsFile), 'utf8').replaceAll('</script', '<\\/script')
const css = readFileSync(join(assetsDir, cssFile), 'utf8')

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
