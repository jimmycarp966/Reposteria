"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Factory, CheckCircle, Play, Clock } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateTaskStatus } from "@/actions/productionActions"
import { useNotificationStore } from "@/store/notificationStore"

interface ProductionClientProps {
  tasks: any[]
}

export function ProductionClient({ tasks }: ProductionClientProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId)
    const result = await updateTaskStatus(taskId, newStatus)
    setUpdatingId(null)

    if (result.success) {
      addNotification({ type: "success", message: result.message! })
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  // Group tasks by order
  const tasksByOrder = tasks.reduce((acc: any, task: any) => {
    const orderId = task.order_item?.order?.id
    if (!orderId) return acc

    if (!acc[orderId]) {
      acc[orderId] = {
        order: task.order_item.order,
        tasks: [],
      }
    }
    acc[orderId].tasks.push(task)
    return acc
  }, {})

  const orderGroups = Object.values(tasksByOrder)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Producción</h1>
        <p className="text-muted-foreground">
          Planifica y gestiona tus tareas de producción
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tareas de Producción</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Factory}
              title="No hay tareas pendientes"
              description="Las tareas de producción se generan automáticamente cuando confirmas un pedido"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orderGroups.map((group: any, index: number) => {
            const order = group.order
            const orderTasks = group.tasks

            const totalTime = orderTasks.reduce((sum: number, t: any) => sum + t.duration_minutes, 0)
            const completedTasks = orderTasks.filter((t: any) => t.status === "COMPLETED").length

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido - Entrega: {formatDate(order.delivery_date)}
                        {order.delivery_time && ` ${order.delivery_time}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tiempo total estimado: {totalTime} minutos
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        order.status === "IN_PRODUCTION" ? "default" :
                        order.status === "CONFIRMED" ? "secondary" :
                        "outline"
                      }>
                        {order.status}
                      </Badge>
                      <Badge variant="outline">
                        {completedTasks}/{orderTasks.length} completadas
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarea</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderTasks.map((task: any) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.task_name}</TableCell>
                          <TableCell>{task.order_item?.product?.name || "-"}</TableCell>
                          <TableCell>{task.duration_minutes} min</TableCell>
                          <TableCell>
                            <Badge variant={
                              task.status === "COMPLETED" ? "default" :
                              task.status === "IN_PROGRESS" ? "secondary" :
                              "outline"
                            }>
                              {task.status === "PENDING" ? "Pendiente" :
                               task.status === "IN_PROGRESS" ? "En Progreso" :
                               "Completada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {task.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(task.id, "IN_PROGRESS")}
                                disabled={updatingId === task.id}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateStatus(task.id, "COMPLETED")}
                                disabled={updatingId === task.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completar
                              </Button>
                            )}
                            {task.status === "COMPLETED" && (
                              <span className="text-sm text-muted-foreground">
                                ✓ Completada
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

