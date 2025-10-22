"use client"

import { useState } from "react"
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
import { Edit, Trash2, Plus, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { CreateIngredientDialog } from "./CreateIngredientDialog"
import { UpdateStockDialog } from "./UpdateStockDialog"
import { deleteIngredient, updateIngredientCost } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { Input } from "@/components/ui/input"

interface IngredientsTableProps {
  ingredients: any[]
}

export function IngredientsTable({ ingredients }: IngredientsTableProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [newCost, setNewCost] = useState("")
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

  const handleUpdateCost = async (id: string) => {
    const cost = parseFloat(newCost)
    if (isNaN(cost) || cost < 0) {
      addNotification({ type: "error", message: "Ingresa un costo válido" })
      return
    }

    const result = await updateIngredientCost(id, cost)
    if (result.success) {
      addNotification({ type: "success", message: result.message! })
      setEditingCostId(null)
      setNewCost("")
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

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ingrediente
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Costo Unitario</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <TableRow key={ingredient.id}>
              <TableCell className="font-medium">{ingredient.name}</TableCell>
              <TableCell>{ingredient.unit}</TableCell>
              <TableCell>
                {editingCostId === ingredient.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-24"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateCost(ingredient.id)}
                    >
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCostId(null)
                        setNewCost("")
                      }}
                    >
                      X
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCostId(ingredient.id)
                      setNewCost(ingredient.cost_per_unit.toString())
                    }}
                    className="hover:underline"
                  >
                    {formatCurrency(ingredient.cost_per_unit)}
                  </button>
                )}
              </TableCell>
              <TableCell>
                {ingredient.inventory ? (
                  <>
                    {ingredient.inventory.quantity} {ingredient.inventory.unit}
                  </>
                ) : (
                  "0"
                )}
              </TableCell>
              <TableCell>
                {ingredient.inventory && getStockBadge(ingredient.inventory.quantity)}
              </TableCell>
              <TableCell>
                {ingredient.inventory?.location || "-"}
              </TableCell>
              <TableCell className="text-right space-x-2">
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
                  variant="ghost"
                  onClick={() => handleDelete(ingredient.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateIngredientDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {selectedIngredient && (
        <UpdateStockDialog
          open={showStockDialog}
          onClose={() => {
            setShowStockDialog(false)
            setSelectedIngredient(null)
          }}
          ingredient={selectedIngredient}
        />
      )}
    </>
  )
}



