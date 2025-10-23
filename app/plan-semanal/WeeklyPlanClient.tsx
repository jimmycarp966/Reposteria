"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Clock, 
  Edit, 
  Trash2,
  Calendar
} from "lucide-react"
import { 
  getWeeklyPlan, 
  createWeeklyPlan, 
  addTaskToPlan, 
  updateTaskStatus, 
  deleteTask
} from "@/actions/weeklyPlanActions"
import { 
  getPreviousWeekStart, 
  getNextWeekStart, 
  getWeekDateRange 
} from "@/lib/utils"
import { useNotificationStore } from "@/store/notificationStore"
import { formatDate } from "@/lib/utils"
import type { WeeklyPlanWithTasks, WeeklyProductionTaskWithRecipe } from "@/lib/types"
import { AddTaskDialog } from "./AddTaskDialog"
import { EditTaskDialog } from "./EditTaskDialog"

interface WeeklyPlanClientProps {
  initialPlan: WeeklyPlanWithTasks | null
  currentWeekStart: string
}

const DAYS_OF_WEEK = [
  { day: 1, name: "Lunes", short: "Lun" },
  { day: 2, name: "Martes", short: "Mar" },
  { day: 3, name: "Miércoles", short: "Mié" },
  { day: 4, name: "Jueves", short: "Jue" },
  { day: 5, name: "Viernes", short: "Vie" },
  { day: 6, name: "Sábado", short: "Sáb" },
  { day: 7, name: "Domingo", short: "Dom" },
]

export function WeeklyPlanClient({ initialPlan, currentWeekStart }: WeeklyPlanClientProps) {
  const [currentWeek, setCurrentWeek] = useState(currentWeekStart)
  const [plan, setPlan] = useState<WeeklyPlanWithTasks | null>(initialPlan)
  const [loading, setLoading] = useState(false)
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<WeeklyProductionTaskWithRecipe | null>(null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  // Wrapper function for onUpdate callbacks
  const handleUpdate = () => {
    loadPlan(currentWeek)
  }

  const weekRange = getWeekDateRange(currentWeek)

  // Load plan for current week
  const loadPlan = async (weekStart: string) => {
    setLoading(true)
    try {
      const result = await getWeeklyPlan(weekStart)
      if (result.success) {
        setPlan(result.data ?? null)
      } else {
        setPlan(null)
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al cargar plan semanal" })
    } finally {
      setLoading(false)
    }
  }

  // Create new plan for current week
  const createPlan = async () => {
    try {
      const result = await createWeeklyPlan(currentWeek, "")
      if (result.success) {
        setPlan(result.data)
        addNotification({ type: "success", message: "Plan semanal creado exitosamente" })
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al crear plan semanal" })
    }
  }

  // Navigate weeks
  const goToPreviousWeek = () => {
    const prevWeek = getPreviousWeekStart(currentWeek)
    setCurrentWeek(prevWeek)
    loadPlan(prevWeek)
  }

  const goToNextWeek = () => {
    const nextWeek = getNextWeekStart(currentWeek)
    setCurrentWeek(nextWeek)
    loadPlan(nextWeek)
  }

  // Add task
  const handleAddTask = async (dayOfWeek: number, taskData: any) => {
    if (!plan) return

    try {
      const result = await addTaskToPlan(
        plan.id,
        dayOfWeek,
        taskData.task_description,
        taskData.recipe_id,
        taskData.estimated_time_minutes
      )
      
      if (result.success) {
        loadPlan(currentWeek) // Reload plan
        addNotification({ type: "success", message: "Tarea agregada exitosamente" })
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al agregar tarea" })
    }
  }

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, status: 'pendiente' | 'en_progreso' | 'completada') => {
    try {
      const result = await updateTaskStatus(taskId, status)
      
      if (result.success) {
        loadPlan(currentWeek) // Reload plan
        addNotification({ type: "success", message: "Estado de tarea actualizado" })
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al actualizar tarea" })
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId)
      
      if (result.success) {
        loadPlan(currentWeek) // Reload plan
        addNotification({ type: "success", message: "Tarea eliminada exitosamente" })
      } else {
        addNotification({ type: "error", message: result.message! })
      }
    } catch (error) {
      addNotification({ type: "error", message: "Error al eliminar tarea" })
    }
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completada':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completada</Badge>
      case 'en_progreso':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En Progreso</Badge>
      case 'pendiente':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTasksForDay = (dayOfWeek: number) => {
    if (!plan || !plan.tasks) return []
    return plan.tasks.filter(task => task.day_of_week === dayOfWeek)
  }

  const getTotalTimeForDay = (dayOfWeek: number) => {
    const tasks = getTasksForDay(dayOfWeek)
    return tasks.reduce((total, task) => total + (task.estimated_time_minutes || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Plan Semanal de Producción
          </h1>
          <p className="text-muted-foreground">
            {weekRange.start} - {weekRange.end}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {!plan && (
            <Button onClick={createPlan} className="btn-gradient-green">
              <Plus className="h-4 w-4 mr-2" />
              Crear Plan
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando plan semanal...</p>
        </div>
      ) : !plan ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">No hay plan para esta semana</h3>
            <p className="text-muted-foreground mb-4">
              Crea un plan semanal para organizar tu producción
            </p>
            <Button onClick={createPlan} className="btn-gradient-green">
              <Plus className="h-4 w-4 mr-2" />
              Crear Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Weekly Grid */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map(({ day, name, short }) => {
            const tasks = getTasksForDay(day)
            const totalTime = getTotalTimeForDay(day)
            
            return (
              <Card key={day} className="min-h-[400px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{short}</div>
                      <div>{name}</div>
                    </div>
                    {totalTime > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {totalTime}min
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Add Task Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedDay(day)
                      setAddTaskDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Tarea
                  </Button>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 border rounded-lg space-y-2 ${
                          task.status === 'completada' ? 'bg-green-50 border-green-200' : 
                          task.status === 'en_progreso' ? 'bg-blue-50 border-blue-200' : 
                          'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">
                              {task.task_description}
                            </p>
                            {task.recipe && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Receta: {task.recipe.name}
                              </p>
                            )}
                            {task.estimated_time_minutes && (
                              <p className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {task.estimated_time_minutes} min
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setSelectedTask(task)
                                setEditTaskDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {getTaskStatusBadge(task.status)}
                          
                          <div className="flex gap-1">
                            {task.status !== 'completada' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleUpdateTaskStatus(task.id, 'completada')}
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tasks.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No hay tareas programadas
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        dayOfWeek={selectedDay}
        planId={plan?.id}
        onAddTask={handleAddTask}
      />

      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        task={selectedTask}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
