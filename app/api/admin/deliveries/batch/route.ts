import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeliveryStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs krävs' }, { status: 400 })
    }

    if (!status || !Object.values(DeliveryStatus).includes(status)) {
      return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 })
    }

    // Verify all deliveries belong to user's club
    const deliveries = await prisma.delivery.findMany({
      where: {
        id: { in: ids },
        order: {
          team: {
            lagGroup: {
              ...(user.clubId ? { clubId: user.clubId } : {}),
            },
          },
        },
      },
      select: { id: true },
    })

    if (deliveries.length !== ids.length) {
      return NextResponse.json(
        { error: 'En eller flera leveranser hittades inte' },
        { status: 404 }
      )
    }

    await prisma.delivery.updateMany({
      where: { id: { in: ids } },
      data: { status },
    })

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    console.error('Error batch updating deliveries:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
