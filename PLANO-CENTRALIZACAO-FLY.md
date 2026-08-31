# Plano — Centralização dos leads das LPs no banco próprio (Fly / 3cdashboard)

## Objetivo
Sair do Supabase e centralizar **todos** os leads das LPs num banco próprio no Fly,
dentro do app `3cdashboard`, exposto como o módulo **"LP Vip Statics"** — sem perder
nenhum tracking existente.

- **Existentes (Jon, Nobru):** clonar o histórico do Supabase → Fly + **dual-write** na transição.
- **Novos (Hudson e futuros):** **não** criam projeto Supabase — a LP escreve **direto** no central.
- **Chave universal:** `client_id` (liga LP ↔ central ↔ postback de FTD).

## Princípios inegociáveis
1. **Aditivo / estrangulamento** — nada existente é removido antes do novo estar validado. Zero perda.
2. **Trackings intactos** — pixel (navegador) e CAPI/postback (Apps Script) **não dependem do store**.
   Mantemos o `postToSheet` até o fim para o CAPI/postback continuarem vivos.
3. **Upsert por `client_id`** — resolve na origem os 3 problemas atuais: duplicação, campo em branco,
   e a gravação em 2 momentos (parcial→completo "só melhora").

---

## Arquitetura alvo

```
        LPs (jon, nobru, hudson, ...)  [engine.js]
                 │  (dual-write, best-effort)
      ┌──────────┼───────────────┬─────────────────┐
      ▼          ▼               ▼                 ▼
  Supabase   Planilha Google   CENTRAL (novo)   Meta Pixel (navegador)
 (legado,   (postToSheet →     POST /ingest/    (independente)
  backup)    Apps Script →      leads
             CAPI + postback)      │
                                   ▼
                        Postgres Fly (tabela `leads`, coluna creator)
                                   │
                                   ▼
                     3cdashboard → módulo /lp-vip ("LP Vip Statics")
                                   │
                        (bridge FTD/UTM via affiliateApi/incomeSearch,
                         casando por client_id)
```

---

## Fases

### Fase 0 — Contrato (fecha o acordo entre os 2 repos)
Definir o **schema da tabela `leads`** e o **contrato do `POST /ingest/leads`** (abaixo).
Nada é construído antes disso — é o contrato que os dois lados obedecem.

### Fase 1 — Banco + endpoint (repo do dashboard)
- Criar a tabela `leads` no Postgres do Fly.
- Criar a rota `POST /ingest/leads` (Fastify): valida chave write-only, faz **upsert por client_id**,
  CORS liberando os domínios das LPs, rate limit.
- **Validação:** um POST de teste cria/atualiza uma linha corretamente (parcial→completo funde).

### Fase 2 — Backfill (clonar Supabase → central)
- Script único: puxa Jon + Nobru do Supabase, **deduplica por client_id** e insere no central.
- **Validação:** contagem de pessoas únicas no central bate com o dedup do Supabase (~17,7k Jon).

### Fase 3 — Dual-write nas LPs existentes (este repo)
- Novo campo no config: `B.leadsApi = { url, key }`.
- Nova função `postToCentral()` no `engine.js`, **ao lado** de `postLead` (Supabase) e `postToSheet`.
  Best-effort (`sendBeacon`/keepalive, `try/catch`), mesmo payload do `buildRow()`, entra na fila local.
- Ativar só no Jon e Nobru. Rebuild + deploy.
- **Validação:** por alguns dias, os leads novos aparecem no Supabase **e** no central, batendo.

### Fase 4 — Novo streamer direto no central (este repo)
- Marca nova (ex.: Hudson): `brands/hudson/` **sem** bloco `supabase` — só `B.leadsApi`.
- A LP dele escreve **exclusivamente** no central. Nenhum projeto Supabase é criado.
- **Validação:** leads do Hudson só aparecem no central.

### Fase 5 — Módulo no dashboard (repo do dashboard)
- Módulo `leads.js` (queries: totais, funil, faixa, dia, UTM).
- Página `/lp-vip` + card **"LP Vip Statics"** na `home.html`, atrás da auth (cookie) que já existe.
- Export reaproveitando `xlsx.js`/`csv.js`.

### Fase 6 — Cutover
- Central vira fonte de verdade dos relatórios.
- Supabase segue de backup por um período; depois desliga a **escrita** nele.
- **`postToSheet` continua** (é ele que alimenta CAPI/postback).

### Fase 7 — (opcional, depois) Fechar o loop de atribuição
- Bridge leads ↔ FTD por `client_id` usando `affiliateApi.js`/`incomeSearch.js`/`conversion.js`.
- (Opcional) mover o CAPI para disparar do central; aí o `postToSheet` pode ser aposentado.

---

## Schema da tabela `leads` (contrato)

