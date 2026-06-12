/**
 * SuperJon — coletor de leads para Google Sheets.
 *
 * Como usar:
 *  1. Crie uma planilha no Google Sheets.
 *  2. Menu  Extensões → Apps Script.  Cole este arquivo (substitua o conteúdo).
 *  3. Implantar → Nova implantação → tipo "App da Web".
 *       - Executar como: Eu
 *       - Quem tem acesso: Qualquer pessoa
 *  4. Copie a URL do app da Web e cole em SHEETS_WEBHOOK_URL no app.js.
 *
 * A primeira linha vira o cabeçalho automaticamente, na ordem de COLUMNS,
 * mantendo a planilha organizada para as próximas campanhas.
 */

// Ordem das colunas (chaves do payload enviado pela LP).
var COLUMNS = [
  'submitted_at',
  'nome',
  'contato_superbet',
  'telefone',
  'faixa_aposta_label',
  'faixa_aposta',
  'tier',
  'vip_candidate',
  'ja_tinha_conta',
  'consentimento',
  'origem',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referrer',
  'landing_url',
  'user_agent'
];

// Rótulos amigáveis do cabeçalho (mesma ordem de COLUMNS).
var HEADERS = [
  'Data/Hora', 'Nome', 'E-mail ou ID', 'Telefone',
  'Faixa de aposta', 'Faixa (cod)', 'Tier', 'VIP?',
  'Já tinha conta', 'Consentimento', 'Origem',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL', 'User Agent'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // evita corrida em envios simultâneos
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Cabeçalho na primeira execução
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    var row = COLUMNS.map(function (key) {
      var v = data[key];
      return v === undefined || v === null ? '' : v;
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Healthcheck simples ao abrir a URL no navegador.
function doGet() {
  return json({ ok: true, service: 'superjon-leads' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
