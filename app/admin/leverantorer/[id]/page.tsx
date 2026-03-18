import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { requireOrgAdmin } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { LeverantorForm } from '@/components/admin/leverantor-form'

export default async function LeverantorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrgAdmin()
  if (!user || !user.organizationId) return null

  const { id } = await params

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      products: {
        include: { product: { select: { id: true, name: true } } },
      },
      supplierOrders: {
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!supplier) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/leverantorer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Tillbaka
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {supplier.name}
            <Badge variant={supplier.active ? 'success' : 'secondary'}>
              {supplier.active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </h1>
        </div>
        <LeverantorForm
          supplier={supplier}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" /> Redigera
            </Button>
          }
        />
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader><CardTitle>Kontaktuppgifter</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Kontaktperson</p>
              <p className="font-medium">{supplier.contactName || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">E-post</p>
              <p className="font-medium">{supplier.contactEmail || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Telefon</p>
              <p className="font-medium">{supplier.contactPhone || '—'}</p>
            </div>
          </div>
          {supplier.notes && (
            <div className="mt-4 pt-4 border-t text-sm">
              <p className="text-gray-500">Anteckningar</p>
              <p>{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked products */}
      <Card>
        <CardHeader><CardTitle>Kopplade produkter ({supplier.products.length})</CardTitle></CardHeader>
        <CardContent>
          {supplier.products.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inköpspris</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplier.products.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/produkter/${ps.product.id}`} className="text-blue-600 hover:underline">
                        {ps.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(ps.sellPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      {ps.isCurrent && <Badge variant="success">Nuvarande</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">Inga produkter kopplade</p>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader><CardTitle>Beställningshistorik ({supplier.supplierOrders.length})</CardTitle></CardHeader>
        <CardContent>
          {supplier.supplierOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Antal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beställd</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Förv. leverans</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Levererad</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {supplier.supplierOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{order.product.name}</td>
                      <td className="px-4 py-3 text-right">{order.quantity}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          order.status === 'DELIVERED' ? 'success' :
                          order.status === 'ORDERED' ? 'warning' : 'secondary'
                        }>
                          {order.status === 'PENDING' ? 'Väntande' : order.status === 'ORDERED' ? 'Beställd' : 'Levererad'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{order.orderDate ? formatDate(order.orderDate) : '—'}</td>
                      <td className="px-4 py-3">{order.expectedDelivery ? formatDate(order.expectedDelivery) : '—'}</td>
                      <td className="px-4 py-3">{order.actualDelivery ? formatDate(order.actualDelivery) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Inga beställningar ännu</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
