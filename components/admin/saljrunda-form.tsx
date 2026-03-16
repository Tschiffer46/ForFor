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

interface SaljrundaFormProps {
  trigger: React.ReactNode
  campaign?: {
    id: string
    name: string
    salesStart: Date
    salesEnd: Date
    deliveryStart: Date | null
    deliveryEnd: Date | null
  }
}

export function SaljrundaForm({ trigger, campaign }: SaljrundaFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    salesStart: campaign?.salesStart
      ? new Date(campaign.salesStart).toISOString().split('T')[0]
      : '',
    salesEnd: campaign?.salesEnd
      ? new Date(campaign.salesEnd).toISOString().split('T')[0]
      : '',
    deliveryStart: campaign?.deliveryStart
      ? new Date(campaign.deliveryStart).toISOString().split('T')[0]
      : '',
    deliveryEnd: campaign?.deliveryEnd
      ? new Date(campaign.deliveryEnd).toISOString().split('T')[0]
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = campaign
        ? `/api/admin/saljrundor/${campaign.id}`
        : '/api/admin/saljrundor'

      const method = campaign ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save campaign')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Ett fel uppstod nar kampanjen skulle sparas')
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
              {campaign ? 'Redigera kampanj' : 'Skapa ny kampanj'}
            </DialogTitle>
            <DialogDescription>
              Fyll i information om kampanjen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesStart">Forsaljningsstart *</Label>
              <Input
                id="salesStart"
                type="date"
                value={formData.salesStart}
                onChange={(e) =>
                  setFormData({ ...formData, salesStart: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesEnd">Forsaljningsslut *</Label>
              <Input
                id="salesEnd"
                type="date"
                value={formData.salesEnd}
                onChange={(e) =>
                  setFormData({ ...formData, salesEnd: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryStart">Leveransstart</Label>
              <Input
                id="deliveryStart"
                type="date"
                value={formData.deliveryStart}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryStart: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryEnd">Leveransslut</Label>
              <Input
                id="deliveryEnd"
                type="date"
                value={formData.deliveryEnd}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryEnd: e.target.value })
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
