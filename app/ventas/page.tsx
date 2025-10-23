import { getTodaysSales, getDailySalesStats } from "@/actions/saleActions"
import { getTodaysEventsWithProducts } from "@/actions/eventActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, ShoppingCart, Users, DollarSign } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { CreateSaleDialog } from "./CreateSaleDialog"
import { SalesClient } from "./SalesClient"

export default async function VentasPage() {
  const [salesResult, statsResult, eventsResult] = await Promise.all([
    getTodaysSales(),
    getDailySalesStats(new Date().toISOString().split('T')[0]),
    getTodaysEventsWithProducts()
  ])

  const sales = salesResult.success ? salesResult.data || [] : []
  const stats = statsResult.success ? statsResult.data : null
  const todaysEvents = eventsResult.success ? eventsResult.data || [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">
            Gestión de ventas diarias - {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>
        <CreateSaleDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </CreateSaleDialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.total_sales?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_sales_count || 0} ventas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_items_sold || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              unidades vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.average_ticket?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              por venta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_customers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's events */}
      {todaysEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Efemérides de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todaysEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{event.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.event_products?.length || 0} productos especiales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600">
                      Productos destacados disponibles
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales list */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesClient initialSales={sales} />
        </CardContent>
      </Card>
    </div>
  )
}


