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

    const customers = await prisma.customer.findMany({
      where: {
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
      include: {
        address: {
          include: {
            streetRef: {
              include: {
                district: {
                  include: {
                    team: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email, subscription, addressId } = body

    if (!name || !addressId) {
      return NextResponse.json({ error: 'Namn och adress ar obligatoriska' }, { status: 400 })
    }

    // Verify the address belongs to the user's club
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        streetRef: {
          district: {
            team: {
              lagGroup: {
                clubId: user.clubId!,
              },
            },
          },
        },
      },
    })

    if (!address) {
      return NextResponse.json({ error: 'Ogiltig adress' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        subscription: subscription || false,
        addressId,
      },
    })

    revalidatePath('/admin/kunder')
    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
