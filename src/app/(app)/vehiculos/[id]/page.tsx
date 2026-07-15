import { notFound } from "next/navigation"

import { requireActiveMember } from "@/lib/session"
import { getVehicle } from "@/services/vehicles"
import { getTasksForEntity } from "@/services/tasks"
import { QuickAddTaskForm } from "@/components/tasks/quick-add-task-form"
import { TaskSection } from "@/components/tasks/task-section"

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { householdId, member } = await requireActiveMember()

  const vehicle = await getVehicle(id)
  if (!vehicle || vehicle.householdId !== householdId) {
    notFound()
  }

  const { pending, history } = await getTasksForEntity(member, { vehicleId: id })

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{vehicle.alias}</h1>
        <p className="text-muted-foreground">
          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Sin datos"}
          {vehicle.plate ? ` · ${vehicle.plate}` : ""}
        </p>
      </div>

      <QuickAddTaskForm hiddenFields={{ module: "VEHICLE", vehicleId: vehicle.id }} />

      <div className="space-y-6">
        <TaskSection
          icon="☑"
          title="Pendiente"
          tasks={pending}
          emptyLabel="Nada pendiente para este vehículo."
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
