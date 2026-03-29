# PLAN: Seamless & Reliable WhatsApp Checkout Flow

> **Task Slug:** `seamless-checkout-flow`
> **Project Type:** WEB (Next.js Static Export)
> **Created:** 2026-03-29
> **Agent:** `@project-planner` → `@frontend-specialist` + `@backend-specialist`
> **Status:** 🟡 Awaiting Approval

---

## 📋 Overview

Redesign the checkout flow from "backend-first with spinner" to a **Hybrid Optimistic** model.
The customer experience feels instant (WhatsApp opens immediately), while the backend works in parallel.
The owner reliably receives every order as a WhatsApp message AND as a row in Google Sheets.

---

## ✅ Success Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | WA opens within 0ms of button click (no spinner) | Test on mobile — tap → WA opens instantly |
| 2 | Order appears in Google Sheets within 5s | Check Sheets after WA opens |
| 3 | Confirmation page shows real Order ID + Razorpay link | Navigate to `/confirmation` page |
| 4 | UPI QR is visible on confirmation page | Screenshot test |
| 5 | Owner WhatsApp shows beautifully formatted order | Manual test |
| 6 | "I've Sent the Message" button marks WA Sent = Y in Sheets | Check Sheets column R |
| 7 | No ghost orders (row created as Pending, not abandoned) | Sheets audit |

---

## 🏗️ The New Flow (Architecture Decision)

### Old Flow (Broken)
```
[Fill Form] → [Submit] → [Spinner 2-5s] → [n8n creates order] → [Redirect] → [WA button]
```
Problems: Ghost orders, spinner friction, UPI QR missing, no WA confirmation tracking.

### New Flow (Hybrid Optimistic)
```
[Fill Form] → [Validate locally] → [Click "WhatsApp Order"]
                                          │
                       ┌──────────────────┴───────────────────┐
                       ▼ INSTANT                               ▼ PARALLEL
              [Open WA with prefilled              [POST /new-order to n8n]
               order text + amounts]                      │
                       │                         [n8n creates Sheet row]
                       │                         [n8n creates Razorpay link]
                       ▼                                  │
             [Redirect to /confirmation]         [Result stored in sessionStorage]
                       │                                  │
                       └─────────────┬────────────────────┘
                                     ▼
                         [Show: Order ID | RZP link | UPI QR | "I Sent It" btn]
                                     │
                         [User clicks "I Sent It"]
                                     ▼
                         [POST /confirm-wa → Sheets: WhatsApp Sent = Y]
```

---

## 📁 Files to Change

| File | Change Type | Why |
|------|-------------|-----|
| `src/app/checkout/page.js` | Rewrite | Replace submit→spinner with instant WA open + parallel POST |
| `src/app/confirmation/page.js` | Rewrite | UPI QR, "I Sent It" button, async Order ID polling |
| `src/lib/whatsapp.js` | Update | Build rich WA message client-side (no Order ID needed) |
| `src/lib/api.js` | Update | Add `confirmWhatsapp(orderId)` for "I Sent It" button |
| n8n: `New Order` workflow | Update | Default WhatsApp Sent = N; ensure response format correct |
| n8n: `confirm-wa` workflow | Create | New webhook: orderId → set WhatsApp Sent = Y |

---

## 📋 Task Breakdown

### Phase A: Frontend — Checkout Page

#### A1: Build WA Message Client-Side
- **Agent:** `frontend-specialist` | **Priority:** P0
- **INPUT:** Cart items, form data, storePhone, storeSettings
- **OUTPUT:** `buildWaOrderMessage(cart, form, settings)` in `lib/whatsapp.js`
  - Includes: name, phone, address/pickup, items breakdown, subtotal, discount, delivery, total
  - Conditionally shows: discount line (only if > 0), delivery (only if delivery type), notes (only if written)
  - Ends with: "Pay online: Razorpay link will be shared on confirmation page"
- **VERIFY:** Call with mock data → inspect URL in browser → WA opens with correct formatted text

#### A2: Rewrite Checkout Button Logic
- **Agent:** `frontend-specialist` | **Priority:** P0 | **Depends:** A1
- **INPUT:** Current `checkout/page.js`
- **OUTPUT:** Button click does:
  1. Client-side validation (name, 10-digit phone, min order)
  2. If invalid → inline error, no WA
  3. If valid → `window.open(waUrl, '_blank')` → fire `placeOrder()` as non-blocking promise → `router.push('/confirmation')`
  4. Store `sessionStorage.pendingOrder = 'loading'` before redirect
- **VERIFY:** Click → WA opens in 0ms → browser navigates immediately

#### A3: Phone Validation UX
- **Agent:** `frontend-specialist` | **Priority:** P1 | **Depends:** A2
- **OUTPUT:** Real-time validation on phone field:
  - 10-digit, starts with 6-9 → green ✅ indicator
  - Wrong → red "Enter a valid 10-digit Indian mobile number"
  - WA button disabled if phone invalid
- **VERIFY:** `9876543210` → ✅. `123` → ❌. Button disabled.

#### A4: Remove Payment Method Selector
- **Agent:** `frontend-specialist` | **Priority:** P2 | **Depends:** A2
- **OUTPUT:** Remove Razorpay/UPI radio buttons from checkout — payment choice is on confirmation page
- **VERIFY:** Checkout page has no payment method radio buttons

---

### Phase B: Frontend — Confirmation Page

