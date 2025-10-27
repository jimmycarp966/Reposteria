import { getIngredients } from "@/actions/ingredientActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp } from "lucide-react"
import { IngredientsTable } from "./IngredientsTable"
import { CreateIngredientDialog } from "./CreateIngredientDialog"
import { BulkPriceIncreaseDialog } from "./BulkPriceIncreaseDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ShoppingBag } from "lucide-react"

export default async function IngredientesPage() {
  const result = await getIngredients()
  const ingredients = result.success && result.data ? result.data : []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ingredientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tus ingredientes y stock
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            {ingredients.length > 0 && (
              <BulkPriceIncreaseDialog totalIngredients={ingredients.length}>
                <Button variant="outline" className="w-full sm:w-auto border-orange-300 text-orange-700 hover:bg-orange-50 h-12 sm:h-10">
                  <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm sm:text-base">Aumentar Precios</span>
                </Button>
              </BulkPriceIncreaseDialog>
            )}
            <CreateIngredientDialog>
              <Button className="w-full sm:w-auto h-12 sm:h-10">
                <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                <span className="text-sm sm:text-base">Agregar Ingrediente</span>
              </Button>
            </CreateIngredientDialog>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg lg:text-xl">Lista de Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          {ingredients.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No hay ingredientes"
              description="Comienza agregando tu primer ingrediente"
            />
          ) : (
            <IngredientsTable ingredients={ingredients} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}



