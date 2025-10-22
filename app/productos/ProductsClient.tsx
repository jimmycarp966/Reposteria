"use client"

import { useState } from "react"
import { Product, Recipe } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CreateProductDialog } from "./CreateProductDialog"
import { EditPriceDialog } from "./EditPriceDialog"
import { deleteProduct } from "@/actions/productActions"
import { useNotificationStore } from "@/store/notificationStore"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, Edit, Package } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"

interface ProductsClientProps {
  products: any[]
  recipes: Recipe[]
}

export function ProductsClient({ products, recipes }: ProductsClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditPriceDialog, setShowEditPriceDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return

    const result = await deleteProduct(id)
    if (result.success) {
      addNotification({ type: "success", message: "Producto eliminado" })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No hay productos"
        description="Crea productos desde tus recetas o manualmente"
        action={{
          label: "Crear Producto",
          onClick: () => setShowCreateDialog(true),
        }}
      />
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Receta Base</TableHead>
              <TableHead>Costo Base</TableHead>
              <TableHead>Precio Sugerido</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.recipe?.name || "N/A"}</TableCell>
                <TableCell>{formatCurrency(product.base_cost_cache)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowEditPriceDialog(true)
                    }}
                    className="hover:underline"
                  >
                    {formatCurrency(product.suggested_price_cache)}
                  </button>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.recipe?.name || "Sin receta base"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Costo Base:</span>
                  <span>{formatCurrency(product.base_cost_cache)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Precio Sugerido:</span>
                  <span>{formatCurrency(product.suggested_price_cache)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
            <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedProduct(product)
                  setShowEditPriceDialog(true)
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Precio
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <CreateProductDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        recipes={recipes}
      />

      {selectedProduct && (
        <EditPriceDialog
          open={showEditPriceDialog}
          onClose={() => {
            setShowEditPriceDialog(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
        />
      )}
    </>
  )
}

