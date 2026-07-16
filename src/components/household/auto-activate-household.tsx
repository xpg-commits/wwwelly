"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { activateHouseholdAction } from "@/actions/household"

// Renders only for the one round-trip needed to fix up the session, then
// the layout re-renders with activeOrganizationId set and this disappears.
export function AutoActivateHousehold({ organizationId }: { organizationId: string }) {
  const router = useRouter()

  useEffect(() => {
    activateHouseholdAction(organizationId).then(() => {
      router.refresh()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <p className="text-sm text-muted-foreground">Cargando tu hogar…</p>
    </div>
  )
}
