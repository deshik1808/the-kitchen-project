const host = 'https://n8n.srv1155211.hstgr.cloud';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2EzM2ExZC1hYTk2LTQzNTAtYTg2Ni1jMTdmZjRiNmNjZmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzc0NTk1NzM3fQ.IxHbX-UikNx7UF8CrJjuEDkJ-xdR-Tn9jd3s-ZUEARI';

async function cleanup() {
  try {
    const res = await fetch(host + '/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': token }
    });
    const data = await res.json();
    const workflows = data.data || [];
    
    console.log(`Found ${workflows.length} workflows.`);
    
    // Group by name
    const grouped = {};
    const kitchenWorkflows = workflows.filter(w => w.name.toLowerCase().includes('kitchen'));
    
    const menuAPIs = kitchenWorkflows.filter(w => w.name.toLowerCase().includes('menu'));
    const orderAPIs = kitchenWorkflows.filter(w => w.name.toLowerCase().includes('order'));
    
    const handleGroup = async (group, label) => {
      if (group.length <= 1) return;
      console.log(`\n--- Cleaning up ${label} ---`);
      
      // Sort: Active ones first, then by ID descending (newest)
      const sorted = group.sort((a, b) => {
        if (a.active && !b.active) return -1;
        if (!a.active && b.active) return 1;
        return b.id.localeCompare(a.id);
      });
      
      const keep = sorted[0];
      console.log(`Keeping: ${keep.name} (${keep.id}) - Active: ${keep.active}`);
      
      for (const w of sorted.slice(1)) {
        if (w.active || w.name.includes('[Auto-Generated]')) {
          console.log(`Deactivating duplicate/old version: ${w.name} (${w.id})`);
          await fetch(`${host}/api/v1/workflows/${w.id}/deactivate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': token }
          });
        }
      }
    };

    await handleGroup(menuAPIs, "Menu APIs");
    await handleGroup(orderAPIs, "Order APIs");
    
    console.log("\nDashboard De-cluttered.");
    console.log("\nCleanup Finished.");
  } catch (err) {
    console.error("Error cleaning up:", err.message);
  }
}

cleanup();
