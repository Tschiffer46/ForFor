'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const router = useRouter()
  const [personnummer, setPersonnummer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulate BankID loading
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await fetch('/api/auth/bankid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personnummer }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Inloggning misslyckades')
      }

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Admin-inloggning</CardTitle>
          <CardDescription>
            Logga in med BankID för att komma åt administratörspanelen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="personnummer" className="text-sm font-medium">
                Personnummer
              </label>
              <Input
                id="personnummer"
                type="text"
                placeholder="ÅÅÅÅMMDDXXXX"
                value={personnummer}
                onChange={(e) => setPersonnummer(e.target.value)}
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
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Autentiserar med BankID...
                </span>
              ) : (
                'Logga in med BankID'
              )}
            </Button>

            <div className="text-xs text-center text-gray-500 mt-4">
              Detta är en mockad BankID-inloggning för MVP-syften
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
