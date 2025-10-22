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
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
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
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{getSettingLabel(setting.key)}</p>
                  {editingKey === setting.key ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
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
                      >
                        Cancelar
                      </Button>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Efemérides</CardTitle>
          <Button>
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
          )}
        </CardContent>
      </Card>

      {/* Reglas de Precio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reglas de Precio Especiales</CardTitle>
          <Button>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

