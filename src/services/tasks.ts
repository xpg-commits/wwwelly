import { addDays, endOfDay, startOfDay } from "date-fns"

import { db } from "@/lib/db"
import { visibleTaskWhere } from "@/lib/permissions"
import { computeNextOccurrence } from "@/lib/recurrence"
import type { TaskDraft } from "@/lib/ai/schemas"
import type { TaskModule, RecurrenceType } from "@/generated/prisma/enums"

type VisibilityMember = { id: string; visibilityRole: string }

export type CreateTaskInput = {
  householdId: string
  title: string
  description?: string | null
  dueDate?: Date | null
  dueTime?: string | null
  module?: TaskModule
  petId?: string | null
  vehicleId?: string | null
  childId?: string | null
  relatedMemberId?: string | null
  assignedToMemberId?: string | null
  createdByMemberId?: string | null
  recurrenceType?: RecurrenceType
  recurrenceIntervalDays?: number | null
  involvedChildIds?: string[] | null
}

export async function createTask(input: CreateTaskInput) {
  return db.task.create({
    data: {
      householdId: input.householdId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      module: input.module ?? "GENERAL",
      petId: input.petId ?? null,
      vehicleId: input.vehicleId ?? null,
      childId: input.childId ?? null,
      relatedMemberId: input.relatedMemberId ?? null,
      assignedToMemberId: input.assignedToMemberId ?? null,
      createdByMemberId: input.createdByMemberId ?? null,
      recurrenceType: input.recurrenceType ?? "NONE",
      recurrenceIntervalDays: input.recurrenceIntervalDays ?? null,
      involvedChildIds: input.involvedChildIds ?? [],
      source: "MANUAL",
    },
  })
}

export type UpdateTaskInput = {
  title?: string
  dueDate?: Date | null
  assignedToMemberId?: string | null
  involvedChildIds?: string[]
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  return db.task.update({
    where: { id: taskId },
    data: input,
  })
}

export async function getTask(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: { include: { user: true } },
      createdBy: { include: { user: true } },
      pet: true,
      vehicle: true,
      child: true,
    },
  })
}

// Pending + done split for an entity's own page (pet/vehicle/child/module),
// as opposed to getDashboardTasks() which only returns PENDING for the Hoy/
// Esta semana/Más adelante view.
export async function getTasksForEntity(
  member: VisibilityMember,
  where:
    | { petId: string }
    | { vehicleId: string }
    | { childId: string }
    | { householdId: string; module: TaskModule }
) {
  const tasks = await db.task.findMany({
    where: { ...where, ...visibleTaskWhere(member) },
    include: {
      child: true,
      relatedMember: { include: { user: true } },
      assignedTo: { include: { user: true } },
      createdBy: { include: { user: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  })

  return {
    pending: tasks.filter((t) => t.status === "PENDING"),
    history: tasks
      .filter((t) => t.status === "DONE")
      .sort(
        (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
      ),
  }
}

export async function setTaskStatus(taskId: string, done: boolean) {
  if (!done) {
    // Reopening doesn't try to undo any next occurrence that recurrence may
    // already have generated — simplest correct behavior for the common
    // case (someone unchecked by mistake), not worth the extra bookkeeping
    // for the rare case (unchecking specifically to cancel the next one).
    return db.task.update({
      where: { id: taskId },
      data: { status: "PENDING", completedAt: null },
    })
  }

  const completedAt = new Date()

  return db.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: { status: "DONE", completedAt },
    })

    const nextDueDate = computeNextOccurrence({
      recurrenceType: task.recurrenceType,
      recurrenceIntervalDays: task.recurrenceIntervalDays,
      dueDate: task.dueDate,
      completedAt,
    })

    if (nextDueDate) {
      // Rotativo (2+ ids): the turn advances to whoever comes after the
      // current assignee in the roster, wrapping back to the start (and
      // restarting at index 0 if the current assignee somehow isn't in the
      // list). Fijo (0-1 ids): unchanged, same assignee every time.
      const rotation = task.rotationMemberIds
      const nextAssignedToMemberId =
        rotation.length > 1
          ? rotation[(rotation.indexOf(task.assignedToMemberId ?? "") + 1) % rotation.length]
          : task.assignedToMemberId

      await tx.task.create({
        data: {
          householdId: task.householdId,
          title: task.title,
          description: task.description,
          module: task.module,
          dueDate: nextDueDate,
          petId: task.petId,
          vehicleId: task.vehicleId,
          childId: task.childId,
          relatedMemberId: task.relatedMemberId,
          assignedToMemberId: nextAssignedToMemberId,
          rotationMemberIds: task.rotationMemberIds,
          involvedChildIds: task.involvedChildIds,
          recurrenceType: task.recurrenceType,
          recurrenceIntervalDays: task.recurrenceIntervalDays,
          previousTaskId: task.id,
          source: task.source,
        },
      })
    }

    return task
  })
}

