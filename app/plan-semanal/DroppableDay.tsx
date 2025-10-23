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
      <Card ref={setNodeRef} className="min-h-[400px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{day.short}</div>
              <div>{day.name}</div>
            </div>
            {totalTime > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {Math.floor(totalTime / 60)}h {totalTime % 60}m
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 flex-grow">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddTask(day.day)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Tarea
          </Button>

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

          {tasks.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No hay tareas programadas
            </div>
          )}
        </CardContent>
      </Card>
    </SortableContext>
  );
}
