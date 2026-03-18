import { NextRequest, NextResponse } from 'next/server'
import { requireOrgAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile } from '@/lib/upload'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOrgAdmin()
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { images: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Produkt hittades inte' }, { status: 404 })
    }

    if (product.images.length >= 3) {
      return NextResponse.json({ error: 'Max 3 bilder per produkt' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Ingen fil vald' }, { status: 400 })
    }

    const imagePath = await saveUploadedFile(file, 'products')

    const image = await prisma.productImage.create({
      data: {
        imagePath,
        sortOrder: product.images.length,
        productId: id,
      },
    })

    revalidatePath(`/admin/produkter/${id}`)
    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error('Error uploading product image:', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
