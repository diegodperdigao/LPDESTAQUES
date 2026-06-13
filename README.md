# LP de Conversão — Engine multi-marca

Landing page de captação de leads (mobile-first + desktop). **Núcleo genérico
(engine) + configuração por marca** — replicar para outra marca = nova pasta de
config + assets. Sem framework, sem build obrigatório (HTML/CSS/JS puro).

## Estrutura

```
engine/
  engine.js        # núcleo: fluxo, validação, submit (lê window.BRAND)
  engine.css       # estilos (tokens via CSS vars, sobrescritos pela marca)
brands/
  superjon/
    config.js      # TUDO da marca: tokens, textos, perguntas, links, supabase
    assets/        # logos/imagens da marca
index.html         # shell genérico (carrega config + engine)
supabase/
  migrations/0001_lp_leads.sql   # tabela de leads (rodar no projeto Supabase)
apps-script/Code.gs              # receptor opcional p/ sync Supabase -> Sheets
preview.html       # build self-contained (gerado) p/ preview rápido
```

## Fluxo da LP

```
gate ("Já tem conta?")
  ├─ Sim ─────────────► form
  └─ Não ─► create ("Criar conta", abre cadastro em nova aba) ─► form
form (nome, e-mail/ID, telefone, faixa de aposta, consentimento)
  └─ CTA ─► submitLead() ─► INSERT no Supabase ─► redireciona p/ WhatsApp
```

## Replicar para uma nova marca

1. `cp -r brands/superjon brands/<nova>` e ajuste `config.js` (tokens, textos,
   perguntas, `links`, `supabase`, `brand`, `source`) + troque os `assets/`.
2. Aponte o `index.html` para `./brands/<nova>/config.js` (ou faça um deploy
   separado dessa marca no Cloudflare Pages — recomendado, 1 projeto por marca/domínio).
3. No banco, os leads já vêm separados pela coluna `brand` / `source`.

## Backend (Supabase) — escalável

Os leads são gravados via **PostgREST** (`/rest/v1/lp_leads`) com a chave
**publishable/anon** e RLS **insert-only** (a página grava, mas ninguém lê os
leads pela chave pública). Estático no CDN + insert direto no Postgres aguenta
alto volume.

Setup:
1. Crie um projeto Supabase dedicado a leads (sa-east-1).
2. Rode `supabase/migrations/0001_lp_leads.sql` no SQL Editor.
3. Em `brands/superjon/config.js` → `supabase`: preencha `url` e `anonKey`.

### Sync com Google Sheets (para o marketing)

A fonte da verdade é o Supabase. O Sheets recebe uma cópia via job que lê os
leads com `synced_to_sheets = false`, faz `appendRow` (Apps Script em
`apps-script/Code.gs`) e marca como sincronizado. Agendar via cron (a combinar).

## Deploy (Cloudflare Pages)

- Output: site estático (raiz do repo). Sem build command (ou apenas gerar
  `preview.html` se quiser servir o single-file).
- Conecte o repo no Cloudflare Pages, defina o domínio, pronto — CDN global
  aguenta os picos.

## Config — campos a preencher antes de ir ao ar (`brands/superjon/config.js`)

| Campo | O que é |
|---|---|
| `links.registration` | Link de cadastro da Superbet |
| `links.whatsapp` / `whatsappVip` | Grupo de WhatsApp (e VIP opcional) |
| `supabase.url` / `anonKey` | Projeto Supabase de leads |
| `seal.imageUrl` | (opcional) selo +18 oficial |
| `terms` | Texto oficial dos Termos (hoje rascunho — revisão jurídica) |

## Rodar local

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Conformidade

Selo 18+ e jogo responsável sempre visível; não prometer prêmio/bônus por
cadastro; `terms` precisa de revisão jurídica antes do ar.
