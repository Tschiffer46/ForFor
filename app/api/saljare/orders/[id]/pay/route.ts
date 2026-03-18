import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the order belongs to this seller
    const order = await prisma.order.findFirst({
      where: { id, sellerId: user.id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Ordern hittades inte' },
        { status: 404 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'BETALD' },
    })

    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Error marking order as paid:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
