/**
 * LP Leads — Recebedor direto (POST da LP -> Google Sheets) com DEDUP.
 *
 * A landing page manda cada lead (JSON) para a URL deste Web App; aqui a gente
 * grava numa aba por creator (Jon / Nobru). Nao depende de Supabase.
 *
 * DEDUP (1 linha por pessoa): ao chegar um lead, procura uma linha existente
 * com o MESMO client_id OU o MESMO telefone. Se achar, ATUALIZA (merge que so
 * melhora: preenche campos vazios, e status "completo" vence "parcial"; mantem
 * a Data/Hora do primeiro contato). Se nao achar, cria linha nova.
 *
 * ---- SETUP (uma vez) ----
 * 1. Planilha -> Extensoes -> Apps Script -> cole este arquivo (substitua tudo).
 * 2. Salve.
 * 3. Deploy -> New deployment -> tipo "Web app":
 *      - Execute as: Me (voce)
 *      - Who has access: Anyone
 *    -> Deploy -> autorize -> copie a "Web app URL" (termina em /exec).
 *
 * ---- AO EDITAR ESTE CODIGO DEPOIS ----
 * Deploy -> Manage deployments -> (edite o atual, ✏️) -> Version: New version
 * -> Deploy. A URL /exec CONTINUA A MESMA. (Nao crie "New deployment".)
 */

var HEADERS = [
  'Data/Hora', 'Creator', 'Origem', 'Fluxo', 'Status', 'Client ID',
  'Nome', 'E-mail/ID', 'WhatsApp',
  'Faixa de aposta', 'Ja tinha conta (atual)',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL',
  'Converteu conta?',            // SIM = nao->sim/criou_agora (criou conta apos interagir)
  'Ja tinha conta (1o contato)', // valor da PRIMEIRA vez (nao e sobrescrito)
  // --- conversao confirmada pela casa (postback S2S do Income Access) ---
  'Registrou?', 'Data registro', 'FTD?', 'Valor FTD', 'Data FTD'
];

// Indices (0-based) das colunas usadas na deduplicacao / merge / metrica
var COL_DATA = 0, COL_STATUS = 4, COL_CID = 5, COL_TEL = 8, COL_JTC = 10, COL_CONV = 18, COL_JTC0 = 19;
// conversao (preenchidas pelo postback)
var COL_REG = 20, COL_REG_DT = 21, COL_FTD = 22, COL_FTD_VAL = 23, COL_FTD_DT = 24;

// SiteID (do payload do afiliado) -> creator. Define o pixel/token do CAPI.
var SITE_CREATOR = { '2001773': 'nobru', '46521': 'jon' };
// Config do Meta CAPI por creator. O token vem de Script Property (secreto,
// fora do codigo). Pixel e publico. Setar:  CAPI_TOKEN_NOBRU / CAPI_TOKEN_JON.
var CAPI = {
  nobru: { pixel: '1787191679332721', tokenProp: 'CAPI_TOKEN_NOBRU' },
  jon:   { pixel: '2044295176436601', tokenProp: 'CAPI_TOKEN_JON' }
};

