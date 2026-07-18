import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { listChildren } from "@/services/children"
import { getTasksForEntity } from "@/services/tasks"
import { HealthQuickAddForm } from "@/components/health/health-quick-add-form"
import { TaskSection } from "@/components/tasks/task-section"

export default async function SaludPage() {
  const { householdId, member } = await requireActiveMember()
  const reqHeaders = await headers()

  const [household, children, { pending, history }] = await Promise.all([
    auth.api.getFullOrganization({ headers: reqHeaders }),
    listChildren(householdId),
    getTasksForEntity(member, { householdId, module: "HEALTH" }),
  ])

  const memberOptions = (household?.members ?? []).map((m) => ({
    value: `member:${m.id}`,
    label: m.user.name,
  }))
  const childOptions = children.map((c) => ({
    value: `child:${c.id}`,
    label: c.name,
  }))

  const withSubtitle = (tasks: typeof pending) =>
    tasks.map((t) => ({
      ...t,
      subtitle: t.child?.name ?? t.relatedMember?.user.name ?? null,
    }))

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Salud</h1>
        <p className="text-muted-foreground">
          Citas, analíticas y revisiones de toda la familia.
        </p>
      </div>

      <HealthQuickAddForm members={memberOptions} children={childOptions} />

      <div className="space-y-6">
        <TaskSection
          title="Pendiente"
          tasks={withSubtitle(pending)}
          emptyLabel="Nada pendiente de salud."
          markOverdue
        />
        <TaskSection
          title="Historial"
          tasks={withSubtitle(history)}
          emptyLabel="Todavía no hay nada en el historial."
          showAsDone
        />
      </div>
    </div>
  )
}
