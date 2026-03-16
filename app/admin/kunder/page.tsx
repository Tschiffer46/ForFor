import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Upload, Edit, Trash2 } from 'lucide-react'
import { KundImport } from '@/components/admin/kund-import'
import { KundForm } from '@/components/admin/kund-form'
import { DeleteButton } from '@/components/admin/delete-button'

export default async function KunderPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  if (!user.clubId) {
    return <p className="text-gray-500">Ingen klubb tilldelad.</p>
  }

  const customers = await prisma.customer.findMany({
    where: {
      address: {
        streetRef: {
          district: {
            team: {
              lagGroup: {
                clubId: user.clubId,
              },
            },
          },
        },
      },
    },
    include: {
      address: {
        include: {
          streetRef: {
            include: {
              district: {
                include: {
                  team: true,
                },
              },
            },
          },
        },
      },
      orders: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kunder</h1>
          <p className="text-gray-600 mt-1">
            Hantera kunder och importera fran Excel
          </p>
        </div>
        <KundImport
          trigger={
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importera kunder
            </Button>
          }
        />
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
                {customers.filter((c) => c.subscription).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gjort bestallningar</p>
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
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bestallningar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prenumeration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Atgarder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {customer.phone && <p>{customer.phone}</p>}
                        {customer.email && (
                          <p className="text-gray-500">{customer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p>{customer.address.street}</p>
                        <p className="text-gray-500">
                          {customer.address.postalCode} {customer.address.city}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {customer.address.streetRef.district.team.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {customer.orders.length}
                    </td>
                    <td className="px-4 py-3">
                      {customer.subscription ? (
                        <Badge variant="success">Ja (10% rabatt)</Badge>
                      ) : (
                        <Badge variant="outline">Nej</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <KundForm
                          customer={customer}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteButton
                          itemName={customer.name}
                          itemType="kund"
                          onDelete={async () => {
                            const response = await fetch(`/api/admin/kunder/${customer.id}`, {
                              method: 'DELETE',
                            })
                            if (!response.ok) {
                              throw new Error('Failed to delete customer')
                            }
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Inga kunder annu. Importera fran Excel for att komma igang.
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
