import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'ORG_ADMIN' && user.role !== 'CLUB_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.clubId) {
    return NextResponse.json({ error: 'No club associated with user' }, { status: 400 })
  }

  const { members } = await req.json() as {
    members: Array<{
      lag: string
      team: string
      medlemsnamn: string
      telefon?: string
      epost?: string
    }>
  }

  let imported = 0
  let updated = 0
  let skipped = 0

  // Pre-fetch existing lagGroups and teams to avoid N+1 queries
  const existingLagGroups = await prisma.lagGroup.findMany({
    where: { clubId: user.clubId },
    include: { teams: true },
  })
  const lagGroupCache = new Map<string, { id: string }>(
    existingLagGroups.map((lg) => [lg.name, lg])
  )
  const teamCache = new Map<string, { id: string }>(
    existingLagGroups.flatMap((lg) =>
      lg.teams.map((t) => [`${lg.name}::${t.name}`, t])
    )
  )

  for (const row of members) {
    if (!row.lag || !row.team || !row.medlemsnamn) {
      skipped++
      continue
    }

    // Find or create LagGroup (cached)
    let lagGroup = lagGroupCache.get(row.lag)
    if (!lagGroup) {
      lagGroup = await prisma.lagGroup.create({
        data: { name: row.lag, clubId: user.clubId },
      })
      lagGroupCache.set(row.lag, lagGroup)
    }

    // Find or create Team (cached)
    const teamKey = `${row.lag}::${row.team}`
    let team = teamCache.get(teamKey)
    if (!team) {
      team = await prisma.team.create({
        data: { name: row.team, lagGroupId: lagGroup.id },
      })
      teamCache.set(teamKey, team)
    }

    // Find or create User (match by name case-insensitive within the team)
    const existingMember = await prisma.user.findFirst({
      where: {
        name: { equals: row.medlemsnamn, mode: 'insensitive' },
        teamId: team.id,
      },
    })

    if (existingMember) {
      await prisma.user.update({
        where: { id: existingMember.id },
        data: {
          phone: row.telefon || existingMember.phone,
          email: row.epost || existingMember.email,
        },
      })
      updated++
    } else {
      await prisma.user.create({
        data: {
          name: row.medlemsnamn,
          username: crypto.randomUUID().slice(0, 8),
          password: '',
          phone: row.telefon || null,
          email: row.epost || null,
          role: 'TEAM_MEMBER',
          teamId: team.id,
          clubId: user.clubId,
        },
      })
      imported++
    }
  }

  revalidatePath('/admin/lag')

  return NextResponse.json({
    imported,
    updated,
    skipped,
    total: members.length,
  })
}
