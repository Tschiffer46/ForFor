import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { Building2, MapPin, Globe } from 'lucide-react'

export default async function ClubsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ORG_ADMIN' || !user.organizationId) return null

  const clubs = await prisma.club.findMany({
    where: { organizationId: user.organizationId },
    include: {
      _count: {
        select: {
          lagGroups: true,
          campaigns: true,
          users: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Klubbar</h1>
        <p className="text-gray-600 mt-1">{clubs.length} klubbar registrerade</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clubs.map((club) => (
          <Link key={club.id} href={`/admin/klubbar/${club.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    {club.name}
                  </CardTitle>
                  <Badge variant={club.active ? 'success' : 'secondary'}>
                    {club.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {club.sport && <p className="font-medium text-gray-800">{club.sport}</p>}
                  {(club.address || club.city) && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[club.address, club.postalCode, club.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {club.website && (
                    <p className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {club.website}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 pt-3 border-t text-xs">
                    <span>{club._count.lagGroups} laggrupper</span>
                    <span>{club._count.users} användare</span>
                    <span>{club._count.campaigns} kampanjer</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
