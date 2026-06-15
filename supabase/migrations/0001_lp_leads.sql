-- =====================================================================
-- LP de conversão — tabela de leads (projeto Supabase dedicado a leads)
-- Rode no SQL Editor do projeto novo (ex.: "leads-conversao", sa-east-1).
-- Multi-marca: a coluna `brand` (e `source`) separa marca/criador.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.lp_leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  brand               text not null default 'superbet',
  source              text not null default 'lp_superjon',
  nome                text,
  contato             text,           -- e-mail ou ID Superbet
  telefone            text,
  faixa_aposta        text,
  faixa_aposta_label  text,
  tier                text not null default 'standard',
  vip_candidate       boolean not null default false,
  ja_tinha_conta      text,            -- 'sim' | 'nao' | 'criou_agora'
  consentimento       boolean not null default true,
  flow                text not null default 'full',     -- 'full' (com gate) | 'direct'
  status              text not null default 'completo', -- 'completo' | 'parcial' (early-save)
  client_id           text,            -- mesma sessão: casa o parcial com o envio final
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  referrer            text,
  landing_url         text,
  user_agent          text,
  synced_to_sheets    boolean not null default false  -- usado pelo sync com a planilha
);

create index if not exists lp_leads_created_at_idx on public.lp_leads (created_at desc);
create index if not exists lp_leads_brand_source_idx on public.lp_leads (brand, source);
create index if not exists lp_leads_client_id_idx on public.lp_leads (client_id);
create index if not exists lp_leads_unsynced_idx on public.lp_leads (created_at) where synced_to_sheets = false;

-- RLS: a LP grava com a chave pública (anon), mas ninguém LÊ os leads por ela.
alter table public.lp_leads enable row level security;

drop policy if exists "lp_leads public insert" on public.lp_leads;
create policy "lp_leads public insert"
  on public.lp_leads for insert to anon with check (true);

-- Usuários autenticados (painel/CRM no mesmo projeto, se houver) podem ler.
drop policy if exists "lp_leads authenticated read" on public.lp_leads;
create policy "lp_leads authenticated read"
  on public.lp_leads for select to authenticated using (true);
