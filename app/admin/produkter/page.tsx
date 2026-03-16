import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { ProduktForm } from '@/components/admin/produkt-form'

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const orgId = user.organizationId
  if (!orgId) return null

  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  })

  const isOrgAdmin = user.role === 'ORG_ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkter</h1>
          <p className="text-gray-600 mt-1">{products.length} produkter</p>
        </div>
        {isOrgAdmin && <ProduktForm />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.active ? 'success' : 'secondary'}>
                  {product.active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {product.description && (
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
              )}
              <p className="text-2xl font-bold text-green-700">{formatCurrency(product.price)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
