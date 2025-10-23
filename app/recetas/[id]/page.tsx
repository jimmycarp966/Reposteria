import { getRecipeById, calculateRecipeCost, deleteRecipe } from "@/actions/recipeActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { RecipeActions } from "./RecipeActions"
import { convertUnits, areUnitsCompatible } from "@/components/shared/UnitSelector"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function RecipeDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const result = await getRecipeById(id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const recipe = result.data

  // Calculate costs with unit conversion
  let totalCost = 0
  recipe.recipe_ingredients?.forEach((ri: any) => {
    let itemCost = 0
    
    // Check if units are compatible for conversion
    if (areUnitsCompatible(ri.unit, ri.ingredient.unit)) {
      // Convert quantity to ingredient's unit
      const convertedQuantity = convertUnits(ri.quantity, ri.unit, ri.ingredient.unit)
      itemCost = convertedQuantity * ri.ingredient.cost_per_unit
    } else {
      // If units are not compatible, use direct calculation (assume user knows what they're doing)
      itemCost = ri.quantity * ri.ingredient.cost_per_unit
    }
    
    totalCost += itemCost
  })
  const costPerServing = totalCost / recipe.servings

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/recetas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
        </div>
        <Badge variant="outline">Versión {recipe.version}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recipe.image_url && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                <Image
                  src={recipe.image_url}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Porciones:</span>
              <Badge variant="secondary">{recipe.servings}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingredientes:</span>
              <span className="font-medium">
                {recipe.recipe_ingredients?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Badge variant={recipe.active ? "default" : "secondary"}>
                {recipe.active ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cost Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo de Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo Total</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo por Porción</p>
              <p className="text-2xl font-bold">
                {formatCurrency(costPerServing)}
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Precio sugerido (60% markup):
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(costPerServing * 1.6)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/productos" className="block">
              <Button className="w-full" variant="default">
                Crear Producto desde esta Receta
              </Button>
            </Link>
            <RecipeActions recipeId={recipe.id} />
          </CardContent>
        </Card>
      </div>

      {/* Ingredients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead className="text-right">Costo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.recipe_ingredients?.map((ri: any) => {
                // Calculate cost with unit conversion
                let itemCost = 0
                if (areUnitsCompatible(ri.unit, ri.ingredient.unit)) {
                  const convertedQuantity = convertUnits(ri.quantity, ri.unit, ri.ingredient.unit)
                  itemCost = convertedQuantity * ri.ingredient.cost_per_unit
                } else {
                  itemCost = ri.quantity * ri.ingredient.cost_per_unit
                }
                
                return (
                  <TableRow key={ri.id}>
                    <TableCell className="font-medium">
                      {ri.ingredient.name}
                    </TableCell>
                    <TableCell>{ri.quantity}</TableCell>
                    <TableCell>{ri.unit}</TableCell>
                    <TableCell>{formatCurrency(ri.ingredient.cost_per_unit)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(itemCost)}
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  Total:
                </TableCell>
                <TableCell className="text-right font-bold text-primary text-lg">
                  {formatCurrency(totalCost)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

