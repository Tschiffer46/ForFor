import { NextRequest, NextResponse } from 'next/server'
import { authenticateSalesRep } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { clubSlug, name, teamId } = await request.json()

    if (!clubSlug || !name || !teamId) {
      return NextResponse.json(
        { error: 'Namn och lag krävs' },
        { status: 400 }
      )
    }

    // Verify the club exists and the team belongs to it
    const club = await prisma.club.findUnique({
      where: { slug: clubSlug },
      include: {
        lagGroups: {
          include: { teams: true },
        },
      },
    })

    if (!club) {
      return NextResponse.json(
        { error: 'Klubben hittades inte' },
        { status: 404 }
      )
    }

    const allTeams = club.lagGroups.flatMap((lg) => lg.teams)
    const team = allTeams.find((t) => t.id === teamId)

    if (!team) {
      return NextResponse.json(
        { error: 'Laget hittades inte i denna klubb' },
        { status: 400 }
      )
    }

    const user = await authenticateSalesRep(name.trim(), teamId, club.id)

    return NextResponse.json({
      success: true,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    console.error('Sales rep login error:', error)
    return NextResponse.json(
      { error: 'Något gick fel vid inloggning' },
      { status: 500 }
    )
  }
}
