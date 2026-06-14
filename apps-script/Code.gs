/**
 * SuperJon — Sync Supabase -> Google Sheets (receptor)
 *
 * Fluxo recomendado: Database Webhook no Supabase (na tabela lp_leads, evento
 * INSERT) faz POST deste Web App, que dá appendRow na planilha. Near-real-time,
 * sem backend. (Para picos muito altos, dá pra trocar por um pull em lote
 * agendado lendo synced_to_sheets = false.)
 *
 * Setup:
 *  1. Crie a planilha -> Extensões -> Apps Script -> cole este arquivo.
 *  2. Implantar -> Novo -> App da Web -> Executar como: Eu / Acesso: Qualquer um.
 *  3. No Supabase: Database -> Webhooks -> Create -> tabela lp_leads, evento
 *     INSERT, tipo HTTP POST, URL = a URL do Web App.
 */

// Colunas exportadas (na ordem da planilha) — espelham a tabela lp_leads.
var COLUMNS = [
  'created_at', 'brand', 'source',
  'nome', 'contato', 'telefone',
  'faixa_aposta_label', 'tier', 'vip_candidate', 'ja_tinha_conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'referrer', 'landing_url'
];

var HEADERS = [
  'Data/Hora', 'Marca', 'Origem',
  'Nome', 'E-mail/ID', 'Telefone',
  'Faixa de aposta', 'Tier', 'VIP?', 'Já tinha conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    // Webhook do Supabase manda { type, record, ... }; aceita também row direta.
    var row = body.record || body;

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(COLUMNS.map(function (k) {
      var v = row[k];
      return v === undefined || v === null ? '' : v;
    }));
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json({ ok: true, service: 'superjon-leads-sync' }); }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
