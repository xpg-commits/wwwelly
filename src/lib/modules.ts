// The toggleable modules a household can turn on/off from Configuración del
// hogar — GENERAL isn't here because the dashboard/general tasks always
// apply regardless of which domain modules a household actually uses.
export const HOUSEHOLD_MODULES = [
  { key: "HOME", label: "Hogar", href: "/hogar" },
  { key: "PET", label: "Mascotas", href: "/mascotas" },
  { key: "VEHICLE", label: "Vehículos", href: "/vehiculos" },
  { key: "CHILD", label: "Niños", href: "/ninos" },
  { key: "HEALTH", label: "Salud", href: "/salud" },
  { key: "SHOPPING", label: "Lista de la compra", href: "/compras" },
  { key: "HABIT", label: "Hábitos", href: "/habitos" },
] as const

export type HouseholdModuleKey = (typeof HOUSEHOLD_MODULES)[number]["key"]

export const ALL_MODULE_KEYS: HouseholdModuleKey[] = HOUSEHOLD_MODULES.map((m) => m.key)

export function isHouseholdModuleKey(value: unknown): value is HouseholdModuleKey {
  return typeof value === "string" && (ALL_MODULE_KEYS as string[]).includes(value)
}

// "Todo" (shows every module's tasks together) — a full citizen of the same
// order/enable list as the real modules, not a hardcoded first entry, so it
// can be repositioned or turned off from Configuración del hogar like the
// user asked.
export const ALL_FILTER_KEY = "ALL"

export type FilterKey = HouseholdModuleKey | typeof ALL_FILTER_KEY

export const DEFAULT_MODULE_ORDER: FilterKey[] = [ALL_FILTER_KEY, ...ALL_MODULE_KEYS]

export function isFilterKey(value: unknown): value is FilterKey {
  return value === ALL_FILTER_KEY || isHouseholdModuleKey(value)
}

// Anything missing from a stale/partial order (a module added to the app
// since a household's moduleOrder was last saved) still shows up, appended
// at the end — every read path that renders the module list from a saved
// moduleOrder needs this, not just the editor that lets you reorder it.
export function withBackfilledOrder(order: FilterKey[]): FilterKey[] {
  const result = [...order]
  for (const key of DEFAULT_MODULE_ORDER) {
    if (!result.includes(key)) result.push(key)
  }
  return result
}

export function filterLabel(key: FilterKey): string {
  if (key === ALL_FILTER_KEY) return "Todo"
  return HOUSEHOLD_MODULES.find((m) => m.key === key)?.label ?? key
}

export function filterHref(key: FilterKey): string | undefined {
  if (key === ALL_FILTER_KEY) return undefined
  return HOUSEHOLD_MODULES.find((m) => m.key === key)?.href
}
