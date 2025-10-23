import { getRecipeById, calculateRecipeCost, deleteRecipe } from "@/actions/recipeActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"
import { RecipeActions } from "./RecipeActions"
import { RecipeCostDisplay } from "./RecipeCostDisplay"
import { RecipeIngredientsTable } from "./RecipeIngredientsTable"
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
        <RecipeCostDisplay 
          ingredients={recipe.recipe_ingredients || []} 
          servings={recipe.servings} 
        />

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
      <RecipeIngredientsTable ingredients={recipe.recipe_ingredients || []} />
    </div>
  )
}

