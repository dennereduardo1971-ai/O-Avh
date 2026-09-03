# Prompts para gerar imagens do tema anime — Nosso Cantinho

Guia de apoio para gerar os assets visuais da repaginação. Cobre dois tipos
de imagem: (1) ilustrações originais por área do app e (2) as fotos de vocês
dois estilizadas.

## Antes de gerar — regras que evitam problema depois

- **Nunca cite o nome do anime ou do estúdio no prompt** ("estilo Ufotable",
  "como em Kimetsu no Yaiba", "personagem tipo Tanjiro"). Isso empurra o
  gerador para reproduzir algo protegido por direito autoral/marca. Os
  prompts abaixo já descrevem o *efeito visual* (traço fino, respiração de
  água, paleta noturna) sem citar a obra — é isso que torna a imagem
  original e segura de usar num app pessoal.
- **Peça fundo transparente** sempre que a imagem for um elemento de UI
  (ícone, selo, mascote) — não sobre um fundo do site. Se o serviço não tiver
  a opção nativa, peça "fundo liso de cor sólida fácil de remover" e use
  remove.bg (gratuito) depois.
- **Formato**: PNG para tudo com transparência; para as fotos estilizadas,
  JPG/PNG normal está bom.
- **Resolução**: peça pelo menos 1024×1024 (ou 1536 no lado maior) — dá para
  reduzir depois, mas não para aumentar sem perder qualidade.
- Guarde os arquivos brutos numa pasta separada do repo (ex. `assets-brutos/`
  fora do git) — quem entra no projeto são os arquivos já otimizados que eu
  processar (cortar, comprimir, converter).

---

## 1. Ilustrações originais por área

### Painel (`/`) — referência: sistema de RPG/status
```
Ilustração digital estilo animação japonesa moderna, traço fino e limpo,
sombreamento em células (cel-shading), moldura ornamentada tipo interface
de jogo de RPG com cantos decorados, brilho suave roxo e dourado, fundo
transparente, sem texto, sem personagem — apenas o ornamento da moldura
```

### Missões (`/tarefas`) — referência: técnicas de respiração / elementos
```
Ícone ilustrado estilo animação japonesa, uma onda de água estilizada em
espiral fina e fluida, tom azul-esverdeado translúcido brilhante, traço
energético como se fosse feito de luz, fundo transparente, composição
centralizada, sem texto
```
Variações: trocar "onda de água" por "chama ondulante" (tom laranja/vermelho),
"folha girando ao vento" (tom verde), "relâmpago fino ramificado" (tom violeta)
— um ícone por categoria de missão.

### Tesouro (`/financas`) — referência: selo/contenção de algo valioso
```
Ilustração de um selo circular ornamentado estilo animação japonesa
sobrenatural, padrões geométricos finos gravados, brilho roxo profundo
saindo das bordas, aparência de contrato ou barreira mágica, fundo
transparente, sem texto, sem símbolos de alfabeto real
```

### Recadinhos (`/mensagens`) — referência: tom romântico-melancólico
```
Ilustração estilo animação japonesa romântica, pétalas de flor de cerejeira
caindo devagar, traço delicado, paleta rosa e azul-lavanda suave, luz macia
de entardecer, fundo transparente, sem personagens, apenas as pétalas em
composição diagonal
```

### Refúgio (`/calma`) — referência: cena contemplativa de piano/rio
```
Ilustração estilo animação japonesa contemplativa, ondulações concêntricas
na superfície de um lago à noite refletindo luz de lua, tom azul-petróleo
e prata, atmosfera calma e silenciosa, fundo transparente, sem texto
```

### Arcade (`/diversao`) — referência: energia de batalha/combo
```
Ilustração de efeito de impacto estilo animação japonesa de ação, linhas de
velocidade radiais partindo do centro, fagulhas de energia laranja e roxa,
fundo transparente, composição para sobrepor sobre um botão ou card, sem
texto
```

### Troféus (`/conquistas`) — referência: emblemas de rank
```
Ilustração de emblema/insígnia estilo animação japonesa de RPG, formato de
brasão hexagonal, relevo metálico dourado, fita decorativa curta na base,
brilho de "item raro" ao redor, fundo transparente, sem texto, espaço em
branco no centro para eu inserir um ícone depois
```

---

## 2. Estilizando as fotos de vocês

Para transformar uma foto real em ilustração no mesmo estilo do app (sem
usar nenhum serviço que exija enviar a foto para um banco de dados público —
prefira ferramentas que deixam claro que a imagem não entra em treinamento,
ou gere localmente se tiver Stable Diffusion instalado):

```
Transforme esta foto em uma ilustração estilo animação japonesa moderna,
traço fino e expressivo, sombreamento em células (cel-shading), mantenha a
pose, as roupas e a composição originais da foto, preserve os traços do
rosto de forma reconhecível mas suavizados no estilo, paleta de cores
noturna com tons de rosa, roxo e dourado, iluminação suave e romântica,
fundo desfocado ou removido
```

Dicas:
- Se o serviço aceitar "peso" de quanto seguir a foto original (`image
  strength`/`denoise`), comece em ~0.55–0.65 — baixo demais ignora a foto,
  alto demais some com o estilo.
- Fotos de casal (as duas pessoas juntas, gesto de carinho — mão dada, testa
  encostada) tendem a sair melhor que selfies isoladas, porque preservam a
  composição em vez de precisar inventar uma pose.
- Gere 2–4 variações da mesma foto e escolha a melhor — a primeira raramente
  é a definitiva.
- Depois de escolhida, me passa o arquivo que eu cuido de recortar, otimizar
  o peso (o app tem orçamento de performance/PWA) e encaixar no lugar certo
  (ex.: cabeçalho do Painel, tela de conquista especial, splash do PWA).

---

## 3. Onde gerar (contas necessárias, todas com opção grátis para testar)

| Serviço | Para quê | Observação |
|---|---|---|
| [Leonardo.ai](https://leonardo.ai) | Ilustrações originais + estilização de foto | Free tier diário, sem cartão |
| [LottieFiles](https://lottiefiles.com) | Animação vetorial pronta ou por IA (mascote que se move) | Marketplace tem muito estilo "kawaii/anime"; checar licença de uso pessoal |
| [remove.bg](https://remove.bg) | Remover fundo de imagem que não saiu transparente | Alguns créditos grátis por mês |
| ChatGPT (imagens) / Gemini | Alternativa se já tiver assinatura | Mesmos prompts acima funcionam |

Qualquer um desses serve — o prompt é o que importa, não a ferramenta
específica.
