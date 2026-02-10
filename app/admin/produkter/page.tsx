import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Package } from 'lucide-react'

export default async function ProdukterPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const products = await prisma.produkt.findMany({
    where: { foreningId: user.foreningId },
    orderBy: {
      namn: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkter</h1>
          <p className="text-gray-600 mt-1">Hantera produkter som säljs i säck</p>
        </div>
        <Button>Lägg till produkt</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <span className="line-clamp-1">{product.namn}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.beskrivning && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.beskrivning}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Pris per säck:</span>
                <Badge variant="outline" className="text-lg font-bold">
                  {formatCurrency(product.pris)}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Redigera
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                  Ta bort
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Inga produkter skapade ännu</p>
              <Button className="mt-4">Lägg till din första produkt</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
