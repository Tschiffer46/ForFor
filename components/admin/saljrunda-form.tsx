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
  saljrunda?: {
    id: string
    namn: string
    forsaljningStart: Date
    forsaljningSlut: Date
    leveransDatum: Date
  }
}

export function SaljrundaForm({ trigger, saljrunda }: SaljrundaFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    namn: saljrunda?.namn || '',
    forsaljningStart: saljrunda?.forsaljningStart
      ? new Date(saljrunda.forsaljningStart).toISOString().split('T')[0]
      : '',
    forsaljningSlut: saljrunda?.forsaljningSlut
      ? new Date(saljrunda.forsaljningSlut).toISOString().split('T')[0]
      : '',
    leveransDatum: saljrunda?.leveransDatum
      ? new Date(saljrunda.leveransDatum).toISOString().split('T')[0]
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = saljrunda
        ? `/api/admin/saljrundor/${saljrunda.id}`
        : '/api/admin/saljrundor'
      
      const method = saljrunda ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save saljrunda')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving saljrunda:', error)
      alert('Ett fel uppstod när säljrundan skulle sparas')
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
              {saljrunda ? 'Redigera säljrunda' : 'Skapa ny säljrunda'}
            </DialogTitle>
            <DialogDescription>
              Fyll i information om säljrundan
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
              <Label htmlFor="forsaljningStart">Försäljningsstart *</Label>
              <Input
                id="forsaljningStart"
                type="date"
                value={formData.forsaljningStart}
                onChange={(e) =>
                  setFormData({ ...formData, forsaljningStart: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forsaljningSlut">Försäljningsslut *</Label>
              <Input
                id="forsaljningSlut"
                type="date"
                value={formData.forsaljningSlut}
                onChange={(e) =>
                  setFormData({ ...formData, forsaljningSlut: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leveransDatum">Leveransdatum *</Label>
              <Input
                id="leveransDatum"
                type="date"
                value={formData.leveransDatum}
                onChange={(e) =>
                  setFormData({ ...formData, leveransDatum: e.target.value })
                }
                required
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
