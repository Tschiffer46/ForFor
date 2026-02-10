import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithBankID } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personnummer } = body

    if (!personnummer) {
      return NextResponse.json(
        { error: 'Personnummer krävs' },
        { status: 400 }
      )
    }

    // For MVP, we ignore the personnummer and just authenticate any admin
    await authenticateWithBankID()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('BankID auth error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Inloggning misslyckades' },
      { status: 401 }
    )
  }
}
