"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Calendar, BarChart3, Plus } from "lucide-react"
import { formatDate, getTodayGMT3, parseDateGMT3 } from "@/lib/utils"
import { EventProductsDialog } from "./EventProductsDialog"
import { getEventSalesStats, getEventsWithProducts } from "@/actions/eventActions"
import { getSalesByDateRange } from "@/actions/saleActions"
import type { EventWithProducts, OrderWithItems, EventSalesStats, SaleWithItems } from "@/lib/types"
import { useEffect, useState } from "react"

interface DayDetailDialogProps {
  date: string
  events: EventWithProducts[]
  orders: OrderWithItems[]
  children: React.ReactNode
}

export function DayDetailDialog({ date, events, orders, children }: DayDetailDialogProps) {
  const [eventStats, setEventStats] = useState<EventSalesStats[]>([])
  const [daySales, setDaySales] = useState<SaleWithItems[]>([])
  const [loading, setLoading] = useState(false)
  const [currentEvents, setCurrentEvents] = useState<EventWithProducts[]>(events)

  const isToday = date === getTodayGMT3()
  const isPastDate = parseDateGMT3(date) < parseDateGMT3(getTodayGMT3())

  // Update events when prop changes
  useEffect(() => {
    setCurrentEvents(events)
  }, [events])

  const handleEventUpdate = async () => {
    // Reload events for this date
    const result = await getEventsWithProducts()
    if (result.success && result.data) {
      const dateEvents = result.data.filter(e => e.date === date)
      setCurrentEvents(dateEvents)
    }
  }

  useEffect(() => {
      const fetchData = async () => {
      if (currentEvents.length === 0 && !isPastDate) return

      setLoading(true)
      try {
        // Get sales stats for events
        if (currentEvents.length > 0) {
          const statsPromises = currentEvents.map(event => getEventSalesStats(event.id))
          const statsResults = await Promise.all(statsPromises)
          const validStats = statsResults
            .filter(result => result.success && result.data)
            .map(result => result.data!)
          setEventStats(validStats)
        }

        // Get sales for this date
        if (isPastDate) {
          const salesResult = await getSalesByDateRange(date, date)
          if (salesResult.success) {
            setDaySales(salesResult.data || [])
          }
        }
      } catch (error) {
        console.error("Error fetching day data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [date, currentEvents, isPastDate])

  const totalDaySales = daySales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalDayItems = daySales.reduce((sum, sale) => 
    sum + (sale.sale_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl flex-wrap">
            <Calendar className="h-5 w-5 shrink-0" />
            <span className="truncate">{formatDate(date)}</span>
            {isToday && <Badge variant="default" className="shrink-0">Hoy</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Events */}
          {currentEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  🎉 Efemérides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base sm:text-lg">{event.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description || "Sin descripción"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.event_products?.length || 0} productos especiales
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <EventProductsDialog event={event} onUpdate={handleEventUpdate}>
                          <Button variant="outline" size="sm" className="h-10 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none">
                            <Package className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Gestionar Productos</span>
                            <span className="sm:hidden">Productos</span>
                          </Button>
                        </EventProductsDialog>
                      </div>
                    </div>

                    {/* Event products preview */}
                    {event.event_products && event.event_products.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {event.event_products.slice(0, 3).map(eventProduct => (
                          <div key={eventProduct.id} className="flex items-center gap-2 p-2 bg-emerald-50 rounded">
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                              📦
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {eventProduct.product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${eventProduct.special_price?.toFixed(2) || eventProduct.product.suggested_price_cache?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        ))}
                        {event.event_products.length > 3 && (
                          <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                            +{event.event_products.length - 3} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Orders */}
          {orders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📦 Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Pedido {order.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} producto(s)
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${order.total_price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sales Statistics (only for past dates) */}
          {isPastDate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estadísticas de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Cargando estadísticas...</p>
                  </div>
                ) : daySales.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        ${totalDaySales.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Ventas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {daySales.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Ventas Realizadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {totalDayItems}
                      </p>
                      <p className="text-sm text-muted-foreground">Productos Vendidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        ${(totalDaySales / daySales.length || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No hay ventas registradas para esta fecha</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Statistics */}
          {eventStats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  📊 Estadísticas de Efemérides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventStats.map((stats, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">
                        ${stats.total_sales.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ventas Totales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {stats.total_items_sold}
                      </p>
                      <p className="text-xs text-muted-foreground">Productos Vendidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {stats.total_customers}
                      </p>
                      <p className="text-xs text-muted-foreground">Clientes Atendidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">
                        ${stats.average_ticket.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ticket Promedio</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {currentEvents.length === 0 && orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin eventos programados</h3>
                <p className="text-muted-foreground">
                  Este día no tiene efemérides ni pedidos programados
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