function doPost(e) {
  // se o afiliado mandar a conversao via POST (payload com acid/et), trata como postback
  var pp = (e && e.parameter) || {};
  if (pp.acid || pp.et) return handlePostback_(pp);
  var bodyRaw = (e && e.postData && e.postData.contents) || '{}';
  var maybe = {};
  try { maybe = JSON.parse(bodyRaw); } catch (e0) {}
  if (maybe && (maybe.acid || maybe.et)) return handlePostback_(maybe);

  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // serializa: evita corrida entre 2 envios simultaneos
  try {
    var data = JSON.parse(bodyRaw);
    var creator = String(data.creator || 'Outros');
    var tab = creator.charAt(0).toUpperCase() + creator.slice(1); // jon -> Jon
    var sheet = getSheet_(tab);
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    var incoming = rowFromData_(data, now);
    var cid = String(data.client_id || '').trim();
    var tel = normPhone_(data.telefone);

    var found = findRow_(sheet, cid, tel);
    if (found) {
      var merged = mergeRows_(found.values, incoming);
      sheet.getRange(found.rowIndex, 1, 1, merged.length).setValues([merged]);
      return json_({ ok: true, action: 'update', row: found.rowIndex });
    }
    sheet.appendRow(incoming);
    return json_({ ok: true, action: 'insert' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// GET: ?stats=1 -> contadores; payload (acid/et/c/lead_id) -> POSTBACK; senão health.
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.stats) return statsReport_();
  if (!p.acid && !p.et && !p.c && !p.lead_id) {
    return json_({ ok: true, msg: 'LP lead receiver ativo (dedup + postback).' });
  }
  return handlePostback_(p);
}

// Contadores de quantos registros/FTDs chegaram no webhook (por creator).
// Guardados em Script Properties. Nao expõe token nem dado pessoal.
function bumpStats_(creator, kind) {
  try {
    var props = PropertiesService.getScriptProperties();
    var key = 'stats_' + (creator || 'unknown') + '_' + kind;
    props.setProperty(key, String((parseInt(props.getProperty(key) || '0', 10) || 0) + 1));
  } catch (e) { /* nunca quebra o fluxo */ }
}
function statsReport_() {
  var all = PropertiesService.getScriptProperties().getProperties();
  var stats = {};
  Object.keys(all).forEach(function (k) { if (k.indexOf('stats_') === 0) stats[k] = Number(all[k]); });
  return json_({ ok: true, stats: stats });
}

// Postback de conversao. O servidor do afiliado manda o payload pronto:
//   et   -> 'reg' (registro) | 'ftd' (deposito)
//   acid -> o nosso client_id (o que foi no c= do link de cadastro)
//   SiteID / AdID -> identificadores da campanha
// Acha o lead pelo client_id e marca Registrou / FTD na linha. Token opcional.
function handlePostback_(p) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('POSTBACK_TOKEN');
    if (secret && String(p.token || '') !== secret) {
      return json_({ ok: false, error: 'token invalido' });
    }
    var leadId = String(p.acid || p.c || p.lead_id || '').trim();
    if (!leadId) return json_({ ok: false, error: 'acid (lead_id) ausente' });

    var ev = String(p.et || p.event || 'reg').toLowerCase();
    var isFtd = /ftd|deposit|sale|first|purchase/.test(ev);
    var value = p.value || p.amount || '';
    var siteId = String(p.SiteID || p.siteid || p.siteId || '').trim();
    var creator = SITE_CREATOR[siteId] || '';

    // BONUS/best-effort: se existir planilha, marca a linha e descobre o creator
    // caso falte. Tudo aqui é envolvido em try -> NUNCA quebra o CAPI.
    var matched = false;
    try {
      var loc = findByClientId_(leadId);
      if (loc) {
        matched = true;
        if (!creator) creator = String(loc.sheet.getName()).toLowerCase();
        var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        var sh = loc.sheet, row = loc.rowIndex;
        sh.getRange(row, COL_REG + 1).setValue('SIM');
        if (!sh.getRange(row, COL_REG_DT + 1).getValue()) sh.getRange(row, COL_REG_DT + 1).setValue(now);
        if (isFtd) {
          sh.getRange(row, COL_FTD + 1).setValue('SIM');
          if (value !== '') sh.getRange(row, COL_FTD_VAL + 1).setValue(value);
          sh.getRange(row, COL_FTD_DT + 1).setValue(now);
        }
      }
    } catch (eSheet) { /* sem planilha / erro: ignora — o CAPI nao depende dela */ }

    // PRINCIPAL: dispara o evento no Meta (CAPI). Independe 100% da planilha.
    var capi = fireCapi_(creator, leadId, isFtd);

    // conta quantos reg/ftd chegaram no webhook (ver com ?stats=1)
    bumpStats_(creator || SITE_CREATOR[siteId] || 'unknown', isFtd ? 'ftd' : 'reg');

    return json_({ ok: true, matched: matched, event: isFtd ? 'ftd' : 'reg', creator: creator, capi: capi });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// Dispara o evento confirmado no Meta via Conversions API.
//   reg -> CompleteRegistration ; ftd -> Purchase (value 0, Betano nao manda valor)
// external_id = SHA256(lead_id) p/ matching. No-op se nao houver token do creator.
function fireCapi_(creator, leadId, isFtd) {
  var cfg = CAPI[String(creator || '').toLowerCase()];
  if (!cfg) return { skipped: 'creator desconhecido' };
  var token = PropertiesService.getScriptProperties().getProperty(cfg.tokenProp);
  if (!token) return { skipped: 'sem token (' + cfg.tokenProp + ')' };

  var event = {
    event_name: isFtd ? 'Purchase' : 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_id: leadId + '-' + (isFtd ? 'ftd' : 'reg'),
    user_data: { external_id: [sha256Hex_(leadId)] }
  };
  if (isFtd) event.custom_data = { currency: 'BRL', value: 0 };

  try {
    var res = UrlFetchApp.fetch(
      'https://graph.facebook.com/v21.0/' + cfg.pixel + '/events?access_token=' + encodeURIComponent(token),
      { method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ data: [event] }), muteHttpExceptions: true });
    return { code: res.getResponseCode(), body: res.getContentText().slice(0, 200) };
  } catch (e) { return { error: String(e) }; }
}

