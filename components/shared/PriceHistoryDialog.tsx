'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { 
  getProductPriceHistory, 
  getIngredientPriceHistory,
  getProductPriceStats,
  getIngredientPriceStats,
  type PriceHistoryEntry 
} from '@/actions/priceHistoryActions'

interface PriceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'product' | 'ingredient'
  itemId: string
  itemName: string
}

interface PriceStats {
  total_changes: number
  first_price: number | null
  current_price: number | null
  highest_price: number | null
  lowest_price: number | null
  average_price: number | null
  total_increase: number
  total_decrease: number
}

export function PriceHistoryDialog({ 
  open, 
  onOpenChange, 
  type, 
  itemId, 
  itemName 
}: PriceHistoryDialogProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [stats, setStats] = useState<PriceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('chart')

  const loadData = async () => {
    if (!itemId) return

    setLoading(true)
    setError(null)

    try {
      const [historyResult, statsResult] = await Promise.all([
        type === 'product' 
          ? getProductPriceHistory(itemId)
          : getIngredientPriceHistory(itemId),
        type === 'product'
          ? getProductPriceStats(itemId)
          : getIngredientPriceStats(itemId)
      ])

      if (!historyResult.success) {
        setError(historyResult.error || 'Error al cargar historial')
        return
      }

      if (!statsResult.success) {
        setError(statsResult.error || 'Error al cargar estadísticas')
        return
      }

      setHistory(historyResult.data || [])
      setStats(statsResult.data || null)
    } catch (err) {
      setError('Error inesperado al cargar datos')
      console.error('Error loading price history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && itemId) {
      loadData()
    }
  }, [open, itemId, type])

  // Preparar datos para el gráfico (ordenados cronológicamente)
  const chartData = history
    .slice()
    .reverse()
    .map((entry, index) => ({
      date: new Date(entry.changed_at).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: new Date(entry.changed_at).toLocaleDateString('es-ES'),
      price: entry.new_price,
      change: entry.price_change,
      changePercentage: entry.price_change_percentage,
      index: index + 1
    }))

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeBadgeVariant = (change: number) => {
    if (change > 0) return 'default' as const
    if (change < 0) return 'destructive' as const
    return 'secondary' as const
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Historial de Precios - {itemName}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando historial...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              className="ml-auto"
            >
              Reintentar
            </Button>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Estadísticas Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Precio Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.current_price || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Precio Más Alto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.highest_price || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Precio Más Bajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.lowest_price || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Cambios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.total_changes}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs para diferentes vistas */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4" />
                  Gráfico
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tabla
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estadísticas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución del Precio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Precio']}
                            labelFormatter={(label, payload) => {
                              const data = payload?.[0]?.payload
                              return data ? data.fullDate : label
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="table" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial Detallado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Precio Anterior</TableHead>
                            <TableHead>Precio Nuevo</TableHead>
                            <TableHead>Cambio</TableHead>
                            <TableHead>% Cambio</TableHead>
                            <TableHead>Razón</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {formatDate(entry.changed_at)}
                              </TableCell>
                              <TableCell>
                                {entry.old_price ? formatCurrency(entry.old_price) : '-'}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(entry.new_price)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getChangeIcon(entry.price_change)}
                                  <span className={getChangeColor(entry.price_change)}>
                                    {entry.price_change > 0 ? '+' : ''}{formatCurrency(entry.price_change)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getChangeBadgeVariant(entry.price_change_percentage)}>
                                  {entry.price_change_percentage > 0 ? '+' : ''}{entry.price_change_percentage}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {entry.change_reason || 'Cambio automático'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Aumentos Totales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(stats.total_increase)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Suma de todos los aumentos de precio
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        Reducciones Totales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {formatCurrency(stats.total_decrease)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Suma de todas las reducciones de precio
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Precio Promedio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatCurrency(stats.average_price || 0)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Promedio de todos los precios registrados
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        Precio Inicial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatCurrency(stats.first_price || 0)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Primer precio registrado en el sistema
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!loading && !error && (!stats || history.length === 0) && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin historial de precios
            </h3>
            <p className="text-gray-600">
              Este {type === 'product' ? 'producto' : 'ingrediente'} aún no tiene cambios de precio registrados.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
