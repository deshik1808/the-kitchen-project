# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production (or static export if STATIC_EXPORT=true)
npm run start    # Start production server
npm run lint     # Run ESLint
```

For static export (Vercel deployment):
```bash
STATIC_EXPORT=true npm run build
```

## Architecture

**Zero-cost mobile-first food ordering system.**

```
Browser (Static Site on Vercel)
  → Next.js API rewrites (/api/n8n/*)
  → n8n webhooks (Hostinger VPS)
  → Google Sheets (data store + staff dashboard)
  → Razorpay / WhatsApp / Cloudinary
```

**Customer flow:** Browse menu → Add items + add-ons → Checkout + discount → Place order (opens WhatsApp) → Pay via Razorpay link or UPI QR → Confirmation page.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/StoreContext.js` | Global state (store data, theme, toasts) via React Context |
| `src/lib/api.js` | All n8n webhook calls (menu, discount, order, WA confirm) |
| `src/lib/cart.js` | localStorage cart CRUD; dispatches `cartUpdated` event |
| `src/lib/theme.js` | Injects CSS custom properties from Google Sheets settings |
| `src/lib/whatsapp.js` | Builds `wa.me` deep link URL with formatted order message |
| `src/lib/orderUtils.js` | Generates Order IDs (format: `ORD-MMDD-XXXX`) |
| `src/styles/globals.css` | Full design system via CSS custom properties |
| `next.config.mjs` | Conditional static export + CORS proxy rewrite for n8n |

## n8n API Endpoints

All calls go through the Next.js rewrite proxy at `/api/n8n/*` → `NEXT_PUBLIC_N8N_API_URL`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/n8n/menu` | GET | Fetch store settings, menu items, promotions, discount codes |
| `/api/n8n/validate-discount` | POST | Validate a discount code `{code, subtotal}` |
| `/api/n8n/new-order` | POST | Submit order, receive `{orderId, upiQrUrl, razorpayLink, total}` |
| `/api/n8n/confirm-wa` | POST | Confirm WhatsApp message was sent `{orderId}` |

Menu data is cached in `sessionStorage` for 5 minutes and refreshed on tab focus.

## Data Sources (Google Sheets)

Four tabs: **Settings** (store config + branding), **Menu** (items, prices, add-ons), **Orders** (log with status), **Discounts** (codes, limits, usage).

Add-ons are JSON arrays in menu cells: `[{name, price}]` — `price: 0` = free preference, `price > 0` = paid extra.

## State & Storage Patterns

- **Global state:** React Context (`StoreContext`) — store info, theme, open/closed status, toast queue
- **Cart:** `localStorage` with unique `cartItemId` per line item (supports same item with different add-ons)
- **Checkout handoff:** `sessionStorage` carries pending order data to confirmation page; 15-second polling for n8n response with fallback re-submit

## Environment Variables

```
NEXT_PUBLIC_N8N_API_URL=https://n8n.srv1155211.hstgr.cloud/webhook
GOOGLE_SPREADSHEET_ID=<sheet id>
```

## Agent Kit

`.agent/` contains 20 specialist agents, 36 skills, and 11 workflows that define how AI should work on this project. See `.agent/MASTER_PLAN.md` for the full spec (Google Sheets schema, n8n workflow specs, implementation phases).
