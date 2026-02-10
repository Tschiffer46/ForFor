import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, MapPin } from 'lucide-react'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const lag = await prisma.lag.findUnique({
    where: { id },
    include: {
      teamMembers: true,
      streets: {
        include: {
          addresses: true,
        },
        orderBy: {
          namn: 'asc',
        },
      },
      forening: true,
    },
  })

  if (!lag) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/lag">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{lag.namn}</h1>
          <p className="text-gray-600 mt-1">{lag.forening.name}</p>
        </div>
        <Button>Redigera lag</Button>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lagmedlemmar ({lag.teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lag.teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Inga medlemmar i laget ännu</p>
              <Button className="mt-4" variant="outline">
                Lägg till medlem
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {lag.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{member.namn}</p>
                    <p className="text-sm text-gray-600">{member.epost}</p>
                    {member.telefon && (
                      <p className="text-sm text-gray-600">{member.telefon}</p>
                    )}
                  </div>
                  <Badge>{member.roll}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tilldelade gator ({lag.streets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lag.streets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Inga gator tilldelade ännu</p>
              <Button className="mt-4" variant="outline">
                Tilldela gata
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lag.streets.map((street) => (
                <div
                  key={street.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{street.namn}</h3>
                      <p className="text-sm text-gray-600">{street.stad}</p>
                    </div>
                    <Badge variant="outline">
                      {street.addresses.length} adresser
                    </Badge>
                  </div>
                  
                  {street.addresses.length > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {street.addresses.slice(0, 3).map((address) => (
                        <p key={address.id}>
                          {address.gatuadress}, {address.postnummer}
                        </p>
                      ))}
                      {street.addresses.length > 3 && (
                        <p className="text-gray-400 italic">
                          +{street.addresses.length - 3} fler adresser...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
