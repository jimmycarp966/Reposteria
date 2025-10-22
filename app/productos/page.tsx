import { getProducts } from "@/actions/productActions"
import { getRecipes } from "@/actions/recipeActions"
import { ProductsClient } from "./ProductsClient"

export default async function ProductosPage() {
  const [productsResult, recipesResult] = await Promise.all([
    getProducts({ page: 1, pageSize: 20 }),
    getRecipes({ page: 1, pageSize: 100, activeOnly: true }), // Todas las recetas para el selector
  ])

  const products = productsResult.success && productsResult.data ? productsResult.data : []
  const recipes = recipesResult.success && recipesResult.data ? recipesResult.data : []
  const pagination = productsResult.pagination

  return (
    <ProductsClient 
      initialProducts={products} 
      recipes={recipes}
      initialPagination={pagination}
    />
  )
}
