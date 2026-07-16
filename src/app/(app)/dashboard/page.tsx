import { requireActiveMember } from "@/lib/session"
import { getDashboardTasks, countCompletedThisWeek } from "@/services/tasks"
import { TaskSection } from "@/components/tasks/task-section"

export default async function DashboardPage() {
  const { session, member, householdId } = await requireActiveMember()

  const [{ today, thisWeek, later }, completedThisWeek] = await Promise.all([
    getDashboardTasks(householdId, member),
    countCompletedThisWeek(householdId, member),
  ])

  const firstName = session.user.name?.split(" ")[0] ?? ""

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenos días, {firstName} 👋
        </h1>
        {completedThisWeek > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Esta semana has vaciado tu cabeza de {completedThisWeek}{" "}
            {completedThisWeek === 1 ? "tarea" : "tareas"}.
          </p>
        )}
      </div>

      <div className="space-y-6">
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
    </div>
  )
}
