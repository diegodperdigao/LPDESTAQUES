/**
 * Meta CAPI relay — Nobru (Income Access S2S -> Meta Conversions API)
 *
 * Fluxo:
 *  1) LP, no clique "criar conta agora":
 *       POST /click  { lead_id, fbp, fbc, fbclid, utm_source, utm_medium, utm_campaign, utm_content }
 *     -> guarda no KV (LEADS) por lead_id (TTL 60d), junto de IP + user-agent (p/ matching do Meta).
 *
 *  2) Income Access, no registro/FTD, chama (config. pelo gerente de afiliado):
 *       GET /postback?c=<lead_id>&event=<tipo>&value=<valor>&currency=<moeda>&token=<SECRET>
 *     -> acha o lead no KV e dispara o evento no Meta via Conversions API:
 *          registro -> CompleteRegistration
 *          FTD/sale -> Purchase (com value + currency)
 *
 * Config (Worker vars/secrets):
 *   PIXEL_ID         (var)    = 1787191679332721  (Pixel do Nobru)
 *   CAPI_TOKEN       (secret) = token do Events Manager -> Conversions API
 *   POSTBACK_SECRET  (secret) = segredo que vai na URL do postback (?token=)
 *   EVENT_SOURCE_URL (var)    = URL pública da LP do Nobru (p/ o evento)
 *
 * Bindings:
 *   LEADS = KV namespace (guarda lead_id -> dados do clique)
 */

const GRAPH = 'https://graph.facebook.com/v21.0';
const TTL = 60 * 24 * 3600; // 60 dias

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      if (request.method === 'POST' && path.endsWith('/click')) return await handleClick(request, env);
      if (request.method === 'GET'  && path.endsWith('/postback')) return await handlePostback(url, env);
      if (path.endsWith('/health')) return json({ ok: true, service: 'capi-nobru' });
    } catch (err) {
      return json({ ok: false, error: String(err && err.message || err) }, 500);
    }
    return json({ ok: false, error: 'not found' }, 404);
  }
};

// ---- 1) clique na LP: guarda os dados do usuário p/ casar no postback ----
async function handleClick(request, env) {
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const leadId = String(b.lead_id || '').trim();
  if (!leadId) return json({ ok: false, error: 'lead_id ausente' }, 400);

  const rec = {
    fbp: b.fbp || '', fbc: b.fbc || '', fbclid: b.fbclid || '',
    utm_source: b.utm_source || '', utm_medium: b.utm_medium || '',
    utm_campaign: b.utm_campaign || '', utm_content: b.utm_content || '',
    ip: request.headers.get('cf-connecting-ip') || '',
    ua: request.headers.get('user-agent') || '',
    ts: Math.floor(Date.now() / 1000)
  };
  await env.LEADS.put('lead:' + leadId, JSON.stringify(rec), { expirationTtl: TTL });
  return json({ ok: true });
}

// ---- 2) postback do Income Access: dispara o evento confirmado no Meta ----
async function handlePostback(url, env) {
  const q = url.searchParams;

  // segurança: token secreto na URL (evita FTD forjado)
  if (env.POSTBACK_SECRET && q.get('token') !== env.POSTBACK_SECRET) {
    return json({ ok: false, error: 'token invalido' }, 401);
  }

  const leadId = String(q.get('c') || q.get('lead_id') || '').trim();
  if (!leadId) return json({ ok: false, error: 'c (lead_id) ausente' }, 400);

  const raw = await env.LEADS.get('lead:' + leadId);
  const lead = raw ? JSON.parse(raw) : null; // pode não achar (ex.: TTL) — ainda envia com o que tiver

  // mapeia o evento do IA -> evento do Meta
  const evParam = String(q.get('event') || 'registration').toLowerCase();
  const isFtd = /ftd|deposit|sale|purchase|first/.test(evParam);
  const eventName = isFtd ? 'Purchase' : 'CompleteRegistration';
  const value = parseFloat(q.get('value') || q.get('amount') || '0') || 0;
  const currency = (q.get('currency') || 'BRL').toUpperCase();

  const user_data = {};
  if (lead) {
    if (lead.fbp) user_data.fbp = lead.fbp;
    if (lead.fbc) user_data.fbc = lead.fbc;
    if (lead.ip) user_data.client_ip_address = lead.ip;
    if (lead.ua) user_data.client_user_agent = lead.ua;
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_id: leadId + ':' + eventName, // dedup com o Pixel do navegador (mesmo id)
    event_source_url: env.EVENT_SOURCE_URL || undefined,
    user_data
  };
  if (isFtd) event.custom_data = { value, currency };

  const res = await fetch(`${GRAPH}/${env.PIXEL_ID}/events?access_token=${encodeURIComponent(env.CAPI_TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] })
  });
  const meta = await res.json().catch(() => ({}));

  // Sempre responde 200 pro Income Access (evita reenvio em loop). O resultado
  // do Meta fica logado no corpo p/ conferência.
  return json({ ok: res.ok, event: eventName, matched: !!lead, meta });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
