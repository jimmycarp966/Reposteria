import { getProductionTasks } from "@/actions/productionActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Factory } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/utils"
import { ProductionClient } from "./ProductionClient"

export default async function ProduccionPage() {
  const result = await getProductionTasks()
  const tasks = result.success && result.data ? result.data : []

  return <ProductionClient tasks={tasks} />
}
