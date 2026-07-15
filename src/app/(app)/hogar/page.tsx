import { requireActiveMember } from "@/lib/session"
import { getTasksForEntity } from "@/services/tasks"
import { QuickAddTaskForm } from "@/components/tasks/quick-add-task-form"
import { TaskSection } from "@/components/tasks/task-section"

export default async function HogarPage() {
  const { householdId, member } = await requireActiveMember()

  const { pending, history } = await getTasksForEntity(member, {
    householdId,
    module: "HOME",
  })

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">🏠 Hogar</h1>
        <p className="text-muted-foreground">
          Filtros, aire acondicionado, jardín, pintura, electrodomésticos.
        </p>
      </div>

      <QuickAddTaskForm hiddenFields={{ module: "HOME" }} />

      <div className="space-y-6">
        <TaskSection
          icon="☑"
          title="Pendiente"
          tasks={pending}
          emptyLabel="Nada pendiente para el hogar."
          markOverdue
        />
        <TaskSection
          icon="📋"
          title="Historial"
          tasks={history}
          emptyLabel="Todavía no hay nada en el historial."
          showAsDone
        />
      </div>
    </div>
  )
}
