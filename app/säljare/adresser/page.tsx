import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MapPin, Home } from 'lucide-react'

export default async function AdresserPage() {
  const user = await getCurrentUser()

  if (!user || !user.lagId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Du är inte tilldelad till något lag ännu.</p>
        </CardContent>
      </Card>
    )
  }

  // Get streets assigned to the team member's team
  const streets = await prisma.gata.findMany({
    where: { lagId: user.lagId },
    include: {
      addresses: {
        include: {
          kunder: {
            include: {
              orders: true,
            },
          },
        },
        orderBy: {
          gatuadress: 'asc',
        },
      },
    },
    orderBy: {
      namn: 'asc',
    },
  })

  const totalAddresses = streets.reduce(
    (sum, street) => sum + street.addresses.length,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mina adresser</h1>
        <p className="text-gray-600 mt-1">
          {streets.length} gator, {totalAddresses} adresser
        </p>
      </div>

      <div className="space-y-4">
        {streets.map((street) => (
          <Card key={street.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-600" />
                {street.namn}
                <Badge variant="outline" className="ml-auto">
                  {street.addresses.length} adresser
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-500">{street.stad}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {street.addresses.map((address) => {
                const hasCustomers = address.kunder.length > 0
                const hasOrders = address.kunder.some((k) => k.orders.length > 0)

                return (
                  <div
                    key={address.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{address.gatuadress}</p>
                          <p className="text-sm text-gray-600">
                            {address.postnummer} {address.stad}
                          </p>

                          {hasCustomers && (
                            <div className="mt-2 space-y-1">
                              {address.kunder.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="text-sm bg-blue-50 px-2 py-1 rounded"
                                >
                                  <p className="font-medium text-blue-900">
                                    {customer.namn}
                                  </p>
                                  {customer.telefon && (
                                    <p className="text-blue-700">
                                      {customer.telefon}
                                    </p>
                                  )}
                                  {customer.prenumeration && (
                                    <Badge variant="success" className="text-xs mt-1">
                                      Prenumeration (10% rabatt)
                                    </Badge>
                                  )}
                                  {customer.orders.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      {customer.orders.length} tidigare order(s)
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {!hasCustomers && (
                        <Badge variant="outline" className="text-xs">
                          Ingen kund
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {streets.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                Inga gator tilldelade till ditt lag ännu.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Kontakta din administratör för att få gator tilldelade.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
