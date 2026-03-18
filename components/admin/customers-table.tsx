'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react'
import { KundForm } from '@/components/admin/kund-form'
import { DeleteButton } from '@/components/admin/delete-button'

export interface SerializedCustomer {
  id: string
  customerNumber: number
  name: string
  phone: string | null
  email: string | null
  subscription: boolean
  address: {
    street: string
    postalCode: string
    city: string
  }
  teamName: string
  orderCount: number
  lastCampaignName: string | null
  saleType: string
  visitStatus: string
}

interface CustomersTableProps {
  customers: SerializedCustomer[]
}

function SortIcon({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc' } }) {
  const sort = column.getIsSorted()
  if (sort === 'asc') return <ArrowUp className="ml-1 h-3 w-3 inline" />
  if (sort === 'desc') return <ArrowDown className="ml-1 h-3 w-3 inline" />
  return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
}

const SALE_TYPES = ['Säljare', 'Webbsida', 'Ingen försäljning ännu'] as const
const VISIT_STATUSES = [
  'Besökt och köpte',
  'Besökt, köpte inte',
  'Besökt, ingen hemma',
  'Ej besökt',
  'Beställde via webb',
] as const

export default function CustomersTable({ customers }: CustomersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('alla')
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>('alla')
  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('alla')

  const filteredData = useMemo(() => {
    let data = customers
    if (subscriptionFilter !== 'alla') {
      data = data.filter((c) =>
        subscriptionFilter === 'ja' ? c.subscription : !c.subscription
      )
    }
    if (saleTypeFilter !== 'alla') {
      data = data.filter((c) => c.saleType === saleTypeFilter)
    }
    if (visitStatusFilter !== 'alla') {
      data = data.filter((c) => c.visitStatus === visitStatusFilter)
    }
    return data
  }, [customers, subscriptionFilter, saleTypeFilter, visitStatusFilter])

  const columns = useMemo<ColumnDef<SerializedCustomer>[]>(
    () => [
      {
        accessorKey: 'customerNumber',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Kundnr <SortIcon column={column} />
          </button>
        ),
        sortingFn: 'basic',
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Namn <SortIcon column={column} />
          </button>
        ),
      },
      {
        id: 'address',
        accessorFn: (row) => row.address.street,
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Adress <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{row.original.address.street}</p>
            <p className="text-gray-500">
              {row.original.address.postalCode} {row.original.address.city}
            </p>
          </div>
        ),
      },
      {
        id: 'city',
        accessorFn: (row) => row.address.city,
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Ort <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => row.original.address.city,
      },
      {
        accessorKey: 'subscription',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Abonnemang <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) =>
          row.original.subscription ? (
            <Badge variant="success">Ja</Badge>
          ) : (
            <Badge variant="outline">Nej</Badge>
          ),
      },
      {
        accessorKey: 'orderCount',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Beställningar <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-center block">{row.original.orderCount}</span>
        ),
        sortingFn: 'basic',
      },
      {
        accessorKey: 'lastCampaignName',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Senaste kampanj <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.lastCampaignName || '-'}</span>
        ),
      },
      {
        accessorKey: 'saleType',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Försäljningstyp <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => {
          const type = row.original.saleType
          const variant =
            type === 'Säljare'
              ? 'default'
              : type === 'Webbsida'
                ? 'secondary'
                : 'outline'
          return <Badge variant={variant as 'default' | 'secondary' | 'outline'}>{type}</Badge>
        },
      },
      {
        accessorKey: 'visitStatus',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Säljstatus <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => {
          const status = row.original.visitStatus
          const variant =
            status === 'Besökt och köpte'
              ? 'success'
              : status === 'Beställde via webb'
                ? 'success'
                : status === 'Besökt, köpte inte'
                  ? 'warning'
                  : 'outline'
          return <Badge variant={variant as 'success' | 'warning' | 'outline'}>{status}</Badge>
        },
      },
      {
        id: 'actions',
        header: 'Åtgärder',
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex gap-1">
              <KundForm
                customer={{
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  email: c.email,
                  subscription: c.subscription,
                }}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
              <DeleteButton
                itemName={c.name}
                itemType="kund"
                deleteUrl={`/api/admin/kunder/${c.id}`}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase()
      const c = row.original
      return (
        c.name.toLowerCase().includes(search) ||
        c.customerNumber.toString().includes(search) ||
        (c.email?.toLowerCase().includes(search) ?? false) ||
        (c.phone?.includes(search) ?? false) ||
        c.address.street.toLowerCase().includes(search) ||
        c.address.city.toLowerCase().includes(search) ||
        c.teamName.toLowerCase().includes(search) ||
        (c.lastCampaignName?.toLowerCase().includes(search) ?? false)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <>
      {/* Filter controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Sök kund, adress, team..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="alla">Alla abonnemang</option>
              <option value="ja">Med abonnemang</option>
              <option value="nej">Utan abonnemang</option>
            </select>
            <select
              value={saleTypeFilter}
              onChange={(e) => setSaleTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="alla">Alla försäljningstyper</option>
              {SALE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={visitStatusFilter}
              onChange={(e) => setVisitStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="alla">Alla säljstatusar</option>
              {VISIT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      Inga kunder matchar filtren
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-gray-500 border-t">
            Visar {table.getRowModel().rows.length} av {customers.length} kunder
          </div>
        </CardContent>
      </Card>
    </>
  )
}
