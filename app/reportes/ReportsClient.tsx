"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, CreditCard, AlertTriangle } from "lucide-react"
import { exportSalesReportCSV } from "@/actions/reportActions"
import { getAccountsReceivable } from "@/actions/paymentActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useState, useEffect } from "react"
import type { AccountsReceivable } from "@/lib/types"

interface ReportsClientProps {
  monthlyStats: any
  salesReport: any
}

export function ReportsClient({ monthlyStats, salesReport }: ReportsClientProps) {
  const [exporting, setExporting] = useState(false)
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([])
  const [accountsTotals, setAccountsTotals] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
    pendingCount: 0,
    partialCount: 0
  })
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Load accounts receivable data
  useEffect(() => {
    const loadAccountsReceivable = async () => {
      setLoadingAccounts(true)
      try {
        const result = await getAccountsReceivable()
        if (result.success && result.data) {
          setAccountsReceivable(result.data.accounts)
          setAccountsTotals(result.data.totals)
        }
      } catch (error) {
        addNotification({ type: "error", message: "Error al cargar cuentas por cobrar" })
      } finally {
        setLoadingAccounts(false)
      }
    }

    loadAccountsReceivable()
  }, [addNotification])

  const getPaymentStatusBadge = (status: string) => {
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

  const handleExportCSV = async () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

    setExporting(true)
    const result = await exportSalesReportCSV(firstDay, lastDay)
    setExporting(false)

    if (result.success) {
      // Download CSV
      const blob = new Blob([result.data!], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-ventas-${firstDay}-${lastDay}.csv`
      a.click()
      addNotification({ type: "success", message: "Reporte exportado exitosamente" })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  // Prepare chart data
  const topProductsData = salesReport?.topProducts?.map((p: any) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    revenue: p.revenue,
    quantity: p.quantity,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu negocio
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="margenes">Márgenes</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="cuentas">Cuentas por Cobrar</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ingresos del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {monthlyStats ? formatCurrency(monthlyStats.totalRevenue) : "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {monthlyStats ? `${monthlyStats.orderCount} pedidos` : "Sin datos"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Costos del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {monthlyStats ? formatCurrency(monthlyStats.totalCost) : "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Materia prima
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ganancia del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {monthlyStats ? formatCurrency(monthlyStats.profit) : "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {monthlyStats ? `Margen: ${monthlyStats.profitMargin.toFixed(1)}%` : "Sin datos"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Productos del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              {topProductsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No hay datos de ventas para este mes
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {salesReport?.topProducts && salesReport.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {salesReport.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} unidades vendidas
                        </p>
                      </div>
                      <p className="font-bold text-lg">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos de ventas para este mes
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margenes">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Márgenes</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Margen Bruto</p>
                      <p className="text-2xl font-bold">{monthlyStats.profitMargin.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Ganancia Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(monthlyStats.profit)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Análisis detallado por producto próximamente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produccion">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Producción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tiempos de producción y eficiencia próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuentas" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Total Pendiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(accountsTotals.totalPending)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accountsTotals.pendingCount + accountsTotals.partialCount} cuentas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-yellow-500" />
                  Pagos Parciales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {accountsTotals.partialCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cuentas con pago parcial
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Completamente Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {accountsTotals.pendingCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sin pago realizado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  Total Cobrado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountsTotals.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  De {formatCurrency(accountsTotals.totalAmount)} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Cuentas por Cobrar</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Cargando cuentas por cobrar...</p>
                </div>
              ) : accountsReceivable.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-medium mb-2">¡Excelente!</h3>
                  <p className="text-sm text-muted-foreground">
                    No tienes cuentas por cobrar pendientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accountsReceivable.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {account.type === 'pedido' ? 'Pedido' : 'Venta'}
                            </Badge>
                            {getPaymentStatusBadge(account.payment_status)}
                          </div>
                          <p className="font-medium text-sm">{account.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {formatDate(account.due_date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(account.total_amount)}</p>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-green-600">Pagado: {formatCurrency(account.amount_paid)}</span>
                              <span className="text-red-600">Pendiente: {formatCurrency(account.amount_pending)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

