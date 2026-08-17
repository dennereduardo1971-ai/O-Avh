/*
 * Service worker do Nosso Cantinho.
 *
 * Faz duas coisas:
 *   1. deixa o app abrir sem internet (cache do que já foi baixado);
 *   2. recebe as notificações push e mostra o aviso no celular.
 *
 * Este arquivo fica em public/, ou seja, é copiado cru para o build — o Vite
 * não mexe nele. Por isso nada aqui pode depender de import/bundler, e todos
 * os caminhos são resolvidos em relação ao escopo (self.registration.scope),
 * que no GitHub Pages é /O-Avh/ e em dev é /.
 */

// Muda sozinha a cada deploy (o workflow substitui __BUILD_ID__ pelo hash do
// commit). Isso não é enfeite: sem isso, um navegador que caísse no cache
// offline ficaria preso pra sempre na página de um deploy antigo, que
// referencia um arquivo .js que o deploy seguinte já apagou — tela em branco.
// Bumping manual falhou uma vez (a versão nunca subiu); agora é automático.
const VERSAO = 'cantinho-__BUILD_ID__'

const escopo = new URL(self.registration.scope)
const INDEX = new URL('index.html', escopo).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll([escopo.pathname, INDEX]))
      // Se um dos dois falhar (offline no primeiro acesso, por exemplo) não
      // faz sentido abortar a instalação: o cache se enche em runtime.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== escopo.origin) return

  // Navegação (abrir o app): tenta a rede primeiro para pegar deploy novo,
  // e cai no index.html guardado se estiver sem internet.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone()
          caches.open(VERSAO).then((cache) => cache.put(INDEX, copia))
          return resp
        })
        .catch(() => caches.match(INDEX).then((r) => r ?? caches.match(escopo.pathname))),
    )
    return
  }

  // Demais arquivos (JS/CSS com hash no nome, ícones): o conteúdo nunca muda
  // para uma mesma URL, então o cache vem primeiro.
  event.respondWith(
    caches.match(req).then((emCache) => {
      if (emCache) return emCache
      return fetch(req).then((resp) => {
        if (resp.ok && resp.type === 'basic') {
          const copia = resp.clone()
          caches.open(VERSAO).then((cache) => cache.put(req, copia))
        }
        return resp
      })
    }),
  )
})

/* ------------------------------------------------------------------ */
/* Notificações                                                        */
/* ------------------------------------------------------------------ */

// Um "toque" diferente por área, para o casal sentir a diferença sem olhar
// pro celular — dois toquezinhos curtos e um longo pro recadinho lembra
// batida de coração; o resto é mais neutro. Só vale em quem suporta
// vibração (Android; iOS e desktop ignoram, sem quebrar nada).
const VIBRACOES = {
  recadinho: [90, 60, 90, 60, 220],
  missao: [140, 90, 140],
  tesouro: [60, 40, 60, 40, 60],
  aventura: [80, 50, 80, 50, 80, 50, 160],
  padrao: [120],
}

// Quando dá pra agrupar (ver mais abaixo), a notificação some ser "3 avisos
// soltos" e vira uma frase só — mais parecido com o que apps de mensagem
// modernos fazem.
const FRASES_DE_GRUPO = {
  recadinho: (n) => `${n} recadinhos novos esperando por você 💌`,
  missao: (n) => `${n} missões concluídas enquanto você não olhava ⚔️`,
  tesouro: (n) => `${n} novidades no Tesouro 💎`,
  aventura: (n) => `${n} novidades no mapa de vocês 🗺️`,
}

/**
 * O crachá no ícone do app (Badging API): mostra quantos avisos ainda não
 * foram vistos, sem precisar abrir o app pra saber que tem novidade. É
 * melhor-esforço de propósito — nem todo navegador tem `setAppBadge`
 * (iOS só a partir do 16.4, instalado na tela de início), e uma falha aqui
 * não pode impedir a notificação em si de aparecer.
 */
