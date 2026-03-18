'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProduktFormProps {
  trigger?: React.ReactNode
  product?: {
    id: string
    name: string
    description: string | null
    price: number
    listPrice: number | null
    imageUrl: string | null
    size: string | null
    weightPerUnit: number | null
    sacksPerPallet: number | null
    mustBuyPerPallet: boolean
  }
}

export function ProduktForm({ trigger, product }: ProduktFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    listPrice: product?.listPrice?.toString() || '',
    imageUrl: product?.imageUrl || '',
    size: product?.size || '',
    weightPerUnit: product?.weightPerUnit?.toString() || '',
    sacksPerPallet: product?.sacksPerPallet?.toString() || '',
    mustBuyPerPallet: product?.mustBuyPerPallet || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = product ? `/api/admin/produkter/${product.id}` : '/api/admin/produkter'
      const response = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Failed to save product')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const triggerElement = trigger || <Button>Lägg till produkt</Button>

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? 'Redigera produkt' : 'Lägg till produkt'}</DialogTitle>
            <DialogDescription>Fyll i produktinformation nedan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Pris (SEK) *</Label>
                <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listPrice">Listpris till klubbar (SEK)</Label>
                <Input id="listPrice" type="number" value={formData.listPrice} onChange={(e) => setFormData({ ...formData, listPrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Bild-URL</Label>
              <Input id="imageUrl" type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Storlek</Label>
                <Input id="size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="t.ex. 500g, 1kg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightPerUnit">Vikt per enhet (kg)</Label>
                <Input id="weightPerUnit" type="number" step="0.01" value={formData.weightPerUnit} onChange={(e) => setFormData({ ...formData, weightPerUnit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sacksPerPallet">Säckar per pall</Label>
                <Input id="sacksPerPallet" type="number" value={formData.sacksPerPallet} onChange={(e) => setFormData({ ...formData, sacksPerPallet: e.target.value })} />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 pb-2">
                  <input type="checkbox" checked={formData.mustBuyPerPallet} onChange={(e) => setFormData({ ...formData, mustBuyPerPallet: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm">Måste köpas per pall</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Avbryt</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Sparar...' : 'Spara'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
