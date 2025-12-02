import { getSalesReport, getMonthlyStats } from "@/actions/reportActions"
import { getFirstDayOfMonthGMT3, getLastDayOfMonthGMT3 } from "@/lib/utils"
import { ReportsClient } from "./ReportsClient"

export default async function ReportesPage() {
  const firstDayOfMonth = getFirstDayOfMonthGMT3()
  const lastDayOfMonth = getLastDayOfMonthGMT3()

  const [monthlyStatsResult, salesReportResult] = await Promise.all([
    getMonthlyStats(),
    getSalesReport(firstDayOfMonth, lastDayOfMonth),
  ])

  const monthlyStats = monthlyStatsResult.success ? monthlyStatsResult.data : null
  const salesReport = salesReportResult.success ? salesReportResult.data : null

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <ReportsClient monthlyStats={monthlyStats} salesReport={salesReport} />
    </div>
  )
}
