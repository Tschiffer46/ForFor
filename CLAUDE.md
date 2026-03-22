# ForFor — Föreningsförsäljning

Door-to-door fundraising campaign management for Swedish sports clubs.

## Stack
- Next.js 16 (App Router, Server Components, standalone output)
- Prisma 5 + PostgreSQL 16
- Tailwind CSS 4 + shadcn/ui
- bcrypt for auth, cookie-based sessions
- next-intl for i18n (Swedish primary)
- Docker on Hetzner via GHCR

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Build (runs prisma generate + next build)
- `npx tsc --noEmit` — Type check
- `npm run lint` — ESLint
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma db push` — Push schema to database (dev only)
- `npx prisma db seed` — Seed database with test data

## Architecture

### Data Hierarchy
Organization (AZ Profil) → Club (Uppåkra IF) → LagGroup ("Flickor 08") → Team ("Team A")
Team → District → Street → Address → Customer

IMPORTANT: "LagGroup" = age group (e.g., "Flickor 08"), "Team" = operational unit that owns streets. Despite "lag" meaning "team" in Swedish, we use this three-level hierarchy.

### Roles
- `ORG_ADMIN` — AZ Profil staff, sees all clubs
- `CLUB_ADMIN` — Club admin, sees own club only
- `TEAM_MEMBER` — Seller, sees own team's addresses/orders

### File Structure
```
app/
├── admin/              # Admin pages (ORG_ADMIN + CLUB_ADMIN)
├── saljare/            # Seller pages (TEAM_MEMBER)
│   ├── layout.tsx      # Seller layout: club branding (logo, colors), logout, bottom nav
│   ├── page.tsx        # Dashboard: "Idag" (street progress, quick actions) + "Statistik" tabs
│   ├── dashboard-tabs.tsx  # Client component for dashboard tab switching
│   ├── ny-bestallning/
│   │   └── page.tsx    # 3-step order flow: identify customer → select products → payment
│   ├── bestallningar/
│   │   ├── page.tsx    # Order list (server component)
│   │   └── order-card.tsx  # Order card with pay/receipt buttons (client)
│   ├── produkter/
│   │   └── page.tsx    # Product catalog (browse only, with images)
│   └── adresser/
│       ├── page.tsx    # Address list with visit status (server)
│       └── address-list.tsx  # Address cards with mark-visit dialog (client)
├── s/[slug]/           # Passwordless club login (e.g., /s/uppakra)
│   ├── page.tsx        # Club branding + team picker
│   └── club-login-form.tsx  # Name + team selection form
├── logga-in/           # Password-based login pages
├── api/
│   ├── admin/          # Admin API (requires CLUB_ADMIN+)
│   ├── saljare/        # Seller API (requires TEAM_MEMBER)
│   │   ├── addresses/  # GET with ?q= search support
│   │   ├── customers/  # GET/POST/PATCH (create, update contact info)
│   │   ├── customers/with-address/  # POST: create customer + new address together
│   │   ├── orders/     # POST: create order
│   │   ├── orders/[id]/pay/     # PATCH: mark order as paid
│   │   ├── orders/[id]/receipt/ # POST: send receipt via email/SMS
│   │   ├── products/   # GET with images
│   │   └── visits/     # POST: record visit result
│   ├── auth/           # Login/logout + passwordless saljare-login
│   ├── uploads/[...path]/ # Serve uploaded files (product images, club logos)
│   └── seed/           # Database seeding
├── layout.tsx          # Root layout with NextIntlClientProvider
└── page.tsx            # Landing page
components/
├── ui/                 # shadcn/ui primitives
├── admin/              # Admin-specific components (sidebar, forms)
└── saljare/
    ├── bottom-nav.tsx  # Bottom tab bar (Hem, Ny Order, Produkter, Mina Orders)
    └── mark-visit-dialog.tsx  # Visit result dialog (Köpte!, Nej tack, etc.)
lib/
├── auth.ts             # Session management, role checks, passwordless auth
├── prisma.ts           # Prisma client singleton
└── upload.ts           # File upload helper (products, clubs)
prisma/
├── schema.prisma       # Data model
└── seed.ts             # Seed script
messages/
├── sv.json             # Swedish translations
└── en.json             # English translations
```

### Seller App Flow
The seller app (`/saljare/*`) is designed for early-teen sales reps doing door-to-door fundraising.

**Login:** Club admin shares a link like `forfor.agiletransition.se/s/uppakra`. Teen enters name, picks team, taps "Starta" — no password needed. The club slug acts as implicit authorization.

**Dashboard (`/saljare`):** Two tabs — "Idag" shows streets with visit progress bars and quick action buttons; "Statistik" shows order counts and revenue. First-time users see a 4-step explainer.

**New Order (`/saljare/ny-bestallning`):** Three-step flow:
1. **Identify customer** — Search by street name, pick address, pick existing customer or create new one. If address not found, create new address+customer together.
2. **Select products** — Compact product cards with images, +/- quantity buttons, sticky total bar.
3. **Payment** — Swish QR code shown first, large "Kunden har betalat" button (dominant). "Betala senare" is a small link that verifies customer contact info before proceeding to invoice delivery options (email/SMS).

**Club branding:** Layout fetches club logo and colors, sets CSS custom properties (`--club-primary`, `--club-secondary`). All accent colors use these variables, with green fallback.

## Code Conventions
- Swedish UI text, English code (variable names, field names, comments)
- All UI strings should use next-intl translations from `messages/sv.json`
- Use shadcn/ui components (Card, Button, Input, Label, Badge, Dialog)
- Server Components by default; `"use client"` only when needed
- Prisma queries in Server Components or API routes only
- Always include proper `include` clauses for Prisma relations
- Auth checks: use `requireOrgAdmin()` or `requireClubAdmin()` from `lib/auth.ts`
- Address model has `street` (string field) AND `streetRef` (relation to Street model) — don't confuse them

## Database
- Prisma schema has `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` for Alpine Docker
- Order items relation is `items` (not `orderItems`)
- Campaign has `deliveryStart`/`deliveryEnd` (nullable), not `deliveryDate`
- `user.clubId` is nullable (ORG_ADMIN has no club)

## Deployment
- Docker multi-stage build → GHCR → Hetzner (89.167.90.112)
- GitHub Actions on push to main
- IMPORTANT: Don't use `npx prisma` on server — use `node node_modules/prisma/build/index.js`
- Build script must NOT include `prisma db push` (no DB at build time)
- Git email: use `Tschiffer46@users.noreply.github.com`

## Reference Repos
- UI patterns: https://github.com/Kiranism/next-shadcn-dashboard-starter
- UI reference: https://github.com/satnaing/shadcn-admin
