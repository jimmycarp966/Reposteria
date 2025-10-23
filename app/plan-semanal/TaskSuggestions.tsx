"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Lightbulb } from "lucide-react"
import { getTaskSuggestions } from "@/actions/weeklyPlanActions"

interface TaskSuggestion {
  name: string
  recipe_id: string
  quantity: number
}

interface TaskSuggestionsProps {
  weekStartDate: string
  weekEndDate: string
  onAddTask: (taskData: { task_description: string; recipe_id: string }, dayOfWeek: number) => void
}

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]

export function TaskSuggestions({ weekStartDate, weekEndDate, onAddTask }: TaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const result = await getTaskSuggestions(weekStartDate, weekEndDate)
        if (result.success && result.data) {
          setSuggestions(result.data)
        }
      } catch (error) {
        console.error("Error fetching task suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [weekStartDate, weekEndDate])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugerencias de Tareas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Buscando sugerencias...</p>
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return null // Don't render anything if there are no suggestions
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Sugerencias de Tareas
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          Basado en los pedidos confirmados para esta semana.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion.recipe_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="font-medium text-sm">{suggestion.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs mr-1">Añadir a:</span>
                {DAYS.map(day => (
                  <Button
                    key={day.value}
                    variant="outline"
                    size="sm"
                    className="px-2 h-7"
                    onClick={() => onAddTask({
                      task_description: suggestion.name,
                      recipe_id: suggestion.recipe_id
                    }, day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
