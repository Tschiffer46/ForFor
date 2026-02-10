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
    const { namn, forsaljningStart, forsaljningSlut, leveransDatum } = body

    if (!namn || !forsaljningStart || !forsaljningSlut || !leveransDatum) {
      return NextResponse.json({ error: 'Alla fält är obligatoriska' }, { status: 400 })
    }

    // Verify the saljrunda belongs to the user's organization
    const existingSaljrunda = await prisma.saljrunda.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingSaljrunda) {
      return NextResponse.json({ error: 'Säljrunda hittades inte' }, { status: 404 })
    }

    const saljrunda = await prisma.saljrunda.update({
      where: { id },
      data: {
        namn,
        forsaljningStart: new Date(forsaljningStart),
        forsaljningSlut: new Date(forsaljningSlut),
        leveransDatum: new Date(leveransDatum),
      },
    })

    revalidatePath('/admin/saljrundor')
    return NextResponse.json({ saljrunda })
  } catch (error) {
    console.error('Error updating saljrunda:', error)
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

    // Verify the saljrunda belongs to the user's organization
    const existingSaljrunda = await prisma.saljrunda.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingSaljrunda) {
      return NextResponse.json({ error: 'Säljrunda hittades inte' }, { status: 404 })
    }

    await prisma.saljrunda.delete({
      where: { id },
    })

    revalidatePath('/admin/saljrundor')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saljrunda:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
