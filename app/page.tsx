import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Home() {
  const user = await getCurrentUser()

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    if (user.roll === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/säljare')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold text-green-700">
            ForFor
          </CardTitle>
          <CardDescription className="text-lg">
            Föreningsförsäljning - Door-to-door kampanjhantering för svenska sportklubbar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/logga-in/admin" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Admin</CardTitle>
                  <CardDescription>
                    Logga in med BankID för att hantera föreningen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Admin-inloggning
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/logga-in/säljare" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-xl">Säljare</CardTitle>
                  <CardDescription>
                    Logga in som lagmedlem för att registrera beställningar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Säljare-inloggning
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            Hantera säljrundor, lag, adresser och beställningar enkelt och effektivt
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

