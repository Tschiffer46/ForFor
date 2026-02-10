import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.roll !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const addressId = searchParams.get('addressId')

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    const customers = await prisma.kund.findMany({
      where: {
        adressId: addressId,
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
    
    if (!user || user.roll !== 'TEAM_MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { namn, telefon, epost, prenumeration, adressId } = body

    if (!namn || !adressId) {
      return NextResponse.json(
        { error: 'Name and address ID required' },
        { status: 400 }
      )
    }

    const customer = await prisma.kund.create({
      data: {
        namn,
        telefon,
        epost,
        prenumeration: prenumeration || false,
        adressId,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
