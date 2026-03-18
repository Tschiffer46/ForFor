import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'Ingen förening kopplad' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const teamId = searchParams.get('teamId')

    const visits = await prisma.addressVisit.findMany({
      where: {
        address: {
          streetRef: {
            district: {
              team: {
                lagGroup: {
                  clubId: user.clubId,
                },
                ...(teamId ? { id: teamId } : {}),
              },
            },
          },
        },
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        address: true,
        user: true,
        campaign: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ visits })
  } catch (error) {
    console.error('Error fetching address visits:', error)
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
      return NextResponse.json({ error: 'Ingen förening kopplad' }, { status: 400 })
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

    // Verify the address belongs to the user's club
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        streetRef: {
          district: {
            team: {
              lagGroup: {
                clubId: user.clubId,
              },
            },
          },
        },
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Adressen hittades inte eller tillhör inte din förening' },
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

    revalidatePath('/admin/address-visits')
    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    console.error('Error creating address visit:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
