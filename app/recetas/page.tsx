import { getRecipes } from "@/actions/recipeActions"
import { RecipesClient } from "./RecipesClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Settings } from "lucide-react"
import Link from "next/link"

export default async function RecetasPage() {
  const result = await getRecipes()

  // Si Supabase no está configurado, mostrar mensaje de configuración
  if (!result.success && result.needsSetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Recetas</h1>
          <p className="text-muted-foreground">
            Gestiona tus recetas y calcula costos
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-orange-800">
              <AlertTriangle className="h-6 w-6" />
              Configuración Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-orange-700">
              Para usar la aplicación, necesitas configurar Supabase. Sigue estos pasos:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-orange-800">Crear proyecto en Supabase</p>
                  <p className="text-sm text-orange-700">Ve a <a href="https://supabase.com" target="_blank" rel="noopener" className="underline">supabase.com</a> y crea un proyecto gratuito</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-orange-800">Configurar base de datos</p>
                  <p className="text-sm text-orange-700">Ejecuta las migraciones SQL en Supabase SQL Editor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-orange-800">Configurar credenciales</p>
                  <p className="text-sm text-orange-700">
                    Edita el archivo <code className="bg-orange-100 px-1 rounded">.env.local</code> con tus credenciales de Supabase
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-orange-200">
              <Link
                href="/configuracion"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Ir a Configuración
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recipes = result.success && result.data ? result.data : []

  return <RecipesClient recipes={recipes} />
}
