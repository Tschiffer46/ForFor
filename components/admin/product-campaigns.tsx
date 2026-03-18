'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'

interface PriceCampaign {
  id: string
  discountType: string
  discountValue: number
  startDate: Date | string
  endDate: Date | string
  description: string | null
  active: boolean
}

function formatDiscount(type: string, value: number) {
  return type === 'percentage' ? `${value}%` : `${value} kr`
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('sv-SE')
}

export function ProductCampaigns({ productId, campaigns }: { productId: string; campaigns: PriceCampaign[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  const handleAdd = async () => {
    if (!form.discountValue || !form.startDate || !form.endDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/produkter/${productId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Misslyckades')
        return
      }
      setAdding(false)
      setForm({ discountType: 'percentage', discountValue: '', startDate: '', endDate: '', description: '' })
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Ta bort kampanjen?')) return
    await fetch(`/api/admin/produkter/${productId}/campaigns/${campaignId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {campaigns.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2 font-medium text-gray-600">Rabatt</th>
              <th className="text-left py-2 font-medium text-gray-600">Period</th>
              <th className="text-left py-2 font-medium text-gray-600">Beskrivning</th>
              <th className="text-center py-2 font-medium text-gray-600">Status</th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((c) => {
              const now = new Date()
              const isActive = c.active && new Date(c.startDate) <= now && new Date(c.endDate) >= now
              return (
                <tr key={c.id}>
                  <td className="py-2 font-medium">{formatDiscount(c.discountType, c.discountValue)}</td>
                  <td className="py-2">{formatDate(c.startDate)} - {formatDate(c.endDate)}</td>
                  <td className="py-2 text-gray-600">{c.description || '-'}</td>
                  <td className="py-2 text-center">
                    <Badge variant={isActive ? 'success' : 'secondary'}>
                      {isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">Inga priskampanjer</p>
      )}

      {!adding && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ny kampanj
        </Button>
      )}

      {adding && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rabattyp</Label>
              <select className="border rounded px-3 py-2 text-sm w-full" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Procent (%)</option>
                <option value="absolute">Kronor (kr)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Värde</Label>
              <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === 'percentage' ? 'Ex: 10' : 'Ex: 50'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Slutdatum</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Beskrivning</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Valfri beskrivning" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={loading}>{loading ? 'Sparar...' : 'Skapa kampanj'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Avbryt</Button>
          </div>
        </div>
      )}
    </div>
  )
}
