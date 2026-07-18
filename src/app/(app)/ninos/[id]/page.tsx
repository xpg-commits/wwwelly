import { notFound } from "next/navigation"

import { requireActiveMember } from "@/lib/session"
import { getChild } from "@/services/children"
import { getTasksForEntity } from "@/services/tasks"
import { QuickAddTaskForm } from "@/components/tasks/quick-add-task-form"
import { TaskSection } from "@/components/tasks/task-section"
import { EntityPhotoUpload } from "@/components/shared/entity-photo-upload"
import { updateChildPhotoAction } from "@/actions/children"

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { householdId, member } = await requireActiveMember()

  const child = await getChild(id)
  if (!child || child.householdId !== householdId) {
    notFound()
  }

  const { pending, history } = await getTasksForEntity(member, { childId: id })

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div className="flex items-center gap-4">
        <EntityPhotoUpload
          currentUrl={child.photoUrl}
          fallbackText={child.name.charAt(0).toUpperCase()}
          uploadAction={updateChildPhotoAction.bind(null, child.id)}
        />
        <h1 className="text-2xl font-semibold tracking-tight">{child.name}</h1>
      </div>

      <QuickAddTaskForm hiddenFields={{ module: "CHILD", childId: child.id }} />

      <div className="space-y-6">
        <TaskSection
          title="Pendiente"
          tasks={pending}
          emptyLabel="Nada pendiente."
          markOverdue
        />
        <TaskSection
          title="Historial"
          tasks={history}
          emptyLabel="Todavía no hay nada en el historial."
          showAsDone
        />
      </div>
    </div>
  )
}
