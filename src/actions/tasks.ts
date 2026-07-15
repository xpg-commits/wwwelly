"use server"

import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import * as taskService from "@/services/tasks"
import { TaskModule } from "@/generated/prisma/enums"

type ActionResult = { success: true } | { success: false; error: string }

const VALID_MODULES = new Set<string>(Object.values(TaskModule))

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const title = String(formData.get("title") ?? "").trim()
  if (!title) {
    return { success: false, error: "Ponle un título a la tarea." }
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = dueDateRaw ? new Date(`${dueDateRaw}T00:00:00`) : null

  const moduleRaw = String(formData.get("module") ?? "").trim()
  const module = VALID_MODULES.has(moduleRaw) ? (moduleRaw as TaskModule) : undefined

  const petId = String(formData.get("petId") ?? "").trim() || undefined
  const vehicleId = String(formData.get("vehicleId") ?? "").trim() || undefined

  // petId/vehicleId are hidden-input values from our own forms, but still
  // client-supplied — verify they actually belong to this household before
  // trusting them, same reasoning as the ownership check in setTaskStatusAction.
  if (petId) {
    const pet = await db.pet.findUnique({ where: { id: petId }, select: { householdId: true } })
    if (!pet || pet.householdId !== householdId) {
      return { success: false, error: "Mascota no encontrada." }
    }
  }
  if (vehicleId) {
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { householdId: true },
    })
    if (!vehicle || vehicle.householdId !== householdId) {
      return { success: false, error: "Vehículo no encontrado." }
    }
  }

  await taskService.createTask({ householdId, title, dueDate, module, petId, vehicleId })

  return { success: true }
}

export async function setTaskStatusAction(
  taskId: string,
  done: boolean
): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { householdId: true },
  })
  if (!task || task.householdId !== householdId) {
    return { success: false, error: "Tarea no encontrada." }
  }

  await taskService.setTaskStatus(taskId, done)
  return { success: true }
}