#### B1: Async Order Resolution (Skeleton → Real Data)
- **Agent:** `frontend-specialist` | **Priority:** P0 | **Depends:** A2
- **INPUT:** `sessionStorage.pendingOrder`, background `placeOrder()` promise
- **OUTPUT:** 
  - Page renders instantly with skeleton pulse for Order ID and Razorpay link
  - `placeOrder()` promise writes result to `sessionStorage.orderResult` on resolve
  - Confirmation page polls `sessionStorage.orderResult` every 500ms for max 15s
  - On resolve: show real Order ID + Razorpay "Pay Now" button
  - On timeout (15s): show graceful fallback — "Your order was sent via WhatsApp! We'll confirm shortly."
- **VERIFY:** Open confirmation → skeleton shown → Order ID appears within 3-5s

#### B2: UPI QR Display
- **Agent:** `frontend-specialist` | **Priority:** P1 | **Depends:** B1
- **OUTPUT:** Below Razorpay button:
  - "── OR pay via UPI ──" divider
  - QR image from `storeData.store.upiQrUrl`
  - Caption: "Screenshot and scan in any UPI app"
  - Entire section hidden if `upiQrUrl` is empty
- **VERIFY:** With QR URL in Settings → QR visible. Without → section hidden.

#### B3: "I've Sent the Message" Button
- **Agent:** `frontend-specialist` | **Priority:** P1 | **Depends:** B1, C2
- **OUTPUT:** Prominent CTA button: "✅ I've sent the WhatsApp message"
  - On click → calls `confirmWhatsapp(orderId)` → button becomes "✅ Confirmed! We'll prepare your order." (disabled)
  - Toast notification shown
- **VERIFY:** Click → `confirm-wa` webhook fires → Sheets Column R = Y

#### B4: Order Summary Card
- **Agent:** `frontend-specialist` | **Priority:** P2 | **Depends:** B1
- **OUTPUT:** Read-only card showing: items, addons, subtotal, discount, delivery, total; address or "Self-Pickup"
- **VERIFY:** Every cart item appears with correct totals

---

### Phase C: Backend — n8n

#### C1: Create `confirm-wa` Webhook (NEW n8n Workflow)
- **Agent:** `backend-specialist` | **Skill:** `n8n-management` | **Priority:** P0
- **INPUT:** `POST /confirm-wa` → `{ "orderId": "ORD-03291234" }`
- **OUTPUT:** n8n workflow:
  1. Webhook trigger
  2. Google Sheets Read → find row where Col A = orderId
  3. Google Sheets Update → set Col R = `Y`
  4. Respond `{ "success": true }`
- **VERIFY:** POST to endpoint with valid orderId → Col R in Sheets = Y

#### C2: Add `confirmWhatsapp()` to `lib/api.js`
- **Agent:** `frontend-specialist` | **Priority:** P0 | **Depends:** C1
- **OUTPUT:**
```js
export async function confirmWhatsapp(orderId) {
  return fetch(`${BASE_URL}/confirm-wa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  }).then(r => r.json()).catch(() => ({ success: false }));
}
```
- **VERIFY:** Call from browser dev tools → Sheets row updated

#### C3: Update `New Order` n8n Workflow
- **Agent:** `backend-specialist` | **Skill:** `n8n-management` | **Priority:** P1
- **OUTPUT:** Ensure:
  - `WhatsApp Sent` defaults to `N` (not Y)
  - Response includes `{ success, orderId, razorpayLink, upiQrUrl, total, subtotal, discountAmount, deliveryFee }`
- **VERIFY:** Test order → Sheets row shows WhatsApp Sent = N

---

## 🗺️ Dependency Graph

```
A1 (WA builder) ──► A2 (Button logic) ──► A3 (Phone validation)
                                       ──► A4 (Remove payment selector)
                         │
                         ▼
                    B1 (Async resolution) ──► B2 (UPI QR)
                                         ──► B3 ("I Sent It")  ◄── C2
                                         ──► B4 (Order summary)

C1 (confirm-wa webhook) ──► C2 (api.js function) ──► B3
C3 (New Order update) — parallel, no blockers
```

---

## ⚠️ Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| n8n slow (>5s) | Medium | High | Graceful degradation: "WA message sent, we'll confirm shortly" |
| Customer doesn't send WA | Medium | Medium | Sheets has Pending row; owner can follow up via the phone number collected |
| `window.open()` blocked by browser | Low | High | Show fallback "Click here if WhatsApp didn't open" link |
| sessionStorage wiped | Low | Medium | On 15s timeout, show clear manual fallback message |
| Razorpay link creation fails | Low | Medium | UPI QR shown as fallback — customer can still pay |

---

## 📋 Phase X: Verification Checklist

### Functional
- [ ] "WhatsApp Order" opens WA instantly (0ms)
- [ ] Browser navigates to `/confirmation` immediately after WA opens
- [ ] Order row appears in Google Sheets within 5s
- [ ] Order ID appears on confirmation page (after skeleton)
- [ ] Razorpay "Pay Now" button links to correct payment page
- [ ] UPI QR image displays when URL set in Settings
- [ ] "I've Sent It" button updates Sheets Column R to Y
- [ ] Invalid phone blocks WA button with clear error message
- [ ] Empty cart redirects to `/` (menu page)
- [ ] Min order not met shows warning and blocks button

### Edge Cases
- [ ] n8n timeout (15s): graceful degradation message shown
- [ ] `window.open()` blocked: manual WA link fallback visible
- [ ] No discount: discount line absent from WA message
- [ ] Pickup mode: delivery line and address absent from WA message
- [ ] No notes: notes line absent from WA message
- [ ] UPI QR URL empty in Settings: QR section hidden completely

### Build & Quality
- [ ] `npm run build` passes with no errors
- [ ] No console errors on any page
- [ ] All pages render correctly on 375px (mobile) viewport
- [ ] Skeleton → real data transition is smooth (no layout shift)
