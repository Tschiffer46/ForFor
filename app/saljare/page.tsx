import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Calendar, TrendingUp, Package } from 'lucide-react'
import Link from 'next/link'

export default async function SeljarHomePage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get current order round
  const currentRound = await prisma.saljrunda.findFirst({
    where: {
      foreningId: user.foreningId,
      forsaljningStart: { lte: new Date() },
      forsaljningSlut: { gte: new Date() },
    },
  })

  // Get seller's stats
  const [totalOrders, paidOrders, totalRevenue] = await Promise.all([
    prisma.order.count({
      where: { saljareId: user.id },
    }),
    prisma.order.count({
      where: {
        saljareId: user.id,
        status: 'BETALD',
      },
    }),
    prisma.order.aggregate({
      where: {
        saljareId: user.id,
        status: 'BETALD',
      },
      _sum: {
        totalBelopp: true,
      },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl">Välkommen, {user.namn}! 👋</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 text-lg">
            Redo att sälja? Börja med att registrera en ny beställning!
          </p>
          <Link href="/saljare/ny-bestallning">
            <Button size="lg" className="mt-4 w-full h-14 text-lg">
              Ny beställning
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Current round info */}
      {currentRound && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Pågående säljrunda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-bold text-lg">{currentRound.namn}</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Försäljning pågår till:</span>
                  <span className="font-medium">
                    {formatDate(currentRound.forsaljningSlut)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leveransdatum:</span>
                  <span className="font-medium">
                    {formatDate(currentRound.leveransDatum)}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="success" className="w-full justify-center py-2">
              Aktiv
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Totalt orders</p>
              <p className="text-3xl font-bold mt-1">{totalOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Betalda</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {paidOrders}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total försäljning</p>
            <p className="text-4xl font-bold text-green-700 mt-2">
              {formatCurrency(totalRevenue._sum.totalBelopp || 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/saljare/adresser">
            <Button variant="outline" className="w-full h-12 text-base" size="lg">
              Se mina adresser
            </Button>
          </Link>
          <Link href="/saljare/bestallningar">
            <Button variant="outline" className="w-full h-12 text-base" size="lg">
              Se mina beställningar
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
