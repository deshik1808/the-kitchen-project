async function createAdminWorkflow() {
  const host = 'https://n8n.srv1155211.hstgr.cloud';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';
  const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';
  const credentialId = 'oTYKOsLDCXf4qSSD';

  const jsCode = `
const orders = $("Get Orders").all().map(o => o.json).reverse().slice(0, 50);
return { json: { success: true, count: orders.length, orders: orders } };
  `;

  const workflowSpec = {
    name: "🚀 Kitchen Admin API",
    settings: { executionOrder: "v1" },
    nodes: [
      {
        parameters: { httpMethod: "GET", path: "admin-orders", responseMode: "responseNode" },
        name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 1, position: [100, 300], webhookId: "kitchen-admin-orders"
      },
      {
        parameters: { authentication: "serviceAccount", documentId: { __rl: true, value: spreadsheetId, mode: "id" }, sheetName: { __rl: true, value: "Orders", mode: "name" }, options: {} },
        name: "Get Orders", type: "n8n-nodes-base.googleSheets", typeVersion: 4, position: [300, 300], credentials: { googleApi: { id: credentialId } }
      },
      {
        parameters: { jsCode: jsCode },
        name: "Format Logic", type: "n8n-nodes-base.code", typeVersion: 2, position: [500, 300]
      },
      {
        parameters: { respondWith: "allIncomingItems", options: { responseHeaders: { entries: [{ name: "Access-Control-Allow-Origin", value: "*" }] } } },
        name: "Response", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1, position: [700, 300]
      }
    ],
    connections: {
      "Webhook": { main: [[{ node: "Get Orders", type: "main", index: 0 }]] },
      "Get Orders": { main: [[{ node: "Format Logic", type: "main", index: 0 }]] },
      "Format Logic": { main: [[{ node: "Response", type: "main", index: 0 }]] }
    }
  };

  try {
    const res = await fetch(host + '/api/v1/workflows', {
      method: "POST", headers: { "X-N8N-API-KEY": token, "Content-Type": "application/json" },
      body: JSON.stringify(workflowSpec)
    });
    const data = await res.json();
    if (data.id) {
      await fetch(host + '/api/v1/workflows/' + data.id + '/activate', { method: 'POST', headers: { 'X-N8N-API-KEY': token } });
      console.log("✅ Admin API active: " + host + "/webhook/admin-orders");
    } else {
      console.log("❌ Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) { console.error(err); }
}
createAdminWorkflow();
