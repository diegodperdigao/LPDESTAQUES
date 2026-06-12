# LP de Conversão — SuperJon (Jon Vlogs × Superbet)

Especificação visual e funcional do esboço, para reconstrução em código. Mantém a linha do protótipo aprovado.

---

## 1. Visão geral

Landing page mobile-first de captura de lead. O lead chega pelo link do vídeo (destaque do Instagram), responde perguntas curtas de qualificação e clica em "Quero entrar no grupo agora". A faixa de aposta declarada qualifica o lead (faixa alta → fila do VIP do VIP). Layout vertical único, sem rolagem longa, pensado para a tela do celular.

Destino dos dados do lead: a definir (Supabase, planilha ou webhook da automação). Hospedagem: a definir.

---

## 2. Design tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| Red (Super Red) | `#FD0104` | Cor principal: hero, CTA, números, chips selecionados |
| Burgundy | `#540031` | Acento secundário |
| Dark Purple | `#181020` | Fundos escuros pontuais |
| Generosity Yellow | `#FFE200` | Destaque "os dois", ponto do logotipo |
| White | `#FFFFFF` | Fundo da página |
| Ink | `#1a1320` | Texto principal |
| Ink soft | `#5c5566` | Texto secundário |
| Ink faint | `#938b9c` | Labels, rodapé |
| BG-2 | `#fbf9f7` | Fundo dos cards de pergunta |
| Linha | `rgba(24,16,32,0.12)` | Bordas |
| Linha forte | `rgba(24,16,32,0.22)` | Bordas de chips |
| Amarelo texto | `#7a5c00` / `#9a7600` | Texto sobre amarelo (legibilidade) |

### Tipografia
- **Hero / títulos:** Roboto Flex — usado em **bold itálico, uppercase** (títulos, números, CTA). Importar de Google Fonts: `Roboto+Flex:ital,opsz,wght@0,8..144,400..900;1,8..144,600..900`.
- **Corpo / funcional:** Inter — pesos 400/500/600/700. `Inter:wght@400;500;600;700`.

---

## 3. Estrutura da página (de cima pra baixo)

```
[ Hero vermelho ]
   - Logo Superbet (branca) + avatar "JON VLOGS"
   - Título: SUPERJON
   - Subtítulo
[ Corpo branco ]
   - Barra de progresso
   - Label "Perguntas rápidas"
   - Pergunta 1 (card)
   - Pergunta 2 (card)
   - Botão CTA
   - Rodapé de responsabilidade
```

---

## 4. Hero (bloco vermelho)

- **Fundo:** gradiente `linear-gradient(155deg, #FD0104, #d10003)`.
- **Padding:** `0 20px 30px` (sem padding no topo; o espaço do topo vem da status bar / safe area no app real).
- **Texto:** branco.
- **Logo Superbet:** imagem PNG da logo, altura `15px`, alinhada à esquerda, `margin-top: 18px`. Como a logo oficial é vermelha/escura, aplicar `filter: brightness(0) invert(1)` para deixá-la branca sobre o vermelho. Fallback: wordmark "superbet." em Roboto Flex 800, com o ponto final em amarelo (`#FFE200`).
- **Avatar Jon:** círculo no canto superior direito (`top: 48px; right: 20px`), `42×42px`, borda `1.5px rgba(255,255,255,0.45)`, fundo `rgba(255,255,255,0.12)`, texto "JON VLOGS" centralizado, `8.5px`, bold. (No real, trocar por foto do Jon.)
- **Título (h3):** "SuperJon" — Roboto Flex 800 itálico, **uppercase**, `26px`, `line-height: 1`, `letter-spacing: -1px`, `margin-top: 14px`.
- **Subtítulo (p):** "Responde as perguntas abaixo e a equipe te direciona pro grupo certo." — `12px`, `opacity: 0.92`, `line-height: 1.45`, `max-width: 90%`.

---

## 5. Corpo (bloco branco)