function sha256Hex_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) { var b = (bytes[i] + 256) % 256; hex += (b < 16 ? '0' : '') + b.toString(16); }
  return hex;
}

// procura o client_id em TODAS as abas (Jon/Nobru) — ids sao unicos
function findByClientId_(cid) {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s], last = sh.getLastRow();
    if (last < 2) continue;
    var ids = sh.getRange(2, COL_CID + 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0] || '').trim() === cid) return { sheet: sh, rowIndex: i + 2 };
    }
  }
  return null;
}

// monta a linha a partir do payload
function rowFromData_(d, now) {
  var jtc = d.ja_tinha_conta || '';
  return [
    now, d.creator || '', d.source || '', d.flow || '', d.status || '', d.client_id || '',
    d.nome || '', d.contato || '', d.telefone || '',
    d.faixa_aposta_label || '', jtc,
    d.utm_source || '', d.utm_medium || '', d.utm_campaign || '', d.utm_content || '', d.utm_term || '',
    d.referrer || '', d.landing_url || '',
    jtc === 'criou_agora' ? 'SIM' : '',  // Converteu conta? (na 1a gravacao)
    jtc                                  // Ja tinha conta (1o contato)
  ];
}

// só os dígitos do telefone (compara "(11) 99999-0000" == "11999990000")
function normPhone_(t) { return String(t || '').replace(/\D/g, ''); }

// acha linha existente pelo client_id OU pelo telefone (ambos nao-vazios)
function findRow_(sheet, cid, tel) {
  var last = sheet.getLastRow();
  if (last < 2) return null; // so cabecalho
  var values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = 0; i < values.length; i++) {
    var rowCid = String(values[i][COL_CID] || '').trim();
    var rowTel = normPhone_(values[i][COL_TEL]);
    if (cid && rowCid && rowCid === cid) return { rowIndex: i + 2, values: values[i] };
    if (tel && rowTel && rowTel === tel) return { rowIndex: i + 2, values: values[i] };
  }
  return null;
}

// merge que so melhora: mantem Data/Hora antiga; status completo vence parcial;
// demais colunas usam o novo valor se nao for vazio, senao mantem o antigo.
function mergeRows_(existing, incoming) {
  var out = existing.slice();
  var rank = { 'parcial': 1, 'completo': 2 };
  var curS = String(existing[COL_STATUS] || '');
  var newS = String(incoming[COL_STATUS] || '');
  out[COL_STATUS] = (rank[newS] || 0) >= (rank[curS] || 0) ? (newS || curS) : curS;

  // "Converteu conta?" (sticky): era 'nao' e virou 'sim'/'criou_agora', ou
  // veio 'criou_agora'. Usa os valores ANTES do merge (existing vs incoming).
  var prevFlag = String(existing[COL_CONV] || '');
  var exJTC = String(existing[COL_JTC] || '');
  var inJTC = String(incoming[COL_JTC] || '');
  var converted = prevFlag === 'SIM'
    || inJTC === 'criou_agora'
    || (exJTC === 'nao' && (inJTC === 'sim' || inJTC === 'criou_agora'));
  out[COL_CONV] = converted ? 'SIM' : prevFlag;

  // "Ja tinha conta (atual)" so sobe (nao volta de sim/criou_agora p/ nao)
  var jRank = { 'nao': 1, 'sim': 2, 'criou_agora': 3 };
  out[COL_JTC] = (jRank[inJTC] || 0) >= (jRank[exJTC] || 0) ? (inJTC || exJTC) : exJTC;
  // "Ja tinha conta (1o contato)" nunca muda depois de gravado
  out[COL_JTC0] = String(existing[COL_JTC0] || '') || incoming[COL_JTC0] || '';

  for (var i = 0; i < incoming.length; i++) {
    if (i === COL_DATA || i === COL_STATUS || i === COL_CONV || i === COL_JTC || i === COL_JTC0) continue;
    var nv = incoming[i];
    if (nv !== '' && nv !== null && nv !== undefined) out[i] = nv;
  }
  return out;
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else {
    // garante o cabecalho atual (ex.: abas antigas ganham a coluna nova)
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
