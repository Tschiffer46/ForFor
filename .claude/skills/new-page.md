---
name: new-page
description: Create a new admin or seller page following ForFor conventions
---

# Create a New Page

## Admin Page (Server Component)

Create `app/admin/<name>/page.tsx`:

```tsx
import { requireClubAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PageName() {
  const user = await requireClubAdmin()
  if (!user) redirect('/logga-in/admin')

  // Query with proper includes and club scoping
  const data = await prisma.model.findMany({
    where: user.role === 'ORG_ADMIN' ? {} : { clubId: user.clubId! },
    include: { /* relations */ },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Page Title</h1>
      {/* Content using shadcn/ui components */}
    </div>
  )
}
```

## Key Patterns
- Always check auth with `requireClubAdmin()` or `requireOrgAdmin()`
- Scope queries by `user.clubId` for CLUB_ADMIN, show all for ORG_ADMIN
- Use `user.clubId!` (non-null assertion) only after role check
- Import from `@/components/ui/` for shadcn components
- Use `redirect()` from `next/navigation` for auth failures
- Add route to sidebar in `components/admin/sidebar.tsx`
