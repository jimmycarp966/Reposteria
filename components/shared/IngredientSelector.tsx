"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface IngredientSelectorProps {
  ingredients: Array<{
    id: string
    name: string
    unit?: string
    cost_per_unit?: number
  }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function IngredientSelector({
  ingredients,
  value,
  onValueChange,
  placeholder = "Seleccionar ingrediente",
  className,
  disabled = false
}: IngredientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [open, setOpen] = useState(false)

  const filteredIngredients = useMemo(() => {
    if (!searchQuery) return ingredients

    const query = searchQuery.toLowerCase().trim()
    return ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(query) ||
      (ingredient.unit && ingredient.unit.toLowerCase().includes(query))
    )
  }, [ingredients, searchQuery])

  const selectedIngredient = ingredients.find(ing => ing.id === value)

  const handleSelect = (newValue: string) => {
    onValueChange(newValue)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda después de seleccionar
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Select 
        value={value} 
        onValueChange={handleSelect}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedIngredient ? selectedIngredient.name : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Buscador */}
          <div className="sticky top-0 z-10 bg-background border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ingrediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Evitar que se cierre el select al escribir
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  // Evitar que se cierre el select al hacer clic
                  e.stopPropagation()
                }}
                className="pl-8 h-9 text-sm"
                autoFocus
              />
            </div>
            {filteredIngredients.length !== ingredients.length && (
              <p className="text-xs text-muted-foreground mt-2">
                Mostrando {filteredIngredients.length} de {ingredients.length} ingredientes
              </p>
            )}
          </div>

          {/* Lista de ingredientes filtrados */}
          <div className="max-h-[240px] overflow-y-auto">
            {filteredIngredients.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron ingredientes
              </div>
            ) : (
              filteredIngredients.map((ingredient) => (
                <SelectItem 
                  key={ingredient.id} 
                  value={ingredient.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{ingredient.name}</span>
                    {ingredient.unit && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({ingredient.unit})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}

