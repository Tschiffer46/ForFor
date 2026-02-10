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

    const products = await prisma.produkt.findMany({
      where: {
        foreningId: user.foreningId,
      },
      orderBy: {
        namn: 'asc',
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
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
    const { namn, beskrivning, pris, bildUrl } = body

    if (!namn || pris === undefined) {
      return NextResponse.json({ error: 'Namn och pris är obligatoriska' }, { status: 400 })
    }

    const product = await prisma.produkt.create({
      data: {
        namn,
        beskrivning: beskrivning || null,
        pris: parseInt(pris, 10),
        bildUrl: bildUrl || null,
        foreningId: user.foreningId,
      },
    })

    revalidatePath('/admin/produkter')
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
