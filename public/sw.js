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

self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = { corpo: event.data ? event.data.text() : '' }
  }

  const titulo = dados.titulo || 'Nosso Cantinho'
  const opcoes = {
    body: dados.corpo || 'Tem novidade esperando por você 💞',
    icon: new URL('icone-192.png', escopo).href,
    badge: new URL('icone-192.png', escopo).href,
    lang: 'pt-BR',
    // Agrupa por área: um recadinho novo substitui o aviso do anterior em vez
    // de empilhar cinco notificações iguais na tela de bloqueio.
    tag: dados.tag || 'cantinho',
    renotify: true,
    data: { rota: dados.rota || '/' },
  }

  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const rota = (event.notification.data && event.notification.data.rota) || '/'
  const destino = new URL(`#${rota}`, escopo).href

  event.waitUntil(
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
  )
})
