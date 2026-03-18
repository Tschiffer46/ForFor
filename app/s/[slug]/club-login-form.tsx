'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Team {
  id: string
  name: string
  groupName: string
}

interface Props {
  clubSlug: string
  teams: Team[]
  primaryColor: string
}

export function ClubLoginForm({ clubSlug, teams, primaryColor }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !selectedTeamId) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/saljare-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubSlug,
          name: name.trim(),
          teamId: selectedTeamId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Något gick fel')
        return
      }

      router.push('/saljare')
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  // Group teams by lagGroup
  const groupedTeams = teams.reduce(
    (acc, team) => {
      if (!acc[team.groupName]) acc[team.groupName] = []
      acc[team.groupName].push(team)
      return acc
    },
    {} as Record<string, Team[]>
  )

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Name input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Vad heter du?</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
            className="h-12 text-lg"
            autoFocus
          />
        </div>

        {/* Team selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Välj ditt lag</label>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(groupedTeams).map(([groupName, groupTeams]) => (
              <div key={groupName}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {groupName}
                </p>
                <div className="space-y-1">
                  {groupTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className="w-full text-left p-3 rounded-lg border-2 transition-all text-base font-medium"
                      style={
                        selectedTeamId === team.id
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, white)`,
                              color: primaryColor,
                            }
                          : {
                              borderColor: '#e5e7eb',
                            }
                      }
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Submit */}
        <Button
          className="w-full h-14 text-lg"
          style={{ backgroundColor: primaryColor }}
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !selectedTeamId}
        >
          {loading ? 'Loggar in...' : 'Starta'}
        </Button>
      </CardContent>
    </Card>
  )
}
