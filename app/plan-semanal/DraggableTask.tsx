"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Check, Clock, Edit, Trash2 } from 'lucide-react';
import type { WeeklyProductionTaskWithRecipe } from '@/lib/types';

interface DraggableTaskProps {
  task: WeeklyProductionTaskWithRecipe;
  onEditTask: (task: WeeklyProductionTaskWithRecipe) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: 'completada' | 'en_progreso' | 'pendiente') => void;
  getTaskStatusBadge: (status: string) => React.ReactNode;
}

export function DraggableTask({
  task,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  getTaskStatusBadge,
}: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 border rounded-lg space-y-2 relative touch-none ${
        task.status === 'completada' ? 'bg-green-50 border-green-200' : 
        task.status === 'en_progreso' ? 'bg-blue-50 border-blue-200' : 
        'bg-white'
      }`}
    >
      {task.category && (
        <div
          className="absolute top-2 left-2 h-2 w-2 rounded-full"
          style={{ backgroundColor: task.category.color }}
          title={`Categoría: ${task.category.name}`}
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 pl-4">
          <p className="text-sm font-medium whitespace-pre-wrap">{task.task_description}</p>
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {task.recipe && (
              <span className="truncate">Receta: {task.recipe.name}</span>
            )}
            {task.estimated_time_minutes && (
              <span className="flex items-center shrink-0">
                <Clock className="h-3 w-3 inline mr-1" />
                {task.estimated_time_minutes} min
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEditTask(task)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={() => onDeleteTask(task.id)}
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
              onClick={() => onUpdateStatus(task.id, 'completada')}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
