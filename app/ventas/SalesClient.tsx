"use client"

import { useState } from "react"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, CreditCard } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SaleDetailDialog } from "./SaleDetailDialog"
import { RegisterPaymentDialog } from "./RegisterPaymentDialog"
import type { SaleWithItems, Column, PaymentStatus } from "@/lib/types"

interface SalesClientProps {
  initialSales: SaleWithItems[]
}

export function SalesClient({ initialSales }: SalesClientProps) {
  const [sales] = useState<SaleWithItems[]>(initialSales)

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pagado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pagado</Badge>
      case 'parcial':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pago Parcial</Badge>
      case 'pendiente':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: Column<SaleWithItems>[] = [
    {
      key: "created_at",
      header: "Hora",
      cell: (sale) => (
        <span className="text-sm">
          {new Date(sale.created_at).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (sale) => (
        <span className="text-sm">
          {sale.customer?.name || "Sin cliente"}
        </span>
      )
    },
    {
      key: "items",
      header: "Productos",
      cell: (sale) => (
        <span className="text-sm">
          {sale.sale_items?.length || 0} producto(s)
        </span>
      )
    },
    {
      key: "payment_method",
      header: "Método",
      cell: (sale) => (
        <Badge variant="outline" className="capitalize">
          {sale.payment_method}
        </Badge>
      )
    },
    {
      key: "payment_status",
      header: "Pago",
      cell: (sale) => getPaymentStatusBadge(sale.payment_status)
    },
    {
      key: "total_amount",
      header: "Total",
      cell: (sale) => (
        <span className="font-semibold text-emerald-600">
          ${sale.total_amount.toFixed(2)}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      cell: (sale) => (
        <div className="flex gap-2">
          <SaleDetailDialog sale={sale}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
          </SaleDetailDialog>
          {sale.payment_status !== 'pagado' && (
            <RegisterPaymentDialog
              saleId={sale.id}
              saleTotal={sale.total_amount}
              currentPaid={sale.amount_paid}
              currentPending={sale.amount_pending}
            >
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar
              </Button>
            </RegisterPaymentDialog>
          )}
        </div>
      )
    }
  ]

  const mobileCardRender = (sale: SaleWithItems) => (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {new Date(sale.created_at).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <Badge variant="outline" className="capitalize">
          {sale.payment_method}
        </Badge>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Cliente</p>
        <p className="font-medium">{sale.customer?.name || "Sin cliente"}</p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Productos</p>
        <p className="font-medium">{sale.sale_items?.length || 0} producto(s)</p>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Estado de pago</p>
        {getPaymentStatusBadge(sale.payment_status)}
        {sale.payment_status !== 'pagado' && (
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Pagado:</span>
              <span className="text-green-600">${sale.amount_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Pendiente:</span>
              <span className="text-red-600">${sale.amount_pending.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="font-semibold text-emerald-600 text-lg">
            ${sale.total_amount.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <SaleDetailDialog sale={sale}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver
            </Button>
          </SaleDetailDialog>
          {sale.payment_status !== 'pagado' && (
            <RegisterPaymentDialog
              saleId={sale.id}
              saleTotal={sale.total_amount}
              currentPaid={sale.amount_paid}
              currentPending={sale.amount_pending}
            >
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar
              </Button>
            </RegisterPaymentDialog>
          )}
        </div>
      </div>
    </div>
  )

  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-lg font-medium mb-2">No hay ventas registradas</h3>
        <p className="text-muted-foreground">
          Comienza registrando tu primera venta del día
        </p>
      </div>
    )
  }

  return (
    <DataTable
      data={sales}
      columns={columns}
      mobileCardRender={mobileCardRender}
      emptyState={
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium mb-2">No hay ventas</h3>
          <p className="text-muted-foreground">
            Comienza registrando tu primera venta del día
          </p>
        </div>
      }
    />
  )
}
