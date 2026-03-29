const fs = require('fs');

async function createWorkflow() {
  const host = 'https://n8n.srv1155211.hstgr.cloud';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';
  const spreadsheetId = '1Hrn3MbWGud0yUPblTt0EjHD_9BBD-0R1IYFuZ6GB9nw';

  const jsCode = `
const settingsData = $items("Get Settings");
const menuData = $items("Get Menu");

const store = {};
const branding = {};

// Step 2: Parse Settings
settingsData.forEach(item => {
  const row = item.json;
  const label = row['Label']; 
  const value = String(row['Value'] || ''); 
  
  if (!label) return;

  if (label === 'Store Name') store.name = value;
  if (label === 'Store Phone') store.phone = value;
  if (label === 'Store Open') store.open = value === 'Y';
  if (label === 'Closed Message') store.closedMessage = value;
  if (label === 'Store Address') store.address = value;
  if (label === 'Delivery Available') store.deliveryAvailable = value === 'Y';
  if (label === 'Min Order Amount') store.minOrder = Number(value);
  if (label === 'Delivery Fee') store.deliveryFee = Number(value);
  if (label === 'UPI QR Image URL') store.upiQrUrl = value;
  if (label === 'Currency Symbol') store.currency = value;

  if (label === 'Primary Color') branding.primaryColor = value;
  if (label === 'Accent Color') branding.accentColor = value;
  if (label === 'Background Color') branding.backgroundColor = value;
  if (label === 'Surface Color') branding.surfaceColor = value;
  if (label === 'Text Color') branding.textColor = value;
  if (label === 'Font') branding.font = value;
  if (label === 'Logo URL') branding.logoUrl = value;
  if (label === 'Favicon URL') branding.faviconUrl = value;
  if (label === 'Banner Image URL') branding.bannerUrl = value;
  if (label === 'Footer Text') branding.footerText = value;
  if (label === 'Instagram URL') branding.instagramUrl = value;
  if (label === 'Google Maps URL') branding.googleMapsUrl = value;
});

// Step 3: Parse Menu (Filtering out unavailable items)
const menu = menuData
  .filter(item => item.json['Available'] === 'Y')
  .map(item => {
    const row = item.json;
    let addons = [];
    try {
      const addonStr = row['Add-ons'] || '';
      if (addonStr.trim().startsWith('[') || addonStr.trim().startsWith('{')) {
        // try JSON
        addons = JSON.parse(addonStr);
      } else if (addonStr.trim()) {
        // try Simple Text: "Extra Cheese: 30, No Onions: 0"
        addons = addonStr.split(',').map(part => {
          const [name, price] = part.split(':');
          return {
            name: (name || '').trim(),
            price: Number((price || '0').trim()) || 0
          };
        }).filter(a => a.name);
      }
    } catch (e) {
      console.log("Error parsing addons for: " + row['Name'], e.message);
    }
    
    return {
       id: Number(row['ID']),
      name: row['Name'],
      description: row['Description'],
      price: Number(row['Price']),
      category: row['Category'],
      imageUrl: row['Image URL'],
      addons: addons,
      sortOrder: Number(row['Sort Order']) || 99,
      type: row['Veg/Non-Veg']
    };
  })
  .sort((a, b) => a.sortOrder - b.sortOrder);

return {
  store,
  branding,
  menu
};
`;

  const workflowSpec = {
    name: "🚀 Kitchen Menu API [Auto-Generated]",
    settings: {},    
    nodes: [
      {
        parameters: {
          httpMethod: "GET",
          path: "menu",
          responseMode: "responseNode",
          options: {}
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [100, 300],
        webhookId: "kitchen-menu-api-8989"
      },
      {
        parameters: {
          operation: "getAll",
          documentId: {
            __rl: true,
            value: spreadsheetId,
            mode: "id"
          },
          sheetName: {
            __rl: true,
            value: "Settings",
            mode: "name"
          },
          options: {}
        },
        name: "Get Settings",
        type: "n8n-nodes-base.googleSheets",
        typeVersion: 4,
        position: [300, 300]
      },
      {
        parameters: {
          operation: "getAll",
          documentId: {
            __rl: true,
            value: spreadsheetId,
            mode: "id"
          },
          sheetName: {
            __rl: true,
            value: "Menu",
            mode: "name"
          },
          options: {}
        },
        name: "Get Menu",
        type: "n8n-nodes-base.googleSheets",
        typeVersion: 4,
        position: [500, 300]
      },
      {
        parameters: {
          language: "javaScript",
          jsCode: jsCode
        },
        name: "Code",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [700, 300]
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
        position: [900, 300]
      }
    ],
    connections: {
      "Webhook": {
        "main": [
          [
            {
              "node": "Get Settings",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Settings": {
        "main": [
          [
            {
              "node": "Get Menu",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Menu": {
        "main": [
          [
            {
              "node": "Code",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Code": {
        "main": [
          [
            {
              "node": "Respond to Webhook",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
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
    } catch (e) {
      console.log("Cleanup failed, proceeding with creation...");
    }
  }

  await cleanupDuplicates("Kitchen Menu API");

  try {
    const res = await fetch(host + '/api/v1/workflows', {
      method: 'POST',
      headers: { 
        'X-N8N-API-KEY': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowSpec)
    });
    const data = await res.json();
    if (data.id) {
      console.log("✅ Workflow Created! ID:", data.id);
      await fetch(host + '/api/v1/workflows/' + data.id + '/activate', {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': token }
      });
      console.log("✅ Workflow Activated!");
      console.log("📡 Menu API URL: " + host + "/webhook/menu");
    } else {
      console.log("❌ Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error creating workflow:", err.message);
  }
}
createWorkflow();
