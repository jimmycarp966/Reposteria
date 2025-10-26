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
      <Card ref={setNodeRef} className="min-h-[300px] md:min-h-[400px] flex flex-col">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            <div>
              <div className="text-xs md:text-sm text-muted-foreground">{day.short}</div>
              <div className="text-sm md:text-base">{day.name}</div>
            </div>
            {totalTime > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {Math.floor(totalTime / 60)}h {totalTime % 60}m
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 md:space-y-3 flex-grow">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 md:h-10 text-sm"
            onClick={() => onAddTask(day.day)}
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Agregar Tarea</span>
            <span className="sm:hidden">Agregar</span>
          </Button>

          <div className="space-y-1 md:space-y-2">
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

          {tasks.length === 0 && (
            <div className="text-center py-3 md:py-4 text-muted-foreground text-xs md:text-sm">
              No hay tareas programadas
            </div>
          )}
        </CardContent>
      </Card>
    </SortableContext>
  );
}
