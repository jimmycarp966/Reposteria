"use client"

import { useState, useMemo } from "react"
import { Ingredient } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Package, ShoppingCart, History, BarChart3, ShoppingBag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { CreateIngredientDialog } from "./CreateIngredientDialog"
import { EditIngredientDialog } from "./EditIngredientDialog"
import { UpdateStockDialog } from "./UpdateStockDialog"
import { RegisterPurchaseDialog } from "./RegisterPurchaseDialog"
import { PurchaseHistoryDialog } from "./PurchaseHistoryDialog"
import { PriceHistoryDialog } from "@/components/shared/PriceHistoryDialog"
import { deleteIngredient } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { SearchFilter } from "@/components/shared/SearchFilter"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { IngredientActionSheet } from "./IngredientActionSheet"
import type { IngredientWithInventory, Column } from "@/lib/types"

interface IngredientsTableProps {
  ingredients: IngredientWithInventory[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
}

export function IngredientsTable({
  ingredients,
  pagination,
  isLoading = false
}: IngredientsTableProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientWithInventory | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showPriceHistoryDialog, setShowPriceHistoryDialog] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este ingrediente?")) return

    const result = await deleteIngredient(id)
    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Sin stock</Badge>
    } else if (quantity < 10) {
      return <Badge className="bg-yellow-600">Bajo</Badge>
    } else {
      return <Badge variant="secondary">OK</Badge>
    }
  }

  const columns: Column<IngredientWithInventory>[] = [
    {
      key: 'name',
      header: 'Nombre',
      cell: (ingredient) => <span className="font-medium">{ingredient.name}</span>,
      sortable: true
    },
    {
      key: 'unit',
      header: 'Unidad',
      cell: (ingredient) => ingredient.unit
    },
    {
      key: 'cost_per_unit',
      header: 'Costo Unitario',
      cell: (ingredient) => formatCurrency(ingredient.cost_per_unit)
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (ingredient) => (
        ingredient.inventory ? (
          <>
            {ingredient.inventory.quantity} {ingredient.inventory.unit}
          </>
        ) : (
          "0"
        )
      )
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (ingredient) => (
        ingredient.inventory && getStockBadge(ingredient.inventory.quantity)
      )
    },
    {
      key: 'location',
      header: 'Ubicación',
      cell: (ingredient) => ingredient.inventory?.location || "-"
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cell: (ingredient) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedIngredient(ingredient)
              setShowEditDialog(true)
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedIngredient(ingredient)
              setShowStockDialog(true)
            }}
          >
            <Package className="h-4 w-4 mr-1" />
            Stock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedIngredient(ingredient)
              setShowPurchaseDialog(true)
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Compra
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedIngredient(ingredient)
              setShowHistoryDialog(true)
            }}
          >
            <History className="h-4 w-4 mr-1" />
            Compras
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedIngredient(ingredient)
              setShowPriceHistoryDialog(true)
            }}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Precios
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(ingredient.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const renderMobileCard = (ingredient: IngredientWithInventory) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{ingredient.name}</CardTitle>
        <CardDescription>
          {formatCurrency(ingredient.cost_per_unit)} / {ingredient.unit}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Stock:</span>
            <span>
              {ingredient.inventory ? `${ingredient.inventory.quantity} ${ingredient.inventory.unit}` : "0"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Ubicación:</span>
            <span>{ingredient.inventory?.location || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600">Estado:</span>
            <span>
              {ingredient.inventory && getStockBadge(ingredient.inventory.quantity)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <IngredientActionSheet
          ingredient={ingredient}
          onEditClick={() => {
            setSelectedIngredient(ingredient)
            setShowEditDialog(true)
          }}
          onStockClick={() => {
            setSelectedIngredient(ingredient)
            setShowStockDialog(true)
          }}
          onPurchaseClick={() => {
            setSelectedIngredient(ingredient)
            setShowPurchaseDialog(true)
          }}
          onHistoryClick={() => {
            setSelectedIngredient(ingredient)
            setShowHistoryDialog(true)
          }}
          onPriceHistoryClick={() => {
            setSelectedIngredient(ingredient)
            setShowPriceHistoryDialog(true)
          }}
          onDeleteClick={() => handleDelete(ingredient.id)}
        />
      </CardFooter>
    </Card>
  )

  return (
    <>
      <DataTable
        data={ingredients}
        columns={columns}
        mobileCardRender={renderMobileCard}
        pagination={pagination}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={ShoppingBag}
            title="No se encontraron ingredientes"
            description="No hay ingredientes que coincidan con los criterios de búsqueda"
          />
        }
      />

      <CreateIngredientDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {selectedIngredient && (
        <>
          <EditIngredientDialog
            open={showEditDialog}
            onClose={() => {
              setShowEditDialog(false)
              setSelectedIngredient(null)
            }}
            ingredient={selectedIngredient}
          />
          <UpdateStockDialog
            open={showStockDialog}
            onClose={() => {
              setShowStockDialog(false)
              setSelectedIngredient(null)
            }}
            ingredient={selectedIngredient}
          />
          <RegisterPurchaseDialog
            ingredient={selectedIngredient}
            open={showPurchaseDialog}
            onClose={() => {
              setShowPurchaseDialog(false)
              setSelectedIngredient(null)
            }}
          />
          <PurchaseHistoryDialog
            ingredient={selectedIngredient}
            open={showHistoryDialog}
            onClose={() => {
              setShowHistoryDialog(false)
              setSelectedIngredient(null)
            }}
          />
          <PriceHistoryDialog
            open={showPriceHistoryDialog}
            onOpenChange={setShowPriceHistoryDialog}
            type="ingredient"
            itemId={selectedIngredient.id}
            itemName={selectedIngredient.name}
          />
        </>
      )}
    </>
  )
}



