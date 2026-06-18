/**
 * LP Leads — Sync Supabase -> Google Sheets (PULL em LOTE, agendado)
 *
 * Por que pull em lote (e não webhook por linha): sob alto tráfego, um webhook
 * por INSERT estoura as cotas do Apps Script. Aqui um gatilho de tempo roda a
 * cada poucos minutos, lê em BLOCOS as linhas ainda não sincronizadas
 * (synced_to_sheets = false), grava de uma vez (setValues) e marca como
 * sincronizadas. O Postgres é a fonte da verdade; a planilha é um espelho.
 *
 * Suporta as 2 marcas (1 projeto Supabase por marca), cada uma na sua aba.
 *
 * ---- SETUP (uma vez) ----
 * 1. Planilha -> Extensões -> Apps Script -> cole este arquivo.
 * 2. Project Settings -> Script Properties -> adicione a propriedade SOURCES
 *    com um JSON (use a chave SERVICE ROLE, não a anon — ela ignora o RLS p/
 *    ler e marcar como sincronizado; mantenha secreta aqui):
 *
 *    SOURCES = [
 *      {"name":"nobru","url":"https://XXXX.supabase.co","key":"SERVICE_ROLE_KEY","sheet":"Nobru"},
 *      {"name":"jon","url":"https://YYYY.supabase.co","key":"SERVICE_ROLE_KEY","sheet":"Jon"}
 *    ]
 *
 * 3. Rode setupTrigger() uma vez (cria o gatilho de 5 em 5 min). Pronto.
 *    (Rode syncLeads() manualmente p/ testar.)
 *
 * Obs.: a planilha tem limite de ~10M células. Para volume muito alto, troque
 * a aba periodicamente (ex.: uma aba por mês) ou trate o Postgres como store.
 */

var BATCH = 500;          // linhas por leitura (ajuste se precisar)
var TABLE = 'lp_leads';

var COLUMNS = [
  'created_at', 'creator', 'source', 'flow', 'status', 'client_id',
  'nome', 'contato', 'telefone',
  'faixa_aposta_label', 'ja_tinha_conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'referrer', 'landing_url'
];

var HEADERS = [
  'Data/Hora', 'Creator', 'Origem', 'Fluxo', 'Status', 'Client ID',
  'Nome', 'E-mail/ID', 'WhatsApp',
  'Faixa de aposta', 'Já tinha conta',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Referrer', 'Landing URL'
];

function getSources_() {
  var raw = PropertiesService.getScriptProperties().getProperty('SOURCES');
  if (!raw) throw new Error('Defina a Script Property SOURCES (JSON com url/key/sheet por marca).');
  return JSON.parse(raw);
}

// Roda em loop pelas marcas. Use um gatilho de tempo (setupTrigger).
function syncLeads() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return; // já tem uma execução rodando
  try {
    getSources_().forEach(function (src) {
      try { syncSource_(src); }
      catch (err) { Logger.log('[' + (src.name || '?') + '] erro: ' + err); }
    });
  } finally {
    lock.releaseLock();
  }
}

function syncSource_(src) {
  var base = String(src.url).replace(/\/+$/, '') + '/rest/v1/' + TABLE;
  var auth = { 'apikey': src.key, 'Authorization': 'Bearer ' + src.key };

  // 1) lê um bloco de não-sincronizados (mais antigos primeiro)
  var readUrl = base + '?synced_to_sheets=eq.false&order=created_at.asc&limit=' + BATCH +
    '&select=id,' + COLUMNS.join(',');
  var res = UrlFetchApp.fetch(readUrl, { headers: auth, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    Logger.log('[' + src.name + '] leitura falhou ' + res.getResponseCode() + ': ' + res.getContentText());
    return;
  }
  var rows = JSON.parse(res.getContentText());
  if (!rows.length) return;

  // 2) grava de uma vez na aba da marca
  var sheet = getSheet_(src.sheet || src.name || 'Leads');
  var values = rows.map(function (r) {
    return COLUMNS.map(function (k) { return (r[k] === undefined || r[k] === null) ? '' : r[k]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, COLUMNS.length).setValues(values);

  // 3) marca como sincronizadas (PATCH em lote por id)
  var ids = rows.map(function (r) { return '"' + r.id + '"'; }).join(',');
  var patch = UrlFetchApp.fetch(base + '?id=in.(' + ids + ')', {
    method: 'patch',
    headers: { 'apikey': src.key, 'Authorization': 'Bearer ' + src.key,
               'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    payload: JSON.stringify({ synced_to_sheets: true }),
    muteHttpExceptions: true
  });
  if (patch.getResponseCode() >= 300) {
    Logger.log('[' + src.name + '] PATCH synced falhou ' + patch.getResponseCode() + ': ' + patch.getContentText());
  } else {
    Logger.log('[' + src.name + '] sincronizou ' + rows.length + ' linha(s).');
  }
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

// Rode uma vez: cria o gatilho de tempo (5 min). Remove duplicados antes.
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncLeads').timeBased().everyMinutes(5).create();
  Logger.log('Gatilho criado: syncLeads a cada 5 min.');
}
