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

    if (!user.clubId) {
      return NextResponse.json({ error: 'Ingen förening kopplad' }, { status: 400 })
    }

    const { id } = await params
    const body = await request.json()
    const { result, notes } = body

    // Verify the visit exists and belongs to the user's club
    const existing = await prisma.addressVisit.findFirst({
      where: {
        id,
        address: {
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
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Besöket hittades inte' },
        { status: 404 }
      )
    }

    if (result) {
      const validResults = ['KOPT', 'NEJ_TACK', 'NEJ_TACK_FRAMTIDEN', 'INGEN_HEMMA', 'EJ_BESIKT']
      if (!validResults.includes(result)) {
        return NextResponse.json(
          { error: 'Ogiltigt resultat' },
          { status: 400 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (result !== undefined) data.result = result
    if (notes !== undefined) data.notes = notes || null

    const visit = await prisma.addressVisit.update({
      where: { id },
      data,
      include: {
        address: true,
        user: true,
        campaign: true,
      },
    })

    revalidatePath('/admin/address-visits')
    return NextResponse.json({ visit })
  } catch (error) {
    console.error('Error updating address visit:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.clubId) {
      return NextResponse.json({ error: 'Ingen förening kopplad' }, { status: 400 })
    }

    const { id } = await params

    // Verify the visit exists and belongs to the user's club
    const existing = await prisma.addressVisit.findFirst({
      where: {
        id,
        address: {
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
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Besöket hittades inte' },
        { status: 404 }
      )
    }

    await prisma.addressVisit.delete({
      where: { id },
    })

    revalidatePath('/admin/address-visits')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address visit:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
