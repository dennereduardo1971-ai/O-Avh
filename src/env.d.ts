/// <reference types="vite/client" />

// Variáveis lidas no build (arquivo .env local ou secrets do GitHub Actions).
// Se estiverem faltando, o app roda igualzinho a antes: tudo local, sem sync
// e sem push. Nada aqui é segredo: a chave "anon" do Supabase é pública por
// projeto e quem protege os dados é o login do casal + as regras RLS.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_VAPID_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
