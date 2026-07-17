import Link from "next/link"

import { cn } from "@/lib/utils"

// Todos/Mías filter — inline now, not floating: the bottom nav already
// covers add-task and resumen, so this is the one control that's actually
// specific to the dashboard's own task list.
export function ViewToggle({
  ver,
  modulo,
}: {
  ver?: string
  modulo?: string
}) {
  const modSuffix = modulo ? `modulo=${modulo}&` : ""

  return (
    <div className="flex items-center gap-0.5 self-start rounded-full bg-card p-1 text-xs font-medium shadow-[0_1px_2px_rgba(70,60,140,0.04)] ring-1 ring-foreground/[0.06]">
      <Link
        href={`/dashboard?${modSuffix}`}
        className={cn(
          "rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95",
          !ver
            ? "bg-primary text-primary-foreground shadow-[0_2px_8px_-1px_rgba(70,60,140,0.4)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Todos
      </Link>
      <Link
        href={`/dashboard?${modSuffix}ver=mias`}
        className={cn(
          "rounded-full px-3.5 py-2 transition-all duration-200 active:scale-95",
          ver === "mias"
            ? "bg-primary text-primary-foreground shadow-[0_2px_8px_-1px_rgba(70,60,140,0.4)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Mías
      </Link>
    </div>
  )
}
