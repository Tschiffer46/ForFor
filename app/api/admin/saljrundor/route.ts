import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        clubId: user.clubId,
      },
      orderBy: {
        salesStart: 'desc',
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
    }

    const body = await request.json()
    const { name, salesStart, salesEnd, deliveryStart } = body

    if (!name || !salesStart || !salesEnd || !deliveryStart) {
      return NextResponse.json({ error: 'Alla falt ar obligatoriska' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        salesStart: new Date(salesStart),
        salesEnd: new Date(salesEnd),
        deliveryStart: new Date(deliveryStart),
        clubId: user.clubId,
      },
    })

    revalidatePath('/admin/kampanjer')
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
