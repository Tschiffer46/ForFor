import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithMagicLink } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token saknas' },
        { status: 400 }
      )
    }

    await authenticateWithMagicLink(token)

    // Redirect to team member home
    return NextResponse.redirect(new URL('/säljare', request.url))
  } catch (error) {
    console.error('Magic link verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ogiltig länk' },
      { status: 401 }
    )
  }
}
