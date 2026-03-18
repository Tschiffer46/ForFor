import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { requireOrgAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { ProduktForm } from '@/components/admin/produkt-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductImages } from '@/components/admin/product-images'
import { ProductSuppliers } from '@/components/admin/product-suppliers'
import { ProductCampaigns } from '@/components/admin/product-campaigns'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOrgAdmin()
  if (!user || !user.organizationId) return null

  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      productSuppliers: { include: { supplier: true }, orderBy: { isCurrent: 'desc' } },
      priceCampaigns: { orderBy: { startDate: 'desc' } },
      _count: { select: { orderItems: true } },
    },
  })

  if (!product) {
    return <p className="text-gray-500">Produkt hittades inte</p>
  }

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: user.organizationId, active: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/produkter">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Tillbaka</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <Badge variant={product.active ? 'success' : 'secondary'}>{product.active ? 'Aktiv' : 'Inaktiv'}</Badge>
            {product.archived && <Badge variant="secondary">Arkiverad</Badge>}
          </div>
          {product.description && <p className="text-gray-600 mt-1">{product.description}</p>}
        </div>
        <ProduktForm product={product} trigger={<Button variant="outline">Redigera</Button>} />
      </div>

      {/* Product info grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Pris</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(product.price)}</div></CardContent>
        </Card>
        {product.listPrice && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Listpris till klubbar</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(product.listPrice)}</div></CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Beställningar</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{product._count.orderItems}</div></CardContent>
        </Card>
        {product.sacksPerPallet && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Säckar/pall</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{product.sacksPerPallet}</div></CardContent>
          </Card>
        )}
      </div>

      {/* Attributes */}
      {(product.size || product.weightPerUnit || product.mustBuyPerPallet) && (
        <Card>
          <CardHeader><CardTitle>Attribut</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {product.size && <div><span className="text-gray-600">Storlek:</span> <span className="font-medium">{product.size}</span></div>}
              {product.weightPerUnit && <div><span className="text-gray-600">Vikt/enhet:</span> <span className="font-medium">{product.weightPerUnit} kg</span></div>}
              {product.sacksPerPallet && <div><span className="text-gray-600">Säckar/pall:</span> <span className="font-medium">{product.sacksPerPallet}</span></div>}
              {product.mustBuyPerPallet && <div><Badge variant="warning">Måste köpas per pall</Badge></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images (#9) */}
      <Card>
        <CardHeader><CardTitle>Bilder ({product.images.length}/3)</CardTitle></CardHeader>
        <CardContent>
          <ProductImages productId={product.id} images={product.images} />
        </CardContent>
      </Card>

      {/* Suppliers (#10) */}
      <Card>
        <CardHeader><CardTitle>Leverantörer ({product.productSuppliers.length}/3)</CardTitle></CardHeader>
        <CardContent>
          <ProductSuppliers
            productId={product.id}
            productSuppliers={product.productSuppliers}
            availableSuppliers={suppliers}
          />
        </CardContent>
      </Card>

      {/* Price campaigns (#12) */}
      <Card>
        <CardHeader><CardTitle>Priskampanjer</CardTitle></CardHeader>
        <CardContent>
          <ProductCampaigns productId={product.id} campaigns={product.priceCampaigns} />
        </CardContent>
      </Card>
    </div>
  )
}
