import { headers } from "next/headers"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import { getDashboardTasks, countCompletedThisWeek } from "@/services/tasks"
import { getTodaysBirthdays } from "@/services/birthdays"
import { listHabitsForMember } from "@/services/habits"
import { TaskSection } from "@/components/tasks/task-section"
import { HabitRow } from "@/components/habits/habit-row"
import { ModuleFilterBar } from "@/components/dashboard/module-filter-bar"
import { ViewToggle } from "@/components/dashboard/view-toggle"
import { GettingStartedBanner } from "@/components/dashboard/getting-started-banner"
import { BirthdayBanner } from "@/components/dashboard/birthday-banner"
import {
  DEFAULT_MODULE_ORDER,
  isFilterKey,
  isHouseholdModuleKey,
  withBackfilledOrder,
  type FilterKey,
} from "@/lib/modules"
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
  const householdEnabled: FilterKey[] = Array.isArray(rawEnabled)
    ? rawEnabled.filter(isFilterKey)
    : DEFAULT_MODULE_ORDER
  const myHiddenModules = (member as { hiddenModules?: string[] }).hiddenModules ?? []
  // Household-wide enabled set, minus whatever THIS person has personally
  // hidden from their own view — same rule as (app)/layout.tsx.
  const enabledModules = householdEnabled.filter(
    (key) => key === "ALL" || !myHiddenModules.includes(key)
  )
  const rawOrder = (household as { moduleOrder?: unknown })?.moduleOrder
  const moduleOrder: FilterKey[] = withBackfilledOrder(
    Array.isArray(rawOrder) ? rawOrder.filter(isFilterKey) : DEFAULT_MODULE_ORDER
  )
  const [
    { today, tomorrow, next7Days, later },
    completedThisWeek,
    homeTaskCount,
    childCount,
    birthdays,
    habits,
  ] = await Promise.all([
    getDashboardTasks(householdId, member, {
      module: activeModule as TaskModule | undefined,
      onlyAssignedToMemberId: onlyMine ? member.id : undefined,
    }),
    countCompletedThisWeek(householdId, member),
    db.task.count({ where: { householdId, module: "HOME" } }),
    db.child.count({ where: { householdId } }),
    getTodaysBirthdays(householdId),
    enabledModules.includes("HABIT") ? listHabitsForMember(member.id) : Promise.resolve([]),
  ])

  const adultCount = (household?.members ?? []).filter(
    (m) => (m as { visibilityRole?: string }).visibilityRole === "ADULT"
  ).length

  const firstName = session.user.name?.split(" ")[0] ?? ""

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-12">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenos días, {firstName}
        </h1>
        {completedThisWeek > 0 && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Esta semana has vaciado tu cabeza de {completedThisWeek}{" "}
            {completedThisWeek === 1 ? "tarea" : "tareas"}.
          </p>
        )}
      </div>

      <BirthdayBanner birthdays={birthdays} viewerMemberId={member.id} />

      {homeTaskCount === 0 && !(member as { gettingStartedDismissed?: boolean }).gettingStartedDismissed && (
        <GettingStartedBanner adultCount={adultCount} childCount={childCount} />
      )}

      <div className="space-y-3">
        <ModuleFilterBar
          order={moduleOrder}
          enabled={enabledModules}
          activeModule={activeModule}
          ver={ver}
        />
        <div className="flex justify-end">
          <ViewToggle ver={ver} modulo={activeModule} />
        </div>
      </div>

      {habits.length > 0 && (
        <section className="space-y-3.5">
          <h2 className="font-heading text-base font-semibold text-foreground/80">
            Hábitos de hoy
          </h2>
          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </section>
      )}

      <div data-tour="task-list" className="space-y-8">
        <TaskSection
          title={`Hoy, ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}`}
          tasks={today}
          emptyLabel="Nada urgente para hoy."
          markOverdue
        />
        <TaskSection
          title={`Mañana, ${format(addDays(new Date(), 1), "EEEE d 'de' MMMM", { locale: es })}`}
          tasks={tomorrow}
          emptyLabel="Nada para mañana."
        />
        <TaskSection
          title="En los próximos 7 días"
          tasks={next7Days}
          emptyLabel="Nada más en los próximos 7 días."
        />
        <TaskSection
          title="Más adelante"
          tasks={later}
          emptyLabel="Nada pendiente sin fecha próxima."
        />
      </div>

      <GuidedTour memberId={member.id} />
    </div>
  )
}
