import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Calendar } from 'lucide-react'

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE')
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'Aktiv'
    case 'CLOSED': return 'Avslutad'
    default: return 'Utkast'
  }
}

function statusVariant(status: string): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'CLOSED': return 'secondary'
    default: return 'warning'
  }
}

export default async function CampaignsPage() {
  const user = await getCurrentUser()
  if (!user || !user.clubId) return <p className="text-gray-500">Välj en klubb först.</p>

  const campaigns = await prisma.campaign.findMany({
    where: { clubId: user.clubId },
    include: {
      products: { include: { product: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { salesStart: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kampanjer</h1>
        <p className="text-gray-600 mt-1">Hantera försäljningskampanjer</p>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Inga kampanjer ännu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    {campaign.name}
                  </CardTitle>
                  <Badge variant={statusVariant(campaign.status)}>
                    {statusLabel(campaign.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Försäljningsperiod</p>
                    <p className="text-sm font-medium">{formatDate(campaign.salesStart)} - {formatDate(campaign.salesEnd)}</p>
                  </div>
                  {campaign.deliveryStart && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Leverans</p>
                      <p className="text-sm font-medium">{formatDate(campaign.deliveryStart)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Beställningar</p>
                    <p className="text-sm font-medium">{campaign._count.orders}</p>
                  </div>
                </div>
                {campaign.products.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Produkter</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.products.map((cp) => (
                        <Badge key={cp.id} variant="outline">{cp.product.name} - {formatCurrency(cp.product.price)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
