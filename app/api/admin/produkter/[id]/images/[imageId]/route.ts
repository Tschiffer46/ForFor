import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { unlink } from 'fs/promises'
import { getUploadPath } from '@/lib/upload'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, imageId } = await params

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, product: { id, organizationId: user.organizationId } },
    })
    if (!image) {
      return NextResponse.json({ error: 'Bild hittades inte' }, { status: 404 })
    }

    // Delete file from disk
    try {
      await unlink(getUploadPath(image.imagePath))
    } catch {
      // File may already be deleted
    }

    await prisma.productImage.delete({ where: { id: imageId } })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product image:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
