"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getRecipes } from "@/actions/recipeActions"
import type { Recipe } from "@/lib/types"

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
  const [estimatedTime, setEstimatedTime] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  // Load recipes when dialog opens
  useEffect(() => {
    if (open) {
      loadRecipes()
    }
  }, [open])

  const loadRecipes = async () => {
    try {
      const result = await getRecipes({ activeOnly: true })
      if (result.success && result.data) {
        setRecipes(result.data)
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dayOfWeek || !planId) return

    const taskData = {
      task_description: taskDescription,
      recipe_id: selectedRecipe || null,
      estimated_time_minutes: estimatedTime ? parseInt(estimatedTime) : null
    }

    onAddTask(dayOfWeek, taskData)
    
    // Reset form
    setTaskDescription("")
    setSelectedRecipe("")
    setEstimatedTime("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTaskDescription("")
    setSelectedRecipe("")
    setEstimatedTime("")
    onOpenChange(false)
  }

  if (!dayOfWeek) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Agregar Tarea - {DAY_NAMES[dayOfWeek - 1]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción de la tarea</Label>
            <Textarea
              id="description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Ej: Hacer mermelada de frutillas, Preparar masa para tartas..."
              required
              rows={3}
            />
          </div>

          {/* Recipe Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipe">Receta asociada (opcional)</Label>
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar receta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin receta específica</SelectItem>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Tiempo estimado (minutos)</Label>
            <Input
              id="time"
              type="number"
              min="1"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Ej: 60"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Agregando..." : "Agregar Tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


