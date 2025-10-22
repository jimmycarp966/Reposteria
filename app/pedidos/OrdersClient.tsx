"use client"

import { useState } from "react"
import { Order } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList } from "lucide-react"
import { CreateOrderDialog } from "./CreateOrderDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
// import { confirmOrder, cancelOrder } from "@/actions/orderActions"
// import { useNotificationStore } from "@/store/notificationStore"

interface OrdersClientProps {
  orders: any[]
}

const OrderTable = ({ orders }: { orders: any[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Fecha Entrega</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Notas</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {orders.map((order) => (
        <TableRow key={order.id}>
          <TableCell>
            {new Date(order.delivery_date).toLocaleDateString()}
          </TableCell>
          <TableCell>{formatCurrency(order.total_price)}</TableCell>
          <TableCell>
            <Badge>{order.status}</Badge>
          </TableCell>
          <TableCell>{order.type}</TableCell>
          <TableCell>{order.notes || "-"}</TableCell>
          <TableCell className="text-right">
            {/* Acciones para el pedido */}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

const OrderCards = ({ orders }: { orders: any[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {orders.map((order) => (
      <Card key={order.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Pedido #{order.id.substring(0, 6)}</CardTitle>
              <CardDescription>
                Entrega: {new Date(order.delivery_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge>{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(order.total_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span>{order.type}</span>
            </div>
            {order.notes && (
              <p className="text-sm pt-2 text-gray-700 bg-gray-50 p-2 rounded-md">
                {order.notes}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {/* Acciones para el pedido */}
        </CardFooter>
      </Card>
    ))}
  </div>
)

const OrderList = ({ orders }: { orders: any[] }) => {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay pedidos en esta categoría.
      </p>
    )
  }
  return (
    <>
      <div className="hidden lg:block">
        <OrderTable orders={orders} />
      </div>
      <div className="lg:hidden">
        <OrderCards orders={orders} />
      </div>
    </>
  )
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  // const addNotification = useNotificationStore((state) => state.addNotification)

  const pending = orders.filter((o) => o.status === "PENDING")
  const confirmed = orders.filter((o) => o.status === "CONFIRMED")
  const inProduction = orders.filter((o) => o.status === "IN_PRODUCTION")
  const completed = orders.filter((o) => o.status === "COMPLETED")

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No hay pedidos"
        description="Comienza creando tu primer pedido"
        action={{
          label: "Crear Pedido",
          onClick: () => setShowCreateDialog(true),
        }}
      />
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona los pedidos de tus clientes
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Pedido
        </Button>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmados ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="in_production">En Producción ({inProduction.length})</TabsTrigger>
          <TabsTrigger value="completed">Completados ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><OrderList orders={pending} /></TabsContent>
        <TabsContent value="confirmed"><OrderList orders={confirmed} /></TabsContent>
        <TabsContent value="in_production"><OrderList orders={inProduction} /></TabsContent>
        <TabsContent value="completed"><OrderList orders={completed} /></TabsContent>
      </Tabs>

      <CreateOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  )
}

