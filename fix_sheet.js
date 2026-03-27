const { google } = require('googleapis');
const path = require('path');

async function fixSheet() {
  const credPath = path.normalize(process.env.GOOGLE_APPLICATION_CREDENTIALS || 'D://UserFiles//Downloads//the-kitchen-project-bc8d581ef629.json').replace(/\\/g, '/');
  
  const auth = new google.auth.GoogleAuth({
    keyFile: 'D:/UserFiles/Downloads/the-kitchen-project-bc8d581ef629.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';

  try {
    // 1. Get the current sheet to find the sheetId of "Settings"
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const settingsSheet = res.data.sheets.find(s => s.properties.title === 'Settings');
    const sheetId = settingsSheet.properties.sheetId;

    // 2. Insert 1 blank row at the top
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1
              },
              inheritFromBefore: false
            }
          }
        ]
      }
    });

    // 3. Write 'Label' and 'Value' to A1:B1
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Settings!A1:B1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['Label', 'Value']] }
    });

    console.log("Success! Headers added to Settings.");
  } catch (err) {
    console.error("Error fixing sheet:", err.message);
  }
}
fixSheet();
