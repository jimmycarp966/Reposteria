import { getOrders } from "@/actions/orderActions"
import { getEvents } from "@/actions/settingsActions"
import { getEventsWithProducts } from "@/actions/eventActions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateEventDialog } from "./CreateEventDialog"
import { CalendarGrid } from "./CalendarGrid"

export default async function CalendarioPage() {
  const [ordersResult, eventsResult, eventsWithProductsResult] = await Promise.all([
    getOrders(),
    getEvents(),
    getEventsWithProducts(),
  ])

  const orders = ordersResult.success && ordersResult.data ? ordersResult.data : []
  const events = eventsResult.success && eventsResult.data ? eventsResult.data : []
  const eventsWithProducts = eventsWithProductsResult.success && eventsWithProductsResult.data ? eventsWithProductsResult.data : []

  // Group orders by date
  const ordersByDate: Record<string, typeof orders> = {}
  orders?.forEach((order) => {
    const date = order.delivery_date
    if (!ordersByDate[date]) {
      ordersByDate[date] = []
    }
    ordersByDate[date].push(order)
  })

  // Get all unique dates and sort them
  const allDates = [
    ...Object.keys(ordersByDate),
    ...(events?.map((e) => e.date) || []),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendario</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Vista mensual de pedidos y efemérides con gestión de productos
          </p>
        </div>
        <CreateEventDialog>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Evento
          </Button>
        </CreateEventDialog>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <CalendarGrid 
            events={eventsWithProducts} 
            orders={orders} 
          />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-lg sm:text-xl shrink-0">
                🎉
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Efemérides</p>
                <p className="text-lg sm:text-xl font-bold">{events.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg sm:text-xl shrink-0">
                📦
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pedidos</p>
                <p className="text-lg sm:text-xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg sm:text-xl shrink-0">
                📅
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Días con Eventos</p>
                <p className="text-lg sm:text-xl font-bold">{allDates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



