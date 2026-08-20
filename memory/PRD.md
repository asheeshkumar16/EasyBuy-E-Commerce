# EasyBuy — PRD

## Original Problem Statement
Build a modern, high-end eCommerce website named EasyBuy for a fashion apparel brand (men & women), premium/minimal like Zara or H&M. Full structure: animated hero homepage, men/women product listing pages, product detail pages (images, pricing, size selection, add-to-cart), cart page, checkout page with user details form. Homepage sections: featured products, new arrivals, trending collections, category highlights, promotional banners. Smooth scrolling, hover effects, transitions. Responsive navbar (logo, search, cart, wishlist, login/signup UI only). Footer (about, contact, FAQs, privacy, terms, social). Realistic dummy data, reusable components, backend-ready structure. Fully responsive.

## User Choices
- Minimal light theme (white/off-white, black text, editorial — Zara-like)
- AI-generated product images for a consistent look (done via Gemini image gen, 20 images)
- Cart/wishlist in browser storage (localStorage), working instantly
- Award-level art direction: kinetic hero with masked line reveal, editorial marquee, numbered manifesto chapters, parallax, framer-motion + lenis

## Architecture
- Frontend-only React SPA (CRA/craco + Tailwind + shadcn tokens)
- framer-motion (reveals, micro-interactions), lenis (smooth scroll), react-fast-marquee, lucide-react
- State: React Context (`StoreContext`) + localStorage (`easybuy_cart`, `easybuy_wishlist`)
- Data: `src/data/products.js` — 16 products (8 women / 8 men), tags: featured/new/trending
- Images: `frontend/public/images/*.jpg` — AI-generated (Gemini Nano Banana via script `/app/scripts/generate_images.py`)
- Backend: untouched FastAPI template, ready for future products/orders/auth APIs

## Pages / Routes
- `/` Home: intro curtain, kinetic hero (masked line reveal + parallax), marquee, category highlights, featured, manifesto (dark, numbered chapters, sticky image), new arrivals rail, parallax promo banner, trending, newsletter
- `/shop/:gender` (women|men|all): filter chips, sort select, animated grid
- `/product/:id`: sticky image, size selector (required), qty, add-to-bag, wishlist, accordions, related
- `/cart`: qty controls, remove, order summary, free-shipping threshold ($150)
- `/checkout`: 3-step form (contact/shipping/payment placeholder), order summary, simulated order confirmation (EB-XXXXXX)
- `/wishlist`: saved pieces grid
- `/info/:page`: about, contact (form), faqs (accordion), privacy, terms
- Overlays: search (live results), auth modal (login/signup UI only, demo), mobile menu

## Implemented
- 2026-08-20: Full storefront MVP, all 20 AI images generated, e2e verified (browse → PDP → size validation → cart → checkout → order confirmation EB-891846)
- 2026-08-20: REAL BACKEND connected — FastAPI + MongoDB now powers the store:
  - Products served from MongoDB (`GET /api/products` with gender/tag/category/q/sort filters, `GET /api/products/{id}`), seeded idempotently on startup
  - Server-side anonymous carts (`POST/GET/DELETE /api/carts`, `POST/PATCH /api/carts/{id}/items`), cart id persisted in localStorage, enriched cart view with totals + free-shipping rule ($150)
  - Real orders (`POST /api/orders`, `GET /api/orders/{order_number}`) — validated customer details (EmailStr), line-item snapshots, unique EB-XXXXXX numbers, cart cleared on order
  - Frontend StoreContext now talks to the API (products fetched live, cart mutations synced server-side); wishlist stays local-only
  - Verified: API chain (add/patch/order EB-466139, cart cleared), $9 shipping under $150, 400 empty-cart order, 404 unknown product, browser e2e order placed
- 2026-08-20: TRUE ACCOUNTS + STRIPE + ORDER HISTORY + ORDER EMAILS:
  - JWT auth (bcrypt, httpOnly access+refresh cookies, /api/auth register/login/logout/me/refresh, brute-force lockout 5 tries/15 min, admin seed)
  - Carts bind to users on login (guest cart merges into account via /api/carts/merge, /api/carts/mine); wishlist server-backed per user with local→server sync
  - Stripe payments (Flow B, emergentintegrations StripeCheckout, shared test sandbox — claimable sandbox unavailable in this region): order → checkout session → redirect → status polling + /api/webhook/stripe, order flips to paid, cart clears
  - My Orders page (/orders) lists a shopper's orders with status/totals
  - Resend order confirmation email (managed, from_name EasyBuy, reply-to easybuy@gmail.com) sent on payment, guardrail gate enforced
  - Verified live: register/login/me/admin login, merge, wishlist toggle/sync, order EB-690651 → real Stripe card payment (4242) → paid → email id 9b498982 accepted (202) → cart cleared → My Orders shows PAID; UI sign-in/sign-out/dropdown all pass
- 2026-08-20: PASSWORD RESET + ORDER TRACKING:
  - Forgot/reset password: /api/auth/forgot-password (single-use 1h token in password_reset_tokens, TTL index, branded reset email via Resend), /api/auth/reset-password; UI: "Forgot your password?" in auth modal + /reset-password page
  - Order tracking: PATCH /api/orders/{n}/status (admin-only, require_admin), GET /api/admin/orders; statuses paid→shipped→delivered with timestamps; /admin "Order Desk" page with Mark Shipped/Delivered; My Orders shows Paid→Shipped→Delivered progress tracker
  - Verified: full reset round-trip (token single-use, expiry, login with new password, reset email accepted 202 after a transient proxy 422), admin 403 for non-admins, ship→deliver flow visible to shopper

## Backlog
- P0: Nothing blocking — core commerce loop complete
- P1: Claim a dedicated Stripe account (KYC) before deploy; shipping/delivery notification emails; admin product management (CRUD)
- P1: Product variants (colors, multiple images), size guide modal, inventory
- P2: Refunds UI, recently viewed, reviews, i18n/currency

## Next Tasks
1. Shipping/delivery status emails to shoppers on status change
2. User completes Stripe KYC / claims account for live keys
3. Admin product CRUD
