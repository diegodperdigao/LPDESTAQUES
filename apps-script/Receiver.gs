/**
 * LP Leads — Recebedor direto (POST da LP -> Google Sheets).
 *
 * A landing page manda cada lead (JSON) para a URL deste Web App; aqui a gente
 * grava numa aba por creator (Jon / Nobru) na planilha que contem este script.
 * Nao depende de Supabase.
 *
 * ---- SETUP (uma vez) ----
 * 1. Planilha -> Extensoes -> Apps Script -> cole este arquivo (substitua tudo).
 * 2. Salve.
 * 3. Deploy -> New deployment -> tipo "Web app":
 *      - Execute as: Me (voce)
 *      - Who has access: Anyone
 *    -> Deploy -> autorize -> copie a "Web app URL" (termina em /exec).
 * 4. Passe essa URL para eu configurar na LP.
 *
 * Teste: abra a URL /exec no navegador -> deve responder {"ok":true,...}.
 */

var HEADERS = [
  'Data/Hora', 'Creator', 'Origem', 'Fluxo', 'Status', 'Client ID',
  'Nome', 'E-mail/ID', 'WhatsApp',
  'Faixa de aposta', 'Ja tinha conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var creator = String(data.creator || 'Outros');
    var tab = creator.charAt(0).toUpperCase() + creator.slice(1); // jon -> Jon
    var sheet = getSheet_(tab);
    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      now, data.creator || '', data.source || '', data.flow || '', data.status || '', data.client_id || '',
      data.nome || '', data.contato || '', data.telefone || '',
      data.faixa_aposta_label || '', data.ja_tinha_conta || '',
      data.utm_source || '', data.utm_medium || '', data.utm_campaign || '', data.utm_content || '', data.utm_term || '',
      data.referrer || '', data.landing_url || ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet() {
  return json_({ ok: true, msg: 'LP lead receiver ativo.' });
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
