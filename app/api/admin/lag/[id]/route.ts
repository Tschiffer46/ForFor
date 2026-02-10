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
    const { namn } = body

    if (!namn) {
      return NextResponse.json({ error: 'Namn är obligatoriskt' }, { status: 400 })
    }

    // Verify the team belongs to the user's organization
    const existingTeam = await prisma.lag.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Lag hittades inte' }, { status: 404 })
    }

    const team = await prisma.lag.update({
      where: { id },
      data: { namn },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error updating team:', error)
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

    // Verify the team belongs to the user's organization
    const existingTeam = await prisma.lag.findFirst({
      where: {
        id,
        foreningId: user.foreningId,
      },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Lag hittades inte' }, { status: 404 })
    }

    await prisma.lag.delete({
      where: { id },
    })

    revalidatePath('/admin/lag')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
