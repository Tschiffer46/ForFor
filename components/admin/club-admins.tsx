'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react'

interface ClubAdmin {
  id: string
  name: string
  username: string
  email: string | null
  phone: string | null
}

export function ClubAdmins({
  slug,
  admins: initialAdmins,
}: {
  slug: string
  admins: ClubAdmin[]
}) {
  const router = useRouter()
  const [admins, setAdmins] = useState(initialAdmins)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
  })

  const handleCreate = async () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/klubbar/${slug}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Ett fel uppstod')
        return
      }
      const { admin } = await res.json()
      setAdmins((prev) => [...prev, admin])
      setForm({ name: '', username: '', password: '', email: '', phone: '' })
      setShowForm(false)
      router.refresh()
    } catch {
      setError('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (adminId: string) => {
    if (!confirm('Ta bort denna administratör? De kommer inte längre kunna logga in.'))
      return
    setDeleting(adminId)
    try {
      const res = await fetch(`/api/admin/klubbar/${slug}/admins/${adminId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId))
        router.refresh()
      }
    } catch {
      alert('Ett fel uppstod')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {admins.length === 0 && !showForm && (
        <p className="text-sm text-gray-500">Inga administratörer tillagda</p>
      )}

      {admins.map((admin) => (
        <div
          key={admin.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
        >
          <div>
            <p className="font-medium text-sm">{admin.name}</p>
            <p className="text-xs text-gray-500">
              Användarnamn: <span className="font-mono">{admin.username}</span>
              {admin.email && <> &middot; {admin.email}</>}
              {admin.phone && <> &middot; {admin.phone}</>}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(admin.id)}
            disabled={deleting === admin.id}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Namn *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Anna Svensson"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Användarnamn *</Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value.toLowerCase() })
                  }
                  placeholder="anna.uppakra"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lösenord *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minst 6 tecken"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">E-post</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? 'Sparar...' : 'Skapa administratör'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Lägg till administratör
        </Button>
      )}
    </div>
  )
}
