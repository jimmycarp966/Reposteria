import { getProductionTasks } from "@/actions/productionActions"
import { Factory } from "lucide-react"
import { ProductionClient } from "./ProductionClient"

export default async function ProduccionPage() {
  const result = await getProductionTasks()
  const tasks = result.success && result.data ? result.data : []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Producción</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Planifica y gestiona tus tareas de producción
          </p>
        </div>
      </div>

      <ProductionClient tasks={tasks} />
    </div>
  )
}
