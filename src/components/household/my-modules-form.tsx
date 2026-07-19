"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { filterLabel, type FilterKey } from "@/lib/modules"
import { updateMyHiddenModulesAction } from "@/actions/household-settings"

// Personal display preference, layered on top of the household's own
// enabled-modules list (Configuración del hogar) — this only lets someone
// hide, from their own view, a module the household has already turned on.
export function MyModulesForm({
  householdEnabledModules,
  initialHidden,
}: {
  householdEnabledModules: FilterKey[]
  initialHidden: FilterKey[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [hiddenSet, setHiddenSet] = useState(new Set(initialHidden))

  function toggle(key: FilterKey, visible: boolean) {
    const previous = hiddenSet
    const next = new Set(hiddenSet)
    if (visible) next.delete(key)
    else next.add(key)
    setHiddenSet(next)
    startTransition(async () => {
      const result = await updateMyHiddenModulesAction(Array.from(next))
      if (!result.success) {
        toast.error(result.error)
        setHiddenSet(previous)
        return
      }
      router.refresh()
    })
  }

  if (householdEnabledModules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu hogar no tiene módulos activados todavía.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {householdEnabledModules.map((key) => (
        <div key={key} className="list-row justify-between">
          <span className="text-sm">{filterLabel(key)}</span>
          <Switch
            checked={!hiddenSet.has(key)}
            disabled={pending}
            onCheckedChange={(checked) => toggle(key, checked === true)}
            aria-label={`Mostrar ${filterLabel(key)}`}
          />
        </div>
      ))}
    </div>
  )
}
