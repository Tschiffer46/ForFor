import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.teamId) {
      return NextResponse.json(
        { error: 'Du är inte kopplad till något lag' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { addressId, result, notes, campaignId } = body

    if (!addressId || !result) {
      return NextResponse.json(
        { error: 'Adress och resultat är obligatoriska' },
        { status: 400 }
      )
    }

    const validResults = ['KOPT', 'NEJ_TACK', 'NEJ_TACK_FRAMTIDEN', 'INGEN_HEMMA', 'EJ_BESIKT']
    if (!validResults.includes(result)) {
      return NextResponse.json(
        { error: 'Ogiltigt resultat' },
        { status: 400 }
      )
    }

    // Verify the address belongs to one of the user's team's districts
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        streetRef: {
          district: {
            teamId: user.teamId,
          },
        },
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Adressen hittades inte eller tillhör inte ditt lags distrikt' },
        { status: 404 }
      )
    }

    const visit = await prisma.addressVisit.create({
      data: {
        addressId,
        result,
        notes: notes || null,
        userId: user.id,
        campaignId: campaignId || null,
      },
      include: {
        address: true,
        user: true,
        campaign: true,
      },
    })

    revalidatePath('/saljare')
    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    console.error('Error creating visit:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
