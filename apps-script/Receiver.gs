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
  'Faixa de aposta', 'Ja tinha conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL'
];

// Indices (0-based) das colunas usadas na deduplicacao / merge
var COL_DATA = 0, COL_STATUS = 4, COL_CID = 5, COL_TEL = 8;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // serializa: evita corrida entre 2 envios simultaneos
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
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

function doGet() {
  return json_({ ok: true, msg: 'LP lead receiver ativo (dedup por client_id/telefone).' });
}

// monta a linha (18 colunas) a partir do payload
function rowFromData_(d, now) {
  return [
    now, d.creator || '', d.source || '', d.flow || '', d.status || '', d.client_id || '',
    d.nome || '', d.contato || '', d.telefone || '',
    d.faixa_aposta_label || '', d.ja_tinha_conta || '',
    d.utm_source || '', d.utm_medium || '', d.utm_campaign || '', d.utm_content || '', d.utm_term || '',
    d.referrer || '', d.landing_url || ''
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
  for (var i = 0; i < incoming.length; i++) {
    if (i === COL_DATA || i === COL_STATUS) continue; // ja tratados / preservados
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
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
