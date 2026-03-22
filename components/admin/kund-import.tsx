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
import { CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'
import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file'

interface KundImportProps {
  trigger: React.ReactNode
  clubSlug?: string
}

interface ParsedCustomer {
  namn: string
  telefon?: string
  epost?: string
  gatuadress: string
  postnummer: string
  stad: string
  lag?: string
  lagNamn?: string
}

interface RejectedRow {
  row: number
  data: ParsedCustomer
  reason: string
}

interface WarningRow {
  row: number
  data: ParsedCustomer
  warnings: string[]
}

interface ImportResult {
  imported: number
  skipped: number
  warnings: number
  total: number
  rejectedRows: RejectedRow[]
  warningRows: WarningRow[]
  createdLagGroups: string[]
  createdTeams: string[]
}

function parseRow(obj: Record<string, unknown>): ParsedCustomer {
  const get = (keys: string[]) => {
    for (const k of keys) {
      const val = obj[k] ?? obj[k.toLowerCase()]
      if (val != null && String(val).trim()) return String(val).trim()
    }
    return ''
  }

  return {
    namn: get(['namn', 'Namn']),
    telefon: get(['telefon', 'Telefon']),
    epost: get(['epost', 'Epost', 'E-post', 'e-post']),
    gatuadress: get(['gatuadress', 'Gatuadress', 'adress', 'Adress']),
    postnummer: get(['postnummer', 'Postnummer']),
    stad: get(['stad', 'Stad']),
    lag: get(['lag', 'Lag']),
    lagNamn: get(['lagNamn', 'LagNamn', 'lagnamn', 'team', 'Team']),
  }
}

export function KundImport({ trigger, clubSlug }: KundImportProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedCustomer[]>([])
  const [allCustomers, setAllCustomers] = useState<ParsedCustomer[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const resetState = () => {
    setFile(null)
    setPreview([])
    setAllCustomers([])
    setResult(null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)
    setLoading(true)

    try {
      const fileName = selectedFile.name.toLowerCase()
      let customers: ParsedCustomer[] = []

      if (fileName.endsWith('.csv')) {
        Papa.parse(selectedFile, {
          header: true,
          complete: (results) => {
            customers = (results.data as Record<string, unknown>[]).map(parseRow)
            setAllCustomers(customers)
            setPreview(customers.slice(0, 5))
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

        customers = rows.slice(1).map((row) => {
          const obj: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index]
          })
          return parseRow(obj)
        })

        setAllCustomers(customers)
        setPreview(customers.slice(0, 5))
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
    if (allCustomers.length === 0) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/kunder/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: allCustomers }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const importResult: ImportResult = await response.json()
      setResult(importResult)
    } catch (error) {
      console.error('Error importing customers:', error)
      alert('Ett fel uppstod vid import')
    } finally {
      setLoading(false)
    }
  }

  const downloadRejectedCsv = () => {
    if (!result || result.rejectedRows.length === 0) return

    const csvData = result.rejectedRows.map((r) => ({
      Rad: r.row,
      Namn: r.data.namn,
      Gatuadress: r.data.gatuadress,
      Postnummer: r.data.postnummer,
      Stad: r.data.stad,
      Telefon: r.data.telefon || '',
      Epost: r.data.epost || '',
      Lag: r.data.lag || '',
      LagNamn: r.data.lagNamn || '',
      Problem: r.reason,
    }))

    const csv = '\uFEFF' + Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'avvisade-kunder.csv'
    link.click()
    URL.revokeObjectURL(url)
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
          <DialogTitle>Importera kunder</DialogTitle>
          <DialogDescription>
            Ladda upp en CSV eller Excel-fil med kunder. Filen ska innehålla kolumnerna: namn,
            gatuadress, postnummer, stad. Valfria: telefon, epost, lag, lagNamn.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">Välj fil</Label>
                <input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    Förhandsgranskning ({allCustomers.length} rader, visar 5 första)
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1 text-left">Namn</th>
                            <th className="px-2 py-1 text-left">Adress</th>
                            <th className="px-2 py-1 text-left">Stad</th>
                            <th className="px-2 py-1 text-left">Lag</th>
                            <th className="px-2 py-1 text-left">Team</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.map((customer, index) => (
                            <tr key={index}>
                              <td className="px-2 py-1">{customer.namn}</td>
                              <td className="px-2 py-1">{customer.gatuadress}</td>
                              <td className="px-2 py-1">{customer.stad}</td>
                              <td className="px-2 py-1">{customer.lag || '-'}</td>
                              <td className="px-2 py-1">{customer.lagNamn || '-'}</td>
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
              <Button onClick={handleImport} disabled={loading || allCustomers.length === 0}>
                {loading ? 'Importerar...' : 'Importera'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Imported */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-800">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">
                  {result.imported} kunder importerade
                </span>
              </div>

              {/* Warnings */}
              {result.warnings > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">
                      {result.warnings} kunder importerades med varningar
                    </span>
                  </div>
                  <ul className="mt-2 ml-8 text-sm space-y-1">
                    {result.warningRows.slice(0, 5).map((w) => (
                      <li key={w.row}>
                        Rad {w.row} ({w.data.namn}): {w.warnings.join(', ')}
                      </li>
                    ))}
                    {result.warningRows.length > 5 && (
                      <li className="text-yellow-600">
                        ...och {result.warningRows.length - 5} till
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Rejected */}
              {result.skipped > 0 && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">
                      {result.skipped} rader avvisades
                    </span>
                  </div>
                  <ul className="mt-2 ml-8 text-sm space-y-1">
                    {result.rejectedRows.slice(0, 5).map((r) => (
                      <li key={r.row}>
                        Rad {r.row} ({r.data.namn || 'tomt namn'}): {r.reason}
                      </li>
                    ))}
                    {result.rejectedRows.length > 5 && (
                      <li className="text-red-600">
                        ...och {result.rejectedRows.length - 5} till
                      </li>
                    )}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 ml-8"
                    onClick={downloadRejectedCsv}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner avvisade rader (CSV)
                  </Button>
                </div>
              )}

              {/* Created teams info */}
              {(result.createdTeams.length > 0 || result.createdLagGroups.length > 0) && (
                <div className="p-3 rounded-lg bg-blue-50 text-blue-800">
                  <p className="font-medium text-sm">Nya lag/team skapades:</p>
                  <ul className="mt-1 ml-4 text-sm list-disc">
                    {result.createdTeams.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  {clubSlug && (
                    <p className="mt-2 text-sm">
                      Säljare kan logga in direkt via:{' '}
                      <a
                        href={`/s/${clubSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline"
                      >
                        forfor.agiletransition.se/s/{clubSlug}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
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
