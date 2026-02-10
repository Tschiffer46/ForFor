import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Upload } from 'lucide-react'

export default async function KunderPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const customers = await prisma.kund.findMany({
    where: {
      adress: {
        gata: {
          lag: {
            foreningId: user.foreningId,
          },
        },
      },
    },
    include: {
      adress: {
        include: {
          gata: {
            include: {
              lag: true,
            },
          },
        },
      },
      orders: true,
    },
    orderBy: {
      namn: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kunder</h1>
          <p className="text-gray-600 mt-1">
            Hantera kunder och importera från Excel
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importera kunder
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Totalt kunder</p>
              <p className="text-3xl font-bold mt-1">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Med prenumeration</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {customers.filter((c) => c.prenumeration).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gjort beställningar</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {customers.filter((c) => c.orders.length > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Namn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kontakt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Adress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Beställningar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prenumeration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{customer.namn}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {customer.telefon && <p>{customer.telefon}</p>}
                        {customer.epost && (
                          <p className="text-gray-500">{customer.epost}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p>{customer.adress.gatuadress}</p>
                        <p className="text-gray-500">
                          {customer.adress.postnummer} {customer.adress.stad}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {customer.adress.gata.lag.namn}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {customer.orders.length}
                    </td>
                    <td className="px-4 py-3">
                      {customer.prenumeration ? (
                        <Badge variant="success">Ja (10% rabatt)</Badge>
                      ) : (
                        <Badge variant="outline">Nej</Badge>
                      )}
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Inga kunder ännu. Importera från Excel för att komma igång.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
