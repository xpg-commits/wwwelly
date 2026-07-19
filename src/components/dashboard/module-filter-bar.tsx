import Link from "next/link"

import { ALL_FILTER_KEY, filterLabel, type FilterKey } from "@/lib/modules"
import { cn } from "@/lib/utils"

// Plain server-rendered links with query params — no client JS needed, the
// active chip is just whichever one matches the current URL. Horizontal
// scroll instead of wrapping keeps this a single row on a phone even with
// every module enabled, which is the point (mobile-first quick access).
// Order comes straight from Configuración del hogar's manual reordering.
export function ModuleFilterBar({
  order,
  enabled,
  activeModule,
  ver,
}: {
  order: FilterKey[]
  enabled: FilterKey[]
  activeModule?: FilterKey
  ver?: string
}) {
  const verSuffix = ver ? `&ver=${ver}` : ""
  const enabledSet = new Set(enabled)

  const visible = order.filter((key) => enabledSet.has(key))

  const chips = visible.map((key) => ({
    key,
    label: filterLabel(key),
    // "Lista de la compra" isn't a generic task list — it's its own page
    // with its own checkable items, so this chip skips the dashboard filter
    // entirely and goes straight there, same as the global nav already does.
    href:
      key === "SHOPPING"
        ? "/compras"
        : key === ALL_FILTER_KEY
          ? `/dashboard?${ver ? `ver=${ver}` : ""}`
          : `/dashboard?modulo=${key}${verSuffix}`,
  }))

  return (
    <div
      data-tour="module-filter"
      className="-mx-6 flex gap-2.5 overflow-x-auto px-6 pt-1.5 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip, i) => {
        const isActive = chip.key === (activeModule ?? ALL_FILTER_KEY)
        return (
          <Link
            key={chip.key}
            href={chip.href}
            style={{ "--stagger": i } as React.CSSProperties}
            className={cn(
              "stagger-in flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-[0_1px_2px_rgba(32,36,45,0.04)] ring-1 ring-foreground/[0.06] hover:text-foreground hover:shadow-[0_4px_12px_-2px_rgba(32,36,45,0.12)]"
            )}
          >
            {chip.label}
          </Link>
        )
      })}
    </div>
  )
}
