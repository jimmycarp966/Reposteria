"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
} from '@dnd-kit/sortable';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar
} from "lucide-react"
import { 
  getWeeklyPlan, 
  getAllWeeklyPlans,
  addTaskToPlan, 
  updateTaskStatus, 
  deleteTask,
  reorderTasks
} from "@/actions/weeklyPlanActions"
import { 
  getPreviousWeekStart, 
  getNextWeekStart, 
  getWeekDateRange,
  isMonday,
  getMondayOfWeek,
  formatDate
} from "@/lib/utils"
import { useNotificationStore } from "@/store/notificationStore"
import type { WeeklyPlanWithTasks, WeeklyProductionTaskWithRecipe } from "@/lib/types"
import { AddTaskDialog } from "./AddTaskDialog"
import { EditTaskDialog } from "./EditTaskDialog"
import { CreatePlanDialog } from "./CreatePlanDialog"
import { DuplicatePlanDialog } from "./DuplicatePlanDialog"
import { CheckStockDialog } from "./CheckStockDialog"
import { TaskSuggestions } from "./TaskSuggestions"
import { DroppableDay } from './DroppableDay';
import { DraggableTask } from './DraggableTask';

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
  const [activeTask, setActiveTask] = useState<WeeklyProductionTaskWithRecipe | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const addNotification = useNotificationStore((state) => state.addNotification)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByDay = useMemo(() => {
    const groupedTasks: { [key: number]: WeeklyProductionTaskWithRecipe[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      groupedTasks[day.day] = [];
    });
    if (plan?.tasks) {
      plan.tasks.forEach(task => {
        if (groupedTasks[task.day_of_week]) {
          groupedTasks[task.day_of_week].push(task);
        }
      });
    }
    return groupedTasks;
  }, [plan]);


  // Wrapper function for onUpdate callbacks
  const handleUpdate = (weekStartDate?: string) => {
    if (weekStartDate) {
      setCurrentWeek(weekStartDate)
      loadPlan(weekStartDate)
    } else {
      loadPlan(currentWeek)
    }
    // Recargar semanas disponibles después de crear/actualizar
    loadAvailableWeeks()
  }

  const handlePlanDuplicated = (newWeekStartDate: string) => {
    setCurrentWeek(newWeekStartDate)
    loadPlan(newWeekStartDate)
    loadAvailableWeeks()
  }

  const weekRange = getWeekDateRange(currentWeek)

  // Load available weeks
  const loadAvailableWeeks = async () => {
    try {
      const result = await getAllWeeklyPlans()
      if (result.success && result.data) {
        const weeks = result.data.map((plan: any) => plan.week_start_date)
        setAvailableWeeks(weeks)
        console.log('Available weeks:', weeks)
      }
    } catch (error) {
      console.error('Error loading available weeks:', error)
    }
  }

  // Load plan for current week
  const loadPlan = async (weekStart: string) => {
    setLoading(true)
    try {
      console.log('Loading plan for week:', weekStart)
      const result = await getWeeklyPlan(weekStart)
      console.log('Plan load result:', result)
      if (result.success) {
        setPlan(result.data ?? null)
        console.log('Plan set to:', result.data)
      } else {
        setPlan(null)
        console.log('No plan found for week:', weekStart)
      }
    } catch (error) {
      console.error('Error loading plan:', error)
      addNotification({ type: "error", message: "Error al cargar plan semanal" })
    } finally {
      setLoading(false)
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

  // Asegurar que siempre estemos en un lunes
  useEffect(() => {
    if (!isMonday(currentWeek)) {
      const mondayWeek = getMondayOfWeek(currentWeek)
      setCurrentWeek(mondayWeek)
      loadPlan(mondayWeek)
    }
  }, [currentWeek])

  // Cargar semanas disponibles al inicio
  useEffect(() => {
    loadAvailableWeeks()
  }, [])

  // Add task
  const handleAddTask = async (dayOfWeek: number, taskData: any) => {
    if (!plan) return

    try {
      const result = await addTaskToPlan(
        plan.id,
        dayOfWeek,
        taskData.task_description,
        taskData.recipe_id,
        taskData.estimated_time_minutes,
        taskData.category_id
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

  const handleOpenAddTaskDialog = (day: number) => {
    setSelectedDay(day);
    setAddTaskDialogOpen(true);
  };

  const handleCloseAddTaskDialog = () => {
    setAddTaskDialogOpen(false);
    setSelectedDay(null);
  };

  const handleOpenEditTaskDialog = (task: WeeklyProductionTaskWithRecipe) => {
    setSelectedTask(task);
    setEditTaskDialogOpen(true);
  };

  const handleCloseEditTaskDialog = () => {
    setEditTaskDialogOpen(false);
    setSelectedTask(null);
  };


  // Wrapper for suggestions
  const handleAddTaskFromSuggestion = (taskData: { task_description: string; recipe_id: string }, dayOfWeek: number) => {
    handleAddTask(dayOfWeek, taskData)
  }

  // Drag and Drop handlers
  function handleDragStart(event: any) {
    const { active } = event;
    const task = plan?.tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragOver(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const activeDay = active.data.current.sortable.containerId;
    const overDay = over.id.toString().startsWith('day-') ? over.id : over.data.current?.sortable.containerId;
  
    if (!overDay || activeDay === overDay) {
      return;
    }
  
    setPlan((prevPlan) => {
      if (!prevPlan) return null;
  
      const activeTaskIndex = prevPlan.tasks.findIndex(t => t.id === active.id);
      if (activeTaskIndex === -1) return prevPlan;
  
      const updatedTasks = [...prevPlan.tasks];
      const [movedTask] = updatedTasks.splice(activeTaskIndex, 1);
      
      const newDay = parseInt(overDay.replace('day-', ''), 10);
      movedTask.day_of_week = newDay;
  
      // Find where to insert in the tasks list
      const overTaskIndex = updatedTasks.findIndex(t => t.id === over.id);
      if (overTaskIndex !== -1) {
        updatedTasks.splice(overTaskIndex, 0, movedTask);
      } else {
        // If dropping on the container, add to the end of that day's tasks
        const tasksInNewDay = updatedTasks.filter(t => t.day_of_week === newDay);
        const lastTaskIndex = updatedTasks.findLastIndex(t => t.day_of_week === newDay);
        updatedTasks.splice(lastTaskIndex + 1, 0, movedTask);
      }
  
      return { ...prevPlan, tasks: updatedTasks };
    });
  }
  
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveTask(null);
  
    if (!over || active.id === over.id) {
      return;
    }
    
    const overDay = over.id.toString().startsWith('day-') ? over.id : over.data.current?.sortable.containerId;
    if (!overDay) return;
  
    let finalTasks: WeeklyProductionTaskWithRecipe[] = [];
  
    setPlan((prevPlan) => {
      if (!prevPlan) return null;
  
      const oldIndex = prevPlan.tasks.findIndex(t => t.id === active.id);
      let newIndex = prevPlan.tasks.findIndex(t => t.id === over.id);
  
      const activeDay = active.data.current.sortable.containerId;
      
      let reorderedTasks;
  
      if (activeDay === overDay) {
        // Reordering within the same day
        reorderedTasks = arrayMove(prevPlan.tasks, oldIndex, newIndex);
      } else {
        // Moving to a different day
        const movedTask = { ...prevPlan.tasks[oldIndex] };
        movedTask.day_of_week = parseInt(overDay.replace('day-', ''), 10);
        
        const remainingTasks = prevPlan.tasks.filter(t => t.id !== active.id);
        
        const overContainerTasks = prevPlan.tasks.filter(t => t.day_of_week === movedTask.day_of_week);
        if (overContainerTasks.some(t => t.id === over.id)) {
           // Dropped on a task in the new container
           newIndex = remainingTasks.findIndex(t => t.id === over.id);
           remainingTasks.splice(newIndex, 0, movedTask);
        } else {
           // Dropped on the container itself
           const lastIndexOfDay = remainingTasks.findLastIndex(t => t.day_of_week === movedTask.day_of_week);
           remainingTasks.splice(lastIndexOfDay + 1, 0, movedTask);
        }
        reorderedTasks = remainingTasks;
      }
      
      finalTasks = reorderedTasks.map((task, index) => ({
        ...task,
        order_position: index // This is a temporary position; server should re-calculate based on day
      }));
      
      return { ...prevPlan, tasks: reorderedTasks };
    });
  
    // Server update
    const tasksToUpdate = finalTasks.map((task, index) => ({
      id: task.id,
      day_of_week: task.day_of_week,
      order_position: tasksByDay[task.day_of_week].findIndex(t => t.id === task.id),
    })).filter(t => t.order_position !== -1);
  
    // Recalculate positions for all tasks in affected days
    const allTasksToUpdate = new Map<string, { id: string; day_of_week: number; order_position: number }>();
  
    const updatePositionsForDay = (day: number, tasks: WeeklyProductionTaskWithRecipe[]) => {
      tasks.forEach((task, index) => {
        allTasksToUpdate.set(task.id, { id: task.id, day_of_week: day, order_position: index });
      });
    };
  
    const daysToUpdate = new Set<number>();
    if (plan?.tasks) {
      const movedTask = plan.tasks.find(t => t.id === active.id);
      if (movedTask) {
        daysToUpdate.add(movedTask.day_of_week);
        const newDay = parseInt(overDay.replace('day-', ''), 10);
        daysToUpdate.add(newDay);
      }
    }
  
    daysToUpdate.forEach(dayNumber => {
      updatePositionsForDay(dayNumber, finalTasks.filter(t => t.day_of_week === dayNumber));
    });
  
    const result = await reorderTasks(Array.from(allTasksToUpdate.values()));
    if (!result.success) {
      addNotification({ type: "error", message: "Error al reordenar tareas. Recargando..." });
      loadPlan(currentWeek); // Revert optimistic update on failure
    } else {
      addNotification({ type: "success", message: "Orden de tareas actualizado." });
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

  const getTotalTimeForDay = (dayOfWeek: number) => {
    const tasks = tasksByDay[dayOfWeek] || [];
    return tasks.reduce((total, task) => total + (task.estimated_time_minutes || 0), 0)
  }

  const getTotalTimeForWeek = () => {
    if (!plan || !plan.tasks) return 0
    return plan.tasks.reduce((total, task) => total + (task.estimated_time_minutes || 0), 0)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 md:h-8 md:w-8" />
            Plan Semanal de Producción
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {weekRange.start} - {weekRange.end}
          </p>
          <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span>
              Carga horaria total: <strong>{Math.floor(getTotalTimeForWeek() / 60)}h {getTotalTimeForWeek() % 60}m</strong>
            </span>
          </div>
          {!isMonday(currentWeek) && (
            <p className="text-amber-600 text-xs md:text-sm">
              ⚠️ Esta semana no comienza en lunes. Los planes semanales siempre comienzan los lunes.
            </p>
          )}
          {plan && (
            <p className="text-green-600 text-xs md:text-sm">
              ✅ Plan semanal disponible
            </p>
          )}
          {availableWeeks.length > 0 && (
            <p className="text-blue-600 text-xs md:text-sm">
              📅 Planes disponibles: {availableWeeks.length} semana{availableWeeks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-4 md:space-y-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="flex-1 md:flex-none">
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 md:hidden">Anterior</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek} className="flex-1 md:flex-none">
              <ChevronRight className="h-4 w-4" />
              <span className="ml-1 md:hidden">Siguiente</span>
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2 md:flex-row md:gap-2">
            {plan && (
              <DuplicatePlanDialog 
                sourceWeekStart={currentWeek}
                onPlanDuplicated={handlePlanDuplicated}
              />
            )}

            {plan && (
              <CheckStockDialog 
                planId={plan.id}
                planWeek={`${weekRange.start} - ${weekRange.end}`}
              />
            )}

            {!plan && (
              <CreatePlanDialog onPlanCreated={handleUpdate} />
            )}
          </div>
        </div>
      </div>

      {plan && (
        <TaskSuggestions 
          weekStartDate={weekRange.startRaw}
          weekEndDate={weekRange.endRaw}
          onAddTask={handleAddTaskFromSuggestion}
        />
      )}

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
            <CreatePlanDialog onPlanCreated={handleUpdate} />
          </CardContent>
        </Card>
      ) : (
        /* Weekly Grid */
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
            {DAYS_OF_WEEK.map(({ day, name, short }) => {
              const tasks = tasksByDay[day] || [];
              const totalTime = getTotalTimeForDay(day)
              
              return (
                <DroppableDay
                  key={day}
                  id={`day-${day}`}
                  day={{ day, name, short }}
                  tasks={tasks}
                  totalTime={totalTime}
                  onAddTask={handleOpenAddTaskDialog}
                  onEditTask={handleOpenEditTaskDialog}
                  onDeleteTask={handleDeleteTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                  getTaskStatusBadge={getTaskStatusBadge}
                />
              )
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <DraggableTask 
                task={activeTask}
                getTaskStatusBadge={getTaskStatusBadge}
                onEditTask={() => {}}
                onDeleteTask={() => {}}
                onUpdateStatus={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={handleCloseAddTaskDialog}
        dayOfWeek={selectedDay}
        planId={plan?.id}
        onAddTask={handleAddTask}
      />

      <EditTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={handleCloseEditTaskDialog}
        task={selectedTask}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
