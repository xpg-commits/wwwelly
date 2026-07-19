"use server"

import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import * as habitService from "@/services/habits"
import type { HabitType } from "@/generated/prisma/enums"

type ActionResult = { success: true } | { success: false; error: string }

export async function createHabitAction(input: {
  title: string
  type: HabitType
  goalNote?: string
  intervalMinutes?: number
  activeFrom?: string
  activeTo?: string
}): Promise<ActionResult> {
  const { householdId, member } = await requireActiveMember()

  const title = input.title.trim()
  if (!title) {
    return { success: false, error: "Ponle un nombre al hábito." }
  }

  await habitService.createHabit({
    householdId,
    memberId: member.id,
    title,
    type: input.type,
    goalNote: input.goalNote?.trim() || null,
    intervalMinutes: input.type === "REMINDER" ? (input.intervalMinutes ?? 120) : null,
    activeFrom: input.type === "REMINDER" ? (input.activeFrom ?? "08:00") : null,
    activeTo: input.type === "REMINDER" ? (input.activeTo ?? "22:00") : null,
  })

  return { success: true }
}

async function assertHabitBelongsToMember(habitId: string, memberId: string) {
  const habit = await db.habit.findUnique({ where: { id: habitId }, select: { memberId: true } })
  return habit?.memberId === memberId
}

export async function logHabitAction(habitId: string): Promise<ActionResult> {
  const { member } = await requireActiveMember()
  if (!(await assertHabitBelongsToMember(habitId, member.id))) {
    return { success: false, error: "Hábito no encontrado." }
  }
  await habitService.logHabit(habitId)
  return { success: true }
}

export async function undoTodaysLogAction(habitId: string): Promise<ActionResult> {
  const { member } = await requireActiveMember()
  if (!(await assertHabitBelongsToMember(habitId, member.id))) {
    return { success: false, error: "Hábito no encontrado." }
  }
  await habitService.undoTodaysLog(habitId)
  return { success: true }
}

export async function archiveHabitAction(habitId: string): Promise<ActionResult> {
  const { member } = await requireActiveMember()
  if (!(await assertHabitBelongsToMember(habitId, member.id))) {
    return { success: false, error: "Hábito no encontrado." }
  }
  await habitService.archiveHabit(habitId)
  return { success: true }
}
