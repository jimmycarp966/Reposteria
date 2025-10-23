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
      </CardContent>
    </Card>
  )
}
