// WhatsApp URL builder for customer → store ordering flow
// storePhone must be in international format without '+': e.g. "919876543210"

const MAX_ITEMS_IN_WA = 8; // wa.me ?text= URL has ~2000 char limit

/**
 * Formats a single cart item into WA message lines
 */
function formatItemLine(item) {
  const lineTotal = (item.price + (item.addons || []).reduce((s, a) => s + (a.price || 0), 0)) * item.qty;
  let lines = `• ${item.name} x${item.qty} — ₹${lineTotal}`;
  if (item.addons && item.addons.length > 0) {
    item.addons.forEach(addon => {
      lines += `\n    + ${addon.name} (+₹${addon.price || 0})`;
    });
  }
  return lines;
}

/**
 * Builds the wa.me deep link URL with pre-filled order message
 *
 * @param {Array}  cartItems    - Cart items from getCart()
 * @param {Object} formData     - { name, phone, deliveryType, address, notes }
 * @param {Object} storeSettings - store data with phone, name, currency
 * @param {string} orderId      - Client-generated Order ID (ORD-MMDD-XXXX)
 * @param {Object} totals       - { subtotal, discountCode, discountAmount, deliveryFee, total }
 * @returns {string} Full wa.me URL
 */
export function buildWaUrl(cartItems, formData, storeSettings, orderId, totals) {
  const storeName = storeSettings?.name || 'The Kitchen';
  // Phone must be digits only, in international format (e.g. 919876543210)
  const storePhone = (storeSettings?.phone || '').replace(/\D/g, '');
  const currency = storeSettings?.currency || '₹';

  const { subtotal = 0, discountCode = '', discountAmount = 0, deliveryFee = 0, total = 0 } = totals;

  // Build item lines (cap at MAX_ITEMS_IN_WA)
  const displayItems = cartItems.slice(0, MAX_ITEMS_IN_WA);
  const hiddenCount = cartItems.length - displayItems.length;

  let itemLines = displayItems.map(formatItemLine).join('\n');
  if (hiddenCount > 0) {
    itemLines += `\n• ... and ${hiddenCount} more item${hiddenCount > 1 ? 's' : ''}`;
  }

  // Build message
  const isDelivery = formData.deliveryType === 'delivery';
  const lines = [
    `🍽️ ORDER #${orderId}`,
    '',
    `👤 ${formData.name} | 📞 ${formData.phone}`,
    isDelivery
      ? `📍 ${formData.address || 'Address not provided'} (Delivery)`
      : `🏃 Self-Pickup`,
    '',
    `📋 Items:`,
    itemLines,
    '',
    `💰 Subtotal: ${currency}${subtotal}`,
  ];

  if (discountAmount > 0) {
    lines.push(`🎫 Discount${discountCode ? ` (${discountCode})` : ''}: -${currency}${discountAmount}`);
  }
  if (deliveryFee > 0) {
    lines.push(`🚁 Delivery: ${currency}${deliveryFee}`);
  }

  lines.push(`━━━━━━━━━━━━━`);
  lines.push(`📦 TOTAL: ${currency}${total}`);

  if (formData.notes && formData.notes.trim()) {
    lines.push('');
    lines.push(`📝 Notes: ${formData.notes.trim()}`);
  }

  lines.push('');
  lines.push(`via ${storeName}`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);

  return `https://wa.me/${storePhone}?text=${encoded}`;
}
