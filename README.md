# SuperJon — LP de Conversão

Landing page mobile-first de captura de lead (Jon Vlogs × Superbet). O lead
responde perguntas curtas de qualificação e entra na fila do grupo. A faixa de
aposta declarada define o tier (faixa alta → fila do **VIP do VIP**).

Stack: **HTML + CSS + JavaScript puro** (sem build, sem dependências). Basta
servir os arquivos estáticos.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura: hero, corpo, form, rodapé |
| `styles.css` | Design tokens e estilos (conforme `lp_jon_spec.md`) |
| `app.js` | Perguntas data-driven, seleção única, progresso, validação e submissão |
| `lp_jon_spec.md` | Especificação visual/funcional de referência |

## Rodar localmente

```bash
# qualquer servidor estático serve
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Pontos de integração (em `app.js`)

- **`submitLead(payload)`** — função que recebe o lead e devolve uma `Promise`.
  Plugue aqui o destino (Supabase / planilha / webhook). Hoje só loga no console
  e simula sucesso.
- **`GROUP_URL` / `GROUP_URL_VIP`** — links do grupo (WhatsApp/Telegram). Se
  preenchidos, o pós-submit redireciona; senão, mostra tela de confirmação.
- **`QUESTIONS`** — array de perguntas. Edite enunciados/opções aqui. A pergunta
  com `qualifier: true` e a opção com `tier: 'vip'` definem o candidato ao VIP.

### Formato do payload

```json
{
  "answers": { "ja_aposta": "sim", "preferencia": "os_dois",
               "faixa_aposta": "mais_5000", "tem_conta": "nao" },
  "tier": "vip",
  "vip_candidate": true,
  "submitted_at": "2026-06-12T12:00:00.000Z",
  "source": "lp_superjon",
  "utm": { "utm_source": "instagram" },
  "referrer": null,
  "landing_url": "https://.../?utm_source=instagram",
  "user_agent": "..."
}
```

## Trocar o fallback da logo pela PNG oficial

No `index.html`, substituir o `<span class="lp-logo">…</span>` por:

```html
<img src="superbet-logo.png" alt="Superbet"
     style="height:15px;margin-top:18px;filter:brightness(0) invert(1)" />
```

A logo oficial é vermelha/escura; o filtro a deixa branca sobre o hero.

## Conformidade

- Rodapé 18+ e jogo responsável sempre visível.
- Não prometer prêmio/bônus por cadastro. Dinâmicas são comunicadas dentro do
  grupo, para clientes ativos.
- Criativos/headlines passam por **revisão jurídica** antes de ir ao ar.