- **Padding:** `20px 18px 16px`.

### Barra de progresso
- Trilho: altura `3px`, fundo cor linha, borda arredondada, `margin-bottom: 13px`.
- Preenchimento: vermelho, largura proporcional ao avanço (no esboço, `80%`).

### Label de seção
- "Perguntas rápidas" — `10px`, bold 700, uppercase, `letter-spacing: 1.4px`, cor ink-faint, `margin-bottom: 11px`.

### Card de pergunta (`.lp-q`)
- Fundo `#fbf9f7`, borda `1px` cor linha, `border-radius: 11px`, padding `11px 12px`, `margin-bottom: 9px`.
- **Pergunta (qn):** `13px`, bold 700, cor ink, `margin-bottom: 9px`. Acompanha um **número** à esquerda.
- **Número (qi):** quadrado `24×24px`, `border-radius: 7px`, fundo vermelho, texto branco, `12px`, Roboto Flex 800 itálico.

### Chips de resposta (`.chip`)
- `11.5px`, bold 600, cor ink-soft, borda `1.5px` cor linha-forte, `border-radius: 9px`, padding `7px 11px`, fundo branco. Gap entre chips `6px`, com wrap.
- **Selecionado (vermelho):** fundo e borda vermelhos, texto branco.
- **Selecionado (amarelo, p/ "os dois"):** fundo e borda amarelos (`#FFE200`), texto `#7a5c00`.

### Perguntas do esboço (amostra — 2 visíveis)
1. **"Você curte mais cassino ou esporte?"** → chips: `Cassino` · `Esporte` · `Os dois` (este em amarelo).
2. **"Quanto costuma apostar por mês?"** → chips: `Até R$ 1.000` · `R$ 1.000 a 5.000` · `+ de R$ 5.000`.

> Conjunto completo de validação (para a LP final): Já aposta? · Cassino/Esporte/Os dois · Faixa de aposta mensal (define o tier) · Já tem conta na Superbet? A faixa de aposta é o campo que qualifica para o VIP do VIP.

### Botão CTA (`.lp-cta`)
- Largura total, fundo vermelho, texto branco.
- Roboto Flex 800 itálico, uppercase, `14px`, `letter-spacing: 0.3px`.
- Padding `13px`, `border-radius: 11px`, `margin-top: 8px`.
- Sombra: `0 12px 24px -12px #FD0104`.
- Texto: **"Quero entrar no grupo agora"**.

### Rodapé de responsabilidade (`.lp-foot`)
- Centralizado, `9px`, cor ink-faint, padding `10px 18px 16px`, `line-height: 1.45`.
- Texto: "Conteúdo para maiores de 18 anos. Jogue com responsabilidade."

---

## 6. Comportamento / lógica

- **Seleção única por pergunta:** clicar num chip seleciona e desmarca os outros da mesma pergunta.
- **Barra de progresso:** avança conforme as perguntas são respondidas.
- **Validação:** o CTA só dispara quando todas as perguntas obrigatórias estão respondidas (ou destaca as pendentes).
- **No submit:** montar o payload do lead (respostas + timestamp + origem/UTM) e enviar ao destino escolhido. A faixa de aposta marca o lead como candidato ao VIP do VIP quando for a faixa alta.
- **Pós-submit:** redirecionar para o grupo (link do WhatsApp/Telegram) ou tela de confirmação.

---

## 7. Conformidade (observações para o jurídico)

- Não prometer prêmio/bônus como recompensa por cadastro ou depósito. Promoções e dinâmicas são comunicadas dentro do grupo, para clientes ativos.
- Manter o rodapé 18+ e jogo responsável visível.
- Revisar o texto de qualquer criativo/headline que sugira aumento de chance de ganho.

> Lembrete: as regras de publicidade de apostas variam e mudam; o conteúdo deve passar por revisão jurídica antes de ir ao ar. Esta nota não é aconselhamento jurídico.
