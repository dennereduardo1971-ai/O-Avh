/*
 * Gera o par de chaves VAPID usado pelas notificações.
 *
 * Rode com:  node scripts/gerar-vapid.mjs
 *
 * Não precisa instalar nada: usa só o `crypto` que já vem no Node. Uma chave
 * VAPID é um par de chaves na curva P-256 — a pública vai para o app (é
 * pública mesmo), a privada fica só no servidor do Supabase.
 */
import { generateKeyPairSync } from 'node:crypto'

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const jwk = privateKey.export({ format: 'jwk' })

// O navegador espera a chave pública como o ponto da curva sem compressão:
// o byte 0x04 seguido das coordenadas X e Y.
const publica = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(jwk.x, 'base64url'),
  Buffer.from(jwk.y, 'base64url'),
]).toString('base64url')

// A privada é o escalar `d`, que o JWK já entrega em base64url.
const privada = jwk.d

console.log(`
Chaves VAPID geradas. Guarde as duas — a privada não dá para recuperar depois.

  VAPID_PUBLIC_KEY   (vai no app e no Supabase)
  ${publica}

  VAPID_PRIVATE_KEY  (só no Supabase — nunca no app, nunca no git)
  ${privada}

Onde colocar cada uma está em CONFIGURACAO.md, passo 5.
`)
