"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ClipboardList, CheckCircle, XCircle } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateOrderDialog } from "./CreateOrderDialog"
import { confirmOrder, cancelOrder } from "@/actions/orderActions"
import { useNotificationStore } from "@/store/notificationStore"

interface OrdersClientProps {
  orders: any[]
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const pending = orders.filter((o: any) => o.status === "PENDING")
  const confirmed = orders.filter((o: any) => o.status === "CONFIRMED")
  const inProduction = orders.filter((o: any) => o.status === "IN_PRODUCTION")
  const completed = orders.filter((o: any) => o.status === "COMPLETED")

  const handleConfirm = async (orderId: string) => {
    if (!confirm("¿Confirmar este pedido? Se descontará el stock automáticamente.")) return

    setConfirmingId(orderId)
    const result = await confirmOrder(orderId)
    setConfirmingId(null)

    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
      
      if (result.shortages) {
        const shortagesList = result.shortages.map((s: any) => 
          `${s.ingredient_name}: falta ${s.shortage} ${s.ingredient.unit}`
        ).join(", ")
        addNotification({ 
          type: "warning", 
          message: `Ingredientes faltantes: ${shortagesList}`,
          duration: 10000 
        })
      }
    }
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm("¿Cancelar este pedido?")) return

    const result = await cancelOrder(orderId)
    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  const OrdersTable = ({ orders }: { orders: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha Entrega</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: any) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">
              {formatDate(order.delivery_date)}
              {order.delivery_time && <div className="text-xs text-muted-foreground">{order.delivery_time}</div>}
            </TableCell>
            <TableCell>
              <Badge variant={order.type === "EFEMERIDE" ? "default" : "outline"}>
                {order.type}
              </Badge>
            </TableCell>
            <TableCell>{order.order_items?.length || 0} producto(s)</TableCell>
            <TableCell className="font-bold">
              {formatCurrency(order.total_price)}
            </TableCell>
            <TableCell>
              <Badge 
                variant={
                  order.status === "CONFIRMED" ? "default" :
                  order.status === "IN_PRODUCTION" ? "secondary" :
                  order.status === "COMPLETED" ? "outline" :
                  "destructive"
                }
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-2">
              {order.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleConfirm(order.id)}
                    disabled={confirmingId === order.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {confirmingId === order.id ? "Confirmando..." : "Confirmar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancel(order.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </>
              )}
              {order.status !== "PENDING" && (
                <Button size="sm" variant="outline">
                  Ver Detalle
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pedidos</h1>
            <p className="text-muted-foreground">
              Gestiona tus pedidos diarios y por efemérides
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No hay pedidos"
                description="Comienza creando tu primer pedido"
                action={{
                  label: "Crear Pedido",
                  onClick: () => setShowCreateDialog(true),
                }}
              />
            ) : (
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pendientes ({pending.length})
                  </TabsTrigger>
                  <TabsTrigger value="confirmed">
                    Confirmados ({confirmed.length})
                  </TabsTrigger>
                  <TabsTrigger value="in_production">
                    En Producción ({inProduction.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completados ({completed.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {pending.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No hay pedidos pendientes
                    </p>
                  ) : (
                    <OrdersTable orders={pending} />
                  )}
                </TabsContent>

                <TabsContent value="confirmed">
                  {confirmed.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No hay pedidos confirmados
                    </p>
                  ) : (
                    <OrdersTable orders={confirmed} />
                  )}
                </TabsContent>

                <TabsContent value="in_production">
                  {inProduction.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No hay pedidos en producción
                    </p>
                  ) : (
                    <OrdersTable orders={inProduction} />
                  )}
                </TabsContent>

                <TabsContent value="completed">
                  {completed.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No hay pedidos completados
                    </p>
                  ) : (
                    <OrdersTable orders={completed} />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  )
}

