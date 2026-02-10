import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'E-postadress krävs' },
        { status: 400 }
      )
    }

    const token = await sendMagicLink(email)

    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte skicka länk' },
      { status: 400 }
    )
  }
}
