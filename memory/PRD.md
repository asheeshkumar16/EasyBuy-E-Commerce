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

## Implemented (2026-08-20)
- Full storefront MVP as above, all 20 AI images generated, e2e verified (browse → PDP → size validation → cart → checkout → order confirmation EB-891846)

## Backlog
- P0: Backend APIs (products, cart, orders) + MongoDB models; JWT auth to replace demo login
- P1: Real payment (Stripe), order persistence + order history page, email confirmations (Resend)
- P1: Product variants (colors, multiple images), size guide modal
- P2: Recently viewed, reviews, inventory states, admin panel, i18n/currency

## Next Tasks
1. Build `/api/products`, `/api/orders` in FastAPI and swap frontend data source
2. JWT auth (integration_expert playbook) replacing AuthModal demo
3. Stripe checkout integration
