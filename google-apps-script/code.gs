/**
 * Money Manager — Google Sheets ledger bridge
 * -------------------------------------------------------------
 * A tiny "backend" that lets the PWA and iPhone Shortcuts read and
 * write a Google Sheet over HTTP.
 *
 *   doPost(e)  → Append transaction(s) from the request body
 *   doGet(e)   → Return every transaction row as JSON
 *
 * Deploy steps (see README.md in this folder):
 *   1. Create a Google Sheet, copy its ID from the URL.
 *   2. Extensions ▸ Apps Script. Paste this file. Save.
 *   3. Project Settings ▸ Script Properties:
 *        SHEET_ID = <your spreadsheet id>
 *        TOKEN    = <any secret you pick>   (optional but recommended)
 *   4. Deploy ▸ New deployment ▸ Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Copy the /exec URL into the app's Data tab and paste the
 *      same TOKEN there.
 */

var CONFIG_SHEET_ID = ''; // fallback if SHEET_ID script property is missing
var CONFIG_TOKEN    = ''; // fallback if TOKEN script property is missing
var SHEET_TAB       = 'Transactions';
var HEADER          = ['Date', 'Type', 'Amount', 'Note', 'Source', 'CreatedAt'];

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

function _sheetId() {
  var p = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return (p || CONFIG_SHEET_ID || '').trim();
}

function _token() {
  var p = PropertiesService.getScriptProperties().getProperty('TOKEN');
  return (p || CONFIG_TOKEN || '').trim();
}

// If a TOKEN is configured, every request must pass ?key=<token>.
// NOTE: a public web app has no real auth — the token only stops random
// strangers, it is NOT a password. Anyone inside this app's own network
// can read it. Fine for personal use, not for sensitive shared data.
function _tokenOk(e) {
  var t = _token();
  if (!t) return true;
  return !!(e && e.parameter && e.parameter.key === t);
}

function _getSheet() {
  var id = _sheetId();
  if (!id) throw new Error('SHEET_ID not set (add it under Project Settings ▸ Script Properties)');
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName(SHEET_TAB);
  if (!sh) {
    sh = ss.insertSheet(SHEET_TAB);
    sh.appendRow(HEADER);
  }
  return sh;
}

function _json(obj, status) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  try { if (status) out.setStatusCode(status); } catch (e) {}
  return out;
}

/* ------------------------------------------------------------------ */
/* Parsing helpers (mirror src/utils/importTransactions.js)            */
/* ------------------------------------------------------------------ */

function _pad(n) { return ('0' + n).slice(-2); }

// Accepts DD/MM/YYYY (Buddhist year > 2400 auto-converted to CE) and YYYY-MM-DD.
function _normalizeDate(str) {
  var s = String(str || '').trim();
  var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    var d = +m[1], mo = +m[2], y = +m[3];
    if (y > 2400) y -= 543;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return y + '-' + _pad(mo) + '-' + _pad(d);
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    var y2 = +m[1], mo2 = +m[2], d2 = +m[3];
    var dt2 = new Date(y2, mo2 - 1, d2);
    if (dt2.getFullYear() !== y2 || dt2.getMonth() !== mo2 - 1 || dt2.getDate() !== d2) return null;
    return s;
  }
  return null;
}

