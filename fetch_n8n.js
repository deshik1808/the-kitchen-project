const fs = require('fs');

async function getWorkflows() {
  const host = 'https://n8n.srv1155211.hstgr.cloud';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';
  
  try {
    const res = await fetch(host + '/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': token }
    });
    const data = await res.json();
    fs.writeFileSync('d:/Full Stack Experimentation/Kitchen-Project/tmp_workflows.json', JSON.stringify(data.data, null, 2));
    console.log(`Saved ${data.data.length} workflows to tmp_workflows.json`);
  } catch (err) {
    console.error(err.message);
  }
}
getWorkflows();
