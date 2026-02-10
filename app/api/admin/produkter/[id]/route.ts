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
    const { namn, beskrivning, pris, bildUrl } = body

    if (!namn || pris === undefined) {
      return NextResponse.json({ error: 'Namn och pris är obligatoriska' }, { status: 400 })
    }

    // Verify the product belongs to the user's organization
    const existingProduct = await prisma.produkt.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    const product = await prisma.produkt.update({
      where: { id },
      data: {
        namn,
        beskrivning: beskrivning || null,
        pris: parseInt(pris, 10),
        bildUrl: bildUrl || null,
      },
    })

    revalidatePath('/admin/produkter')
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
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

    // Verify the product belongs to the user's organization
    const existingProduct = await prisma.produkt.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    await prisma.produkt.delete({
      where: { id },
    })

    revalidatePath('/admin/produkter')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
