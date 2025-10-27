"use client"

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTask } from './DraggableTask';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';
import type { WeeklyProductionTaskWithRecipe } from '@/lib/types';

interface DroppableDayProps {
  id: string;
  day: { day: number; name: string; short: string };
  tasks: WeeklyProductionTaskWithRecipe[];
  totalTime: number;
  onAddTask: (day: number) => void;
  onEditTask: (task: WeeklyProductionTaskWithRecipe) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: 'completada' | 'en_progreso' | 'pendiente') => void;
  getTaskStatusBadge: (status: string) => React.ReactNode;
}

export function DroppableDay({
  id,
  day,
  tasks,
  totalTime,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  getTaskStatusBadge,
}: DroppableDayProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <SortableContext id={id} items={tasks} strategy={verticalListSortingStrategy}>
      <Card ref={setNodeRef} className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium">{day.short}</div>
              <div className="text-base font-semibold">{day.name}</div>
            </div>
            {totalTime > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {Math.floor(totalTime / 60)}h {totalTime % 60}m
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-grow space-y-4">
          {/* Botón Agregar Tarea más prominente */}
          <Button
            variant="default"
            size="sm"
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            onClick={() => onAddTask(day.day)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Agregar Tarea</span>
            <span className="md:hidden">Nueva Tarea</span>
          </Button>

          {/* Lista de tareas */}
          <div className="flex-grow space-y-3 min-h-0">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onUpdateStatus={onUpdateStatus}
                    getTaskStatusBadge={getTaskStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sin tareas programadas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Haz clic arriba para agregar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SortableContext>
  );
}
