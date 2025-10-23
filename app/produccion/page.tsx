// import { getProductionTasks } from "@/actions/productionActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Factory } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/utils"
// import { ProductionClient } from "./ProductionClient"

export default async function ProduccionPage() {
  // const result = await getProductionTasks()
  // const tasks = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Factory className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Producción</h1>
          <p className="text-muted-foreground">
            Gestiona las tareas de producción
          </p>
        </div>
      </div>
      
      <EmptyState
        icon={Factory}
        title="Módulo en desarrollo"
        description="El módulo de producción está siendo desarrollado. Próximamente estará disponible."
      />
    </div>
  )
}
