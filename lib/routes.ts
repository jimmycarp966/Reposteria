import {
  Home,
  ChefHat,
  ShoppingBag,
  Package,
  ClipboardList,
  Calendar,
  Factory,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface Route {
  label: string
  icon: LucideIcon
  href: string
  color: string
  bgColor: string
  activeBg: string
}

export const routes: Route[] = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    activeBg: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  {
    label: "Recetas",
    icon: ChefHat,
    href: "/recetas",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    activeBg: "bg-gradient-to-r from-orange-500 to-orange-600",
  },
  {
    label: "Ingredientes",
    icon: ShoppingBag,
    href: "/ingredientes",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
    activeBg: "bg-gradient-to-r from-green-500 to-green-600",
  },
  {
    label: "Productos",
    icon: Package,
    href: "/productos",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    activeBg: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
  {
    label: "Pedidos",
    icon: ClipboardList,
    href: "/pedidos",
    color: "text-pink-600",
    bgColor: "bg-pink-50 hover:bg-pink-100",
    activeBg: "bg-gradient-to-r from-pink-500 to-pink-600",
  },
  {
    label: "Calendario",
    icon: Calendar,
    href: "/calendario",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    activeBg: "bg-gradient-to-r from-indigo-500 to-indigo-600",
  },
  {
    label: "Producción",
    icon: Factory,
    href: "/produccion",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    activeBg: "bg-gradient-to-r from-yellow-500 to-yellow-600",
  },
  {
    label: "Reportes",
    icon: BarChart3,
    href: "/reportes",
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:bg-teal-100",
    activeBg: "bg-gradient-to-r from-teal-500 to-teal-600",
  },
  {
    label: "Configuración",
    icon: Settings,
    href: "/configuracion",
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    activeBg: "bg-gradient-to-r from-gray-500 to-gray-600",
  },
]
