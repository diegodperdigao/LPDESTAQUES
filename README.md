# LP de Conversão — Engine multi-marca

Landing page de captação de leads (mobile-first + desktop). **Engine genérico
compartilhado + config por marca + mini-build**. Replicar = nova pasta de config
+ assets. Sem framework.

## Estrutura

```
engine/
  engine.js          # núcleo: fluxo, validação, submit (lê window.BRAND)
  engine.css         # estilos (tokens via CSS vars, sobrescritos pela marca)
brands/
  superjon/
    config.js        # TUDO da marca: tokens, textos, perguntas, links, supabase
    assets/          # logos/imagens da marca
  betano/            # 2ª marca (scaffold) — mesma estrutura
index.template.html  # shell genérico (placeholders <!--BRAND_HEAD--> e config)
build.mjs            # gera dist/<marca>/ (deploy) + preview self-contained
supabase/migrations/0001_lp_leads.sql   # tabela de leads (rodar no projeto)
apps-script/Code.gs  # receptor do sync Supabase -> Sheets
dist/                # saída do build (gitignored)
preview[-<marca>].html  # preview self-contained (gerado pelo build)
```

## Build / preview

```bash
node build.mjs superjon   # -> dist/superjon/ + preview.html
node build.mjs betano     # -> dist/betano/  + preview-betano.html
```

`dist/<marca>/` é autossuficiente (index.html com `<head>` da marca bakeado +
engine/ + brands/<marca>/). `preview*.html` é tudo inline, p/ abrir direto.

## Deploy (Cloudflare Pages) — 1 projeto por marca

- Conecte o repo. **Build command:** `node build.mjs <marca>`.
  **Output directory:** `dist/<marca>`. Defina o domínio da marca.
- Estático no CDN global → aguenta picos; cada marca isolada no seu projeto.

## Replicar para uma nova marca

1. `cp -r brands/superjon brands/<nova>` e ajuste `config.js` (tokens, textos,
   perguntas, `links`, `supabase`, `brand`, `source`, `meta.favicon`) + troque os `assets/`.
2. `node build.mjs <nova>` e crie um projeto Cloudflare Pages apontando p/ `dist/<nova>`.
3. **Regra de ouro:** nada de marca no `engine/` (compartilhado). Tudo em `brands/<nova>/`.

## Backend (Supabase) — escalável e isolado por marca

Leads gravados via **PostgREST** (`/rest/v1/lp_leads`) com a chave anon e RLS
**insert-only** (grava, não lê pela chave pública). **Recomendado: 1 projeto
Supabase de leads por marca** (`leads-superbet`, `leads-betano`) p/ isolar
tráfego — a config `supabase` de cada marca aponta pro seu projeto.

Setup por marca:
1. Crie o projeto Supabase de leads (sa-east-1).
2. Rode `supabase/migrations/0001_lp_leads.sql` no SQL Editor.
3. Preencha `supabase.url` e `supabase.anonKey` em `brands/<marca>/config.js`.

### Sync com Google Sheets
Database Webhook do Supabase (INSERT em lp_leads) → Web App do Apps Script
(`apps-script/Code.gs`) → appendRow. Near-real-time.

## Config — campos a preencher antes do ar (`brands/<marca>/config.js`)

| Campo | O que é |
|---|---|
| `links.registration` | Link de cadastro da casa |
| `links.whatsapp` / `whatsappVip` | Grupo de WhatsApp (e VIP opcional) |
| `supabase.url` / `anonKey` | Projeto Supabase de leads da marca |
| `meta.favicon` · `hero.brandLogo` · `hero.creatorLogo` | Assets da marca |
| `terms` | Texto oficial dos Termos (revisão jurídica) |

## Conformidade
Selo 18+ e jogo responsável sempre visível; não prometer prêmio/bônus por
cadastro; `terms` precisa de revisão jurídica antes do ar.
