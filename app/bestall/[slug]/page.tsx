import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { OrderPage } from './order-form'

export default async function BestallPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      prefix: true,
      slug: true,
    },
  })

  if (!club) notFound()

  // Find active campaign
  const now = new Date()
  const campaign = await prisma.campaign.findFirst({
    where: {
      clubId: club.id,
      status: 'ACTIVE',
      salesStart: { lte: now },
      salesEnd: { gte: now },
    },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              size: true,
              description: true,
              images: {
                select: { imagePath: true },
                orderBy: { sortOrder: 'asc' as const },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ingen aktiv kampanj</h2>
        <p className="text-gray-600">
          Det finns ingen pågående försäljningskampanj just nu. Kom tillbaka senare!
        </p>
      </div>
    )
  }

  const products = campaign.products.map((cp) => ({
    ...cp.product,
    imagePath: cp.product.images[0]?.imagePath ?? null,
  }))

  return (
    <OrderPage
      slug={slug}
      clubName={club.name}
      customerPrefix={club.prefix || club.slug.toUpperCase()}
      campaignName={campaign.name}
      salesStart={campaign.salesStart.toISOString()}
      salesEnd={campaign.salesEnd.toISOString()}
      deliveryStart={campaign.deliveryStart?.toISOString() ?? null}
      deliveryEnd={campaign.deliveryEnd?.toISOString() ?? null}
      products={products}
    />
  )
}
