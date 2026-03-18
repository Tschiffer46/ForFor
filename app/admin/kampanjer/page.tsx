import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Pencil, Trash2, Plus } from 'lucide-react'
import { KampanjForm } from '@/components/admin/kampanj-form'
import { DeleteButton } from '@/components/admin/delete-button'

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

function PeriodDisplay({ label, start, end }: { label: string; start: Date | null; end: Date | null }) {
  if (!start && !end) return null
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium">
        {start ? formatDate(start) : '?'} - {end ? formatDate(end) : '?'}
      </p>
    </div>
  )
}

export default async function CampaignsPage() {
  const user = await getCurrentUser()
  if (!user || !user.clubId) return <p className="text-gray-500">Valj en klubb forst.</p>

  // Fetch club to get organizationId for products
  const club = await prisma.club.findUnique({
    where: { id: user.clubId },
    select: { organizationId: true },
  })

  const [campaigns, availableProducts, availableTeams] = await Promise.all([
    prisma.campaign.findMany({
      where: { clubId: user.clubId },
      include: {
        products: { include: { product: true } },
        campaignTeams: {
          include: {
            team: {
              include: { lagGroup: true },
            },
          },
        },
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true } },
      },
      orderBy: { salesStart: 'desc' },
    }),
    prisma.product.findMany({
      where: {
        organizationId: club?.organizationId,
        active: true,
        archived: false,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({
      where: {
        lagGroup: { clubId: user.clubId },
      },
      select: {
        id: true,
        name: true,
        lagGroup: { select: { name: true } },
      },
      orderBy: [{ lagGroup: { name: 'asc' } }, { name: 'asc' }],
    }),
  ])

  // Compute revenue for each campaign
  const campaignsWithRevenue = campaigns.map((c) => ({
    ...c,
    totalRevenue: c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
  }))

  // Map teams for the form
  const teamsForForm = availableTeams.map((t) => ({
    id: t.id,
    name: t.name,
    lagGroupName: t.lagGroup.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kampanjer</h1>
          <p className="text-gray-600 mt-1">Hantera forsaljningskampanjer</p>
        </div>
        <KampanjForm
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Skapa ny kampanj
            </Button>
          }
          products={availableProducts}
          teams={teamsForForm}
        />
      </div>

      {campaignsWithRevenue.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Inga kampanjer annu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaignsWithRevenue.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    {campaign.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(campaign.status)}>
                      {statusLabel(campaign.status)}
                    </Badge>
                    <KampanjForm
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                      campaign={{
                        id: campaign.id,
                        name: campaign.name,
                        status: campaign.status,
                        salesStart: campaign.salesStart,
                        salesEnd: campaign.salesEnd,
                        deliveryStart: campaign.deliveryStart,
                        deliveryEnd: campaign.deliveryEnd,
                        preparationStart: campaign.preparationStart,
                        preparationEnd: campaign.preparationEnd,
                        transportStart: campaign.transportStart,
                        transportEnd: campaign.transportEnd,
                        recurring: campaign.recurring,
                        products: campaign.products.map((cp) => ({
                          productId: cp.productId,
                        })),
                        campaignTeams: campaign.campaignTeams.map((ct) => ({
                          teamId: ct.teamId,
                        })),
                      }}
                      products={availableProducts}
                      teams={teamsForForm}
                    />
                    <DeleteButton
                      trigger={
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      itemName={campaign.name}
                      itemType="kampanjen"
                      deleteUrl={`/api/admin/kampanjer/${campaign.id}`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <PeriodDisplay
                    label="Forberedelseperiod"
                    start={campaign.preparationStart}
                    end={campaign.preparationEnd}
                  />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Forsaljningsperiod</p>
                    <p className="text-sm font-medium">
                      {formatDate(campaign.salesStart)} - {formatDate(campaign.salesEnd)}
                    </p>
                  </div>
                  <PeriodDisplay
                    label="Transport"
                    start={campaign.transportStart}
                    end={campaign.transportEnd}
                  />
                  <PeriodDisplay
                    label="Utleveransperiod"
                    start={campaign.deliveryStart}
                    end={campaign.deliveryEnd}
                  />
                </div>

                <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Bestallningar</p>
                    <p className="text-sm font-medium">{campaign._count.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total intakt</p>
                    <p className="text-sm font-medium">{formatCurrency(campaign.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Aterkommande</p>
                    <p className="text-sm font-medium">{campaign.recurring ? 'Ja' : 'Nej'}</p>
                  </div>
                </div>

                {campaign.products.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Produkter</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.products.map((cp) => (
                        <Badge key={cp.id} variant="outline">
                          {cp.product.name} - {formatCurrency(cp.product.price)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {campaign.campaignTeams.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tilldelade lag</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.campaignTeams.map((ct) => (
                        <Badge key={ct.id} variant="outline">
                          {ct.team.lagGroup.name} &mdash; {ct.team.name}
                        </Badge>
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
