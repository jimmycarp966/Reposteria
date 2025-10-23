"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getRecipes } from "@/actions/recipeActions"
import { updateTask, updateTaskStatus } from "@/actions/weeklyPlanActions"
import { useNotificationStore } from "@/store/notificationStore"
import type { Recipe, WeeklyProductionTaskWithRecipe } from "@/lib/types"

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
  const [taskDescription, setTaskDescription] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState<string>("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [status, setStatus] = useState<'pendiente' | 'en_progreso' | 'completada'>('pendiente')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Load task data when dialog opens
  useEffect(() => {
    if (open && task) {
      setTaskDescription(task.task_description)
      setSelectedRecipe(task.recipe_id || "")
      setEstimatedTime(task.estimated_time_minutes?.toString() || "")
      setStatus(task.status)
      loadRecipes()
    }
  }, [open, task])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!task) return

    setLoading(true)
    
    try {
      // Update task details
      const updateResult = await updateTask(task.id, {
        task_description: taskDescription,
        recipe_id: selectedRecipe || null,
        estimated_time_minutes: estimatedTime ? parseInt(estimatedTime) : null
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Tarea
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


