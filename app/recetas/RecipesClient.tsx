"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChefHat, Copy, Trash2 } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency } from "@/lib/utils"
import { CreateRecipeDialog } from "./CreateRecipeDialog"
import { duplicateRecipe, deleteRecipe } from "@/actions/recipeActions"
import { useNotificationStore } from "@/store/notificationStore"
import { convertUnits, areUnitsCompatible } from "@/components/shared/UnitSelector"

interface RecipesClientProps {
  recipes: any[]
}

export function RecipesClient({ recipes }: RecipesClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleDuplicate = async (id: string) => {
    const result = await duplicateRecipe(id)
    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta receta?")) return

    const result = await deleteRecipe(id)
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
            <h1 className="text-3xl font-bold">Recetas</h1>
            <p className="text-muted-foreground">
              Gestiona tus recetas y calcula costos
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
        </div>

        {recipes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={ChefHat}
                title="No hay recetas"
                description="Comienza creando tu primera receta con ingredientes y costos"
                action={{
                  label: "Crear Receta",
                  onClick: () => setShowCreateDialog(true),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe: any) => {
              // Calculate cost with unit conversion
              let totalCost = 0
              recipe.recipe_ingredients?.forEach((ri: any) => {
                let itemCost = 0
                
                // Check if units are compatible for conversion
                if (areUnitsCompatible(ri.unit, ri.ingredient.unit)) {
                  // Convert quantity to ingredient's unit
                  const convertedQuantity = convertUnits(ri.quantity, ri.unit, ri.ingredient.unit)
                  itemCost = convertedQuantity * ri.ingredient.cost_per_unit
                } else {
                  // If units are not compatible, use direct calculation
                  itemCost = ri.quantity * ri.ingredient.cost_per_unit
                }
                
                totalCost += itemCost
              })
              const costPerServing = totalCost / recipe.servings

              return (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        {recipe.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {recipe.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        v{recipe.version}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Porciones:</span>
                        <Badge variant="secondary">{recipe.servings}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Ingredientes:</span>
                        <span className="text-sm font-medium">
                          {recipe.recipe_ingredients?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Costo/Porción:</span>
                        <span className="font-bold">{formatCurrency(costPerServing)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Costo Total:</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(totalCost)}
                        </span>
                      </div>

                      <div className="pt-3 flex gap-2">
                        <Link href={`/recetas/${recipe.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            Ver Detalles
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(recipe.id)}
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipe.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <CreateRecipeDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  )
}

