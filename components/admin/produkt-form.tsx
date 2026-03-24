'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'

interface ProductImageData {
  id: string
  imagePath: string
  sortOrder: number
}

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
    images?: ProductImageData[]
  }
}

export function ProduktForm({ trigger, product }: ProduktFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ProductImageData[]>(product?.images || [])
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    listPrice: product?.listPrice?.toString() || '',
    size: product?.size || '',
    weightPerUnit: product?.weightPerUnit?.toString() || '',
    sacksPerPallet: product?.sacksPerPallet?.toString() || '',
    mustBuyPerPallet: product?.mustBuyPerPallet || false,
  })

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/produkter/${product.id}/images`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Uppladdning misslyckades')
        return
      }
      const { image } = await res.json()
      setImages((prev) => [...prev, image])
      router.refresh()
    } catch {
      alert('Ett fel uppstod vid uppladdning')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!product || !confirm('Ta bort bilden?')) return
    try {
      await fetch(`/api/admin/produkter/${product.id}/images/${imageId}`, { method: 'DELETE' })
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    }
  }

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

            {/* Image upload section (only for existing products) */}
            {product && (
              <div className="space-y-2">
                <Label>Bilder ({images.length}/3)</Label>
                <div className="flex gap-2 flex-wrap">
                  {images.map((img) => (
                    <div key={img.id} className="relative w-20 h-20 rounded border overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/uploads/${img.imagePath}`} alt="Produktbild" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <button
                      type="button"
                      className="w-20 h-20 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] mt-0.5">{uploading ? 'Laddar...' : 'Ladda upp'}</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleUploadImage}
                />
              </div>
            )}

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
