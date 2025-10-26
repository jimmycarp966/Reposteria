"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { RecipeCostCalculator } from "./RecipeCostCalculator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RecipeIngredientsTableProps {
  ingredients: any[]
}

export function RecipeIngredientsTable({ ingredients }: RecipeIngredientsTableProps) {
  const { totalCost, ingredientCosts } = RecipeCostCalculator({ ingredients, servings: 1 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredientes</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
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
              {ingredientCosts.map((ri) => (
                <TableRow key={ri.id}>
                  <TableCell className="font-medium">
                    {ri.ingredient.name}
                  </TableCell>
                  <TableCell>{ri.quantity}</TableCell>
                  <TableCell>{ri.unit}</TableCell>
                  <TableCell>{formatCurrency(ri.ingredient.cost_per_unit)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(ri.itemCost)}
                  </TableCell>
                </TableRow>
              ))}
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
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {ingredientCosts.map((ri) => (
            <div key={ri.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{ri.ingredient.name}</h4>
                <span className="font-semibold text-primary">
                  {formatCurrency(ri.itemCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{ri.quantity} {ri.unit}</span>
                <span>{formatCurrency(ri.ingredient.cost_per_unit)}/unidad</span>
              </div>
            </div>
          ))}
          <div className="border-t pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-primary text-xl">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
