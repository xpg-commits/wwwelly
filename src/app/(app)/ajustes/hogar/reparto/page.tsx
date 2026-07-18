import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { listChildren } from "@/services/children"
import { ChoreWizard } from "@/components/household/chore-wizard"
import type { ChoreWizardMember, ChoreWizardChild } from "@/actions/chores"

export default async function RepartoDeTareasPage() {
  const { householdId } = await requireActiveMember()
  const [household, childRows] = await Promise.all([
    auth.api.getFullOrganization({ headers: await headers() }),
    listChildren(householdId),
  ])

  const adults: ChoreWizardMember[] = (household?.members ?? [])
    .filter((m) => (m as { visibilityRole?: string }).visibilityRole === "ADULT")
    .map((m) => ({
      id: m.id,
      name: (m as { displayName?: string | null }).displayName ?? m.user.name,
    }))
  const childOptions: ChoreWizardChild[] = childRows.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reparto de tareas</h1>
        <p className="text-muted-foreground">
          Responde estas preguntas y te propondremos un reparto equitativo.
        </p>
      </div>

      {adults.length === 0 ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
          No hay miembros adultos en este hogar todavía.
        </p>
      ) : (
        <ChoreWizard adults={adults} childOptions={childOptions} />
      )}
    </div>
  )
}
