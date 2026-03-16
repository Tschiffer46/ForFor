---
name: new-api
description: Create a new API route following ForFor conventions
---

# Create a New API Route

Create `app/api/<area>/<resource>/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await prisma.model.findMany({
    where: user.role === 'ORG_ADMIN' ? {} : {
      // Scope to user's club through relations
      ...(user.clubId ? { clubId: user.clubId } : {}),
    },
    include: { /* needed relations */ },
  })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
  }

  const item = await prisma.model.create({
    data: { name, /* other fields */ },
  })

  revalidatePath('/admin/resource')
  return NextResponse.json({ item }, { status: 201 })
}
```

## Key Patterns
- Auth: `getCurrentUser()` + role check
- Nullable clubId: use spread `...(user.clubId ? { clubId: user.clubId } : {})`
- Revalidate paths after mutations
- Error responses: `{ error: string }` with appropriate status code
- For [id] routes: `{ params }: { params: Promise<{ id: string }> }` and `const { id } = await params`
