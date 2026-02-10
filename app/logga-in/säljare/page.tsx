'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SeljarLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLink, setMagicLink] = useState('')

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Kunde inte skicka länk')
      }

      const data = await response.json()
      setMagicLink(`/api/auth/magic-link/verify?token=${data.token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkClick = async () => {
    try {
      const response = await fetch(magicLink)
      if (response.ok) {
        router.push('/säljare')
      }
    } catch {
      setError('Kunde inte logga in')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Säljare-inloggning</CardTitle>
          <CardDescription>
            Ange din e-postadress så skickar vi en magisk länk
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!magicLink ? (
            <form onSubmit={handleSendLink} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-postadress
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din.epost@exempel.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Skickar...' : 'Skicka magisk länk'}
              </Button>

              <div className="text-xs text-center text-gray-500 mt-4">
                Detta är en mockad magic link-inloggning för MVP-syften
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                ✅ Länken har skickats till din e-post!
              </div>

              <div className="text-center text-sm text-gray-600">
                (Mocked: I en riktig app skulle du få ett e-postmeddelande)
              </div>

              <Button onClick={handleMagicLinkClick} className="w-full">
                Klicka här för att logga in direkt
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setMagicLink('')
                  setEmail('')
                }}
                className="w-full"
              >
                Skicka till annan e-post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
