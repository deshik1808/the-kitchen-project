async function createDiscountWorkflow() {
  const host = 'https://n8n.srv1155211.hstgr.cloud';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';
  const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';
  const credentialId = 'oTYKOsLDCXf4qSSD'; // 31Kitchens_Service_Account

  const jsCode = `
const discountsData = $items("Get Discounts");
const webhookData = $items("Webhook");

const body = webhookData[0].json.body || {};
const code = (body.code || "").trim().toUpperCase();
const subtotal = Number(body.subtotal || 0);

if (!code) {
  return { valid: false, discountAmount: 0, message: "No discount code provided" };
}

const match = discountsData.find(item => {
  return (item.json['Code'] || "").trim().toUpperCase() === code;
});

if (!match) {
  return { valid: false, discountAmount: 0, message: "Invalid discount code" };
}

const d = match.json;

if (d['Active'] !== 'Y') {
  return { valid: false, discountAmount: 0, message: "This discount code is no longer active" };
}

if (d['Expiry']) {
  const expiryDate = new Date(d['Expiry']);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiryDate < today) {
    return { valid: false, discountAmount: 0, message: "This discount code has expired" };
  }
}

const usageLimit = Number(d['Usage Limit'] || 9999);
const usedCount = Number(d['Used Count'] || 0);
if (usedCount >= usageLimit) {
  return { valid: false, discountAmount: 0, message: "This discount code has reached its usage limit" };
}

const minOrder = Number(d['Min Order'] || 0);
if (subtotal < minOrder) {
  return { valid: false, discountAmount: 0, message: "Minimum order of Rs." + minOrder + " required" };
}

const type = (d['Type'] || "").toLowerCase();
const value = Number(d['Value'] || 0);
const maxDiscount = Number(d['Max Discount'] || 99999);

let discountAmount = 0;
if (type === 'percent') {
  discountAmount = Math.round(subtotal * value / 100);
} else if (type === 'flat') {
  discountAmount = value;
}
discountAmount = Math.min(discountAmount, maxDiscount, subtotal);

const message = type === 'percent'
  ? value + "% off applied! You save Rs." + discountAmount
  : "Rs." + value + " off applied! You save Rs." + discountAmount;

return {
  valid: true,
  type: type,
  value: value,
  discountAmount: discountAmount,
  message: message
};
`;

  const workflowSpec = {
    name: "Kitchen Validate Discount",
    settings: {},
    nodes: [
      {
        parameters: {
          path: "validate-discount",
          httpMethod: "POST",
          responseMode: "responseNode",
          options: {}
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [100, 300],
        webhookId: "kitchen-validate-discount-final"
      },
      {
        parameters: {
          authentication: "serviceAccount",
          documentId: {
            __rl: true,
            value: spreadsheetId,
            mode: "id"
          },
          sheetName: {
            __rl: true,
            value: "Discounts",
            mode: "name"
          },
          options: {}
        },
        name: "Get Discounts",
        type: "n8n-nodes-base.googleSheets",
        typeVersion: 4,
        position: [300, 300],
        credentials: {
          googleApi: {
            id: credentialId,
            name: "31Kitchens_Service_Account"
          }
        }
      },
      {
        parameters: {
          jsCode: jsCode
        },
        name: "Code",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [500, 300]
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: "={{ $json }}",
          options: {}
        },
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [700, 300]
      }
    ],
    connections: {
      "Webhook": {
        "main": [[{ "node": "Get Discounts", "type": "main", "index": 0 }]]
      },
      "Get Discounts": {
        "main": [[{ "node": "Code", "type": "main", "index": 0 }]]
      },
      "Code": {
        "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
      }
    }
  };

  try {
    console.log("Creating Validate Discount workflow (final)...");
    const res = await fetch(host + '/api/v1/workflows', {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowSpec)
    });
    const data = await res.json();

    if (data.id) {
      console.log("✅ Created! ID:", data.id);
      const actRes = await fetch(host + '/api/v1/workflows/' + data.id + '/activate', {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': token }
      });
      console.log("✅ Activated");
      console.log("📡 URL: " + host + "/webhook/validate-discount");
    } else {
      console.log("❌ Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

createDiscountWorkflow();
