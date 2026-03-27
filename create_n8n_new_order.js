async function createOrderWorkflow() {
  const host = 'https://n8n.srv1155211.hstgr.cloud';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';
  const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';
  const credentialId = 'oTYKOsLDCXf4qSSD';

  const jsCode = `
const body = $("Webhook").first().json.body;
const settings = $("Get Settings").all();
const discounts = $("Get Discounts").all();

const storeSettings = {};
settings.forEach(s => storeSettings[s.json.Label] = s.json.Value);

let subtotal = 0;
body.items.forEach(item => {
  const addonsPrice = (item.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  subtotal += (Number(item.price) + addonsPrice) * Number(item.qty);
});

let discountAmount = 0;
let discountCode = (body.discountCode || "").trim().toUpperCase();
if (discountCode) {
  const match = discounts.find(d => (d.json.Code || "").trim().toUpperCase() === discountCode);
  if (match && match.json.Active === 'Y') {
    const d = match.json;
    if (subtotal >= Number(d['Min Order'] || 0)) {
      discountAmount = (d.Type || "").toLowerCase() === 'percent' ? Math.round(subtotal * Number(d.Value) / 100) : Number(d.Value);
      discountAmount = Math.min(discountAmount, Number(d['Max Discount'] || 99999), subtotal);
    }
  }
}

const total = subtotal - discountAmount + (body.deliveryType === 'delivery' ? Number(storeSettings['Delivery Fee'] || 0) : 0);
const now = new Date();
const orderId = "ORD-" + ((now.getMonth()+1).toString().padStart(2,'0')) + (now.getDate().toString().padStart(2,'0')) + "-" + Math.floor(1000 + Math.random() * 9000);

const adminPhone = storeSettings['Admin Phone'] || "";
const callMeBotKey = storeSettings['CallMeBot API Key'] || "";
let callMeBotUrl = "";
if (adminPhone && callMeBotKey) {
  const textMsg = "🍽 *NEW ORDER:* " + orderId + "\n" +
                  "🧑 " + body.customer.name + " (" + body.customer.phone + ")\n" +
                  "💰 Total: Rs." + total + "\n" +
                  "💳 Paid: " + body.paymentMethod;
  callMeBotUrl = "https://api.callmebot.com/whatsapp.php?phone=" + adminPhone.replace(/\\+/g,'') + "&text=" + encodeURIComponent(textMsg) + "&apikey=" + callMeBotKey;
}

return {
  json: {
    success: true,
    orderId: orderId,
    total: total,
    waLink: waLink,
    upiQrUrl: storeSettings['UPI QR Image URL'] || "",
    callMeBotUrl: callMeBotUrl,
    // Sheet Data
    sheet_OrderId: orderId,
    sheet_Timestamp: now.toLocaleString(),
    sheet_CustomerName: body.customer.name,
    sheet_Phone: body.customer.phone,
    sheet_Items: JSON.stringify(body.items),
    sheet_Subtotal: subtotal,
    sheet_DiscountCode: discountCode,
    sheet_DiscountAmount: discountAmount,
    sheet_DeliveryFee: total - (subtotal - discountAmount),
    sheet_Total: total,
    sheet_Method: body.paymentMethod,
    sheet_Type: body.deliveryType,
    sheet_Address: body.address || "",
    sheet_Notes: body.notes || ""
  }
};
`;

  const workflowSpec = {
    name: "🚀 Kitchen New Order [LITE] + API",
    settings: { executionOrder: "v1" },
    nodes: [
      {
        parameters: { httpMethod: "POST", path: "new-order", responseMode: "responseNode" },
        name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 1, position: [100, 300], webhookId: "kitchen-new-order-lite-api"
      },
      {
        parameters: { authentication: "serviceAccount", documentId: { __rl: true, value: spreadsheetId, mode: "id" }, sheetName: { __rl: true, value: "Settings", mode: "name" }, options: {} },
        name: "Get Settings", type: "n8n-nodes-base.googleSheets", typeVersion: 4, position: [250, 450], credentials: { googleApi: { id: credentialId } }
      },
      {
        parameters: { authentication: "serviceAccount", documentId: { __rl: true, value: spreadsheetId, mode: "id" }, sheetName: { __rl: true, value: "Discounts", mode: "name" }, options: {} },
        name: "Get Discounts", type: "n8n-nodes-base.googleSheets", typeVersion: 4, position: [450, 450], credentials: { googleApi: { id: credentialId } }
      },
      {
        parameters: { jsCode: jsCode },
        name: "Logic", type: "n8n-nodes-base.code", typeVersion: 2, position: [650, 300]
      },
      {
        parameters: {
          authentication: "serviceAccount", operation: "append", documentId: { __rl: true, value: spreadsheetId, mode: "id" }, sheetName: { __rl: true, value: "Orders", mode: "name" },
          columns: {
            mappingMode: "defineBelow",
            value: [
              { column: "Order ID", value: "={{ $json.sheet_OrderId }}" },
              { column: "Timestamp", value: "={{ $json.sheet_Timestamp }}" },
              { column: "Customer Name", value: "={{ $json.sheet_CustomerName }}" },
              { column: "Phone", value: "={{ $json.sheet_Phone }}" },
              { column: "Items", value: "={{ $json.sheet_Items }}" },
              { column: "Subtotal", value: "={{ $json.sheet_Subtotal }}" },
              { column: "Discount Code", value: "={{ $json.sheet_DiscountCode }}" },
              { column: "Discount Amount", value: "={{ $json.sheet_DiscountAmount }}" },
              { column: "Delivery Fee", value: "={{ $json.sheet_DeliveryFee }}" },
              { column: "Total", value: "={{ $json.sheet_Total }}" },
              { column: "Payment Method", value: "={{ $json.sheet_Method }}" },
              { column: "Order Status", value: "New" },
              { column: "Delivery Type", value: "={{ $json.sheet_Type }}" },
              { column: "Address", value: "={{ $json.sheet_Address }}" },
              { column: "Notes", value: "={{ $json.sheet_Notes }}" }
            ]
          }, options: {}
        },
        name: "Save Order", type: "n8n-nodes-base.googleSheets", typeVersion: 4, position: [850, 300], credentials: { googleApi: { id: credentialId } }
      },
      {
        parameters: { respondWith: "json", responseBody: "={\n  \"success\": true,\n  \"orderId\": \"{{ $node[\"Logic\"].json.orderId }}\",\n  \"waLink\": \"{{ $node[\"Logic\"].json.waLink }}\",\n  \"total\": {{ $node[\"Logic\"].json.total }}\n}", options: { responseHeaders: { entries: [{ name: "Access-Control-Allow-Origin", value: "*" }] } } },
        name: "Response", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1, position: [1050, 300]
      },
      {
        parameters: { conditions: { string: [{ value1: "={{ $node[\"Logic\"].json.callMeBotUrl }}", operation: "notEmpty" }] } },
        name: "IF Bot Ready", type: "n8n-nodes-base.if", typeVersion: 1, position: [1050, 500]
      },
      {
        parameters: { method: "GET", url: "={{ $node[\"Logic\"].json.callMeBotUrl }}" },
        name: "CallMeBot API", type: "n8n-nodes-base.httpRequest", typeVersion: 4, position: [1250, 500]
      }
    ],
    connections: {
      "Webhook": { main: [[{ node: "Get Settings", type: "main", index: 0 }]] },
      "Get Settings": { main: [[{ node: "Get Discounts", type: "main", index: 0 }]] },
      "Get Discounts": { main: [[{ node: "Logic", type: "main", index: 0 }]] },
      "Logic": { main: [[{ node: "Save Order", type: "main", index: 0 }]] },
      "Save Order": { main: [[{ node: "Response", type: "main", index: 0 }, { node: "IF Bot Ready", type: "main", index: 0 }]] },
      "IF Bot Ready": { main: [[{ node: "CallMeBot API", type: "main", index: 0 }]] }
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
      console.log("✅ LITE workflow active: " + host + "/webhook/new-order");
    } else {
      console.log("❌ Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) { console.error(err); }
}
createOrderWorkflow();
