# ForFor - Foreningsforsakjning

ForFor is a web application for Swedish sports clubs to manage door-to-door fundraising campaigns. Clubs organize teams of young sellers who go door-to-door selling paper products (toilet paper, paper towels). The app handles everything from team management to order creation and payment via Swish.

**Live:** [forfor.agiletransition.se](https://forfor.agiletransition.se)

## Features

### Admin Interface
- Dashboard with sales statistics and campaign overview
- Team management with CSV/Excel import and export
- Customer database with search, filters, and CSV export
- Order management — create, edit, and delete orders
- Product catalog with images and pricing
- Campaign management with sales periods and delivery dates
- Delivery lists organized by team and street

### Seller Interface (mobile-first)
- Passwordless login — club admin shares a link, seller picks their team
- Street-based address list with visit tracking
- 3-step order creation: identify customer, select products, Swish payment
- Personal sales statistics

### Public Order Page
- Customer-facing web page for self-service ordering (replaces Google Forms)
- Club shares link via WhatsApp/social media (e.g., `forfor.agiletransition.se/bestall/uppakra-if`)
- Supports both existing customers (by customer number) and new customers
- Swish QR code payment

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Database:** PostgreSQL 16 with Prisma 5 ORM
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Auth:** bcrypt + cookie-based sessions, passwordless login for sellers
- **i18n:** next-intl (Swedish primary)
- **Payments:** Swish QR code generation
- **Tables:** TanStack React Table (sortable, filterable)
- **File parsing:** PapaParse (CSV), read-excel-file (XLSX)
- **Deployment:** Docker on Hetzner via GHCR + GitHub Actions

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16

### Setup

```bash
# Install dependencies
npm install

# Create .env from example and set DATABASE_URL
cp .env.example .env

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed with test data
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Logins

**Admin:** `admin@exempel.se` at `/logga-in/admin`

**Seller (passwordless):** Go to `/s/uppakra-if`, enter a name and pick a team.

## Data Model

```
Organization (AZ Profil)
  └── Club (Uppakra IF)
       ├── Campaign (sales period)
       ├── Product (paper products)
       └── LagGroup ("Flickor 08")
            └── Team ("Team A")
                 └── District
                      └── Street
                           └── Address
                                └── Customer → Order
```

**Note:** "LagGroup" = age group, "Team" = operational unit that owns streets. Despite "lag" meaning "team" in Swedish, we use this three-level hierarchy.

## Deployment

Docker multi-stage build, pushed to GHCR, deployed to Hetzner (89.167.90.112) via GitHub Actions on push to `main`.

```bash
npm run build    # Runs prisma generate + next build
```

## Project Structure

```
app/
├── admin/              # Admin pages
├── bestall/[slug]/     # Public order page (no auth)
├── saljare/            # Seller pages (mobile-first)
├── s/[slug]/           # Passwordless seller login
├── api/
│   ├── admin/          # Admin API endpoints
│   ├── bestall/[slug]/ # Public order API (no auth)
│   ├── saljare/        # Seller API endpoints
│   └── auth/           # Login/logout
components/
├── ui/                 # shadcn/ui primitives
├── admin/              # Admin components (tables, forms, import dialogs)
└── saljare/            # Seller components
lib/
├── auth.ts             # Session management, role checks
├── order.ts            # Shared order calculation logic
├── prisma.ts           # Database client
└── swish.ts            # Swish QR generation
prisma/
├── schema.prisma       # Data model
└── seed.ts             # Test data
```

## License

Private project for AZ Profil / Swedish sports clubs.
