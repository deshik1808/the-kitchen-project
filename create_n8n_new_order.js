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
const storePhone = storeSettings['Store Phone'] || "919876543210";
let itemText = body.items.map(i => "• " + i.name + " x " + i.qty).join("%0A");
const waText = "🍽 *New Order: " + orderId + "*%0A%0A" +
    "*Customer:* " + body.customer.name + "%0A" +
    "*Phone:* " + body.customer.phone + "%0A" +
    "*Type:* " + body.deliveryType.toUpperCase() + "%0A%0A" +
    "*Items:*%0A" + itemText + "%0A%0A" +
    "*Subtotal:* Rs." + subtotal + "%0A" +
    (discountAmount > 0 ? "*Discount:* -Rs." + discountAmount + "%0A" : "") +
    (total - (subtotal - discountAmount) > 0 ? "*Delivery:* Rs." + (total - (subtotal - discountAmount)) + "%0A" : "") +
    "*Total:* *Rs." + total + "*%0A%0A" +
    (body.deliveryType === 'delivery' ? "*Address:* " + body.address : "") +
    (body.notes ? "%0A*Notes:* " + body.notes : "");
const waLink = "https://wa.me/" + storePhone + "?text=" + waText;

const callMeBotKey = storeSettings['CallMeBot API Key'] || "";
let callMeBotUrl = "";
if (adminPhone && callMeBotKey) {
  const textMsg = "🍽 *NEW ORDER:* " + orderId + "\\n" +
                  "🧑 " + body.customer.name + " (" + body.customer.phone + ")\\n" +
                  "💰 Total: Rs." + total + "\\n" +
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
            value: {
              "Order ID": "={{ $json.sheet_OrderId }}",
              "Timestamp": "={{ $json.sheet_Timestamp }}",
              "Customer Name": "={{ $json.sheet_CustomerName }}",
              "Phone": "={{ $json.sheet_Phone }}",
              "Items": "={{ $json.sheet_Items }}",
              "Subtotal": "={{ $json.sheet_Subtotal }}",
              "Discount Code": "={{ $json.sheet_DiscountCode }}",
              "Discount Amount": "={{ $json.sheet_DiscountAmount }}",
              "Delivery Fee": "={{ $json.sheet_DeliveryFee }}",
              "Total": "={{ $json.sheet_Total }}",
              "Payment Method": "={{ $json.sheet_Method }}",
              "Order Status": "New",
              "Delivery Type": "={{ $json.sheet_Type }}",
              "Address": "={{ $json.sheet_Address }}",
              "Notes": "={{ $json.sheet_Notes }}"
            }
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

  async function cleanupDuplicates(nameFilter) {
    try {
      const res = await fetch(host + '/api/v1/workflows', {
        headers: { 'X-N8N-API-KEY': token }
      });
      const data = await res.json();
      const workflows = data.data || [];
      for (const w of workflows) {
        if (w.name.includes(nameFilter) && w.active) {
          console.log(`Deactivating old duplicate: ${w.name} (${w.id})`);
          await fetch(`${host}/api/v1/workflows/${w.id}/deactivate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': token }
          });
        }
      }
    } catch (e) {}
  }

  await cleanupDuplicates("Kitchen New Order");

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
