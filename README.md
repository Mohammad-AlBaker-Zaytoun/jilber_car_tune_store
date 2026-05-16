# JILBER Performance Engineering

> Full-stack automotive performance tuning e-commerce platform — product catalog, shopping cart, quote system, order lifecycle, admin dashboard, and WhatsApp integration.

Built with **Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4**

---

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) | 16.2.6 |
| UI Runtime | React | 19.2.4 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS v4 | 4.x |
| Auth | JWT via `jose` + `bcryptjs` | — |
| State | Zustand (cart, persisted) | 5.0.13 |
| Validation | Zod | 4.4.3 |
| Icons | lucide-react | latest |
| Dev Storage | JSON file stores (`.dev-*.json`) | — |

---

## Features

### Storefront

- Scroll-driven canvas hero — 241-frame JPEG sequence cover-scaled to any viewport
- Product catalog with category filtering and search
- Product detail pages with specs, compatibility, ratings, and reviews
- Shopping cart with Zustand (persisted to localStorage) and tax calculation
- Checkout flow with customer info, vehicle details, and payment method selection
- Order confirmation and success page

### Quote System

- Quote request form with product pre-fill (11 service categories)
- Quote status lifecycle: `new → reviewing → contacted → quoted → accepted → converted / rejected`
- Priority levels: low, normal, high, urgent
- Users can track quote progress from their account

### Order Lifecycle

- Full status pipeline: `pending → confirmed → awaiting vehicle → in progress → ready for pickup → completed / cancelled`
- Payment status tracking: unpaid, deposit pending/paid, paid, refunded, not required
- Status history audit trail per order

### Admin Dashboard

- Statistics: products, users, orders, revenue
- Product CRUD with drag-and-drop image upload
- Category management
- Order management with status updates and internal notes
- Quote request management with priority and status updates
- User management and role assignment (user / admin)
- Product review moderation (approve / reject)
- Shop settings: contact info, WhatsApp number, working hours, tax rate, currency

### Contact & Communication

- Floating WhatsApp and phone call buttons (site-wide)
- WhatsApp URL builder with pre-filled messages
- Dedicated contact page
- Product-level and cart-level contact CTAs

### SEO

- JSON-LD structured data (Organization, LocalBusiness)
- Dynamic XML sitemap generation
- Open Graph and Twitter card metadata
- Canonical URLs and robots.txt
- Centralized config at `lib/seo/site-config.ts`

### Auth

- Email + password registration and login
- JWT sessions stored in HTTP-only cookies (24-hour expiry)
- Role-based access control (user / admin)
- Admin-only middleware protection on all `/admin` routes

---

## Project Structure

```text
app/
  page.tsx                      home page (hero + sections)
  layout.tsx                    root layout + providers
  sitemap.ts                    dynamic XML sitemap
  robots.ts                     robots.txt
  (shop)/
    store/                      product catalog + [slug] detail
    cart/                       shopping cart
    checkout/                   checkout + success
    quote/                      quote request + success
    contact/                    contact page
    account/                    dashboard, profile, orders, quotes
    privacy-policy/
    terms-of-service/
    cookie-policy/
  (auth)/
    signin/                     login
    signup/                     registration
  (admin)/
    admin/                      dashboard
    admin/products/             product CRUD + image upload
    admin/categories/           category management
    admin/orders/               order management
    admin/quotes/               quote management
    admin/users/                user management
    admin/reviews/              review moderation
    admin/settings/             shop settings
  api/
    auth/                       register, login, logout, me
    orders/                     create order, user order history
    account/orders|quotes       user-facing order/quote APIs
    admin/products|categories|orders|quotes|users|reviews|stats|settings
    quotes/                     submit quote request
    reviews/                    submit / list reviews
    contact-info/               public shop contact info

components/
  (auth|store|admin|checkout|quotes|contact|home sections)

lib/
  auth.ts                       JWT + cookie helpers
  session.ts                    server-side session retrieval
  admin.ts                      admin authorization check
  cart.ts                       Zustand cart store
  contact.ts                    WhatsApp/phone URL builders
  seo/                          site-config.ts + helpers.ts
  users.dev.ts                  file-based user store
  products.dev.ts               file-based product store
  orders.dev.ts                 file-based order store
  categories.dev.ts             file-based category store
  quotes.dev.ts                 file-based quote store
  reviews.dev.ts                file-based review store
  settings.dev.ts               file-based settings store

types/
  admin.ts                      Order, Quote, User, Settings types
  quotes.ts                     QuoteRequest, QuoteStatus types

data/
  products.ts                   static seed data + Product type

public/
  scroll-frames/                frame_0001.jpg … frame_0241.jpg
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# 32+ character secret for JWT signing
AUTH_SECRET=your-secret-here

# Production domain (no trailing slash) — used for sitemap, OG tags, canonicals
NEXT_PUBLIC_SITE_URL=https://example.com
```

Generate a secure `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Create an admin account

Register a user at `/signup`, then promote them to admin by editing `.dev-users.json` and changing their `role` to `"admin"`.

### 5. Scroll frames (optional)

Drop 241 JPEG frames into `public/scroll-frames/`:

```text
public/scroll-frames/frame_0001.jpg
public/scroll-frames/frame_0002.jpg
...
public/scroll-frames/frame_0241.jpg
```

Recommended resolution: **1280×720**.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server with Turbopack HMR |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | ESLint check |

---

## Data Storage

The project uses **file-based JSON stores** for development (`.dev-*.json` files in the project root). These are fine for local development and demos but are not suitable for production.

| File | Contents |
| --- | --- |
| `.dev-users.json` | User accounts (bcrypt-hashed passwords) |
| `.dev-products.json` | Product catalog |
| `.dev-categories.json` | Product categories |
| `.dev-orders.json` | Orders and status history |
| `.dev-quotes.json` | Quote requests |
| `.dev-reviews.json` | Product reviews |
| `.dev-settings.json` | Admin shop settings |

**For production:** replace the `lib/*.dev.ts` files with a proper database client (PostgreSQL + Prisma is recommended). All API routes call these files through stable function signatures, so the routes themselves do not need to change.

---

## Page Architecture

```text
/ (home)
├── Navbar
├── ScrollFrameHero       ← 241-frame canvas animation (scroll-driven)
├── ServicesSection
├── PackagesSection
├── WhyChooseUsSection
├── GallerySection
├── ProcessSection
├── ContactSection
└── Footer

/store                    product catalog
/store/[slug]             product detail + reviews + add to cart
/cart                     cart with line items and totals
/checkout                 customer + vehicle info + payment method
/checkout/success         order confirmation

/quote                    custom service quote request
/quote/success            submission confirmation

/contact                  contact info + WhatsApp + map

/account                  user dashboard
/account/orders           order history
/account/orders/[id]      order detail with status timeline
/account/quotes           quote history
/account/quotes/[id]      quote detail

/admin                    dashboard stats
/admin/products           product management
/admin/categories         category management
/admin/orders             order management
/admin/quotes             quote management
/admin/users              user management
/admin/reviews            review moderation
/admin/settings           shop settings

/signin  /signup          authentication
```

---

Powered by Zaytoun Solutions
