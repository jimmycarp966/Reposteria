import { getProductionTasks } from "@/actions/productionActions"
import { Factory } from "lucide-react"
import { ProductionClient } from "./ProductionClient"

export default async function ProduccionPage() {
  const result = await getProductionTasks()
  const tasks = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Factory className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Producción</h1>
          <p className="text-muted-foreground">
            Planifica y gestiona tus tareas de producción
          </p>
        </div>
      </div>

      <ProductionClient tasks={tasks} />
    </div>
  )
}
