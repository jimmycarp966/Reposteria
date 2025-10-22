import { getOrders } from "@/actions/orderActions"
import { getEvents } from "@/actions/settingsActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CreateEventDialog } from "./CreateEventDialog"

export default async function CalendarioPage() {
  const [ordersResult, eventsResult] = await Promise.all([
    getOrders(),
    getEvents(),
  ])

  const orders = ordersResult.success && ordersResult.data ? ordersResult.data : []
  const events = eventsResult.success && eventsResult.data ? eventsResult.data : []

  // Group orders by date
  const ordersByDate: Record<string, any[]> = {}
  orders?.forEach((order: any) => {
    const date = order.delivery_date
    if (!ordersByDate[date]) {
      ordersByDate[date] = []
    }
    ordersByDate[date].push(order)
  })

  // Get all unique dates and sort them
  const allDates = [
    ...Object.keys(ordersByDate),
    ...(events?.map((e: any) => e.date) || []),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">
            Vista de pedidos y eventos programados
          </p>
        </div>
        <CreateEventDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Evento
          </Button>
        </CreateEventDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allDates.slice(0, 10).map((date) => {
                const dayOrders = ordersByDate[date] || []
                const dayEvents = events?.filter((e: any) => e.date === date) || []

                return (
                  <div key={date} className="border-l-2 border-primary pl-4">
                    <p className="font-semibold">{formatDate(date)}</p>
                    
                    {dayOrders.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {dayOrders.map((order: any) => (
                          <div key={order.id} className="text-sm">
                            <Badge variant="outline" className="mr-2">
                              {order.type}
                            </Badge>
                            <span className="text-muted-foreground">
                              {order.order_items?.length || 0} producto(s)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {dayEvents.map((event: any) => (
                          <div key={event.id} className="text-sm">
                            <Badge className="mr-2">
                              {event.type}
                            </Badge>
                            <span>{event.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayOrders.length === 0 && dayEvents.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Sin eventos
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Efemérides */}
        <Card>
          <CardHeader>
            <CardTitle>Efemérides y Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!events || events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay efemérides registradas
                </p>
              ) : (
                events?.map((event: any) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{event.name}</p>
                      <Badge>{event.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.date)}
                    </p>
                    {event.description && (
                      <p className="text-sm mt-2">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



