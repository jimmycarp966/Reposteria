import { getSalesReport, getMonthlyStats } from "@/actions/reportActions"
import { get_current_date } from "@/lib/utils"
import { ReportsClient } from "./ReportsClient"

export default async function ReportesPage() {
  const now = get_current_date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [monthlyStatsResult, salesReportResult] = await Promise.all([
    getMonthlyStats(),
    getSalesReport(
      firstDayOfMonth.toISOString().split("T")[0],
      lastDayOfMonth.toISOString().split("T")[0]
    ),
  ])

  const monthlyStats = monthlyStatsResult.success ? monthlyStatsResult.data : null
  const salesReport = salesReportResult.success ? salesReportResult.data : null

  return <ReportsClient monthlyStats={monthlyStats} salesReport={salesReport} />
}
