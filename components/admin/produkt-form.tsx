'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProduktFormProps {
  trigger: React.ReactNode
  product?: {
    id: string
    namn: string
    beskrivning: string | null
    pris: number
    bildUrl: string | null
  }
}

export function ProduktForm({ trigger, product }: ProduktFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    namn: product?.namn || '',
    beskrivning: product?.beskrivning || '',
    pris: product?.pris?.toString() || '',
    bildUrl: product?.bildUrl || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product
        ? `/api/admin/produkter/${product.id}`
        : '/api/admin/produkter'
      
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save product')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ett fel uppstod när produkten skulle sparas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? 'Redigera produkt' : 'Lägg till produkt'}
            </DialogTitle>
            <DialogDescription>
              Fyll i produktinformation nedan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="namn">Namn *</Label>
              <Input
                id="namn"
                value={formData.namn}
                onChange={(e) =>
                  setFormData({ ...formData, namn: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beskrivning">Beskrivning</Label>
              <Input
                id="beskrivning"
                value={formData.beskrivning}
                onChange={(e) =>
                  setFormData({ ...formData, beskrivning: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pris">Pris (SEK) *</Label>
              <Input
                id="pris"
                type="number"
                value={formData.pris}
                onChange={(e) =>
                  setFormData({ ...formData, pris: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bildUrl">Bild-URL</Label>
              <Input
                id="bildUrl"
                type="url"
                value={formData.bildUrl}
                onChange={(e) =>
                  setFormData({ ...formData, bildUrl: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sparar...' : 'Spara'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
