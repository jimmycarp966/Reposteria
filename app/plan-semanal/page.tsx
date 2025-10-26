import { getWeeklyPlan } from "@/actions/weeklyPlanActions"
import { getCurrentWeekStart, getMondayOfWeek } from "@/lib/utils"
import { WeeklyPlanClient } from "./WeeklyPlanClient"

export default async function PlanSemanalPage() {
  const currentWeekStart = getCurrentWeekStart()
  // Asegurar que siempre sea lunes
  const mondayWeekStart = getMondayOfWeek(currentWeekStart)
  const result = await getWeeklyPlan(mondayWeekStart)
  
  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <WeeklyPlanClient 
        initialPlan={result.success ? (result.data ?? null) : null}
        currentWeekStart={mondayWeekStart}
      />
    </div>
  )
}
