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

    const saljrundor = await prisma.saljrunda.findMany({
      where: {
        foreningId: user.foreningId,
      },
      orderBy: {
        forsaljningStart: 'desc',
      },
    })

    return NextResponse.json({ saljrundor })
  } catch (error) {
    console.error('Error fetching saljrundor:', error)
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
    const { namn, forsaljningStart, forsaljningSlut, leveransDatum } = body

    if (!namn || !forsaljningStart || !forsaljningSlut || !leveransDatum) {
      return NextResponse.json({ error: 'Alla fält är obligatoriska' }, { status: 400 })
    }

    const saljrunda = await prisma.saljrunda.create({
      data: {
        namn,
        forsaljningStart: new Date(forsaljningStart),
        forsaljningSlut: new Date(forsaljningSlut),
        leveransDatum: new Date(leveransDatum),
        foreningId: user.foreningId,
      },
    })

    revalidatePath('/admin/saljrundor')
    return NextResponse.json({ saljrunda }, { status: 201 })
  } catch (error) {
    console.error('Error creating saljrunda:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
