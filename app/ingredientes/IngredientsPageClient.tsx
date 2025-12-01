"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp } from "lucide-react"
import { IngredientsTable } from "./IngredientsTable"
import { CreateIngredientDialog } from "./CreateIngredientDialog"
import { BulkPriceIncreaseDialog } from "./BulkPriceIncreaseDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { ShoppingBag } from "lucide-react"
import { getIngredients } from "@/actions/ingredientActions"
import type { IngredientWithInventory, PaginatedResponse } from "@/lib/types"

interface IngredientsPageClientProps {
  initialIngredients: IngredientWithInventory[]
  initialPagination?: {
    page: number
    pageSize: number
    total: number
  }
}

export function IngredientsPageClient({
  initialIngredients,
  initialPagination
}: IngredientsPageClientProps) {
  const [ingredients, setIngredients] = useState<IngredientWithInventory[]>(initialIngredients)
  const [pagination, setPagination] = useState(initialPagination)
  const [isLoading, setIsLoading] = useState(false)

  const totalCount = pagination?.total || 0

  const handlePageChange = async (page: number) => {
    setIsLoading(true)
    try {
      const result: PaginatedResponse<IngredientWithInventory> = await getIngredients({
        page,
        pageSize: pagination?.pageSize || 20
      })

      if (result.success && result.data) {
        setIngredients(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Error loading ingredients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIngredientCreated = async () => {
    // Recargar la página actual después de crear un ingrediente
    if (pagination) {
      await handlePageChange(pagination.page)
    }
  }

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
            {totalCount > 0 && (
              <BulkPriceIncreaseDialog totalIngredients={totalCount}>
                <Button variant="outline" className="w-full sm:w-auto border-orange-300 text-orange-700 hover:bg-orange-50 h-12 sm:h-10">
                  <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm sm:text-base">Aumentar Precios</span>
                </Button>
              </BulkPriceIncreaseDialog>
            )}
            <CreateIngredientDialog onIngredientCreated={handleIngredientCreated}>
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
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            Lista de Ingredientes
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalCount} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ingredients.length === 0 && !isLoading ? (
            <EmptyState
              icon={ShoppingBag}
              title="No hay ingredientes"
              description="Comienza agregando tu primer ingrediente"
            />
          ) : (
            <IngredientsTable
              ingredients={ingredients}
              pagination={pagination ? {
                page: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onPageChange: handlePageChange
              } : undefined}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
