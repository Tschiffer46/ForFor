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
├── admin/          # Admin pages (ORG_ADMIN + CLUB_ADMIN)
├── saljare/        # Seller pages (TEAM_MEMBER)
├── logga-in/       # Login pages
├── api/            # API routes
│   ├── admin/      # Admin API (requires CLUB_ADMIN+)
│   ├── saljare/    # Seller API (requires TEAM_MEMBER)
│   ├── auth/       # Login/logout
│   └── seed/       # Database seeding
├── layout.tsx      # Root layout with NextIntlClientProvider
└── page.tsx        # Landing page
components/
├── ui/             # shadcn/ui primitives
└── admin/          # Admin-specific components (sidebar, forms)
lib/
├── auth.ts         # Session management, role checks
└── prisma.ts       # Prisma client singleton
prisma/
├── schema.prisma   # Data model
└── seed.ts         # Seed script
messages/
├── sv.json         # Swedish translations
└── en.json         # English translations
```

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
