import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMonthlyStats } from "@/actions/reportActions"
import { getUpcomingOrders } from "@/actions/orderActions"
import { getLowStockIngredients } from "@/actions/inventoryActions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getCachedData, CACHE_KEYS } from "@/lib/cache"
import { DollarSign, TrendingUp, Package, AlertTriangle, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  // Usar caché para mejorar rendimiento
  const [monthlyStatsResult, upcomingOrdersResult, lowStockResult] = await Promise.all([
    getCachedData(
      CACHE_KEYS.MONTHLY_STATS,
      () => getMonthlyStats(),
      2 * 60 * 1000 // 2 minutos de caché
    ),
    getCachedData(
      CACHE_KEYS.UPCOMING_ORDERS,
      () => getUpcomingOrders(7),
      1 * 60 * 1000 // 1 minuto de caché
    ),
    getCachedData(
      CACHE_KEYS.LOW_STOCK,
      () => getLowStockIngredients(10),
      1 * 60 * 1000 // 1 minuto de caché
    ),
  ])

  const monthlyStats = monthlyStatsResult.success && monthlyStatsResult.data ? monthlyStatsResult.data : null
  const upcomingOrders = upcomingOrdersResult.success && upcomingOrdersResult.data ? upcomingOrdersResult.data : []
  const lowStock = lowStockResult.success && lowStockResult.data ? lowStockResult.data : []

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-slide-up">
      {/* Header con diseño mejorado */}
      <div className="text-center lg:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 shadow-lg">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard Cam Bake
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              Tu negocio Cam Bake al alcance de tus manos 🍰
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Modernas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Ventas del Mes */}
        <Card className="card-modern border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                +12%
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">
              {monthlyStats ? formatCurrency(monthlyStats.totalRevenue) : "-"}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {monthlyStats ? `${monthlyStats.orderCount} pedidos` : "Sin datos"}
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-green-200 to-green-300 rounded-full"></div>
          </CardContent>
        </Card>

        {/* Margen Promedio */}
        <Card className="card-modern border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                Margen
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">
              {monthlyStats ? `${monthlyStats.profitMargin.toFixed(1)}%` : "-"}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {monthlyStats ? `💰 ${formatCurrency(monthlyStats.profit)}` : "Sin datos"}
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-blue-200 to-cyan-300 rounded-full"></div>
          </CardContent>
        </Card>

        {/* Próximos Pedidos */}
        <Card className="card-modern border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 group-hover:scale-110 transition-transform duration-200">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                Próximos
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">
              {upcomingOrders.length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              📅 Próximos 7 días
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-purple-200 to-pink-300 rounded-full"></div>
          </CardContent>
        </Card>

        {/* Stock Bajo */}
        <Card className="card-modern border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 group-hover:scale-110 transition-transform duration-200">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-orange-600 bg-orange-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {lowStock.length > 0 ? "Atención" : "Perfecto"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-orange-700 mb-1">
              {lowStock.length}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              🛒 Ingredientes bajos
            </p>
            <div className="mt-2 h-1 bg-gradient-to-r from-orange-200 to-red-300 rounded-full"></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Próximos Pedidos */}
        <Card className="card-modern border-0 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Próximos Pedidos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-muted-foreground font-medium">
                  No hay pedidos próximos
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ¡Todo tranquilo por ahora! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {upcomingOrders.slice(0, 5).map((order: any, index: number) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 hover-lift animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                        {order.order_items.length}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {formatDate(order.delivery_date)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Badge
                        variant={
                          order.status === "CONFIRMED" ? "default" :
                          order.status === "IN_PRODUCTION" ? "secondary" :
                          "outline"
                        }
                        className="font-medium text-xs"
                      >
                        {order.status === "CONFIRMED" ? "✅ Confirmado" :
                         order.status === "IN_PRODUCTION" ? "🏭 Produciendo" :
                         "⏳ Pendiente"}
                      </Badge>
                      <Link
                        href={`/pedidos`}
                        className="btn-gradient-strawberry text-xs px-2 sm:px-3 py-1 rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Bajo */}
        <Card className="card-modern border-0 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-orange-100 to-red-100">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Ingredientes con Stock Bajo
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-green-600 mb-1">
                  ¡Perfecto! Todos los ingredientes tienen stock suficiente
                </p>
                <p className="text-sm text-muted-foreground">
                  Mantén ese inventario saludable 🛒✨
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {lowStock.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all duration-200 hover-lift animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                        ⚠️
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {item.ingredient.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.quantity} {item.ingredient.unit} restante
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/ingredientes"
                      className="btn-gradient-chocolate text-xs px-2 sm:px-3 py-1 rounded-lg hover:shadow-md transition-all duration-200 w-fit"
                    >
                      Reabastecer
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



