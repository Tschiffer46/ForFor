'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'

interface ProductSupplier {
  id: string
  sellPrice: number
  isCurrent: boolean
  supplier: { id: string; name: string }
}

interface Supplier {
  id: string
  name: string
}

export function ProductSuppliers({
  productId,
  productSuppliers,
  availableSuppliers,
}: {
  productId: string
  productSuppliers: ProductSupplier[]
  availableSuppliers: Supplier[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const linkedIds = new Set(productSuppliers.map((ps) => ps.supplier.id))
  const unlinkedSuppliers = availableSuppliers.filter((s) => !linkedIds.has(s.id))

  const handleAdd = async () => {
    if (!selectedSupplierId || !sellPrice) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/produkter/${productId}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: selectedSupplierId, sellPrice, isCurrent: productSuppliers.length === 0 }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Misslyckades')
        return
      }
      setAdding(false)
      setSelectedSupplierId('')
      setSellPrice('')
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (supplierId: string) => {
    if (!confirm('Ta bort leverantörskoppling?')) return
    await fetch(`/api/admin/produkter/${productId}/suppliers?supplierId=${supplierId}`, { method: 'DELETE' })
    router.refresh()
  }

  const formatSEK = (v: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-4">
      {productSuppliers.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2 font-medium text-gray-600">Leverantör</th>
              <th className="text-right py-2 font-medium text-gray-600">Inköpspris</th>
              <th className="text-center py-2 font-medium text-gray-600">Status</th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {productSuppliers.map((ps) => (
              <tr key={ps.id}>
                <td className="py-2 font-medium">{ps.supplier.name}</td>
                <td className="py-2 text-right">{formatSEK(ps.sellPrice)}</td>
                <td className="py-2 text-center">
                  {ps.isCurrent && <Badge variant="success">Nuvarande</Badge>}
                </td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(ps.supplier.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">Inga leverantörer kopplade</p>
      )}

      {productSuppliers.length < 3 && !adding && unlinkedSuppliers.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Lägg till leverantör
        </Button>
      )}

      {adding && (
        <div className="flex gap-2 items-end">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
          >
            <option value="">Välj leverantör...</option>
            {unlinkedSuppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Input type="number" placeholder="Inköpspris (SEK)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-40" />
          <Button size="sm" onClick={handleAdd} disabled={loading}>{loading ? '...' : 'Lägg till'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Avbryt</Button>
        </div>
      )}
    </div>
  )
}
