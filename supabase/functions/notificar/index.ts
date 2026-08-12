/*
 * Envia a notificação push para o *outro* celular do casal.
 *
 * Quem chama isto é um Database Webhook do Supabase, disparado quando uma
 * linha da tabela `itens` é criada ou alterada. O passo a passo de configuração
 * está em CONFIGURACAO.md, na raiz do repositório.
 *
 * Roda no Deno (Edge Functions), não no navegador — por isso os imports com
 * `npm:` e `jsr:`.
 */
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface Corpo {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  record: LinhaItem | null
  old_record: LinhaItem | null
}

interface LinhaItem {
  casal_id: string
  area: string
  item_id: string
  conteudo: Record<string, unknown> | null
  removido: boolean
  dispositivo: string | null
  silencioso: boolean
}

interface Aviso {
  titulo: string
  corpo: string
  rota: string
  tag: string
}

const dinheiro = (valor: unknown) =>
  typeof valor === 'number'
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : ''

/**
 * Decide se esta mudança merece apitar no bolso de alguém — e o que dizer.
 *
 * O critério é conservador de propósito: notificação demais vira barulho e a
 * pessoa desliga tudo. Curtida em recadinho, edição de missão e marcação de
 * humor não avisam nada.
 */
function montarAviso(
  tipo: Corpo['type'],
  linha: LinhaItem,
  anterior: LinhaItem | null,
  nomes: Record<string, string>,
): Aviso | null {
  const c = linha.conteudo ?? {}
  const antes = anterior?.conteudo ?? null
  const titulo = typeof c.title === 'string' ? c.title : ''

  switch (linha.area) {
    case 'mensagens': {
      // Só na criação: sem isto, cada coração dado num recadinho antigo
      // dispararia um aviso de "recadinho novo".
      if (tipo !== 'INSERT') return null
      const autor = typeof c.from === 'string' ? nomes[c.from] : ''
      return {
        titulo: 'Recadinho novo 💌',
        corpo: autor ? `${autor} deixou algo carinhoso pra você.` : 'Tem carinho novo esperando.',
        rota: '/mensagens',
        tag: 'recadinho',
      }
    }

    case 'tarefas': {
      const concluiu = c.done === true && (antes === null || antes.done !== true)
      if (!concluiu) return null
      return {
        titulo: 'Missão concluída ⚔️',
        corpo: titulo ? `“${titulo}” saiu da lista.` : 'Mais uma missão fora da lista.',
        rota: '/tarefas',
        tag: 'missao',
      }
    }

    case 'financas': {
      if (tipo !== 'INSERT') return null
      const descricao = typeof c.description === 'string' ? c.description : 'Lançamento'
      const eReceita = c.type === 'receita'
      return {
        titulo: eReceita ? 'Entrou no Tesouro 💎' : 'Saiu do Tesouro 💎',
        corpo: `${descricao} — ${dinheiro(c.amount)}`.trim(),
        rota: '/financas',
        tag: 'tesouro',
      }
    }

    case 'lazer': {
      const virouFeito = c.status === 'feito' && (antes === null || antes.status !== 'feito')
      if (virouFeito) {
        return {
          titulo: 'Aventura vivida 🎉',
          corpo: titulo ? `“${titulo}” — feito!` : 'Mais uma aventura no mapa de vocês.',
          rota: '/lazer',
          tag: 'aventura',
        }
      }
      if (tipo !== 'INSERT') return null
      return {
        titulo: 'Aventura nova 🗺️',
        corpo: titulo ? `“${titulo}” entrou no mapa.` : 'Tem ideia nova no mapa.',
        rota: '/lazer',
        tag: 'aventura',
      }
    }

    // O humor é registro pessoal do dia; aparece no Painel sem interromper.
    default:
      return null
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-segredo') !== Deno.env.get('SEGREDO_WEBHOOK')) {
    return new Response('não autorizado', { status: 401 })
  }

  const { type, record, old_record }: Corpo = await req.json()
  if (!record || record.removido || record.silencioso) {
    return new Response(JSON.stringify({ enviadas: 0, motivo: 'nada a avisar' }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    // A service role ignora o RLS: esta função precisa ler as assinaturas dos
    // dois aparelhos, e ela roda no servidor, nunca no navegador.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: perfil } = await sb
    .from('estado')
    .select('conteudo')
    .eq('casal_id', record.casal_id)
    .eq('chave', 'perfil')
    .maybeSingle()

  const nomes = ((perfil?.conteudo as { names?: Record<string, string> } | null)?.names ?? {
    p1: 'Alguém',
    p2: 'Alguém',
  }) as Record<string, string>

  const aviso = montarAviso(type, record, old_record, nomes)
  if (!aviso) {
    return new Response(JSON.stringify({ enviadas: 0, motivo: 'mudança não notificável' }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  // Todos os aparelhos do casal, menos o que acabou de escrever — ninguém
  // precisa ser avisado do próprio recadinho.
  let consulta = sb.from('dispositivos').select('dispositivo, assinatura').eq('casal_id', record.casal_id)
  if (record.dispositivo) consulta = consulta.neq('dispositivo', record.dispositivo)
  const { data: dispositivos } = await consulta

  if (!dispositivos?.length) {
    return new Response(JSON.stringify({ enviadas: 0, motivo: 'nenhum aparelho inscrito' }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:nosso@cantinho.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const carga = JSON.stringify(aviso)
  let enviadas = 0

  for (const alvo of dispositivos) {
    try {
      await webpush.sendNotification(alvo.assinatura, carga)
      enviadas++
    } catch (erro) {
      // 404/410 = o navegador descartou a inscrição (app desinstalado, permissão
      // revogada). Limpar aqui evita tentar de novo para sempre.
      const status = (erro as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await sb
          .from('dispositivos')
          .delete()
          .eq('casal_id', record.casal_id)
          .eq('dispositivo', alvo.dispositivo)
      } else {
        console.error('falha ao notificar', alvo.dispositivo, erro)
      }
    }
  }

  return new Response(JSON.stringify({ enviadas }), {
    headers: { 'content-type': 'application/json' },
  })
})
