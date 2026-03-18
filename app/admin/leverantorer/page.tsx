import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { requireOrgAdmin } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { LeverantorForm } from '@/components/admin/leverantor-form'

export default async function LeverantorerPage() {
  const user = await requireOrgAdmin()
  if (!user || !user.organizationId) return null

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: user.organizationId },
    include: {
      products: { include: { product: true } },
      _count: { select: { supplierOrders: true } },
    },
    orderBy: { name: 'asc' },
  })

  const pendingOrders = await prisma.supplierOrder.findMany({
    where: {
      supplier: { organizationId: user.organizationId },
      status: { in: ['PENDING', 'ORDERED'] },
    },
    include: {
      supplier: { select: { name: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leverantörer</h1>
          <p className="text-gray-600 mt-1">{suppliers.length} leverantörer</p>
        </div>
        <LeverantorForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <Link key={supplier.id} href={`/admin/leverantorer/${supplier.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <Badge variant={supplier.active ? 'success' : 'secondary'}>
                    {supplier.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {supplier.contactName && <p>{supplier.contactName}</p>}
                  {supplier.contactEmail && <p>{supplier.contactEmail}</p>}
                  {supplier.contactPhone && <p>{supplier.contactPhone}</p>}
                  <div className="flex gap-4 mt-3 pt-3 border-t text-xs">
                    <span>{supplier.products.length} produkter</span>
                    <span>{supplier._count.supplierOrders} beställningar</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending supplier orders */}
      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pågående leverantörsbeställningar</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leverantör</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Antal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skapad</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{order.supplier.name}</td>
                      <td className="px-4 py-3">{order.product.name}</td>
                      <td className="px-4 py-3 text-right">{order.quantity}</td>
                      <td className="px-4 py-3">
                        <Badge variant={order.status === 'ORDERED' ? 'warning' : 'secondary'}>
                          {order.status === 'PENDING' ? 'Väntande' : order.status === 'ORDERED' ? 'Beställd' : 'Levererad'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
