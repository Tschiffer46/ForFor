'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Upload } from 'lucide-react'

interface ProductImage {
  id: string
  imagePath: string
  sortOrder: number
}

export function ProductImages({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/produkter/${productId}/images`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Uppladdning misslyckades')
        return
      }

      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('Ta bort bilden?')) return

    try {
      await fetch(`/api/admin/produkter/${productId}/images/${imageId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      alert('Ett fel uppstod')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group border rounded-lg overflow-hidden aspect-square bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/uploads/${img.imagePath}`} alt="Produktbild" className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(img.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {images.length < 3 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <span><Upload className="h-4 w-4 mr-1" />{uploading ? 'Laddar upp...' : 'Ladda upp bild'}</span>
          </Button>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        </label>
      )}
    </div>
  )
}
