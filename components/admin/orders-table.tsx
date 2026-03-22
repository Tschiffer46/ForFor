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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Bell, Edit, Trash2 } from 'lucide-react'
import { SortIcon } from '@/components/admin/sort-icon'
import { OrderForm } from '@/components/admin/order-form'
import { DeleteButton } from '@/components/admin/delete-button'

// Serialized order type (Dates as ISO strings)
export interface SerializedOrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: { id: string; name: string }
}

export interface SerializedOrder {
  id: string
  status: 'OBETALD' | 'BETALD'
  totalAmount: number
  comment: string | null
  source: string
  createdAt: string
  customer: {
    id: string
    customerNumber: string
    name: string
    phone: string | null
    email: string | null
    address: {
      street: string
      city: string
    }
  }
  seller: { id: string; name: string } | null
  team: {
    id: string
    name: string
    lagGroup: {
      id: string
      name: string
      club: { id: string; name: string }
    }
  }
  campaign: { id: string; name: string }
  items: SerializedOrderItem[]
}

interface OrdersTableProps {
  orders: SerializedOrder[]
  showClubColumn: boolean
  campaigns?: { id: string; name: string }[]
  teams?: { id: string; name: string }[]
  products?: { id: string; name: string; price: number }[]
}

export default function OrdersTable({ orders, showClubColumn, campaigns: formCampaigns = [], teams: formTeams = [], products: formProducts = [] }: OrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [showUnpaidDialog, setShowUnpaidDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('alla')
  const [campaignFilter, setCampaignFilter] = useState<string>('alla')
  const [teamFilter, setTeamFilter] = useState<string>('alla')

  // Unique campaigns and teams for filter dropdowns
  const campaigns = useMemo(() => {
    const map = new Map<string, string>()
    orders.forEach((o) => map.set(o.campaign.id, o.campaign.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [orders])

  const teams = useMemo(() => {
    const map = new Map<string, string>()
    orders.forEach((o) => map.set(o.team.id, o.team.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [orders])

  // Filtered data based on dropdown filters
  const filteredData = useMemo(() => {
    let data = orders
    if (statusFilter !== 'alla') {
      data = data.filter((o) => o.status === statusFilter)
    }
    if (campaignFilter !== 'alla') {
      data = data.filter((o) => o.campaign.id === campaignFilter)
    }
    if (teamFilter !== 'alla') {
      data = data.filter((o) => o.team.id === teamFilter)
    }
    return data
  }, [orders, statusFilter, campaignFilter, teamFilter])

  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.status === 'OBETALD'),
    [orders]
  )

  const columns = useMemo<ColumnDef<SerializedOrder>[]>(() => {
    const cols: ColumnDef<SerializedOrder>[] = [
      {
        accessorKey: 'customer.customerNumber',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Kundnr <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => row.original.customer.customerNumber,
        sortingFn: 'basic',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Datum <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('sv-SE'),
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'customer.name',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Kund <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => row.original.customer.name,
      },
      {
        id: 'address',
        accessorFn: (row) => row.customer.address.street,
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Adress <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => row.original.customer.address.street,
      },
      {
        id: 'city',
        accessorFn: (row) => row.customer.address.city,
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Ort <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => row.original.customer.address.city,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Status <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'BETALD' ? 'success' : 'warning'}>
            {row.original.status === 'BETALD' ? 'Betald' : 'Obetald'}
          </Badge>
        ),
      },
      {
        accessorKey: 'customer.email',
        header: 'E-post',
        cell: ({ row }) => (
          <span className="text-xs break-all">{row.original.customer.email || '-'}</span>
        ),
      },
      {
        accessorKey: 'customer.phone',
        header: 'Telefon',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.customer.phone || '-'}</span>
        ),
      },
      {
        id: 'products',
        header: 'Produkter',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            {row.original.items.map((item) => (
              <div key={item.id} className="text-xs whitespace-nowrap">
                {item.quantity}x {item.product.name}
              </div>
            ))}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'totalAmount',
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Belopp <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: 'comment',
        header: 'Kommentar',
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 max-w-[120px] truncate block">
            {row.original.comment || '-'}
          </span>
        ),
        enableSorting: false,
      },
    ]

    // Add actions column if form data is available
    if (formCampaigns.length > 0) {
      cols.push({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="flex gap-1">
              <OrderForm
                campaigns={formCampaigns}
                teams={formTeams}
                products={formProducts}
                order={{
                  id: o.id,
                  customerId: o.customer.id,
                  customerName: o.customer.name,
                  campaignId: o.campaign.id,
                  teamId: o.team.id,
                  status: o.status,
                  comment: o.comment,
                  items: o.items.map((i) => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                  })),
                }}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
              <DeleteButton
                itemName={`beställning till ${o.customer.name}`}
                itemType="beställning"
                deleteUrl={`/api/admin/bestallningar/${o.id}`}
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
      })
    }

    if (showClubColumn) {
      // Insert club column after "Kund"
      cols.splice(3, 0, {
        id: 'club',
        accessorFn: (row) => row.team.lagGroup.club.name,
        header: ({ column }) => (
          <button className="flex items-center" onClick={() => column.toggleSorting()}>
            Klubb <SortIcon column={column} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs">{row.original.team.lagGroup.club.name}</span>
        ),
      })
    }

    return cols
  }, [showClubColumn, formCampaigns, formTeams, formProducts])

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
      const o = row.original
      return (
        o.customer.name.toLowerCase().includes(search) ||
        o.customer.customerNumber.toLowerCase().includes(search) ||
        (o.customer.email?.toLowerCase().includes(search) ?? false) ||
        (o.customer.phone?.includes(search) ?? false) ||
        o.customer.address.street.toLowerCase().includes(search) ||
        o.customer.address.city.toLowerCase().includes(search) ||
        o.team.name.toLowerCase().includes(search) ||
        o.campaign.name.toLowerCase().includes(search) ||
        (o.comment?.toLowerCase().includes(search) ?? false) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(search))
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
              placeholder="Sök kund, adress, produkt..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="alla">Alla status</option>
              <option value="BETALD">Betald</option>
              <option value="OBETALD">Obetald</option>
            </select>
            {campaigns.length > 1 && (
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="alla">Alla kampanjer</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {teams.length > 1 && (
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="alla">Alla team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnpaidDialog(true)}
                disabled={unpaidOrders.length === 0}
              >
                <Bell className="h-4 w-4 mr-1.5" />
                Påminn obetalda ({unpaidOrders.length})
              </Button>
            </div>
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
                      Inga beställningar matchar filtren
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-gray-500 border-t">
            Visar {table.getRowModel().rows.length} av {orders.length} beställningar
          </div>
        </CardContent>
      </Card>

      {/* Unpaid reminder dialog */}
      <Dialog open={showUnpaidDialog} onOpenChange={setShowUnpaidDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Obetalda beställningar ({unpaidOrders.length})</DialogTitle>
            <DialogDescription>
              Kontaktuppgifter till kunder med obetalda beställningar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {unpaidOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">
                    {order.customer.address.street}, {order.customer.address.city}
                  </p>
                  {order.customer.phone && (
                    <p className="text-xs mt-0.5">
                      Tel:{' '}
                      <a href={`tel:${order.customer.phone}`} className="text-blue-600 underline">
                        {order.customer.phone}
                      </a>
                    </p>
                  )}
                  {order.customer.email && (
                    <p className="text-xs">
                      E-post:{' '}
                      <a href={`mailto:${order.customer.email}`} className="text-blue-600 underline">
                        {order.customer.email}
                      </a>
                    </p>
                  )}
                </div>
                <span className="font-semibold whitespace-nowrap text-orange-600">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            ))}
            {unpaidOrders.length === 0 && (
              <p className="text-gray-500 text-center py-4">Inga obetalda beställningar</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
