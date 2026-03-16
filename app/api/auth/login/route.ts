import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Användarnamn och lösenord krävs' },
        { status: 400 }
      )
    }

    const user = await authenticateWithPassword(username, password)

    return NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Inloggning misslyckades' },
      { status: 401 }
    )
  }
}
