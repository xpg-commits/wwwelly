"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutGridIcon, BarChart3Icon, UserIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"
import {
  ALL_FILTER_KEY,
  DEFAULT_MODULE_ORDER,
  filterHref,
  filterLabel,
  type FilterKey,
} from "@/lib/modules"

// Fixed bottom pill, mobile-only — the app-like nav the desktop header
// collapses into on small screens instead of a "Módulos" dropdown menu.
export function BottomNav({
  enabledModules,
  moduleOrder,
  members,
  currentMemberId,
  childOptions,
  avatarHref = "/ajustes/perfil",
}: {
  enabledModules: FilterKey[]
  moduleOrder: FilterKey[]
  members: { id: string; name: string }[]
  currentMemberId: string
  childOptions?: { id: string; name: string }[]
  avatarHref?: string
}) {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const enabledSet = new Set(
    enabledModules.length > 0 ? enabledModules : DEFAULT_MODULE_ORDER
  )
  const modules = (moduleOrder.length > 0 ? moduleOrder : DEFAULT_MODULE_ORDER).filter(
    (key) => enabledSet.has(key) && key !== ALL_FILTER_KEY
  )

  return (
    <>
      <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center md:hidden">
        <div className="flex items-center gap-1 rounded-full bg-card/90 p-1.5 shadow-[0_8px_24px_-4px_rgba(70,60,140,0.25)] ring-1 ring-foreground/[0.06] backdrop-blur-md">
          <Link
            href="/dashboard"
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-all active:scale-90",
              pathname === "/dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Inicio"
          >
            <HomeIcon className="size-5" />
          </Link>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-foreground active:scale-90"
            aria-label="Módulos"
          >
            <LayoutGridIcon className="size-5" />
          </button>

          <AddTaskDialog
            members={members}
            currentMemberId={currentMemberId}
            childOptions={childOptions}
            floating
            navIcon
          />

          <Link
            href="/resumen"
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-all active:scale-90",
              pathname === "/resumen"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Resumen"
          >
            <BarChart3Icon className="size-5" />
          </Link>

          <Link
            href={avatarHref}
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition-all active:scale-90",
              pathname.startsWith("/ajustes")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Perfil"
          >
            <UserIcon className="size-5" />
          </Link>
        </div>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-5 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle>Módulos</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {modules.map((key) => (
              <Link
                key={key}
                href={filterHref(key) ?? "/dashboard"}
                onClick={() => setSheetOpen(false)}
                className="whitespace-nowrap rounded-xl bg-muted/60 px-4 py-3 text-sm font-medium transition-transform active:scale-[0.98]"
              >
                {filterLabel(key)}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
