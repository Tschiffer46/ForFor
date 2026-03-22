import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()

  if (!user || !['ORG_ADMIN', 'CLUB_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user.clubId) {
    return NextResponse.json({ error: 'No club assigned' }, { status: 400 })
  }

  const lagGroups = await prisma.lagGroup.findMany({
    where: { clubId: user.clubId },
    include: {
      teams: {
        include: {
          users: {
            where: { role: 'TEAM_MEMBER' },
            select: { name: true, phone: true, email: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const BOM = '\uFEFF'
  const header = 'Lag,Team,Medlemsnamn,Telefon,Epost'

  const rows: string[] = []

  for (const lag of lagGroups) {
    for (const team of lag.teams) {
      if (team.users.length === 0) {
        rows.push(`${quote(lag.name)},${quote(team.name)},,,`)
      } else {
        for (const member of team.users) {
          rows.push(
            [
              quote(lag.name),
              quote(team.name),
              quote(member.name),
              quote(member.phone ?? ''),
              quote(member.email ?? ''),
            ].join(',')
          )
        }
      }
    }
  }

  const csv = BOM + header + '\n' + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lag-team.csv"',
    },
  })
}

function quote(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
