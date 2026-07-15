import { addDays, endOfDay, startOfDay } from "date-fns"

import { db } from "@/lib/db"
import { visibleTaskWhere } from "@/lib/permissions"
import type { TaskDraft } from "@/lib/ai/schemas"

type VisibilityMember = { id: string; visibilityRole: string }

export type CreateTaskInput = {
  householdId: string
  title: string
  description?: string | null
  dueDate?: Date | null
  module?:
    | "GENERAL"
    | "HOME"
    | "VEHICLE"
    | "PET"
    | "CHILD"
    | "HEALTH"
    | "SHOPPING"
  assignedToMemberId?: string | null
}

export async function createTask(input: CreateTaskInput) {
  return db.task.create({
    data: {
      householdId: input.householdId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      module: input.module ?? "GENERAL",
      assignedToMemberId: input.assignedToMemberId ?? null,
      source: "MANUAL",
    },
  })
}

export async function setTaskStatus(taskId: string, done: boolean) {
  return db.task.update({
    where: { id: taskId },
    data: done
      ? { status: "DONE", completedAt: new Date() }
      : { status: "PENDING", completedAt: null },
  })
}

export type DashboardTasks = {
  today: Awaited<ReturnType<typeof db.task.findMany>>
  thisWeek: Awaited<ReturnType<typeof db.task.findMany>>
  later: Awaited<ReturnType<typeof db.task.findMany>>
}

export async function getDashboardTasks(
  householdId: string,
  member: VisibilityMember
): Promise<DashboardTasks> {
  const now = new Date()
  const todayEnd = endOfDay(now)
  const weekEnd = endOfDay(addDays(now, 6))

  const tasks = await db.task.findMany({
    where: {
      householdId,
      status: "PENDING",
      ...visibleTaskWhere(member),
    },
    include: { pet: true, vehicle: true, child: true, assignedTo: true },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  })

  const today = tasks.filter((t) => t.dueDate && t.dueDate <= todayEnd)
  const thisWeek = tasks.filter(
    (t) => t.dueDate && t.dueDate > todayEnd && t.dueDate <= weekEnd
  )
  const later = tasks.filter((t) => !t.dueDate || t.dueDate > weekEnd)

  return { today, thisWeek, later }
}

// Shared write path for anything that produces a batch of TaskDraft[] — the
// AI assistant today, routine templates later. Both are just different
// generators of the same draft shape; this is the one place that turns a
// draft into a real Task row, so recurrence/visibility defaults stay
// consistent regardless of where the plan came from.
export async function applyTaskPlan(
  householdId: string,
  drafts: TaskDraft[],
  options?: { source?: "AI" | "TEMPLATE"; aiGenerationId?: string }
) {
  const today = startOfDay(new Date())
  if (drafts.length === 0) return []

  return db.$transaction(
    drafts.map((draft) =>
      db.task.create({
        data: {
          householdId,
          title: draft.title,
          description: draft.description,
          module: draft.module,
          dueDate: addDays(today, draft.dueDateOffsetDays),
          source: options?.source ?? "AI",
          aiGenerationId: options?.aiGenerationId,
        },
      })
    )
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
