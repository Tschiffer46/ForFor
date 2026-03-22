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
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'
import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file'

interface LagImportProps {
  trigger: React.ReactNode
}

interface ParsedMember {
  lag: string
  team: string
  medlemsnamn: string
  telefon?: string
  epost?: string
}

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  total: number
}

function parseRow(obj: Record<string, unknown>): ParsedMember {
  const get = (keys: string[]) => {
    for (const k of keys) {
      const val = obj[k] ?? obj[k.toLowerCase()]
      if (val != null && String(val).trim()) return String(val).trim()
    }
    return ''
  }

  return {
    lag: get(['lag', 'Lag']),
    team: get(['team', 'Team']),
    medlemsnamn: get(['medlemsnamn', 'Medlemsnamn', 'namn', 'Namn']),
    telefon: get(['telefon', 'Telefon']),
    epost: get(['epost', 'Epost', 'E-post', 'e-post']),
  }
}

export function LagImport({ trigger }: LagImportProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allMembers, setAllMembers] = useState<ParsedMember[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  const preview = allMembers.slice(0, 5)

  const resetState = () => {
    setAllMembers([])
    setResult(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setResult(null)
    setLoading(true)

    try {
      const fileName = selectedFile.name.toLowerCase()
      let members: ParsedMember[] = []

      if (fileName.endsWith('.csv')) {
        Papa.parse(selectedFile, {
          header: true,
          complete: (results) => {
            members = (results.data as Record<string, unknown>[]).map(parseRow)
            setAllMembers(members)
            setLoading(false)
          },
          error: () => {
            alert('Fel vid läsning av CSV-fil')
            setLoading(false)
          },
        })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const rows = await readXlsxFile(selectedFile)
        const headers = rows[0] as string[]

        members = rows.slice(1).map((row) => {
          const obj: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index]
          })
          return parseRow(obj)
        })

        setAllMembers(members)
        setLoading(false)
      } else {
        alert('Endast CSV och Excel-filer (.xlsx, .xls) stöds')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Fel vid läsning av fil')
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (allMembers.length === 0) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/lag/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: allMembers }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const importResult: ImportResult = await response.json()
      setResult(importResult)
    } catch (error) {
      console.error('Error importing members:', error)
      alert('Ett fel uppstod vid import')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          resetState()
          if (result) router.refresh()
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importera lag & medlemmar</DialogTitle>
          <DialogDescription>
            Ladda upp en CSV eller Excel-fil. Kolumner: Lag, Team, Medlemsnamn. Valfria: Telefon,
            Epost.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lag-file">Välj fil</Label>
                <input
                  id="lag-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    Förhandsgranskning ({allMembers.length} rader, visar 5 första)
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">Lag</th>
                            <th className="px-2 py-1 text-left">Team</th>
                            <th className="px-2 py-1 text-left">Namn</th>
                            <th className="px-2 py-1 text-left">Telefon</th>
                            <th className="px-2 py-1 text-left">Epost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.map((member, index) => (
                            <tr key={index}>
                              <td className="px-2 py-1">{member.lag || '-'}</td>
                              <td className="px-2 py-1">{member.team || '-'}</td>
                              <td className="px-2 py-1">{member.medlemsnamn}</td>
                              <td className="px-2 py-1">{member.telefon || '-'}</td>
                              <td className="px-2 py-1">{member.epost || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  resetState()
                }}
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button onClick={handleImport} disabled={loading || allMembers.length === 0}>
                {loading ? 'Importerar...' : 'Importera'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-800">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <div>
                  <span className="font-medium">
                    {result.imported} nya medlemmar importerade
                  </span>
                  {result.updated > 0 && (
                    <span className="block text-sm">
                      {result.updated} befintliga medlemmar uppdaterade
                    </span>
                  )}
                  {result.skipped > 0 && (
                    <span className="block text-sm text-yellow-700">
                      {result.skipped} rader hoppades över (saknar namn)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Totalt {result.total} rader i filen
              </p>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false)
                  resetState()
                  router.refresh()
                }}
              >
                Klar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
