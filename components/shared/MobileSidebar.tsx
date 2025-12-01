"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSidebarStore } from "@/store/sidebarStore"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"

export function MobileSidebar() {
  const { isOpen, close, toggle } = useSidebarStore()
  const pathname = usePathname()

  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetContent side="left" className="p-0 w-64">
        <nav className="h-full p-4 overflow-y-auto">
          <div className="mb-8 p-4 rounded-2xl gradient-chocolate shadow-lg">
            <Link href="/" className="block">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🧁</div>
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

          <div className="space-y-3">
            {routes.map((route) => {
              const isActive = pathname === route.href
              const IconComponent = route.icon
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out group",
                    isActive
                      ? `${route.activeBg} text-white shadow-lg`
                      : `${route.bgColor} ${route.color}`
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-white" : route.color
                    )}
                  />
                  <span className="font-medium">{route.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
