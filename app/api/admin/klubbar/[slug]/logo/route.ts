import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile } from '@/lib/upload'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const club = await prisma.club.findFirst({
      where: { slug, organizationId: user.organizationId },
    })
    if (!club) {
      return NextResponse.json({ error: 'Klubb hittades inte' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Ingen fil vald' }, { status: 400 })
    }

    const logoUrl = await saveUploadedFile(file, 'clubs')

    await prisma.club.update({
      where: { id: club.id },
      data: { logoUrl },
    })

    revalidatePath(`/admin/klubbar/${slug}`)
    revalidatePath('/admin/klubbar')
    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('Error uploading club logo:', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
