import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await prisma.kund.findMany({
      where: {
        adress: {
          gata: {
            lag: {
              foreningId: user.foreningId,
            },
          },
        },
      },
      include: {
        adress: {
          include: {
            gata: {
              include: {
                lag: true,
              },
            },
          },
        },
      },
      orderBy: {
        namn: 'asc',
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
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { namn, telefon, epost, prenumeration, adressId } = body

    if (!namn || !adressId) {
      return NextResponse.json({ error: 'Namn och adress är obligatoriska' }, { status: 400 })
    }

    // Verify the address belongs to the user's organization
    const address = await prisma.adress.findFirst({
      where: {
        id: adressId,
        gata: {
          lag: {
            foreningId: user.foreningId,
          },
        },
      },
    })

    if (!address) {
      return NextResponse.json({ error: 'Ogiltig adress' }, { status: 400 })
    }

    const customer = await prisma.kund.create({
      data: {
        namn,
        telefon: telefon || null,
        epost: epost || null,
        prenumeration: prenumeration || false,
        adressId,
      },
    })

    revalidatePath('/admin/kunder')
    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
