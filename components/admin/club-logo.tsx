'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Building2 } from 'lucide-react'

export function ClubLogo({ slug, logoUrl }: { slug: string; logoUrl: string | null }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/klubbar/${slug}/logo`, {
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

  return (
    <label className="cursor-pointer group relative">
      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 group-hover:border-green-500 flex items-center justify-center overflow-hidden bg-gray-50 transition-colors">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/uploads/${logoUrl}`} alt="Klubblogotyp" className="w-full h-full object-cover" />
        ) : (
          <Building2 className="h-8 w-8 text-gray-400 group-hover:text-green-500" />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
        <Upload className="h-3 w-3 text-gray-500" />
      </div>
      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
    </label>
  )
}
