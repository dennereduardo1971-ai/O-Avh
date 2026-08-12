-- ============================================================
--  Nosso Cantinho — banco de dados da sincronização
--  Cole tudo isto no SQL Editor do Supabase e clique em "Run".
--  Rodar duas vezes não faz mal.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabelas
-- ------------------------------------------------------------

-- Um registro por item (cada recadinho, missão, lançamento, aventura e
-- marcação de humor). Guardar item a item — e não a lista inteira — é o que
-- permite os dois escreverem ao mesmo tempo sem um apagar o outro.
create table if not exists public.itens (
  casal_id      uuid        not null references auth.users (id) on delete cascade,
  area          text        not null,
  item_id       text        not null,
  conteudo      jsonb,
  removido      boolean     not null default false,
  atualizado_em timestamptz not null default now(),
  dispositivo   text,
  silencioso    boolean     not null default false,
  primary key (casal_id, area, item_id)
);

-- O que é um bloco só: estado do jogo (XP, conquistas) e os nomes do casal.
create table if not exists public.estado (
  casal_id      uuid        not null references auth.users (id) on delete cascade,
  chave         text        not null,
  conteudo      jsonb,
  atualizado_em timestamptz not null default now(),
  dispositivo   text,
  primary key (casal_id, chave)
);

-- Um registro por celular inscrito para receber notificação.
create table if not exists public.dispositivos (
  casal_id      uuid        not null references auth.users (id) on delete cascade,
  dispositivo   text        not null,
  assinatura    jsonb       not null,
  atualizado_em timestamptz not null default now(),
  primary key (casal_id, dispositivo)
);

-- ------------------------------------------------------------
-- 2. Segurança: cada conta só enxerga os próprios dados
-- ------------------------------------------------------------
-- Sem isto qualquer pessoa com a chave pública do projeto leria tudo.

alter table public.itens        enable row level security;
alter table public.estado       enable row level security;
alter table public.dispositivos enable row level security;

drop policy if exists "casal cuida dos próprios itens"        on public.itens;
drop policy if exists "casal cuida do próprio estado"         on public.estado;
drop policy if exists "casal cuida dos próprios dispositivos" on public.dispositivos;

create policy "casal cuida dos próprios itens" on public.itens
  for all to authenticated
  using (auth.uid() = casal_id) with check (auth.uid() = casal_id);

create policy "casal cuida do próprio estado" on public.estado
  for all to authenticated
  using (auth.uid() = casal_id) with check (auth.uid() = casal_id);

create policy "casal cuida dos próprios dispositivos" on public.dispositivos
  for all to authenticated
  using (auth.uid() = casal_id) with check (auth.uid() = casal_id);

-- ------------------------------------------------------------
-- 3. Rede lenta não desfaz o que é mais novo
-- ------------------------------------------------------------
-- Se um celular estiver sem sinal e subir uma versão antiga depois que o outro
-- já gravou uma mais nova, a gravação antiga é ignorada em vez de vencer.

create or replace function public.ignorar_escrita_antiga()
returns trigger
language plpgsql
as $$
begin
  if new.atualizado_em < old.atualizado_em then
    return old;  -- devolver OLD faz o UPDATE virar um nada
  end if;
  return new;
end;
$$;

drop trigger if exists itens_ignora_antiga  on public.itens;
drop trigger if exists estado_ignora_antiga on public.estado;

create trigger itens_ignora_antiga
  before update on public.itens
  for each row execute function public.ignorar_escrita_antiga();

create trigger estado_ignora_antiga
  before update on public.estado
  for each row execute function public.ignorar_escrita_antiga();

-- ------------------------------------------------------------
-- 4. Tempo real: a mudança aparece no outro celular na hora
-- ------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.itens;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.estado;
exception when duplicate_object then null;
end $$;