```sql
create table leads (
  id                  bigserial primary key,
  client_id           text unique not null,     -- chave de upsert
  creator             text not null,            -- jon | nobru | hudson | ...
  casa                text,                      -- superbet | betano | ...
  source              text,                      -- full | direta
  flow                text,
  status              text,                      -- parcial | completo (só melhora)
  nome                text,
  email               text,                      -- NOVO (Supabase corta hoje)
  contato             text,                      -- usuario superbet / id
  telefone            text,
  faixa_aposta        text,
  faixa_aposta_label  text,
  ja_tinha_conta      text,                      -- sim | nao | criou_agora
  consentimento       boolean,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  referrer            text,
  landing_url         text,
  user_agent          text,
  fbp text, fbc text, capi_event text, capi_event_id text,  -- p/ CAPI futuro
  -- conversão (preenchida pelo postback do afiliado, casando por client_id)
  registrou           boolean default false,
  registrou_em        timestamptz,
  ftd                 boolean default false,
  ftd_valor           numeric,
  ftd_em              timestamptz,
  -- controle
  primeiro_contato    timestamptz default now(),
  ultimo_evento       timestamptz default now(),
  n_eventos           int default 1
);
create index on leads (creator);
create index on leads (creator, faixa_aposta_label);
create index on leads (ultimo_evento desc);
```

**Regra de upsert (`on conflict (client_id)`):** status usa o "maior" (completo > parcial);
campos textuais só sobrescrevem se o novo valor **não for vazio** (coalesce "só melhora");
`primeiro_contato` nunca muda; `ultimo_evento = now()`; `n_eventos = n_eventos + 1`.

---

## Contrato do `POST /ingest/leads`

- **URL:** `https://<3cdashboard>/ingest/leads`
- **Método:** `POST`
- **Body:** JSON do `buildRow()` (o mesmo que já vai pro Supabase/planilha).
- **Content-Type:** aceitar `text/plain` **e** `application/json`.
  > `sendBeacon` manda `text/plain` → **evita preflight CORS** (é como o `postToSheet` já faz).
- **Auth:** chave **write-only** (header `x-api-key` ou campo no body). Como a LP é estática/pública,
  a chave fica visível no bundle (igual à `anon` do Supabase hoje) → o endpoint **só faz upsert,
  nunca lê**, e tem **rate limit por IP**.
- **CORS:** `Access-Control-Allow-Origin` = domínios das LPs (`gruposvip.pages.dev` + domínios próprios).
- **Resposta:** `200/204` minimal, rápido e **tolerante** (nunca bloqueia a conversão da LP).
- **Idempotência:** upsert por `client_id` → reenvio/retry não duplica.

---

## Checklist por repo

### 📁 LPDESTAQUES (este repo)
- [ ] Campo `B.leadsApi = { url, key }` no config das marcas.
- [ ] Função `postToCentral()` no `engine.js` (aditiva, best-effort, na fila local).
- [ ] Ativar em Jon + Nobru (Fase 3); marca nova sem Supabase (Fase 4).
- [ ] Rebuild (`build-all.mjs`) + deploy Cloudflare.
- [ ] **Não mexer** em `postLead` (Supabase) nem `postToSheet` durante a transição.

### 📁 3cdashboard (Dashboard-Banquinhas)
- [ ] Migration da tabela `leads`.
- [ ] Rota `POST /ingest/leads` (upsert, CORS, chave write-only, rate limit).
- [ ] Script de backfill (Supabase → central, dedup).
- [ ] Módulo `leads.js` + página `/lp-vip` + card na `home.html` (atrás da auth).
- [ ] (Depois) bridge FTD/UTM por `client_id`.

---

## O que NÃO pode quebrar (e como)
| Tracking | Onde vive | Garantia |
|---|---|---|
| Pixel (PageView, CompleteRegistration, CriarConta5000) | Navegador (`fbq`) | Não tocamos |
| CAPI server-side | Apps Script ← `postToSheet` | Mantemos o `postToSheet` |
| Postback afiliado (reg/FTD) | Apps Script (casa por `client_id`) | Mantemos o `postToSheet` + `client_id` |
| Continuidade da pessoa | `client_id` persistente | Não muda; é a cola de tudo |

---

## Riscos & mitigação
- **Endpoint no caminho crítico** → dual-write mantém Supabase como backup; fila local do front cobre falha.
- **Chave pública no bundle** → endpoint só-upsert, sem leitura, rate-limited (mesma postura da anon hoje).
- **App em produção (Banquinhas)** → módulo/tabela isolados, sem tocar no que já roda.
- **Deploy do Apps Script** → se precisar mexer, **New version** (nunca New deployment).

---

## Sequência recomendada
Fase 0 (contrato) → Fase 1 (banco+endpoint) → Fase 2 (backfill) → Fase 3 (dual-write Jon/Nobru,
validar dias) → Fase 5 (módulo/dash) → Fase 4 (Hudson direto) → Fase 6 (cutover) → Fase 7 (FTD/UTM).

Cada fase é reversível isoladamente. Só se avança quando a anterior valida.
