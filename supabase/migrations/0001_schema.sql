-- KANTON — estrutura do catálogo
-- Rode no SQL Editor do Supabase, na ordem: 0001, depois 0002.

create extension if not exists "pgcrypto";

create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  ordem int default 0,
  ativo boolean default true
);

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  slug text unique not null,
  descricao text,
  marca text,
  preco numeric(10, 2),
  preco_promocional numeric(10, 2),
  categoria_id uuid references categorias (id) on delete set null,
  tamanhos text[] default '{}',
  cores text[] default '{}',
  destaque boolean default false,
  ativo boolean default true,
  ordem int default 0,
  created_at timestamptz default now()
);

create table if not exists produto_imagens (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references produtos (id) on delete cascade,
  url text not null,
  alt text,
  ordem int default 0
);

create table if not exists config (
  chave text primary key,
  valor text
);

create index if not exists produtos_categoria_idx on produtos (categoria_id);
create index if not exists produtos_ordem_idx on produtos (ordem);
create index if not exists imagens_produto_idx on produto_imagens (produto_id, ordem);

-- ─────────────────────────────────────────────────────────────
-- RLS: leitura pública só do que está ativo; escrita só com sessão.
-- ─────────────────────────────────────────────────────────────
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table produto_imagens enable row level security;
alter table config enable row level security;

drop policy if exists "categorias visíveis" on categorias;
create policy "categorias visíveis" on categorias
  for select using (ativo = true);

drop policy if exists "categorias — escrita autenticada" on categorias;
create policy "categorias — escrita autenticada" on categorias
  for all to authenticated using (true) with check (true);

drop policy if exists "produtos visíveis" on produtos;
create policy "produtos visíveis" on produtos
  for select using (ativo = true);

drop policy if exists "produtos — escrita autenticada" on produtos;
create policy "produtos — escrita autenticada" on produtos
  for all to authenticated using (true) with check (true);

-- imagem aparece se a peça dela aparece
drop policy if exists "imagens visíveis" on produto_imagens;
create policy "imagens visíveis" on produto_imagens
  for select using (
    exists (
      select 1 from produtos p
      where p.id = produto_imagens.produto_id and p.ativo = true
    )
  );

drop policy if exists "imagens — escrita autenticada" on produto_imagens;
create policy "imagens — escrita autenticada" on produto_imagens
  for all to authenticated using (true) with check (true);

drop policy if exists "config visível" on config;
create policy "config visível" on config for select using (true);

drop policy if exists "config — escrita autenticada" on config;
create policy "config — escrita autenticada" on config
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- Storage: bucket público para leitura, escrita só com sessão.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos visíveis" on storage.objects;
create policy "fotos visíveis" on storage.objects
  for select using (bucket_id = 'produtos');

drop policy if exists "fotos — envio autenticado" on storage.objects;
create policy "fotos — envio autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos');

drop policy if exists "fotos — troca autenticada" on storage.objects;
create policy "fotos — troca autenticada" on storage.objects
  for update to authenticated using (bucket_id = 'produtos');

drop policy if exists "fotos — remoção autenticada" on storage.objects;
create policy "fotos — remoção autenticada" on storage.objects
  for delete to authenticated using (bucket_id = 'produtos');
