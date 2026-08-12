# Ligando a conexão entre os dois celulares

Por padrão o Nosso Cantinho guarda tudo **só no aparelho**: o que você escreve
no seu celular não aparece no da Sara. Este guia liga a sincronização e os
avisos no celular.

Tudo aqui é de graça — o plano gratuito do Supabase sobra para um casal.

**Dá para parar no meio.** Os passos 1 a 4 já fazem a sincronização funcionar.
Os passos 5 a 7 são só para as notificações; se pular, o app funciona igual, só
não apita.

> Enquanto nada disso for feito, o app continua funcionando normalmente em modo
> local. Nada quebra por não ter sido configurado.

---

## Antes de começar

Só uma coisa importante para entender, porque muda o resto:

**Vocês dois entram na _mesma_ conta.** Não é uma conta para você e outra para a
Sara — é uma conta do casal, com um e-mail e uma senha que os dois usam. É ela
que define de quem são os dados. Por isso, mais adiante, você vai criar **um**
usuário só.

---

## Passo 1 — Criar o projeto no Supabase

1. Entre em <https://supabase.com> e crie uma conta (dá para entrar com o
   GitHub).
2. Clique em **New project**.
3. Preencha:
   - **Name**: `nosso-cantinho` (ou o que quiser)
   - **Database Password**: gere uma e guarde — você não vai precisar dela no
     dia a dia, mas não dá para recuperar depois
   - **Region**: escolha a mais perto do Brasil (`South America (São Paulo)`)
4. Confirme e espere uns dois minutos até o projeto ficar pronto.

---

## Passo 2 — Criar as tabelas

1. No menu lateral, abra o **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo [`supabase/esquema.sql`](supabase/esquema.sql) deste
   repositório, copie **todo** o conteúdo e cole no editor.
4. Clique em **Run**.

Deve aparecer *Success. No rows returned* — é isso mesmo, o script cria coisas,
não devolve linhas. Rodar de novo por engano não faz mal.

Isso cria as três tabelas, liga a proteção que faz cada conta enxergar só os
próprios dados, e liga o tempo real (o que faz a mudança aparecer no outro
celular na hora, sem precisar recarregar).

---

## Passo 3 — Criar a conta do casal

1. No menu lateral: **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. Preencha um e-mail e uma senha que vocês dois vão usar.
   - Pode ser um e-mail de verdade seu; ninguém vai mandar nada para ele.
4. **Marque a opção de confirmar o e-mail automaticamente**
   (*Auto Confirm User* / *Confirm email*). Sem isso o login não passa, porque a
   conta fica esperando uma confirmação que nunca vai chegar.
5. Clique em **Create user**.

Guarde esse e-mail e essa senha: é o que vocês vão digitar na tela de Ajustes
dos dois celulares.

---

## Passo 4 — Ligar o app no projeto

Primeiro pegue as duas chaves:

1. No menu lateral: **Project Settings** → **API**.
2. Anote:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - **anon public** (chave pública) — um texto longo começando com `eyJ...`

> A chave `anon` é **pública de propósito** — ela vai dentro do app, que roda no
> navegador de vocês. Quem protege os dados é a senha da conta do casal mais as
> regras que o passo 2 criou. Só não compartilhe a chave `service_role`, essa
> sim é secreta.

Agora coloque as chaves no GitHub, para o site publicado passar a usá-las:

1. Abra o repositório no GitHub → **Settings** → **Secrets and variables** →
   **Actions**.
2. Clique em **New repository secret** e crie estes dois:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | a **Project URL** |
   | `VITE_SUPABASE_ANON_KEY` | a chave **anon public** |

3. Vá em **Actions**, abra o fluxo **Deploy no GitHub Pages** e clique em
   **Run workflow** para publicar de novo já com as chaves.

**Pronto — a sincronização já funciona.** Abra o app nos dois celulares, vá em
**Ajustes → Conexão entre os celulares**, entre com a conta do casal nos dois, e
escreva um recadinho num deles para ver aparecer no outro.

### Para testar na sua máquina também (opcional)

Crie um arquivo `.env` na raiz do projeto (ele é ignorado pelo git):

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

E rode `npm run dev`.

---

## Passo 5 — Gerar as chaves das notificações

Daqui em diante é só para os avisos no celular.

Na pasta do projeto, rode:

```bash
node scripts/gerar-vapid.mjs
```

Ele imprime duas chaves. Guarde as duas — a privada não dá para recuperar.

- A **pública** identifica o app para o navegador.
- A **privada** é o que prova que o aviso veio de vocês. Ela fica **só** no
  Supabase: nunca no app, nunca no git.

Adicione a pública como mais um secret no GitHub (mesmo caminho do passo 4):

| Nome | Valor |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | a chave **pública** |

---

## Passo 6 — Publicar a função que envia os avisos

Essa função é quem decide o que merece apitar e manda o aviso para o **outro**
celular (nunca para quem acabou de escrever).

