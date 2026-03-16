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
    const { name, phone, email, subscription } = body

    if (!name) {
      return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
    }

    // Verify the customer belongs to the user's club
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        ...(user.clubId ? {
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
        } : {}),
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        subscription: subscription || false,
      },
    })

    revalidatePath('/admin/kunder')
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error updating customer:', error)
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

    const { id } = await params

    // Verify the customer belongs to the user's club
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        ...(user.clubId ? {
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
        } : {}),
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
    }

    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath('/admin/kunder')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
