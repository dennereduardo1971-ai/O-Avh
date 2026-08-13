# Sons do Refúgio

Solte aqui os arquivos de som e eles passam a tocar no lugar dos sintetizados.
**Nada aqui é obrigatório**: sem arquivo nenhum, o app sintetiza os sons e
funciona igual (é como está hoje).

| Arquivo | Onde toca | O que procurar |
|---|---|---|
| `ploc` | plástico bolha | estouro curto, seco, menos de 1 s ("bubble pop") |
| `gota` | lago de ondas, a cada toque | pingo isolado caindo n'água ("water drop") |
| `agua` | lago de ondas, ao fundo | água corrente/ondas, **em laço**, 10 a 30 s |
| `respirar` | esfera da respiração | acorde/pad contínuo e calmo, **em laço**, 4 a 10 s |

Extensões aceitas: `.mp3`, `.ogg` ou `.wav` — use o nome exato da tabela, sem
acento (ex.: `gota.mp3`).

## O que importa na escolha

- **`agua` e `respirar` tocam em laço.** Procure algo marcado como *loop* /
  *seamless*, senão dá um estalo audível a cada volta. Se o arquivo tiver
  silêncio no começo ou no fim, corte antes de colocar aqui.
- **`ploc` e `gota` precisam ser secos**, sem silêncio na frente: qualquer
  sobra atrasa o som em relação ao toque na tela e quebra a sensação.
- **Peso.** Some tudo e tente ficar abaixo de ~1 MB. Esses arquivos entram no
  cache offline do app e são baixados no celular. `.mp3` a 128 kbps mono já
  basta — é som ambiente, não música.
- **Licença.** Use som livre de direitos (CC0 / domínio público). Pixabay
  Sounds, Freesound (filtrando por CC0) e Mixkit têm bastante água e bolha.

## Como o app usa

O Vite monta a lista **na hora do build** (`import.meta.glob` em
`src/lib/audio.ts`), então:

- arquivo que não existe não vira requisição perdida nem 404 no console;
- arquivo novo só entra no ar depois de um `git push` (o deploy reconstrói);
- no artifact de HTML único não há como carregar arquivo externo, então lá o
  som volta a ser o sintetizado — junto com as outras limitações do artifact
  (sem offline, sem push).

Se um som ficar alto ou baixo demais, o ganho de cada um está em
`src/lib/audio.ts`: `tocarAmostra(nome, taxa, ganho)` para os curtos e o
`exponentialRampToValueAtTime` de `iniciarAmbiente` / `tomDeRespiracao` para os
que tocam em laço.
