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
import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file'

interface KundImportProps {
  trigger: React.ReactNode
}

interface ParsedCustomer {
  namn: string
  telefon?: string
  epost?: string
  gatuadress: string
  postnummer: string
  stad: string
  lagNamn?: string
  prenumeration?: boolean
}

export function KundImport({ trigger }: KundImportProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedCustomer[]>([])
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setLoading(true)

    try {
      const fileName = selectedFile.name.toLowerCase()
      let customers: ParsedCustomer[] = []

      if (fileName.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(selectedFile, {
          header: true,
          complete: (results) => {
            customers = (results.data as any[]).map((row) => ({
              namn: row.namn || row.Namn || '',
              telefon: row.telefon || row.Telefon || '',
              epost: row.epost || row.Epost || row['E-post'] || '',
              gatuadress: row.gatuadress || row.Gatuadress || row.adress || row.Adress || '',
              postnummer: row.postnummer || row.Postnummer || '',
              stad: row.stad || row.Stad || '',
              lagNamn: row.lagNamn || row.LagNamn || row.lag || row.Lag || '',
              prenumeration: row.prenumeration === 'true' || row.Prenumeration === 'true',
            }))
            setPreview(customers.slice(0, 5))
            setLoading(false)
          },
          error: () => {
            alert('Fel vid läsning av CSV-fil')
            setLoading(false)
          },
        })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        const rows = await readXlsxFile(selectedFile)
        const headers = rows[0] as string[]
        
        customers = rows.slice(1).map((row) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index]
          })
          
          return {
            namn: obj.namn || obj['namn'] || '',
            telefon: obj.telefon || obj['telefon'] || '',
            epost: obj.epost || obj['e-post'] || obj['epost'] || '',
            gatuadress: obj.gatuadress || obj.adress || '',
            postnummer: obj.postnummer || '',
            stad: obj.stad || '',
            lagNamn: obj.lagnamn || obj.lag || '',
            prenumeration: obj.prenumeration === 'true' || obj.prenumeration === true,
          }
        })
        
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
    if (!file) return

    setLoading(true)

    try {
      const fileName = file.name.toLowerCase()
      let customers: ParsedCustomer[] = []

      if (fileName.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          complete: async (results) => {
            customers = (results.data as any[]).map((row) => ({
              namn: row.namn || row.Namn || '',
              telefon: row.telefon || row.Telefon || '',
              epost: row.epost || row.Epost || row['E-post'] || '',
              gatuadress: row.gatuadress || row.Gatuadress || row.adress || row.Adress || '',
              postnummer: row.postnummer || row.Postnummer || '',
              stad: row.stad || row.Stad || '',
              lagNamn: row.lagNamn || row.LagNamn || row.lag || row.Lag || '',
              prenumeration: row.prenumeration === 'true' || row.Prenumeration === 'true',
            }))

            await performImport(customers)
          },
        })
      } else {
        const rows = await readXlsxFile(file)
        const headers = rows[0] as string[]
        
        customers = rows.slice(1).map((row) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index]
          })
          
          return {
            namn: obj.namn || obj['namn'] || '',
            telefon: obj.telefon || obj['telefon'] || '',
            epost: obj.epost || obj['e-post'] || obj['epost'] || '',
            gatuadress: obj.gatuadress || obj.adress || '',
            postnummer: obj.postnummer || '',
            stad: obj.stad || '',
            lagNamn: obj.lagnamn || obj.lag || '',
            prenumeration: obj.prenumeration === 'true' || obj.prenumeration === true,
          }
        })

        await performImport(customers)
      }
    } catch (error) {
      console.error('Error importing:', error)
      alert('Fel vid import av kunder')
      setLoading(false)
    }
  }

  const performImport = async (customers: ParsedCustomer[]) => {
    try {
      const response = await fetch('/api/admin/kunder/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      alert(
        `Import klar!\nImporterade: ${result.imported}\nHoppade över: ${result.skipped}\nTotalt: ${result.total}`
      )
      
      setOpen(false)
      setFile(null)
      setPreview([])
      router.refresh()
    } catch (error) {
      console.error('Error importing customers:', error)
      alert('Ett fel uppstod vid import')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importera kunder</DialogTitle>
          <DialogDescription>
            Ladda upp en CSV eller Excel-fil med kunder. Filen ska innehålla kolumnerna: namn, gatuadress, postnummer, stad. Valfria: telefon, epost, lagNamn, prenumeration.
          </DialogDescription>
        </DialogHeader>

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
              <Label>Förhandsgranskning (5 första rader)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Namn</th>
                        <th className="px-2 py-1 text-left">Adress</th>
                        <th className="px-2 py-1 text-left">Stad</th>
                        <th className="px-2 py-1 text-left">Lag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {preview.map((customer, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1">{customer.namn}</td>
                          <td className="px-2 py-1">{customer.gatuadress}</td>
                          <td className="px-2 py-1">{customer.stad}</td>
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
              setFile(null)
              setPreview([])
            }}
            disabled={loading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !file}
          >
            {loading ? 'Importerar...' : 'Importera'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
