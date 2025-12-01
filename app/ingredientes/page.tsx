import { getIngredients } from "@/actions/ingredientActions"
import { IngredientsPageClient } from "./IngredientsPageClient"

export default async function IngredientesPage() {
  // Cargar ingredientes con paginación del lado servidor
  const result = await getIngredients({ page: 1, pageSize: 20 })
  const ingredients = result.success && result.data ? result.data : []
  const pagination = result.pagination

  return (
    <IngredientsPageClient
      initialIngredients={ingredients}
      initialPagination={pagination}
    />
  )
}



