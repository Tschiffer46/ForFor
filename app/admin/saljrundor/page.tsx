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

  const saljrundor = await prisma.saljrunda.findMany({
    where: { foreningId: user.foreningId },
    include: {
      orders: true,
    },
    orderBy: {
      forsaljningStart: 'desc',
    },
  })

  const isRoundActive = (round: typeof saljrundor[0]) => {
    const now = new Date()
    return now >= round.forsaljningStart && now <= round.forsaljningSlut
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Säljrundor</h1>
          <p className="text-gray-600 mt-1">Hantera försäljningsperioder</p>
        </div>
        <SaljrundaForm trigger={<Button>Skapa ny säljrunda</Button>} />
      </div>

      <div className="space-y-4">
        {saljrundor.map((round) => {
          const active = isRoundActive(round)
          const totalOrders = round.orders.length
          const paidOrders = round.orders.filter(o => o.status === 'BETALD').length

          return (
            <Card key={round.id} className={active ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    {round.namn}
                  </CardTitle>
                  <Badge variant={active ? 'success' : 'outline'}>
                    {active ? 'Aktiv' : 'Avslutad'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Försäljningsstart</p>
                    <p className="font-bold">{formatDate(round.forsaljningStart)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Försäljningsslut</p>
                    <p className="font-bold">{formatDate(round.forsaljningSlut)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Leveransdatum</p>
                    <p className="font-bold">{formatDate(round.leveransDatum)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Totalt beställningar</p>
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
                      saljrunda={round}
                      trigger={
                        <Button variant="outline" size="sm">
                          Redigera
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm">
                      Se beställningar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {saljrundor.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Inga säljrundor skapade ännu</p>
              <SaljrundaForm trigger={<Button className="mt-4">Skapa din första säljrunda</Button>} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
