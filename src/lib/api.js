// Use the Next.js rewrite proxy to avoid CORS issues with n8n
// In dev: /api/n8n/* → rewrites to n8n webhook via next.config.mjs
// In production (Vercel): configure similar rewrites in vercel.json
export const API_BASE = '/api/n8n';

export async function confirmWhatsapp(orderId) {
  try {
    const res = await fetch(`${API_BASE}/confirm-wa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error confirming WhatsApp:', error);
    return { success: false };
  }
}

export async function fetchMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu?t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch menu');
    return await res.json();
  } catch (error) {
    console.error("Error fetching menu:", error);
    return null;
  }
}

export async function validateDiscount(code, subtotal) {
  try {
    const res = await fetch(`${API_BASE}/validate-discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error validating discount:", error);
    return { valid: false, message: 'Network error validating discount' };
  }
}

export async function placeOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE}/new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error placing order:", error);
    return { success: false, message: 'Network error placing order' };
  }
}

