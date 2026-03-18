import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { ProduktForm } from '@/components/admin/produkt-form'
import Link from 'next/link'

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const orgId = user.organizationId
  if (!orgId) return null

  const products = await prisma.product.findMany({
    where: { organizationId: orgId, archived: false },
    include: {
      images: { take: 1, orderBy: { sortOrder: 'asc' } },
      productSuppliers: { where: { isCurrent: true }, include: { supplier: true }, take: 1 },
      _count: { select: { priceCampaigns: true } },
    },
    orderBy: { name: 'asc' },
  })

  const archivedCount = await prisma.product.count({
    where: { organizationId: orgId, archived: true },
  })

  const isOrgAdmin = user.role === 'ORG_ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkter</h1>
          <p className="text-gray-600 mt-1">
            {products.length} aktiva produkter
            {archivedCount > 0 && ` (${archivedCount} arkiverade)`}
          </p>
        </div>
        {isOrgAdmin && <ProduktForm />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link key={product.id} href={`/admin/produkter/${product.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant={product.active ? 'success' : 'secondary'}>
                    {product.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {product.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/uploads/${product.images[0].imagePath}`}
                      alt={product.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-xl font-bold text-green-700">{formatCurrency(product.price)}</p>
                    {product.listPrice && (
                      <p className="text-sm text-gray-500">Listpris: {formatCurrency(product.listPrice)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t text-xs text-gray-500">
                  {product.productSuppliers[0] && (
                    <span>Lev: {product.productSuppliers[0].supplier.name}</span>
                  )}
                  {product.sacksPerPallet && <span>{product.sacksPerPallet} sackar/pall</span>}
                  {product._count.priceCampaigns > 0 && <span>{product._count.priceCampaigns} kampanjer</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
