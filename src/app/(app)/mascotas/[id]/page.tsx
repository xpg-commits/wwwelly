import { notFound } from "next/navigation"

import { requireActiveMember } from "@/lib/session"
import { getPet } from "@/services/pets"
import { getTasksForEntity } from "@/services/tasks"
import { QuickAddTaskForm } from "@/components/tasks/quick-add-task-form"
import { TaskSection } from "@/components/tasks/task-section"
import { EntityPhotoUpload } from "@/components/shared/entity-photo-upload"
import { updatePetPhotoAction } from "@/actions/pets"

export default async function MascotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { householdId, member } = await requireActiveMember()

  const pet = await getPet(id)
  if (!pet || pet.householdId !== householdId) {
    notFound()
  }

  const { pending, history } = await getTasksForEntity(member, { petId: id })

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div className="flex items-center gap-4">
        <EntityPhotoUpload
          currentUrl={pet.photoUrl}
          fallbackText={pet.name.charAt(0).toUpperCase()}
          uploadAction={updatePetPhotoAction.bind(null, pet.id)}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pet.name}</h1>
          <p className="text-muted-foreground">
            {pet.species}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
        </div>
      </div>

      <QuickAddTaskForm hiddenFields={{ module: "PET", petId: pet.id }} />

      <div className="space-y-6">
        <TaskSection
          title="Pendiente"
          tasks={pending}
          emptyLabel="Nada pendiente para esta mascota."
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
