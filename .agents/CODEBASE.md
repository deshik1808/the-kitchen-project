# Kitchen Order — Project Context

> **Type:** Zero-Cost Food Ordering Website
> **Status:** Planning Complete → Ready to Build
> **Last Updated:** 2026-03-27

---

## 📋 Master Plan

> 🔴 **MANDATORY:** Read `MASTER_PLAN.md` before ANY implementation work on this project.
> **Location:** `.agent/MASTER_PLAN.md`

The master plan contains the complete spec:
- Architecture (Next.js Static Export + Google Sheets + n8n + Razorpay + WhatsApp)
- Google Sheets schema (4 tabs, 59 columns total)
- n8n workflow specs (4 webhooks with request/response)
- Frontend structure (4 pages, 10 components)
- Design system (dynamic theming from Google Sheets)
- Implementation phases (5 phases, 20 tasks)
- Store owner guide

---

## 🏗️ Tech Stack

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | Next.js 15 (Static Export) | This repo |
| Hosting | Vercel (free tier) | vercel.app |
| Backend | n8n webhooks | Hostinger VPS (existing) |
| Database | Google Sheets (4 tabs) | Google Drive |
| Images | Cloudinary (free tier) | cloudinary.com |
| Payments | Razorpay Payment Links | razorpay.com |
| Messaging | WhatsApp (`wa.me` deep links) | Normal WhatsApp |

---

## 📁 Project Structure

```
kitchen-order/
├── .agent/
│   ├── CODEBASE.md          ← This file (project context)
│   ├── MASTER_PLAN.md       ← Complete project spec
│   ├── ARCHITECTURE.md      ← Antigravity kit architecture
│   └── ...
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.js        ← Root layout, theme loader
│   │   ├── page.js          ← Menu page (landing)
│   │   ├── cart/page.js     ← Cart review
│   │   ├── checkout/page.js ← Checkout + discount
│   │   └── confirmation/page.js ← Payment + WhatsApp
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── MenuCard.jsx
│   │   ├── AddOnModal.jsx
│   │   ├── CartDrawer.jsx
│   │   ├── CategoryFilter.jsx
│   │   ├── DiscountInput.jsx
│   │   ├── OrderSummary.jsx
│   │   ├── StoreClosed.jsx
│   │   ├── Footer.jsx
│   │   └── Skeleton.jsx
│   ├── lib/
│   │   ├── api.js           ← n8n webhook calls
│   │   ├── cart.js          ← localStorage cart CRUD
│   │   ├── theme.js         ← Dynamic branding from Sheets
│   │   └── whatsapp.js      ← wa.me URL builder
│   └── styles/
│       └── globals.css      ← Design system (CSS custom props)
├── next.config.js           ← output: 'export'
└── package.json
```

---

## 📊 File Dependencies

| File | Depends On | Depended By |
|------|-----------|-------------|
| `lib/api.js` | n8n webhook URLs | All pages |
| `lib/cart.js` | localStorage API | Menu page, Cart page, Checkout |
| `lib/theme.js` | `lib/api.js` (branding data) | `layout.js` |
| `lib/whatsapp.js` | Store phone from settings | Confirmation page |
| `globals.css` | — | All components (CSS custom props) |
| `layout.js` | `lib/theme.js`, Header, Footer | All pages |
| Menu `page.js` | `lib/api.js`, `lib/cart.js`, MenuCard, CategoryFilter, AddOnModal | — |
| Cart `page.js` | `lib/cart.js`, OrderSummary | — |
| Checkout `page.js` | `lib/cart.js`, `lib/api.js`, DiscountInput | — |
| Confirmation `page.js` | `lib/whatsapp.js`, OrderSummary | — |

---

## 🔑 Key Design Decisions

1. **Static Export** — No Node.js server needed. Deploys as static HTML on Vercel free tier.
2. **n8n is the entire backend** — All business logic (validation, order processing, payment) happens in n8n webhooks.
3. **Google Sheets is the database AND dashboard** — Staff manages everything from Sheets.
4. **Dynamic theming** — Colors, fonts, logo, favicon all come from Google Sheets Settings tab. CSS custom properties updated at runtime.
5. **`wa.me` links (free)** — No WhatsApp Business API. Customer-initiated messages only.
6. **Mixed add-ons** — `price: 0` = free preference, `price: > 0` = paid extra.
7. **Dual payment** — Razorpay Payment Links (auto-verify) + UPI QR (manual verify).

---

## 📝 Implementation Progress

| Phase | Status | Tasks |
|-------|--------|-------|
| 1. Setup | 🟢 Done | 1.1 Init Next.js, 1.2 Google Sheets, 1.3 Design System |
| 2. n8n Backend | 🟡 In Progress | Menu API (Done), Discount (Done), Order (Done), Payment webhook |
| 3. Frontend | 🟢 Done | Menu, Cart, Checkout, Confirmation pages |
| 4. Polish | 🟢 Done | Animations, errors, store-closed UX, PWA |
| 5. Deploy | ⏳ Not Started | Vercel, webhook connections, E2E test |

> Update this section as tasks are completed.
