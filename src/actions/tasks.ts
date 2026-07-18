"use server"

import { headers } from "next/headers"

import { requireActiveMember } from "@/lib/session"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import * as taskService from "@/services/tasks"
import { TaskModule, RecurrenceType } from "@/generated/prisma/enums"

type ActionResult = { success: true } | { success: false; error: string }
type DataActionResult<T> = { success: true; data: T } | { success: false; error: string }

const VALID_MODULES = new Set<string>(Object.values(TaskModule))
const RECURRING_TYPES = new Set<string>([
  RecurrenceType.REACTIVE,
  RecurrenceType.FIXED_SCHEDULE,
])

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const { householdId, member } = await requireActiveMember()

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
  let childId = String(formData.get("childId") ?? "").trim() || undefined
  let relatedMemberId = String(formData.get("relatedMemberId") ?? "").trim() || undefined

  // The "¿para quién?" selector (used on /salud) packs type+id into one
  // value — e.g. "child:abc123" or "member:def456" — since a health task
  // targets exactly one of the two.
  const personSelector = String(formData.get("personSelector") ?? "").trim()
  if (personSelector) {
    const [kind, id] = personSelector.split(":")
    if (kind === "child") childId = id
    if (kind === "member") relatedMemberId = id
  }

  // Every foreign key here is a hidden/select value from our own forms, but
  // still client-supplied — verify each actually belongs to this household
  // before trusting it, same reasoning as the ownership check in
  // setTaskStatusAction.
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
  if (childId) {
    const child = await db.child.findUnique({
      where: { id: childId },
      select: { householdId: true },
    })
    if (!child || child.householdId !== householdId) {
      return { success: false, error: "No se encontró ese hijo/a." }
    }
  }
  if (relatedMemberId) {
    const relatedMember = await db.householdMember.findUnique({
      where: { id: relatedMemberId },
      select: { organizationId: true },
    })
    if (!relatedMember || relatedMember.organizationId !== householdId) {
      return { success: false, error: "No se encontró ese miembro." }
    }
  }

  // Defaults to whoever's creating it, unless a specific person was chosen
  // in the "¿para quién?" selector (or the AI assistant set one explicitly).
  const assignedToMemberIdRaw = String(formData.get("assignedToMemberId") ?? "").trim()
  let assignedToMemberId = assignedToMemberIdRaw || member.id
  if (assignedToMemberId !== member.id) {
    const assignedMember = await db.householdMember.findUnique({
      where: { id: assignedToMemberId },
      select: { organizationId: true },
    })
    if (!assignedMember || assignedMember.organizationId !== householdId) {
      return { success: false, error: "No se encontró ese miembro." }
    }
  }

  const recurrenceTypeRaw = String(formData.get("recurrenceType") ?? "").trim()
  const recurrenceIntervalDaysRaw = String(
    formData.get("recurrenceIntervalDays") ?? ""
  ).trim()
  const intervalDays = Number(recurrenceIntervalDaysRaw)
  const recurrenceType =
    RECURRING_TYPES.has(recurrenceTypeRaw) && Number.isInteger(intervalDays) && intervalDays > 0
      ? (recurrenceTypeRaw as RecurrenceType)
      : undefined
  const recurrenceIntervalDays = recurrenceType ? intervalDays : undefined

  // Kids helping/participating in the task — a hidden checkbox list, still
  // client-supplied, so re-verify every id actually belongs to this
  // household before trusting it (same reasoning as petId/vehicleId/etc).
  const involvedChildIdsRaw = formData.getAll("involvedChildIds").map(String)
  const involvedChildIds = involvedChildIdsRaw.length > 0
    ? (
        await db.child.findMany({
          where: { id: { in: involvedChildIdsRaw }, householdId },
          select: { id: true },
        })
      ).map((c) => c.id)
    : []

  await taskService.createTask({
    householdId,
    title,
    dueDate,
    module,
    petId,
    vehicleId,
    childId,
    relatedMemberId,
    assignedToMemberId,
    createdByMemberId: member.id,
    recurrenceType,
    recurrenceIntervalDays,
    involvedChildIds,
  })

  return { success: true }
}

export async function updateTaskAction(
  taskId: string,
  formData: FormData
): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { householdId: true },
  })
  if (!task || task.householdId !== householdId) {
    return { success: false, error: "Tarea no encontrada." }
  }

  const title = String(formData.get("title") ?? "").trim()
  if (!title) {
    return { success: false, error: "Ponle un título a la tarea." }
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "").trim()
  const dueDate = dueDateRaw ? new Date(`${dueDateRaw}T00:00:00`) : null

  const assignedToMemberIdRaw = String(formData.get("assignedToMemberId") ?? "").trim()
  let assignedToMemberId: string | null = assignedToMemberIdRaw || null
  if (assignedToMemberId) {
    const assignedMember = await db.householdMember.findUnique({
      where: { id: assignedToMemberId },
      select: { organizationId: true },
    })
    if (!assignedMember || assignedMember.organizationId !== householdId) {
      return { success: false, error: "No se encontró ese miembro." }
    }
  }

  const involvedChildIdsRaw = formData.getAll("involvedChildIds").map(String)
  const involvedChildIds = involvedChildIdsRaw.length > 0
    ? (
        await db.child.findMany({
          where: { id: { in: involvedChildIdsRaw }, householdId },
          select: { id: true },
        })
      ).map((c) => c.id)
    : []

  await taskService.updateTask(taskId, {
    title,
    dueDate,
    assignedToMemberId,
    involvedChildIds,
  })
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

export type TaskDetail = NonNullable<Awaited<ReturnType<typeof taskService.getTask>>>
export type TaskDetailMember = { id: string; name: string }
export type TaskDetailChild = { id: string; name: string }

export async function getTaskDetailAction(
  taskId: string
): Promise<
  DataActionResult<{ task: TaskDetail; members: TaskDetailMember[]; children: TaskDetailChild[] }>
> {
  const { householdId } = await requireActiveMember()

  const task = await taskService.getTask(taskId)
  if (!task || task.householdId !== householdId) {
    return { success: false, error: "Tarea no encontrada." }
  }

  const [household, childRows] = await Promise.all([
    auth.api.getFullOrganization({ headers: await headers() }),
    db.child.findMany({ where: { householdId }, select: { id: true, name: true } }),
  ])
  const members = (household?.members ?? []).map((m) => ({
    id: m.id,
    name: (m as { displayName?: string | null }).displayName ?? m.user.name,
  }))

  return { success: true, data: { task, members, children: childRows } }
}
