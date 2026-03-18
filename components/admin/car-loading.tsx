'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

interface CarLoadingProduct {
  name: string
  totalQuantity: number
  weight?: number
}

interface CarLoadingProps {
  products: CarLoadingProduct[]
}

export default function CarLoading({ products }: CarLoadingProps) {
  if (products.length === 0) return null

  const totalWeight = products.reduce(
    (sum, p) => sum + (p.weight ?? 0),
    0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lastning &mdash; vad ska med?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((product) => (
            <div
              key={product.name}
              className="bg-gray-50 rounded-lg p-3 text-center"
            >
              <p className="font-semibold text-lg">{product.totalQuantity} st</p>
              <p className="text-sm text-gray-600">{product.name}</p>
              {product.weight != null && product.weight > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {product.weight.toFixed(1)} kg
                </p>
              )}
            </div>
          ))}
        </div>
        {totalWeight > 0 && (
          <p className="text-sm text-gray-500 mt-3 text-right">
            Total vikt: <span className="font-semibold">{totalWeight.toFixed(1)} kg</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
