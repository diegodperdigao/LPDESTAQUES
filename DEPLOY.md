# Deploy & Backend — guia prático

4 LPs (2 por marca): `superjon`, `superjon-direta`, `betano`, `betano-direta`.
Mesma base de código (engine compartilhado); cada marca tem 1 projeto Supabase
próprio (isolamento de tráfego). As 2 variantes de uma marca dividem o mesmo
banco e o mesmo link de cadastro — diferenciadas pelo campo `source`.

---

## 1. Cloudflare Pages (hospedagem — CDN, escala sozinho)

1. Cloudflare → **Pages** → **Connect to Git** → este repositório.
2. Build settings:
   - **Build command:** `node build-all.mjs`
   - **Build output directory:** `dist`
3. Deploy. As LPs ficam em:
   - `/superjon/` · `/superjon-direta/` · `/betano/` · `/betano-direta/`
   - (a raiz `/` é só um índice de QA com os 4 links)
4. (Opcional) Domínios/subdomínios próprios por LP em **Custom domains**.

> Por ser estático servido por CDN, o tráfego de **acesso** não é gargalo.

---

## 2. Supabase (banco — 1 projeto por marca)

Para cada creator (`leads-nobru`, `leads-jon`):

1. Crie o projeto (região **sa-east-1 / São Paulo**). O plano **Free** dá conta
   do volume típico — o tráfego de acesso nem toca o banco; só os envios de lead,
   que são inserts pequenos. Suba pro **Pro** apenas em caso de pico viral extremo.
2. **SQL Editor** → cole e rode `supabase/migrations/0001_lp_leads.sql`.
   (Cria a tabela `lp_leads`, índices e o RLS **insert-only** para a chave anon.)
3. Pegue em **Project Settings → API**:
   - **Project URL**
   - **anon public key** (pode ser pública; o RLS impede leitura por ela)
4. Preencha em `brands/<marca>/config.js` → `supabase`:
   ```js
   supabase: { url: 'https://XXXX.supabase.co', anonKey: 'eyJ...', table: 'lp_leads' }
   ```
   A variante `direta` herda isso automaticamente (mesmo banco).

> O front grava com a chave **anon** (só INSERT). A leitura/sync usa a chave
> **service role** apenas no Apps Script (mantida secreta lá).

---

## 3. Links (cadastro + WhatsApp)

Em `brands/<marca>/config.js` → `links`:
```js
links: {
  registration: 'https://...',                    // link de cadastro (afiliado)
  whatsapp:      'https://chat.whatsapp.com/...'   // grupo único (destino final)
}
```
Vale para as duas variantes da marca (herdado).

---

## 4. Sync com Google Sheets (espelho, em lote)

1. Crie a planilha → **Extensões → Apps Script** → cole `apps-script/Code.gs`.
2. **Project Settings → Script Properties** → propriedade `SOURCES` (JSON), com a
   chave **service role** de cada projeto:
   ```json
   [
     {"name":"nobru","url":"https://XXXX.supabase.co","key":"SERVICE_ROLE","sheet":"Nobru"},
     {"name":"jon","url":"https://YYYY.supabase.co","key":"SERVICE_ROLE","sheet":"Jon"}
   ]
   ```
3. Rode `setupTrigger()` uma vez (cria o gatilho de 5 em 5 min). Teste com
   `syncLeads()`.

> Pull em lote (não webhook por linha) para não estourar cota sob volume. O
> Postgres é a fonte da verdade; a planilha é espelho de conveniência
> (limite ~10M células — para volume muito alto, rotacione a aba).

---

## 5. Robustez já embutida no front

- **keepalive** no envio: o insert completa mesmo durante o redirect pro WhatsApp.
- **Retry com backoff** (3 tentativas) em falha de rede/pico.
- **Fila local** (`localStorage`): se o banco falhar mesmo após os retries, o lead
  é guardado e **reenviado na próxima visita** — não se perde.
- **Conversão nunca trava:** em falha, enfileira e segue pro grupo.
- **Early-save** (fluxo direto): ao marcar "Não possui cadastro?", o lead parcial
  é salvo (mesmo `client_id` do envio final) — capta quem vai ao cadastro e não volta.

---

## Build local (conferência)

```bash
node build-all.mjs          # gera as 4 em dist/
node build.mjs betano direta # uma específica + preview-betano-direta.html
```
