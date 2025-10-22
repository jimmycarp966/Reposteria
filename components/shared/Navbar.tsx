"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  ChefHat,
  ShoppingBag,
  Package,
  ClipboardList,
  Calendar,
  Factory,
  BarChart3,
  Settings
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    activeBg: "bg-gradient-to-r from-blue-500 to-blue-600"
  },
  {
    label: "Recetas",
    icon: ChefHat,
    href: "/recetas",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    activeBg: "bg-gradient-to-r from-orange-500 to-orange-600"
  },
  {
    label: "Ingredientes",
    icon: ShoppingBag,
    href: "/ingredientes",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    activeBg: "bg-gradient-to-r from-green-500 to-green-600"
  },
  {
    label: "Productos",
    icon: Package,
    href: "/productos",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    activeBg: "bg-gradient-to-r from-purple-500 to-purple-600"
  },
  {
    label: "Pedidos",
    icon: ClipboardList,
    href: "/pedidos",
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    activeBg: "bg-gradient-to-r from-pink-500 to-pink-600"
  },
  {
    label: "Calendario",
    icon: Calendar,
    href: "/calendario",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    activeBg: "bg-gradient-to-r from-indigo-500 to-indigo-600"
  },
  {
    label: "Producción",
    icon: Factory,
    href: "/produccion",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    activeBg: "bg-gradient-to-r from-yellow-500 to-yellow-600"
  },
  {
    label: "Reportes",
    icon: BarChart3,
    href: "/reportes",
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100",
    activeBg: "bg-gradient-to-r from-teal-500 to-teal-600"
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/configuracion",
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    activeBg: "bg-gradient-to-r from-gray-500 to-gray-600"
  },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 h-full w-64 p-4 overflow-y-auto animate-fade-in">
      {/* Header con gradiente */}
      <div className="mb-8 p-4 rounded-2xl gradient-chocolate shadow-lg">
        <Link href="/" className="block">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce-gentle">🧁</div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Dulce
              </h1>
              <p className="text-sm text-orange-100 leading-tight">
                Repostería
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <div className="space-y-3">
        {routes.map((route, index) => {
          const isActive = pathname === route.href
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out hover-lift group",
                isActive
                  ? `${route.activeBg} text-white shadow-lg transform scale-105`
                  : `${route.bgColor} ${route.color} hover:shadow-md`,
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <route.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "text-white" : route.color,
                "group-hover:scale-110"
              )} />
              <span className="font-medium">{route.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer decorativo */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-600 text-xs font-medium">
            <span className="animate-pulse">🍪</span>
            <span>¡Listo para hornear!</span>
          </div>
        </div>
      </div>
    </nav>
  )
}



