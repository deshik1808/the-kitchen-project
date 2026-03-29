const fs = require('fs');
const token = require('D:/UserFiles/Downloads/the-kitchen-project-bc8d581ef629.json');
const crypto = require('crypto');

function base64urlEncode(str) { return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function getAuthToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = { iss: token.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: token.token_uri, exp, iat };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = encodedHeader + '.' + encodedPayload;
  const sign = crypto.createSign('RSA-SHA256'); sign.update(signatureInput);
  const signature = base64urlEncode(sign.sign(token.private_key));
  return (await (await fetch(token.token_uri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + signatureInput + '.' + signature })).json()).access_token;
}

async function run() {
  try {
    const accessToken = await getAuthToken();
    const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';
    const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/Orders", {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    const data = await res.json();
    console.log("Total rows: " + data.values.length);
    console.log("Last 5 rows A cols:");
    console.log(data.values.slice(-5).map(row => row[0]));
    console.log("Last 5 rows full:");
    console.log(data.values.slice(-5));
  } catch(e) { console.error(e); }
}
run();
