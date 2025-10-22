"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList, Check, X as XIcon } from "lucide-react"
import { CreateOrderDialog } from "./CreateOrderDialog"
import { StockShortagesDialog } from "./StockShortagesDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { confirmOrder, cancelOrder } from "@/actions/orderActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useMutation } from "@/hooks/useMutation"
import { useTranslation } from "@/lib/i18n"
import type { OrderWithItems, StockShortage } from "@/lib/types"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface OrdersClientProps {
  orders: OrderWithItems[]
}

const OrderCard = ({ order, onConfirm, onCancel, isConfirming, isCancelling }: { 
  order: OrderWithItems
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  isConfirming: boolean
  isCancelling: boolean
}) => {
  const { t } = useTranslation()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Pedido #{order.id.substring(0, 8)}
            </CardTitle>
            <CardDescription>
              Entrega: {formatDate(order.delivery_date)}
              {order.delivery_time && ` a las ${order.delivery_time}`}
            </CardDescription>
          </div>
          <Badge variant={
            order.status === "CONFIRMED" ? "default" :
            order.status === "IN_PRODUCTION" ? "secondary" :
            order.status === "COMPLETED" ? "outline" :
            "destructive"
          }>
            {order.status === "PENDING" && t('orders.pending')}
            {order.status === "CONFIRMED" && t('orders.confirmed')}
            {order.status === "IN_PRODUCTION" && t('orders.inProduction')}
            {order.status === "COMPLETED" && t('orders.completed')}
            {order.status === "CANCELLED" && t('orders.cancelled')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>{t('orders.total')}:</span>
            <span className="text-green-600">{formatCurrency(order.total_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('orders.type')}:</span>
            <span>{order.type === 'DAILY' ? t('orders.typeDaily') : t('orders.typeEvent')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('orders.items')}:</span>
            <span>{order.order_items.length} producto(s)</span>
          </div>
          {order.notes && (
            <p className="text-sm pt-2 text-gray-700 bg-gray-50 p-2 rounded-md">
              {order.notes}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {order.status === "PENDING" && (
          <>
            <Button
              size="sm"
              variant="default"
              className="btn-gradient-green"
              onClick={() => onConfirm(order.id)}
              disabled={isConfirming || isCancelling}
            >
              {isConfirming ? (
                <>Confirmando...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('orders.confirm')}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onCancel(order.id)}
              disabled={isConfirming || isCancelling}
            >
              {isCancelling ? (
                <>Cancelando...</>
              ) : (
                <>
                  <XIcon className="h-4 w-4 mr-1" />
                  {t('orders.cancel')}
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showShortagesDialog, setShowShortagesDialog] = useState(false)
  const [stockShortages, setStockShortages] = useState<StockShortage[]>([])
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  
  const addNotification = useNotificationStore((state) => state.addNotification)
  const { t } = useTranslation()

  // Mutation para confirmar pedido
  const confirmMutation = useMutation(confirmOrder, {
    onSuccess: () => {
      addNotification({ type: "success", message: t('orders.orderConfirmed') })
      setConfirmingOrderId(null)
    },
    onError: (error) => {
      addNotification({ type: "error", message: error })
      setConfirmingOrderId(null)
    }
  })

  // Mutation para cancelar pedido
  const cancelMutation = useMutation(cancelOrder, {
    onSuccess: () => {
      addNotification({ type: "success", message: t('orders.orderCancelled') })
      setCancellingOrderId(null)
    },
    onError: (error) => {
      addNotification({ type: "error", message: error })
      setCancellingOrderId(null)
    }
  })

  const handleConfirmOrder = async (id: string) => {
    if (!confirm('¿Confirmar este pedido? Se descontará el stock de ingredientes.')) return

    setConfirmingOrderId(id)
    const result = await confirmOrder(id)

    if (!result.success) {
      // Si hay shortages, mostrar diálogo
      if (result.shortages && result.shortages.length > 0) {
        setStockShortages(result.shortages)
        setShowShortagesDialog(true)
      } else {
        addNotification({ type: "error", message: result.message || 'Error al confirmar' })
      }
      setConfirmingOrderId(null)
      return
    }

    addNotification({ type: "success", message: t('orders.orderConfirmed') })
    setConfirmingOrderId(null)
  }

  const handleCancelOrder = async (id: string) => {
    if (!confirm('¿Cancelar este pedido?')) return

    setCancellingOrderId(id)
    await cancelMutation.mutate(id)
  }

  const pending = orders.filter((o) => o.status === "PENDING")
  const confirmed = orders.filter((o) => o.status === "CONFIRMED")
  const inProduction = orders.filter((o) => o.status === "IN_PRODUCTION")
  const completed = orders.filter((o) => o.status === "COMPLETED")

  if (orders.length === 0) {
    return (
      <>
        <EmptyState
          icon={ClipboardList}
          title={t('orders.noOrders')}
          description={t('orders.noOrdersDescription')}
          action={{
            label: t('orders.create'),
            onClick: () => setShowCreateDialog(true),
          }}
        />
        <CreateOrderDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      </>
    )
  }

  const OrderList = ({ orders }: { orders: OrderWithItems[] }) => {
    if (orders.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay pedidos en esta categoría.
        </p>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onConfirm={handleConfirmOrder}
            onCancel={handleCancelOrder}
            isConfirming={confirmingOrderId === order.id}
            isCancelling={cancellingOrderId === order.id}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('orders.title')}
            </h1>
            <p className="text-muted-foreground">
              Gestiona los pedidos de tus clientes
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="btn-gradient-pink">
            <Plus className="h-4 w-4 mr-2" />
            {t('orders.createNew')}
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              {t('orders.pending')} ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              {t('orders.confirmed')} ({confirmed.length})
            </TabsTrigger>
            <TabsTrigger value="in_production">
              {t('orders.inProduction')} ({inProduction.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              {t('orders.completed')} ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <OrderList orders={pending} />
          </TabsContent>
          <TabsContent value="confirmed">
            <OrderList orders={confirmed} />
          </TabsContent>
          <TabsContent value="in_production">
            <OrderList orders={inProduction} />
          </TabsContent>
          <TabsContent value="completed">
            <OrderList orders={completed} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <StockShortagesDialog
        open={showShortagesDialog}
        onClose={() => setShowShortagesDialog(false)}
        shortages={stockShortages}
      />
    </>
  )
}
