import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Package } from 'lucide-react'

export default async function ProdukterPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const products = await prisma.product.findMany({
    where: {
      active: true,
      archived: false,
    },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produkter</h1>
        <p className="text-gray-600 mt-1">Visa dessa för kunden</p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Inga produkter tillgängliga just nu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/uploads/${product.images[0].imagePath}`}
                      alt={product.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg">{product.name}</p>
                    {product.size && (
                      <p className="text-sm text-gray-500">{product.size}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    )}
                    <p
                      className="text-2xl font-bold mt-2"
                      style={{ color: 'var(--club-primary, #15803d)' }}
                    >
                      {product.price} kr
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