export type DashboardTasks = {
  today: Awaited<ReturnType<typeof db.task.findMany>>
  tomorrow: Awaited<ReturnType<typeof db.task.findMany>>
  next7Days: Awaited<ReturnType<typeof db.task.findMany>>
  later: Awaited<ReturnType<typeof db.task.findMany>>
}

export async function getDashboardTasks(
  householdId: string,
  member: VisibilityMember,
  filters?: { module?: TaskModule; onlyAssignedToMemberId?: string }
): Promise<DashboardTasks> {
  const now = new Date()
  const todayEnd = endOfDay(now)
  const tomorrowStart = startOfDay(addDays(now, 1))
  const tomorrowEnd = endOfDay(addDays(now, 1))
  // "En los próximos 7 días" starts the day after mañana — a clean,
  // non-overlapping partition now that mañana is its own section.
  const next7End = endOfDay(addDays(now, 8))

  const tasks = await db.task.findMany({
    where: {
      householdId,
      status: "PENDING",
      ...(filters?.module ? { module: filters.module } : {}),
      ...(filters?.onlyAssignedToMemberId
        ? { assignedToMemberId: filters.onlyAssignedToMemberId }
        : {}),
      ...visibleTaskWhere(member),
    },
    include: {
      pet: true,
      vehicle: true,
      child: true,
      assignedTo: { include: { user: true } },
      createdBy: { include: { user: true } },
    },
    orderBy: [
      { dueDate: { sort: "asc", nulls: "last" } },
      { dueTime: { sort: "asc", nulls: "last" } },
      { createdAt: "asc" },
    ],
  })

  const today = tasks.filter((t) => t.dueDate && t.dueDate <= todayEnd)
  const tomorrow = tasks.filter(
    (t) => t.dueDate && t.dueDate >= tomorrowStart && t.dueDate <= tomorrowEnd
  )
  const next7Days = tasks.filter(
    (t) => t.dueDate && t.dueDate > tomorrowEnd && t.dueDate <= next7End
  )
  const later = tasks.filter((t) => !t.dueDate || t.dueDate > next7End)

  return { today, tomorrow, next7Days, later }
}

// Shared write path for anything that produces a batch of TaskDraft[] — the
// AI assistant (anchored to today) and routine templates (anchored to a
// trigger date the user picks) are just different generators of the same
// draft shape; this is the one place that turns a draft into a real Task
// row, so recurrence/visibility defaults stay consistent either way.
export async function applyTaskPlan(
  householdId: string,
  drafts: TaskDraft[],
  options?: {
    source?: "AI" | "TEMPLATE"
    aiGenerationId?: string
    anchorDate?: Date
    // Whoever confirmed the plan — the fallback assignee for any draft that
    // didn't name a specific person, same "assigned to whoever creates it"
    // default as a manually-added task.
    createdByMemberId?: string
  }
) {
  const anchor = startOfDay(options?.anchorDate ?? new Date())
  if (drafts.length === 0) return []

  return db.$transaction(
    drafts.map((draft) => {
      const rotationMemberIds = draft.rotationMemberIds ?? []
      return db.task.create({
        data: {
          householdId,
          title: draft.title,
          description: draft.description,
          module: draft.module,
          dueDate: addDays(anchor, draft.dueDateOffsetDays),
          source: options?.source ?? "AI",
          aiGenerationId: options?.aiGenerationId,
          recurrenceType: draft.recurrenceType ?? "NONE",
          recurrenceIntervalDays: draft.recurrenceIntervalDays,
          petId: draft.petId,
          vehicleId: draft.vehicleId,
          childId: draft.childId,
          relatedMemberId: draft.relatedMemberId,
          assignedToMemberId:
            draft.assignedToMemberId ?? rotationMemberIds[0] ?? options?.createdByMemberId ?? null,
          rotationMemberIds,
          involvedChildIds: draft.involvedChildIds ?? [],
          createdByMemberId: options?.createdByMemberId ?? null,
        },
      })
    })
  )
}

export async function countCompletedThisWeek(householdId: string, member: VisibilityMember) {
  const weekStart = startOfDay(addDays(new Date(), -6))
  return db.task.count({
    where: {
      householdId,
      status: "DONE",
      completedAt: { gte: weekStart },
      ...visibleTaskWhere(member),
    },
  })
}
