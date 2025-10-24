"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ClipboardList, Check, X as XIcon, CreditCard, CheckCircle, Cog } from "lucide-react"
import { CreateOrderDialog } from "./CreateOrderDialog"
import { StockShortagesDialog } from "./StockShortagesDialog"
import { RegisterPaymentDialog } from "./RegisterPaymentDialog"
import { CompleteOrderDialog } from "./CompleteOrderDialog"
import { WhatsAppMessageDialog } from "./WhatsAppMessageDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { confirmOrder, cancelOrder, completeOrderWithSale, moveOrderToProduction } from "@/actions/orderActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useMutation } from "@/hooks/useMutation"
import { useTranslation } from "@/lib/i18n"
import type { OrderWithItems, StockShortage, PaymentStatus } from "@/lib/types"
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

const OrderCard = ({ order, onConfirm, onCancel, onComplete, onMoveToProduction, isConfirming, isCancelling, isMovingToProduction }: { 
  order: OrderWithItems
  onConfirm: (id: string, forceConfirm?: boolean) => void
  onCancel: (id: string) => void
  onComplete: (id: string, total: number) => void
  onMoveToProduction: (id: string) => void
  isConfirming: boolean
  isCancelling: boolean
  isMovingToProduction: boolean
}) => {
  const { t } = useTranslation()

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
          
          {/* Payment Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estado de pago:</span>
            {getPaymentStatusBadge(order.payment_status)}
          </div>
          
          {order.payment_status !== 'pagado' && (
            <div className="bg-gray-50 p-3 rounded-md space-y-1">
              <div className="flex justify-between text-xs">
                <span>Pagado:</span>
                <span className="text-green-600">{formatCurrency(order.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span>Pendiente:</span>
                <span className="text-red-600">{formatCurrency(order.amount_pending)}</span>
              </div>
            </div>
          )}
          
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
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex gap-2">
          {/* WhatsApp Button for PENDING orders */}
          {order.status === "PENDING" && (
            <WhatsAppMessageDialog order={order}>
              <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700 h-9 sm:h-8">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WSP
              </Button>
            </WhatsAppMessageDialog>
          )}
          
          {/* Payment Button for non-PENDING orders */}
          {order.status !== "PENDING" && order.payment_status !== 'pagado' && (
            <RegisterPaymentDialog
              orderId={order.id}
              orderTotal={order.total_price}
              currentPaid={order.amount_paid}
              currentPending={order.amount_pending}
            >
              <Button size="sm" variant="outline" className="btn-gradient-blue h-9 sm:h-8">
                <CreditCard className="h-4 w-4 mr-1" />
                Pagar
              </Button>
            </RegisterPaymentDialog>
          )}
        </div>
        
        <div className="flex gap-2">
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
          
          {order.status === "CONFIRMED" && (
            <Button
              size="sm"
              variant="default"
              className="btn-gradient-orange"
              onClick={() => onMoveToProduction(order.id)}
              disabled={isMovingToProduction}
            >
              {isMovingToProduction ? (
                <>Pasando...</>
              ) : (
                <>
                  <Cog className="h-4 w-4 mr-1" />
                  Pasar a Producción
                </>
              )}
            </Button>
          )}
          
          {order.status === "IN_PRODUCTION" && (
            <Button
              size="sm"
              variant="default"
              className="btn-gradient-blue"
              onClick={() => onComplete(order.id, order.total_price)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showShortagesDialog, setShowShortagesDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [stockShortages, setStockShortages] = useState<StockShortage[]>([])
  const [shortageOrderId, setShortageOrderId] = useState<string | null>(null)
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null)
  const [completingOrderTotal, setCompletingOrderTotal] = useState<number>(0)
  const [movingToProductionId, setMovingToProductionId] = useState<string | null>(null)
  
  
  const addNotification = useNotificationStore((state) => state.addNotification)
  const { t } = useTranslation()

  const handleConfirmOrder = async (id: string, forceConfirm: boolean = false) => {
    // Si no es confirmación forzada, mostrar confirmación
    if (!forceConfirm && !confirm('¿Confirmar este pedido? Se descontará el stock de ingredientes.')) {
      return
    }

    try {
      setConfirmingOrderId(id)
      const result = await confirmOrder(id, forceConfirm)

      if (!result.success) {
        // Si hay shortages y no estamos forzando la confirmación, mostrar diálogo
        if (result.shortages && result.shortages.length > 0 && !forceConfirm) {
          setStockShortages(result.shortages)
          setShortageOrderId(id) // Guardar el ID del pedido
          setShowShortagesDialog(true)
          return
        } else {
          addNotification({ type: "error", message: result.message || 'Error al confirmar' })
          return
        }
      }

      // Si se confirmó con faltantes, mostrar notificación especial
      if (result.has_shortages) {
        addNotification({ 
          type: "warning", 
          message: "Pedido confirmado, pero hay ingredientes faltantes. Actualiza el stock pronto." 
        })
      } else {
        addNotification({ type: "success", message: t('orders.orderConfirmed') })
      }
      
      // Recargar la página para actualizar la lista de pedidos
      window.location.reload()
    } catch (error) {
      addNotification({ 
        type: "error", 
        message: "Error al confirmar el pedido" 
      })
    } finally {
      setConfirmingOrderId(null)
      // No resetear showShortagesDialog aquí, se maneja en el diálogo
    }
  }

  const handleCancelOrder = async (id: string) => {
    if (!confirm('¿Cancelar este pedido?')) return

    setCancellingOrderId(id)
    const result = await cancelOrder(id)
    
    if (result.success) {
      addNotification({ type: "success", message: t('orders.orderCancelled') })
    } else {
      addNotification({ type: "error", message: result.message || 'Error al cancelar' })
    }
    
    setCancellingOrderId(null)
  }

  const handleCompleteOrder = (id: string, total: number) => {
    setCompletingOrderId(id)
    setCompletingOrderTotal(total)
    setShowCompleteDialog(true)
  }

  const handleCompleteOrderConfirm = async (paymentStatus: 'pagado' | 'pendiente') => {
    if (!completingOrderId) return

    try {
      const result = await completeOrderWithSale(completingOrderId, paymentStatus)
      
      if (result.success) {
        addNotification({ 
          type: "success", 
          message: `Pedido completado y venta creada. ${result.message}` 
        })
        // Recargar la página para actualizar la lista
        window.location.reload()
      } else {
        addNotification({ type: "error", message: result.message || 'Error al completar pedido' })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al completar el pedido" })
    } finally {
      setCompletingOrderId(null)
      setShowCompleteDialog(false)
    }
  }

  const handleMoveToProduction = async (id: string) => {
    if (!confirm('¿Pasar este pedido a producción? Esto significa que empezarás a elaborarlo.')) return

    try {
      setMovingToProductionId(id)
      const result = await moveOrderToProduction(id)
      
      if (result.success) {
        addNotification({ 
          type: "success", 
          message: result.message || "Pedido pasado a producción exitosamente" 
        })
      } else {
        addNotification({ 
          type: "error", 
          message: result.message || "Error al pasar el pedido a producción" 
        })
      }
    } catch (error: any) {
      addNotification({ 
        type: "error", 
        message: error.message || "Error al pasar el pedido a producción" 
      })
    } finally {
      setMovingToProductionId(null)
    }
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
      <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onConfirm={(id, forceConfirm) => handleConfirmOrder(id, forceConfirm)}
            onCancel={handleCancelOrder}
            onComplete={handleCompleteOrder}
            onMoveToProduction={handleMoveToProduction}
            isConfirming={confirmingOrderId === order.id}
            isCancelling={cancellingOrderId === order.id}
            isMovingToProduction={movingToProductionId === order.id}
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
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max h-auto p-1 bg-muted/50">
              <TabsTrigger 
                value="pending" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{t('orders.pending')}</span>
                <span className="sm:hidden">Pend.</span>
                <span className="ml-1 bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {pending.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="confirmed" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{t('orders.confirmed')}</span>
                <span className="sm:hidden">Conf.</span>
                <span className="ml-1 bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {confirmed.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="in_production" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{t('orders.inProduction')}</span>
                <span className="sm:hidden">Prod.</span>
                <span className="ml-1 bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {inProduction.length}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">{t('orders.completed')}</span>
                <span className="sm:hidden">Comp.</span>
                <span className="ml-1 bg-muted-foreground/20 px-1.5 py-0.5 rounded-full text-xs">
                  {completed.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

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
        onClose={() => {
          setShowShortagesDialog(false)
          setShortageOrderId(null) // Limpiar el estado
        }}
        onConfirmAnyway={() => {
          console.log('🔧 onConfirmAnyway called, shortageOrderId:', shortageOrderId)
          // Cerrar el diálogo primero
          setShowShortagesDialog(false)
          // Llamar a handleConfirmOrder con forceConfirm=true usando el ID guardado
          if (shortageOrderId) {
            console.log('🚀 Calling handleConfirmOrder with forceConfirm=true')
            handleConfirmOrder(shortageOrderId, true)
            setShortageOrderId(null) // Limpiar el estado
          } else {
            console.log('❌ No shortageOrderId available')
          }
        }}
        shortages={stockShortages}
      />

      <CompleteOrderDialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onComplete={handleCompleteOrderConfirm}
        orderId={completingOrderId || ""}
        orderTotal={completingOrderTotal}
      />
    </>
  )
}