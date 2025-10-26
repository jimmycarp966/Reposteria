"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, MobileDialogContent, DialogHeader, DialogTitle } from "@/components/ui/mobile-dialog"
import { getRecipes } from "@/actions/recipeActions"
import { getTaskCategories } from "@/actions/categoryActions"
import type { Recipe, TaskCategory } from "@/lib/types"

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayOfWeek: number | null
  planId?: string
  onAddTask: (dayOfWeek: number, taskData: any) => void
}

const DAY_NAMES = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
]

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  dayOfWeek, 
  planId,
  onAddTask 
}: AddTaskDialogProps) {
  const [taskDescription, setTaskDescription] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(false)

  // Load recipes and categories when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    try {
      const [recipesResult, categoriesResult] = await Promise.all([
        getRecipes({ activeOnly: true }),
        getTaskCategories()
      ])
      
      if (recipesResult.success && recipesResult.data) {
        setRecipes(recipesResult.data)
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dayOfWeek || !planId) return

    const taskData = {
      task_description: taskDescription,
      recipe_id: selectedRecipe && selectedRecipe !== 'none' ? selectedRecipe : null,
      category_id: selectedCategory && selectedCategory !== 'none' ? selectedCategory : null,
      estimated_time_minutes: estimatedTime ? parseInt(estimatedTime) : null
    }

    onAddTask(dayOfWeek, taskData)
    
    // Reset form
    setTaskDescription("")
    setSelectedRecipe("")
    setSelectedCategory("")
    setEstimatedTime("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTaskDescription("")
    setSelectedRecipe("")
    setSelectedCategory("")
    setEstimatedTime("")
    onOpenChange(false)
  }

  if (!dayOfWeek) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            Agregar Tarea - {DAY_NAMES[dayOfWeek - 1]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción de la tarea</Label>
            <Textarea
              id="description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Ej: Hacer mermelada de frutillas, Preparar masa para tartas..."
              required
              rows={3}
              className="text-base"
            />
          </div>

          {/* Recipe Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipe" className="text-sm font-medium">Receta asociada (opcional)</Label>
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Seleccionar receta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin receta específica</SelectItem>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Categoría (opcional)</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">Tiempo estimado (minutos)</Label>
            <Input
              id="time"
              type="number"
              min="1"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Ej: 60"
              className="h-11 text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto h-11 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto h-11 text-base"
            >
              {loading ? "Agregando..." : "Agregar Tarea"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}