1. No menu lateral do Supabase: **Edge Functions**.
2. Crie uma função nova chamada exatamente **`notificar`**.
3. Cole o conteúdo de
   [`supabase/functions/notificar/index.ts`](supabase/functions/notificar/index.ts)
   e publique (**Deploy**).

> Preferindo o terminal, com a [CLI do Supabase](https://supabase.com/docs/guides/cli)
> instalada: `supabase functions deploy notificar`.

Agora as senhas que a função precisa. Em **Edge Functions** → **Secrets**
(ou **Project Settings** → **Edge Functions**), crie:

| Nome | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | a chave **pública** do passo 5 |
| `VAPID_PRIVATE_KEY` | a chave **privada** do passo 5 |
| `VAPID_SUBJECT` | `mailto:` + seu e-mail (ex.: `mailto:voce@gmail.com`) |
| `SEGREDO_WEBHOOK` | uma senha qualquer que você invente — só precisa ser igual no passo 7 |

O `SUPABASE_URL` e o `SUPABASE_SERVICE_ROLE_KEY` a função já recebe sozinha; não
precisa criar.

O `SEGREDO_WEBHOOK` existe para ninguém de fora conseguir disparar notificações
no celular de vocês chamando o endereço da função na mão.

---

## Passo 7 — Avisar a função quando algo mudar

1. No menu lateral: **Database** → **Webhooks** → **Create a new hook**.
2. Preencha:
   - **Name**: `avisar-o-outro`
   - **Table**: `itens`
   - **Events**: marque **Insert** e **Update**
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://SEU-PROJETO.supabase.co/functions/v1/notificar`
   - **HTTP Headers**: adicione um cabeçalho
     - nome `x-segredo`, valor: **a mesma senha** que você pôs em
       `SEGREDO_WEBHOOK`
3. Salve.

---

## Passo 8 — Ligar os avisos em cada celular

O aviso é ligado **em cada aparelho, separadamente** — ligar no seu não liga no
da Sara.

Em cada celular:

1. Abra o app publicado.
2. **Instale na tela de início.**
   - **Android/Chrome**: aparece um botão **Instalar** na tela de Ajustes.
   - **iPhone**: toque em **Compartilhar** (o quadradinho com a seta para cima)
     → **Adicionar à Tela de Início**. Depois abra o app **pelo ícone novo**.
3. Vá em **Ajustes** → **Avisos no celular** → **Ligar avisos** e aceite a
   permissão.

> **No iPhone isso não é opcional.** O Safari só entrega notificação para app
> instalado na tela de início — enquanto estiver aberto numa aba do navegador, o
> botão de ligar avisos nem aparece.

---

## O que avisa e o que não avisa

Foi calibrado para não virar barulho — notificação demais faz a pessoa desligar
tudo.

**Avisa:** recadinho novo · missão concluída · lançamento novo no Tesouro ·
aventura nova ou marcada como vivida.

**Não avisa:** curtida em recadinho · edição de missão · marcação de humor ·
qualquer coisa que você mesmo escreveu.

Na primeira sincronização, o histórico que já existia no aparelho sobe em
silêncio — senão o celular da Sara apitaria uma vez por recadinho antigo.

---

## Se algo não funcionar

**"E-mail ou senha do casal não confere"**
Provavelmente o usuário não foi confirmado no passo 3. Em **Authentication** →
**Users**, veja se ele aparece como confirmado; se não, apague e crie de novo
marcando a confirmação automática.

**A tela de Ajustes diz "Ainda não configurada nesta versão do app"**
O site foi publicado sem as chaves. Confira se os secrets do passo 4 têm os
nomes exatos (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e rode o workflow
de novo — os secrets só entram em builds feitos **depois** de criados.

**Conecta, mas nada aparece no outro celular**
Confira se os dois entraram com o **mesmo** e-mail. Em **Table Editor** →
`itens`, veja se as linhas estão chegando: se estiverem, o problema é na volta
(tempo real) — confirme que o passo 2 rodou inteiro, que é onde o tempo real é
ligado.

**Fica "Sem internet" mesmo com internet**
É o comportamento normal quando o celular perde a conexão por um instante. O que
você escreveu fica guardado e sobe sozinho quando a conexão volta — nada se
perde.

**Os avisos não chegam**
1. O app está instalado na tela de início? (obrigatório no iPhone)
2. Em **Edge Functions** → **notificar** → **Logs**, veja se a função está sendo
   chamada. Se não aparece nada, o webhook do passo 7 não está disparando.
3. Se aparece `não autorizado`, o `x-segredo` do webhook está diferente do
   `SEGREDO_WEBHOOK` da função.
4. Se aparece `nenhum aparelho inscrito`, o passo 8 não foi concluído naquele
   celular.

---

## Desligando

Na tela de Ajustes, **Desconectar** volta o app ao modo local. Nada é apagado: o
que está em cada celular continua lá.
