"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DayDetailDialog } from "./DayDetailDialog"
import { getTodayGMT3, getDateStringGMT3 } from "@/lib/utils"
import type { EventWithProducts, OrderWithItems } from "@/lib/types"

interface CalendarGridProps {
  events: EventWithProducts[]
  orders: OrderWithItems[]
}

export function CalendarGrid({ events, orders }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Get events grouped by date
  const eventsByDate: Record<string, EventWithProducts[]> = {}
  events.forEach(event => {
    const date = event.date
    if (!eventsByDate[date]) {
      eventsByDate[date] = []
    }
    eventsByDate[date].push(event)
  })

  // Get orders grouped by date
  const ordersByDate: Record<string, OrderWithItems[]> = {}
  orders.forEach(order => {
    const date = order.delivery_date
    if (!ordersByDate[date]) {
      ordersByDate[date] = []
    }
    ordersByDate[date].push(order)
  })

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderDay = (day: number) => {
    const date = new Date(year, month, day)
    const dateString = getDateStringGMT3(date)
    const dayEvents = eventsByDate[dateString] || []
    const dayOrders = ordersByDate[dateString] || []
    const isToday = dateString === getTodayGMT3()

    return (
      <DayDetailDialog
        key={day}
        date={dateString}
        events={dayEvents}
        orders={dayOrders}
      >
        <Card className={`h-24 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
          isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}>
          <CardContent className="p-2 h-full flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day}
              </span>
              {(dayEvents.length > 0 || dayOrders.length > 0) && (
                <Badge variant="secondary" className="text-xs h-5">
                  {dayEvents.length + dayOrders.length}
                </Badge>
              )}
            </div>

            <div className="flex-1 space-y-1">
              {dayEvents.slice(0, 2).map(event => (
                <div
                  key={event.id}
                  className="text-xs bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded truncate"
                  title={event.name}
                >
                  🎉 {event.name}
                </div>
              ))}
              {dayOrders.slice(0, 1).map(order => (
                <div
                  key={order.id}
                  className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
                  title={`Pedido ${order.type}`}
                >
                  📦 Pedido
                </div>
              ))}
              {(dayEvents.length + dayOrders.length) > 3 && (
                <div className="text-xs text-gray-500">
                  +{(dayEvents.length + dayOrders.length) - 3} más
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DayDetailDialog>
    )
  }

  const renderEmptyDay = () => (
    <div className="h-24"></div>
  )

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-semibold">
          {monthNames[month]} {year}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} className="h-24"></div>
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div>
          <span>Efemérides</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Pedidos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  )
}
