"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportSalesReportCSV } from "@/actions/reportActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useState } from "react"

interface ReportsClientProps {
  monthlyStats: any
  salesReport: any
}

export function ReportsClient({ monthlyStats, salesReport }: ReportsClientProps) {
  const [exporting, setExporting] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

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
      </Tabs>
    </div>
  )
}

