import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, comment } = body

    // Build where clause to verify order belongs to user's scope
    const whereClause = user.role === 'ORG_ADMIN'
      ? { id, team: { lagGroup: { club: { organizationId: user.organizationId! } } } }
      : user.clubId
        ? { id, team: { lagGroup: { clubId: user.clubId } } }
        : null

    if (!whereClause) {
      return NextResponse.json({ error: 'Ingen klubb tilldelad' }, { status: 403 })
    }

    const existing = await prisma.order.findFirst({ where: whereClause })

    if (!existing) {
      return NextResponse.json({ error: 'Beställning hittades inte' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (comment !== undefined) updateData.comment = comment

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/bestallningar')
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