function _parseAmount(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null;
  var n = parseFloat(String(v || '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Normalize one record into { date, type, amount, note } or throw.
function _normalizeRecord(v) {
  var date = _normalizeDate(v.date);
  if (!date) throw new Error('invalid date "' + v.date + '"');
  var type = String(v.type || '').trim().toLowerCase();
  if (type !== 'expense' && type !== 'income') {
    throw new Error('invalid type "' + v.type + '" (use EXPENSE or INCOME)');
  }
  var amount = _parseAmount(v.amount);
  if (amount === null) throw new Error('invalid amount "' + v.amount + '"');
  return {
    date: date,
    type: type,
    amount: amount,
    note: String(v.note || '').slice(0, 100),
    source: v.source || 'shortcut'
  };
}

// Parse one `Date:/Type:/Amount:/Description:` text block.
function _parseBlock(lines) {
  var fields = {};
  for (var i = 0; i < lines.length; i++) {
    var m = /^(Date|Type|Amount|Description|Source)\s*:\s*(.*)$/i.exec(lines[i]);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  if (!fields.date || !fields.type || !fields.amount) {
    throw new Error('missing Date/Type/Amount');
  }
  return _normalizeRecord({
    date: fields.date,
    type: fields.type,
    amount: fields.amount,
    note: fields.description,
    source: fields.source || 'shortcut'
  });
}

// Normalize a cell value that might be a real Date object into YYYY-MM-DD.
function _cellDate(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return _normalizeDate(v);
}

// Local Bangkok (+07:00, no DST) timestamp as readable "YYYY-MM-DD HH:mm:ss".
function _bangkokTimestamp() {
  var d = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return d.getUTCFullYear() + '-' + _pad(d.getUTCMonth() + 1) + '-' + _pad(d.getUTCDate())
    + ' ' + _pad(d.getUTCHours()) + ':' + _pad(d.getUTCMinutes()) + ':' + _pad(d.getUTCSeconds());
}

/* ------------------------------------------------------------------ */
/* GET — read all transactions                                         */
/* ------------------------------------------------------------------ */

function doGet(e) {
  try {
    if (!_tokenOk(e)) return _json({ ok: false, error: 'Unauthorized' }, 403);
    var sh = _getSheet();
    var last = sh.getLastRow();
    if (last < 2) return _json({ ok: true, count: 0, transactions: [] });

    var values = sh.getRange(2, 1, last - 1, HEADER.length).getValues();
    var transactions = [];
    for (var i = 0; i < values.length; i++) {
      var r = values[i];
      var date = _cellDate(r[0]);
      var type = String(r[1] || '').trim().toLowerCase();
      var amount = _parseAmount(r[2]);
      var note = String(r[3] || '').trim();
      if (!date || !type || amount === null) continue; // skip blank/bad rows
      transactions.push({
        date: date,
        type: type,
        amount: amount,
        note: note,
        source: String(r[4] || '').trim()
      });
    }
    return _json({ ok: true, count: transactions.length, transactions: transactions });
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

/* ------------------------------------------------------------------ */
/* POST — save transaction(s)                                          */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    if (!_tokenOk(e)) return _json({ ok: false, error: 'Unauthorized' }, 403);
    var sh = _getSheet();
    if (sh.getLastRow() === 0) sh.appendRow(HEADER);

    var items = [];
    var errors = [];

    // Mode 1: raw text/plain body = one or more Date:/Type:/Amount: blocks
    if (e && e.postData && e.postData.contents) {
      var text = String(e.postData.contents || '');
      if (/^date\s*:/i.test(text.trim())) {
        var lines = text.split(/\r?\n/).map(function (l) { return l.trim(); })
          .filter(function (l) { return l.length > 0; });
        var blocks = [[]];
        for (var i = 0; i < lines.length; i++) {
          if (/^date\s*:/i.test(lines[i]) && blocks[blocks.length - 1].length) blocks.push([]);
          blocks[blocks.length - 1].push(lines[i]);
        }
        for (var b = 0; b < blocks.length; b++) {
          if (!/^date\s*:/i.test(blocks[b][0] || '')) {
            errors.push('Block ' + (b + 1) + ': does not start with "Date:"');
            continue;
          }
          try { items.push(_parseBlock(blocks[b])); }
          catch (err) { errors.push('Block ' + (b + 1) + ': ' + err.message); }
        }
      }
    }

    // Mode 2: form-encoded structured fields date/type/amount/note
    if (e && e.parameter && e.parameter.date && e.parameter.type) {
      var p = e.parameter;
      try {
        items.push(_normalizeRecord({
          date: p.date, type: p.type, amount: p.amount,
          note: p.note || p.description || '', source: p.source || 'shortcut'
        }));
      } catch (err) { errors.push('Structured record: ' + err.message); }
    }

    if (items.length === 0 && errors.length === 0) {
      return _json({ ok: false, error: 'No usable data (expected text starting with "Date:" or date/type/amount fields)', added: 0 }, 400);
    }

    // Dedupe against rows already in the sheet (Date|Type|Amount|Note)
    var seen = {};
    var existing = sh.getLastRow() >= 2
      ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
      : [];
    for (var x = 0; x < existing.length; x++) {
      var key = _cellDate(existing[x][0]) + '|' + String(existing[x][1] || '').trim().toLowerCase()
        + '|' + String(existing[x][2] || '').trim() + '|' + String(existing[x][3] || '').trim();
      seen[key] = true;
    }

    var rows = [];
    var added = 0;
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var k = it.date + '|' + it.type + '|' + String(it.amount) + '|' + it.note;
      if (seen[k]) continue;
      seen[k] = true;
      rows.push([it.date, it.type, it.amount, it.note, it.source, _bangkokTimestamp()]);
      added++;
    }

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);
    }

    return _json({ ok: true, added: added, skipped: items.length - added, errors: errors });
  } catch (err) {
    return _json({ ok: false, error: String(err && err.message || err) }, 500);
  }
}
