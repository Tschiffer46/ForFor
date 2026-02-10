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
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { namn, telefon, epost, prenumeration } = body

    if (!namn) {
      return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
    }

    // Verify the customer belongs to the user's organization
    const existingCustomer = await prisma.kund.findFirst({
      where: {
        id,
        adress: {
          gata: {
            lag: {
              foreningId: user.foreningId,
            },
          },
        },
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
    }

    const customer = await prisma.kund.update({
      where: { id },
      data: {
        namn,
        telefon: telefon || null,
        epost: epost || null,
        prenumeration: prenumeration || false,
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
    
    if (!user || user.roll !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the customer belongs to the user's organization
    const existingCustomer = await prisma.kund.findFirst({
      where: {
        id,
        adress: {
          gata: {
            lag: {
              foreningId: user.foreningId,
            },
          },
        },
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Kund hittades inte' }, { status: 404 })
    }

    await prisma.kund.delete({
      where: { id },
    })

    revalidatePath('/admin/kunder')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
