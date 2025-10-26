"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { updateSetting } from "@/actions/settingsActions"
import { useNotificationStore } from "@/store/notificationStore"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ConfigClientProps {
  settings: any[]
  events: any[]
  priceRules: any[]
}

export function ConfigClient({ settings, events, priceRules }: ConfigClientProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleSave = async (key: string) => {
    setSaving(true)
    const result = await updateSetting(key, editValue)
    setSaving(false)

    if (result.success) {
      addNotification({ type: "success", message: result.message! })
      setEditingKey(null)
      setEditValue("")
    } else {
      addNotification({ type: "error", message: result.message! })
    }
  }

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      default_markup_percent: "Margen por Defecto (%)",
      production_buffer_minutes: "Buffer de Producción (minutos)",
      low_stock_threshold: "Umbral de Stock Bajo",
    }
    return labels[key] || key
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Configura tu sistema de repostería
        </p>
      </div>

      {/* Settings Globales */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones Globales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.map((setting: any) => (
              <div
                key={setting.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">{getSettingLabel(setting.key)}</p>
                  {editingKey === setting.key ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full sm:w-32"
                        autoFocus
                      />
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={() => handleSave(setting.key)}
                          disabled={saving}
                          className="flex-1 sm:flex-none"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingKey(null)
                            setEditValue("")
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor actual: <span className="font-bold text-foreground">{setting.value}</span>
                    </p>
                  )}
                </div>
                {editingKey !== setting.key && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingKey(setting.key)
                      setEditValue(setting.value)
                    }}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Editar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Efemérides */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Efemérides</CardTitle>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Efeméride
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay efemérides configuradas
            </p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{formatDate(event.date)}</TableCell>
                        <TableCell>
                          <Badge>{event.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {event.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <Badge className="text-xs">{event.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(event.date)}
                    </div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="ghost" size="sm" className="w-full">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reglas de Precio */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Reglas de Precio Especiales</CardTitle>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Regla
          </Button>
        </CardHeader>
        <CardContent>
          {priceRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay reglas de precio configuradas
            </p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Margen (%)</TableHead>
                      <TableHead>Tarifa Fija</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceRules.map((rule: any) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.markup_percent}%</TableCell>
                        <TableCell>${rule.fixed_fee}</TableCell>
                        <TableCell className="text-sm">
                          {rule.effective_from && rule.effective_to
                            ? `${formatDate(rule.effective_from)} - ${formatDate(rule.effective_to)}`
                            : "Siempre"}
                        </TableCell>
                        <TableCell>
                          {rule.event ? rule.event.name : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {priceRules.map((rule: any) => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{rule.name}</h4>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{rule.markup_percent}%</div>
                        <div className="text-muted-foreground">${rule.fixed_fee}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rule.effective_from && rule.effective_to
                        ? `${formatDate(rule.effective_from)} - ${formatDate(rule.effective_to)}`
                        : "Siempre activa"}
                    </div>
                    {rule.event && (
                      <div className="text-sm text-muted-foreground">
                        Evento: {rule.event.name}
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="ghost" size="sm" className="w-full">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

