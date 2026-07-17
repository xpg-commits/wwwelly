import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { getDashboardTasks, countCompletedThisWeek } from "@/services/tasks"
import { TaskSection } from "@/components/tasks/task-section"
import { ModuleFilterBar } from "@/components/dashboard/module-filter-bar"
import { ViewToggle } from "@/components/dashboard/view-toggle"
import { DEFAULT_MODULE_ORDER, isFilterKey, isHouseholdModuleKey, type FilterKey } from "@/lib/modules"
import { TaskModule } from "@/generated/prisma/enums"
import { GuidedTour } from "@/components/onboarding/guided-tour"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string; ver?: string }>
}) {
  const { session, member, householdId } = await requireActiveMember()
  const { modulo, ver } = await searchParams

  const activeModule = isHouseholdModuleKey(modulo) ? modulo : undefined
  const onlyMine = ver === "mias"

  const reqHeaders = await headers()
  const household = await auth.api.getFullOrganization({ headers: reqHeaders })
  const rawEnabled = (household as { enabledModules?: unknown })?.enabledModules
  const enabledModules: FilterKey[] = Array.isArray(rawEnabled)
    ? rawEnabled.filter(isFilterKey)
    : DEFAULT_MODULE_ORDER
  const rawOrder = (household as { moduleOrder?: unknown })?.moduleOrder
  const moduleOrder: FilterKey[] = Array.isArray(rawOrder)
    ? rawOrder.filter(isFilterKey)
    : DEFAULT_MODULE_ORDER
  const primaryModuleKey =
    (household as { primaryModuleKey?: string | null })?.primaryModuleKey ?? null

  const [{ today, thisWeek, later }, completedThisWeek] = await Promise.all([
    getDashboardTasks(householdId, member, {
      module: activeModule as TaskModule | undefined,
      onlyAssignedToMemberId: onlyMine ? member.id : undefined,
    }),
    countCompletedThisWeek(householdId, member),
  ])

  const firstName = session.user.name?.split(" ")[0] ?? ""

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-12">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenos días, {firstName} 👋
        </h1>
        {completedThisWeek > 0 && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Esta semana has vaciado tu cabeza de {completedThisWeek}{" "}
            {completedThisWeek === 1 ? "tarea" : "tareas"}.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <ModuleFilterBar
          order={moduleOrder}
          enabled={enabledModules}
          primaryModuleKey={primaryModuleKey}
          activeModule={activeModule}
          ver={ver}
        />
        <div className="flex justify-end">
          <ViewToggle ver={ver} modulo={activeModule} />
        </div>
      </div>

      <div data-tour="task-list" className="space-y-8">
        <TaskSection
          icon="☑"
          title="Hoy"
          tasks={today}
          emptyLabel="Nada urgente para hoy."
          markOverdue
        />
        <TaskSection
          icon="📅"
          title="Esta semana"
          tasks={thisWeek}
          emptyLabel="Nada más esta semana."
        />
        <TaskSection
          icon="🌿"
          title="Más adelante"
          tasks={later}
          emptyLabel="Nada pendiente sin fecha próxima."
        />
      </div>

      <GuidedTour memberId={member.id} />
    </div>
  )
}
