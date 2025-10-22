"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, RefreshCw } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateProductDialog } from "./CreateProductDialog"
import { EditPriceDialog } from "./EditPriceDialog"
import { refreshAllProductCosts } from "@/actions/productActions"
import { useNotificationStore } from "@/store/notificationStore"

interface ProductsClientProps {
  products: any[]
  recipes: any[]
}

export function ProductsClient({ products, recipes }: ProductsClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleRefreshAll = async () => {
    if (!confirm("¿Recalcular costos de todos los productos? Esto puede tardar un momento.")) return

    setRefreshing(true)
    const result = await refreshAllProductCosts()
    setRefreshing(false)

    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Productos</h1>
            <p className="text-muted-foreground">
              Gestiona tus productos y precios de venta
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Recalcular Costos
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No hay productos"
                description="Crea productos desde tus recetas o manualmente"
                action={{
                  label: "Crear Producto",
                  onClick: () => setShowCreateDialog(true),
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Costo Base</TableHead>
                    <TableHead>Precio Sugerido</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Receta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => {
                    const margin = product.base_cost_cache > 0
                      ? ((product.suggested_price_cache - product.base_cost_cache) / product.base_cost_cache) * 100
                      : 0

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || "-"}</TableCell>
                        <TableCell>{formatCurrency(product.base_cost_cache)}</TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(product.suggested_price_cache)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={margin > 50 ? "default" : "secondary"}>
                            {margin.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.recipe ? product.recipe.name : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProduct(product)}
                          >
                            Editar Precio
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateProductDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        recipes={recipes}
      />

      {selectedProduct && (
        <EditPriceDialog
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </>
  )
}

