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

interface KundFormProps {
  trigger: React.ReactNode
  customer: {
    id: string
    namn: string
    telefon: string | null
    epost: string | null
    prenumeration: boolean
  }
}

export function KundForm({ trigger, customer }: KundFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    namn: customer.namn,
    telefon: customer.telefon || '',
    epost: customer.epost || '',
    prenumeration: customer.prenumeration,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/kunder/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Ett fel uppstod när kunden skulle uppdateras')
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
            <DialogTitle>Redigera kund</DialogTitle>
            <DialogDescription>
              Uppdatera kundinformation
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
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={formData.telefon}
                onChange={(e) =>
                  setFormData({ ...formData, telefon: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epost">E-post</Label>
              <Input
                id="epost"
                type="email"
                value={formData.epost}
                onChange={(e) =>
                  setFormData({ ...formData, epost: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="prenumeration"
                type="checkbox"
                checked={formData.prenumeration}
                onChange={(e) =>
                  setFormData({ ...formData, prenumeration: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="prenumeration">Prenumeration (10% rabatt)</Label>
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
