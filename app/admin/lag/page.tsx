import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Users } from 'lucide-react'

export default async function LagPage() {
  const user = await getCurrentUser()
  if (!user || !user.clubId) return <p className="text-gray-500">Valj en klubb forst.</p>

  const lagGroups = await prisma.lagGroup.findMany({
    where: { clubId: user.clubId },
    include: {
      teams: {
        include: {
          _count: { select: { districts: true, users: true, orders: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lag & Team</h1>
        <p className="text-gray-600 mt-1">Hantera laggrupper och team</p>
      </div>

      {lagGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Inga laggrupper annu. Skapa en for att komma igang.
          </CardContent>
        </Card>
      ) : (
        lagGroups.map((lg) => (
          <Card key={lg.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                {lg.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lg.teams.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga team i denna grupp</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {lg.teams.map((team) => (
                    <div key={team.id} className="p-4 rounded-lg border bg-gray-50">
                      <p className="font-medium">{team.name}</p>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>{team._count.districts} distrikt</p>
                        <p>{team._count.users} saljare</p>
                        <p>{team._count.orders} bestallningar</p>
                      </div>
                      {team.username && (
                        <p className="mt-2 text-xs text-gray-400">Inloggning: {team.username}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
