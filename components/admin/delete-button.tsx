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

interface DeleteButtonProps {
  trigger: React.ReactNode
  itemName: string
  itemType: string
  onDelete?: () => Promise<void>
  deleteUrl?: string
}

export function DeleteButton({
  trigger,
  itemName,
  itemType,
  onDelete,
  deleteUrl,
}: DeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      if (deleteUrl) {
        const response = await fetch(deleteUrl, { method: 'DELETE' })
        if (!response.ok) throw new Error('Delete failed')
      } else if (onDelete) {
        await onDelete()
      }
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting:', error)
      alert(`Ett fel uppstod när ${itemType} skulle tas bort`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ta bort {itemType}</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort <strong>{itemName}</strong>? Denna åtgärd kan inte ångras.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Tar bort...' : 'Ta bort'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
