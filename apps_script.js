const sheetName = 'data';
const scriptProp = PropertiesService.getScriptProperties();

function initalSetup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
}

function doPost (e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    const sheet = doc.getSheetByName(sheetName);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    const newRow = headers.map(function(header) {
      return header === 'Date' ? new Date() : e.parameter[header]
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    sendMail(newRow);

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
    .setMimeType(ContentService.MimeType.JSON);
  }
  catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e}))
    .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}

function doGet (e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  rows.reverse();
  rows.pop();
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

async function sendMail (e) {
  MailApp.sendEmail({
      to: 'nestorasangelopoulos@gmail.com',
      subject: 'Someone signed your guest book!',
      htmlBody: '<div style="position: absolute;top: 0px;left: 0px;height: 100%;width: 100%;overflow: hidden;font-size: 2em;color: white;background: linear-gradient(210deg, #5bcefa, #7dc2ff, #9bb5ff, #b4a8fe, #cea0f5, #e49ee6, #f1a1d1, #f5a9b8);"><div style="margin: 10vw;"><h1><center>🎉🥳🎊</center></h1><h3><span style="color: #A020F0;">' + e[0] + '</span> says: <br><span style="color: #A020F0;">' + e[1] + '</span></h3><h5>Edit your guest book <a style="color: #A020F0; text-decoration: underline;" href="https://docs.google.com/spreadsheets/d/1KJ9tKrVin1UvbVa7jwdFHD2n2MmR3K1VEoW8dKrgTCE/edit?usp=sharing">here</a><br>Or view your website <a style="color: #A020F0; text-decoration: underline;" href="https://nestorasangelopoulos.github.io">here</a></h5></div>'
    });
}