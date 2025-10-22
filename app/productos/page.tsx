import { getProducts } from "@/actions/productActions"
import { getRecipes } from "@/actions/recipeActions"
import { ProductsClient } from "./ProductsClient"

export default async function ProductosPage() {
  const [productsResult, recipesResult] = await Promise.all([
    getProducts(),
    getRecipes(),
  ])

  const products = productsResult.success && productsResult.data ? productsResult.data : []
  const recipes = recipesResult.success && recipesResult.data ? recipesResult.data : []

  return <ProductsClient products={products} recipes={recipes} />
}
