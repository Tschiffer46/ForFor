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

interface LeverantorFormProps {
  trigger?: React.ReactNode
  supplier?: {
    id: string
    name: string
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    notes: string | null
  }
}

export function LeverantorForm({ trigger, supplier }: LeverantorFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactName: supplier?.contactName || '',
    contactEmail: supplier?.contactEmail || '',
    contactPhone: supplier?.contactPhone || '',
    notes: supplier?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = supplier
        ? `/api/admin/leverantorer/${supplier.id}`
        : '/api/admin/leverantorer'

      const response = await fetch(url, {
        method: supplier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save supplier')

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const triggerElement = trigger || <Button>Lägg till leverantör</Button>

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{supplier ? 'Redigera leverantör' : 'Lägg till leverantör'}</DialogTitle>
            <DialogDescription>Fyll i leverantörsinformation</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Kontaktperson</Label>
              <Input id="contactName" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-post</Label>
              <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon</Label>
              <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Anteckningar</Label>
              <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
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
