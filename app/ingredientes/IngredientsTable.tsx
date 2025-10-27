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
import { Edit, Trash2, Plus, Package, ShoppingCart, History } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { CreateIngredientDialog } from "./CreateIngredientDialog"
import { UpdateStockDialog } from "./UpdateStockDialog"
import { RegisterPurchaseDialog } from "./RegisterPurchaseDialog"
import { PurchaseHistoryDialog } from "./PurchaseHistoryDialog"
import { deleteIngredient, updateIngredientCost } from "@/actions/ingredientActions"
import { useNotificationStore } from "@/store/notificationStore"
import { useSearchFilter } from "@/hooks/useSearchFilter"
import { SearchFilter } from "@/components/shared/SearchFilter"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface IngredientsTableProps {
  ingredients: any[]
}

export function IngredientsTable({ ingredients }: IngredientsTableProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [newCost, setNewCost] = useState("")
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Hook de búsqueda
  const { search, debouncedSearch, setSearch, clearSearch, isSearching } = useSearchFilter()

  // Filtrar ingredientes según búsqueda
  const filteredIngredients = useMemo(() => {
    if (!debouncedSearch) return ingredients

    const searchLower = debouncedSearch.toLowerCase().trim()
    return ingredients.filter(ingredient => 
      ingredient.name?.toLowerCase().includes(searchLower) ||
      ingredient.supplier?.toLowerCase().includes(searchLower)
    )
  }, [ingredients, debouncedSearch])

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
      {/* Buscador */}
      <div className="mb-4 space-y-4">
        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          placeholder="Buscar por nombre o proveedor..."
          isSearching={isSearching}
          showFilterCount={false}
        />
        
        {/* Contador de resultados */}
        {debouncedSearch && (
          <div className="text-sm text-gray-600">
            {filteredIngredients.length === 0 
              ? "No se encontraron ingredientes" 
              : `${filteredIngredients.length} ingrediente${filteredIngredients.length !== 1 ? 's' : ''} encontrado${filteredIngredients.length !== 1 ? 's' : ''}`
            }
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Costo Unitario</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Días Entrega</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {debouncedSearch ? "No se encontraron ingredientes con ese criterio" : "No hay ingredientes para mostrar"}
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredients.map((ingredient) => (
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
                  {ingredient.supplier || "-"}
                </TableCell>
                <TableCell>
                  {ingredient.lead_time_days !== null ? `${ingredient.lead_time_days} días` : "No aplica"}
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
                    Historial
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {filteredIngredients.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-gray-500">
            {debouncedSearch ? "No se encontraron ingredientes con ese criterio" : "No hay ingredientes para mostrar"}
          </div>
        ) : (
          filteredIngredients.map((ingredient) => (
          <Card key={ingredient.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{ingredient.name}</CardTitle>
                  <CardDescription>
                    {formatCurrency(ingredient.cost_per_unit)} / {ingredient.unit}
                  </CardDescription>
                </div>
                {ingredient.inventory && getStockBadge(ingredient.inventory.quantity)}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Proveedor:</span>
                  <span>{ingredient.supplier || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Días Entrega:</span>
                  <span>{ingredient.lead_time_days !== null ? `${ingredient.lead_time_days} días` : "No aplica"}</span>
                </div>
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
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
            </CardFooter>
          </Card>
          ))
        )}
      </div>

      <CreateIngredientDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {selectedIngredient && (
        <>
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
        </>
      )}
    </>
  )
}