async function atualizarCracha() {
  if (!('setAppBadge' in self.navigator)) return
  try {
    const abertas = await self.registration.getNotifications()
    if (abertas.length > 0) await self.navigator.setAppBadge(abertas.length)
    else await self.navigator.clearAppBadge()
  } catch {
    // best-effort, ver comentário acima
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let dados = {}
      try {
        dados = event.data ? event.data.json() : {}
      } catch {
        dados = { corpo: event.data ? event.data.text() : '' }
      }

      const tag = dados.tag || 'cantinho'

      // Agrupamento: se já existe um aviso desta mesma área ainda não visto,
      // este push vira uma continuação dele (mesmo `tag`, substitui na tela)
      // em vez de empilhar. `contagem` viaja escondida em `data` para o
      // próximo push saber que já estava em 2, 3... Some para 1 assim que o
      // casal vê ou descarta o aviso, porque aí ele já não está mais na lista
      // de notificações abertas.
      const existentes = await self.registration.getNotifications({ tag })
      const contagem = (existentes[0]?.data?.contagem ?? 0) + 1

      const titulo = dados.titulo || 'Nosso Cantinho'
      const corpo =
        contagem > 1
          ? (FRASES_DE_GRUPO[tag]?.(contagem) ?? `${contagem} novidades esperando por você 💞`)
          : dados.corpo || 'Tem novidade esperando por você 💞'

      // Ação principal muda com o contexto — retribuir um recadinho ou
      // agradecer uma missão/aventura direto da notificação, sem digitar do
      // zero. "Ver" está sempre presente como saída neutra.
      const acoes = [{ action: 'ver', title: '👀 Ver' }]
      if (dados.acaoRapida === 'curtir') acoes.unshift({ action: 'curtir', title: '❤️ Retribuir' })
      if (dados.acaoRapida === 'rascunho') acoes.unshift({ action: 'rascunho', title: '💌 Agradecer' })

      await self.registration.showNotification(titulo, {
        body: corpo,
        icon: new URL('icone-192.png', escopo).href,
        badge: new URL('icone-192.png', escopo).href,
        lang: 'pt-BR',
        tag,
        renotify: true,
        vibrate: VIBRACOES[tag] || VIBRACOES.padrao,
        timestamp: Date.now(),
        actions: acoes,
        data: {
          rota: dados.rota || '/',
          itemId: dados.itemId,
          rascunho: dados.rascunho,
          contagem,
        },
      })

      await atualizarCracha()
    })(),
  )
})

self.addEventListener('notificationclose', (event) => {
  // Descartar sem tocar também conta como "visto" — o crachá precisa
  // acompanhar, senão fica um número parado que não bate com nada.
  event.waitUntil(atualizarCracha())
})

self.addEventListener('notificationclick', (event) => {
  const dados = event.notification.data || {}
  event.notification.close()

  // A ação escolhida decide o destino: retribuir um recadinho ou agradecer
  // uma missão/aventura leva direto para o Recadinhos já preparado, em vez de
  // só abrir a área e deixar o casal repetir o caminho na mão.
  let destino
  if (event.action === 'curtir' && dados.itemId) {
    destino = new URL(`#/mensagens?curtir=${encodeURIComponent(dados.itemId)}`, escopo).href
  } else if (event.action === 'rascunho' && dados.rascunho) {
    destino = new URL(`#/mensagens?rascunho=${encodeURIComponent(dados.rascunho)}`, escopo).href
  } else {
    destino = new URL(`#${dados.rota || '/'}`, escopo).href
  }

  event.waitUntil(
    Promise.all([
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
        // Se o app já estiver aberto, leva a janela existente para a rota certa
        // em vez de abrir uma segunda cópia.
        for (const janela of janelas) {
          if (janela.url.startsWith(escopo.href)) {
            return janela.focus().then((j) => (j && 'navigate' in j ? j.navigate(destino) : j))
          }
        }
        return self.clients.openWindow(destino)
      }),
      atualizarCracha(),
    ]),
  )
})
