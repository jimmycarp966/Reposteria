"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:block fixed top-0 left-0 h-full w-64 p-4 overflow-y-auto animate-fade-in">
      {/* Header con gradiente */}
      <div className="mb-8 p-4 rounded-2xl gradient-chocolate shadow-lg">
        <Link href="/" className="block">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce-gentle">🧁</div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Cam
              </h1>
              <p className="text-sm text-orange-100 leading-tight">
                Bake
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <div className="space-y-3">
        {routes.map((route, index) => {
          const isActive = pathname === route.href
          const IconComponent = route.icon
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
              <IconComponent className={cn(
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



