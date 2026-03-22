import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Users, Plus, Edit, Trash2, UserPlus, Link2, Download, Upload } from 'lucide-react'
import { LagForm } from '@/components/admin/lag-form'
import { TeamForm } from '@/components/admin/team-form'
import { TeamMemberForm } from '@/components/admin/team-member-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { LagImport } from '@/components/admin/lag-import'

export default async function LagPage() {
  const user = await getCurrentUser()
  if (!user || !user.clubId) return <p className="text-gray-500">Välj en klubb först.</p>

  const club = await prisma.club.findUnique({
    where: { id: user.clubId },
    select: { slug: true },
  })

  const lagGroups = await prisma.lagGroup.findMany({
    where: { clubId: user.clubId },
    include: {
      teams: {
        include: {
          _count: { select: { districts: true, users: true, orders: true } },
          users: {
            where: { role: 'TEAM_MEMBER' },
            select: { id: true, name: true, username: true, phone: true, email: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lag & Team</h1>
          <p className="text-gray-600 mt-1">Hantera laggrupper, team och medlemmar</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/lag/export" download>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Ladda ner Excel
            </Button>
          </a>
          <LagImport
            trigger={
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importera
              </Button>
            }
          />
          <LagForm
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny laggrupp
              </Button>
            }
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Laggrupper</p>
              <p className="text-3xl font-bold mt-1">{lagGroups.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Team</p>
              <p className="text-3xl font-bold mt-1">{lagGroups.reduce((sum, lg) => sum + lg.teams.length, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Säljare</p>
              <p className="text-3xl font-bold mt-1">{lagGroups.reduce((sum, lg) => sum + lg.teams.reduce((ts, t) => ts + t.users.length, 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Beställningar</p>
              <p className="text-3xl font-bold mt-1">{lagGroups.reduce((sum, lg) => sum + lg.teams.reduce((ts, t) => ts + t._count.orders, 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller login link */}
      {club && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Säljarlänk (dela med lag)</p>
                <a
                  href={`/s/${club.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  forfor.agiletransition.se/s/{club.slug}
                </a>
                <p className="text-blue-600 mt-1">Säljare anger sitt namn och väljer team — inget lösenord behövs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lagGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Inga laggrupper ännu. Klicka &quot;Ny laggrupp&quot; för att komma igång.
          </CardContent>
        </Card>
      ) : (
        lagGroups.map((lg) => (
          <Card key={lg.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  {lg.name}
                  <Badge variant="secondary">{lg.teams.length} team</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <TeamForm
                    lagGroupId={lg.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Nytt team
                      </Button>
                    }
                  />
                  <LagForm
                    team={{ id: lg.id, name: lg.name }}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton
                    itemName={lg.name}
                    itemType="laggrupp"
                    deleteUrl={`/api/admin/lag/${lg.id}`}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lg.teams.length === 0 ? (
                <p className="text-gray-500 text-sm">Inga team i denna grupp ännu.</p>
              ) : (
                <div className="space-y-4">
                  {lg.teams.map((team) => (
                    <div key={team.id} className="p-4 rounded-lg border bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{team.name}</p>
                          {team.username && (
                            <Badge variant="outline" className="text-xs">Inloggning: {team.username}</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <TeamMemberForm
                            teamId={team.id}
                            trigger={
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-1" />
                                Lägg till medlem
                              </Button>
                            }
                          />
                          <TeamForm
                            lagGroupId={lg.id}
                            team={{ id: team.id, name: team.name, username: team.username || undefined }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteButton
                            itemName={team.name}
                            itemType="team"
                            deleteUrl={`/api/admin/teams/${team.id}`}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span>{team._count.districts} distrikt</span>
                        <span>{team.users.length} säljare</span>
                        <span>{team._count.orders} beställningar</span>
                      </div>

                      {/* Team members */}
                      {team.users.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Medlemmar</p>
                          <div className="space-y-2">
                            {team.users.map((member) => (
                              <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                <div>
                                  <p className="text-sm font-medium">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.username}{member.phone ? ` • ${member.phone}` : ''}</p>
                                </div>
                                <div className="flex gap-1">
                                  <TeamMemberForm
                                    teamId={team.id}
                                    member={{ id: member.id, name: member.name, username: member.username, phone: member.phone || undefined, email: member.email || undefined }}
                                    trigger={
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    }
                                  />
                                  <DeleteButton
                                    itemName={member.name}
                                    itemType="medlem"
                                    deleteUrl={`/api/admin/team-members/${member.id}`}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
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
