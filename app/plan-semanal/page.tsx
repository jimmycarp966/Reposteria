import { getWeeklyPlan } from "@/actions/weeklyPlanActions"
import { getCurrentWeekStart } from "@/lib/utils"
import { WeeklyPlanClient } from "./WeeklyPlanClient"

export default async function PlanSemanalPage() {
  const currentWeekStart = getCurrentWeekStart()
  const result = await getWeeklyPlan(currentWeekStart)
  
  return (
    <div className="container mx-auto py-6">
      <WeeklyPlanClient 
        initialPlan={result.success ? (result.data ?? null) : null}
        currentWeekStart={currentWeekStart}
      />
    </div>
  )
}
