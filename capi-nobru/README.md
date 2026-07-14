# capi-nobru — Meta CAPI relay do Nobru (Income Access S2S → Meta)

Espelha o servidor do Jon (`sp-meta-capi`) para o Nobru. Cloudflare Worker + KV.

## Fluxo
1. **LP, no clique "criar conta agora":** `POST /click` com `{lead_id, fbp, fbc, fbclid, utm_*}` → guarda no KV por `lead_id` (TTL 60d) + IP/user-agent.
2. **Income Access, no registro/FTD:** `GET /postback?c=<lead_id>&event=<tipo>&value=<valor>&currency=<moeda>&token=<SECRET>` → acha o lead e dispara no Meta CAPI:
   - registro → `CompleteRegistration`
   - FTD/sale → `Purchase` (com `value` + `currency`)

## Deploy (uma vez)
Pré: Node + `npm i -g wrangler` (ou `npx wrangler`), conta Cloudflare.

```bash
cd capi-nobru
wrangler login
wrangler kv namespace create LEADS      # copie o "id" retornado -> wrangler.toml
wrangler secret put CAPI_TOKEN          # token do Events Manager (Conversions API do Nobru)
wrangler secret put POSTBACK_SECRET     # o segredo do ?token= (ex.: 8085a5c4ca25b5be3af52b093ea1f2ff)
wrangler deploy
```
Ajuste em `wrangler.toml`: `EVENT_SOURCE_URL` (domínio real da LP do Nobru) e o `id` do KV.

Após o deploy a URL fica tipo: `https://capi-nobru.<sua-conta>.workers.dev`

## URLs a fornecer
- **Pro Income Access (gerente de afiliado)** — relay tipo **GET**, no evento de registro e FTD:
  ```
  https://capi-nobru.<conta>.workers.dev/postback?c=[MACRO_DO_LEAD_ID]&event=[MACRO_EVENTO]&value=[MACRO_VALOR]&currency=[MACRO_MOEDA]&token=8085a5c4ca25b5be3af52b093ea1f2ff
  ```
  (troque `[MACRO_*]` pelas macros reais do IA — o `c` tem que ser o mesmo valor que a LP mandou no `&c=` do link de cadastro.)
- **Pra LP** — `POST` para `https://capi-nobru.<conta>.workers.dev/click`.

## Teste
```bash
curl https://capi-nobru.<conta>.workers.dev/health
# simula clique:
curl -X POST https://.../click -H 'Content-Type: application/json' \
  -d '{"lead_id":"TESTE-1","fbp":"fb.1.1.1","utm_source":"x"}'
# simula postback:
curl 'https://.../postback?c=TESTE-1&event=registration&token=8085a5c4ca25b5be3af52b093ea1f2ff'
```
