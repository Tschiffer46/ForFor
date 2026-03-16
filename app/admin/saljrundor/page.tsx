import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import { Calendar } from 'lucide-react'
import { SaljrundaForm } from '@/components/admin/saljrunda-form'

export default async function SaljrundorPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (!user.clubId) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  const campaigns = await prisma.campaign.findMany({
    where: { clubId: user.clubId },
    include: {
      orders: true,
    },
    orderBy: {
      salesStart: 'desc',
    },
  })

  const isCampaignActive = (campaign: typeof campaigns[0]) => {
    const now = new Date()
    return now >= campaign.salesStart && now <= campaign.salesEnd
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kampanjer</h1>
          <p className="text-gray-600 mt-1">Hantera forsaljningsperioder</p>
        </div>
        <SaljrundaForm trigger={<Button>Skapa ny kampanj</Button>} />
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const active = isCampaignActive(campaign)
          const totalOrders = campaign.orders.length
          const paidOrders = campaign.orders.filter(o => o.status === 'BETALD').length

          return (
            <Card key={campaign.id} className={active ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    {campaign.name}
                  </CardTitle>
                  <Badge variant={active ? 'success' : 'outline'}>
                    {active ? 'Aktiv' : 'Avslutad'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Forsaljningsstart</p>
                    <p className="font-bold">{formatDate(campaign.salesStart)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Forsaljningsslut</p>
                    <p className="font-bold">{formatDate(campaign.salesEnd)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Leveransperiod</p>
                    <p className="font-bold">
                      {campaign.deliveryStart
                        ? formatDate(campaign.deliveryStart)
                        : '-'}
                      {campaign.deliveryEnd
                        ? ` - ${formatDate(campaign.deliveryEnd)}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Totalt bestallningar</p>
                      <p className="font-bold text-lg">{totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Betalda</p>
                      <p className="font-bold text-lg text-green-600">{paidOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Obetalda</p>
                      <p className="font-bold text-lg text-orange-600">{totalOrders - paidOrders}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <SaljrundaForm
                      campaign={campaign}
                      trigger={
                        <Button variant="outline" size="sm">
                          Redigera
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm">
                      Se bestallningar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Inga kampanjer skapade annu</p>
              <SaljrundaForm trigger={<Button className="mt-4">Skapa din forsta kampanj</Button>} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
