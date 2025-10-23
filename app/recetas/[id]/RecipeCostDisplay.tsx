"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Calculator } from "lucide-react"
import { RecipeCostCalculator } from "./RecipeCostCalculator"

interface RecipeCostDisplayProps {
  ingredients: any[]
  servings: number
}

export function RecipeCostDisplay({ ingredients, servings }: RecipeCostDisplayProps) {
  const { totalCost, costPerServing } = RecipeCostCalculator({ ingredients, servings })

  return (
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
  )
}
