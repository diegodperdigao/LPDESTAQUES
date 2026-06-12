# SuperJon — LP de Conversão

Landing page mobile-first + desktop (Jon Vlogs × Superbet). Captura o lead,
qualifica e encaminha pro grupo de WhatsApp. Stack: **HTML + CSS + JS puro**
(sem build, sem dependências).

## Fluxo

```
[gate]  "Você já tem conta na Superbet?"
   ├─ Sim  ───────────────► [form]
   └─ Não  ─► [create] ─ "Crie sua conta agora"
                 │  (abre cadastro em NOVA aba)
                 └─ esta aba já vai pro [form] com a chamada
                    "Agora que deu tudo certo com o cadastro..."
[form]  Nome · E-mail/ID Superbet · Telefone · Faixa de aposta · consentimento
   └─ CTA "Quero entrar no grupo agora"
        → submitLead(payload) → redireciona pro grupo de WhatsApp
```

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Hero, container de telas (`#screen`), modal de termos |
| `styles.css` | Tokens + estilos responsivos (mobile / desktop split-screen) |
| `app.js` | Máquina de telas, validação, payload, integrações |
| `lp_jon_spec.md` | Spec visual de referência |

## Configuração — plugar no topo do `app.js`

| Constante | O que é |
|---|---|
| `REGISTRATION_URL` | Link de cadastro da Superbet (botão "Crie sua conta agora") |
| `WHATSAPP_GROUP_URL` | Grupo de WhatsApp (destino final) |
| `WHATSAPP_GROUP_URL_VIP` | Opcional — grupo VIP (faixa R$ 5.000+) |
| `SEAL_URL` | Imagem do selo +18 oficial (fallback: badge estilizado) |
| `SHEETS_WEBHOOK_URL` | Webhook da planilha (Google Apps Script `doPost`) |
| `TERMS_TEXT` | Texto do modal de Termos (placeholder → revisão jurídica) |

### Planilha (Google Sheets)

`submitLead()` faz `POST` do payload pra `SHEETS_WEBHOOK_URL`. O caminho mais
simples sem backend: um **Google Apps Script** publicado como Web App que recebe
o JSON e dá `appendRow`. Exemplo de `doPost`:

```js
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var sh = SpreadsheetApp.getActiveSheet();
  sh.appendRow([
    d.submitted_at, d.nome, d.contato_superbet, d.telefone,
    d.faixa_aposta_label, d.tier, d.ja_tinha_conta,
    d.utm_source, d.utm_campaign, d.landing_url
  ]);
  return ContentService.createTextOutput('ok');
}
```

### Payload (flat — uma linha por lead)

```json
{
  "nome": "...", "contato_superbet": "...", "telefone": "...",
  "faixa_aposta": "5000_mais", "faixa_aposta_label": "R$ 5.000+",
  "ja_tinha_conta": "criou_agora", "tier": "vip", "vip_candidate": true,
  "consentimento": true, "consentimento_texto": "...",
  "origem": "lp_superjon",
  "utm_source": "", "utm_medium": "", "utm_campaign": "",
  "utm_content": "", "utm_term": "",
  "referrer": "", "landing_url": "...", "user_agent": "...",
  "submitted_at": "2026-06-12T21:00:00.000Z"
}
```

## Rodar localmente

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Conformidade

- Selo **+18** e jogo responsável sempre visível.
- Não prometer prêmio/bônus por cadastro. Dinâmicas são comunicadas no grupo.
- `TERMS_TEXT` é rascunho — **revisão jurídica obrigatória** antes de ir ao ar.
