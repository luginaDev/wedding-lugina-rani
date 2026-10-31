/**
 * RSVP & Wishes backend for the wedding website (free, stored in YOUR Google Sheet).
 * Setup steps are in README.md → "Connect RSVP to Google Sheets".
 */
const SHEET_NAME = 'RSVP';
const HEADERS = ['Time', 'Name', 'Attendance', 'Guests', 'Message'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stops values like "=HYPERLINK(...)" from running as formulas in the sheet
function clean_(value, max) {
  let s = String(value || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true }); // spam bot
  const name = clean_(p.name, 60);
  if (!name) return json_({ ok: false, error: 'Name is required' });
  const attendance = p.attendance === 'Attending' ? 'Attending' : 'Not attending';
  const guests = Math.max(0, Math.min(10, parseInt(p.guests, 10) || 0));
  const message = clean_(p.message, 500);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), name, attendance, guests, message]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function doGet() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter((r) => r[4])
    .map((r) => ({
      time: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]).replace(/^'/, ''),
      attendance: r[2],
      message: String(r[4]).replace(/^'/, ''),
    }))
    .reverse()
    .slice(0, 300);
  return json_({ ok: true, wishes: wishes });
}
