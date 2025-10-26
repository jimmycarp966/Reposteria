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
import { updateTask, updateTaskStatus } from "@/actions/weeklyPlanActions"
import { useNotificationStore } from "@/store/notificationStore"
import type { Recipe, WeeklyProductionTaskWithRecipe, TaskCategory } from "@/lib/types"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: WeeklyProductionTaskWithRecipe | null
  onUpdate: () => void
}

export function EditTaskDialog({ 
  open, 
  onOpenChange, 
  task,
  onUpdate
}: EditTaskDialogProps) {
  const [description, setDescription] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState<string | undefined>("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>("")
  const [estimatedTime, setEstimatedTime] = useState<string | undefined>("")
  const [status, setStatus] = useState<'pendiente' | 'en_progreso' | 'completada'>('pendiente')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    if (task) {
      setDescription(task.task_description)
      setSelectedRecipe(task.recipe_id || "none")
      setSelectedCategory(task.category_id || "none")
      setEstimatedTime(task.estimated_time_minutes?.toString() || "")
      setStatus(task.status)
    }

    if (open) {
      loadInitialData()
    }
  }, [task, open])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!task) return

    setLoading(true)
    
    try {
      // Update task details
      const updateResult = await updateTask(task.id, {
        task_description: description,
        recipe_id: selectedRecipe === "none" ? null : selectedRecipe,
        estimated_time_minutes: estimatedTime ? parseInt(estimatedTime, 10) : null,
        category_id: selectedCategory === "none" ? null : selectedCategory,
      })

      if (!updateResult.success) {
        addNotification({ type: "error", message: updateResult.message! })
        return
      }

      // Update status if changed
      if (status !== task.status) {
        const statusResult = await updateTaskStatus(task.id, status)
        if (!statusResult.success) {
          addNotification({ type: "error", message: statusResult.message! })
          return
        }
      }

      addNotification({ type: "success", message: "Tarea actualizada exitosamente" })
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      addNotification({ type: "error", message: "Error al actualizar tarea" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            Editar Tarea
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción de la tarea</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Estado</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="w-full sm:w-auto h-11 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto h-11 text-base"
            >
              {loading ? "Actualizando..." : "Actualizar Tarea"}
            </Button>
          </div>
        </form>
      </MobileDialogContent>
    </Dialog>
  )
}


