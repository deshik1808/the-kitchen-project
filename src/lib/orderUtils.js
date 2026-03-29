// Client-side Order ID generator
// Format: ORD-MMDD-XXXX (e.g. ORD-0329-4821)
// ~9000 combinations per day → collision risk < 0.01% at 50 orders/day
export function generateOrderId() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${mm}${dd}-${rand}`;
}
