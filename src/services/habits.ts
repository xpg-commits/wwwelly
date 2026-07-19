import { startOfDay } from "date-fns"

import { db } from "@/lib/db"
import type { HabitType } from "@/generated/prisma/enums"

export type HabitInput = {
  householdId: string
  memberId: string
  title: string
  type: HabitType
  goalNote?: string | null
  intervalMinutes?: number | null
  activeFrom?: string | null
  activeTo?: string | null
}

export async function createHabit(input: HabitInput) {
  return db.habit.create({
    data: {
      householdId: input.householdId,
      memberId: input.memberId,
      title: input.title,
      type: input.type,
      goalNote: input.goalNote ?? null,
      intervalMinutes: input.intervalMinutes ?? null,
      activeFrom: input.activeFrom ?? null,
      activeTo: input.activeTo ?? null,
    },
  })
}

export async function archiveHabit(habitId: string) {
  return db.habit.update({ where: { id: habitId }, data: { archivedAt: new Date() } })
}

export async function logHabit(habitId: string) {
  return db.habitLog.create({ data: { habitId } })
}

// Only removes today's most recent log (an accidental tap), not the whole
// history — undoing never touches yesterday's or older entries.
export async function undoTodaysLog(habitId: string) {
  const log = await db.habitLog.findFirst({
    where: { habitId, loggedAt: { gte: startOfDay(new Date()) } },
    orderBy: { loggedAt: "desc" },
  })
  if (!log) return null
  return db.habitLog.delete({ where: { id: log.id } })
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function parseHHmm(value: string): number {
  const [h, m] = value.split(":").map(Number)
  return h * 60 + m
}

// No activeFrom/activeTo (CHECKIN habits, or a REMINDER without a window
// configured) reads as always-active rather than never-active.
function isWithinWindow(now: Date, activeFrom: string | null, activeTo: string | null): boolean {
  if (!activeFrom || !activeTo) return true
  const nowMinutes = minutesSinceMidnight(now)
  return nowMinutes >= parseHHmm(activeFrom) && nowMinutes <= parseHHmm(activeTo)
}

export type HabitStatus = {
  id: string
  title: string
  type: HabitType
  goalNote: string | null
  intervalMinutes: number | null
  activeFrom: string | null
  activeTo: string | null
  doneToday: boolean
  nextReminderAt: Date | null
  // True when this habit currently wants the member's attention: for
  // CHECKIN, simply "not done yet today"; for REMINDER, "the interval has
  // elapsed AND we're inside the active window" — there's no push behind
  // this, it just drives what gets highlighted in the UI right now.
  dueNow: boolean
}

export async function listHabitsForMember(memberId: string): Promise<HabitStatus[]> {
  const habits = await db.habit.findMany({
    where: { memberId, archivedAt: null },
    include: { logs: { orderBy: { loggedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  })

  const now = new Date()
  const todayStart = startOfDay(now)

  return habits.map((habit) => {
    const lastLog = habit.logs[0] ?? null

    if (habit.type === "CHECKIN") {
      const doneToday = Boolean(lastLog && lastLog.loggedAt >= todayStart)
      return {
        id: habit.id,
        title: habit.title,
        type: habit.type,
        goalNote: habit.goalNote,
        intervalMinutes: null,
        activeFrom: null,
        activeTo: null,
        doneToday,
        nextReminderAt: null,
        dueNow: !doneToday,
      }
    }

    const intervalMs = (habit.intervalMinutes ?? 120) * 60_000
    const nextReminderAt = lastLog ? new Date(lastLog.loggedAt.getTime() + intervalMs) : now
    const dueNow = isWithinWindow(now, habit.activeFrom, habit.activeTo) && nextReminderAt <= now

    return {
      id: habit.id,
      title: habit.title,
      type: habit.type,
      goalNote: habit.goalNote,
      intervalMinutes: habit.intervalMinutes,
      activeFrom: habit.activeFrom,
      activeTo: habit.activeTo,
      doneToday: false,
      nextReminderAt,
      dueNow,
    }
  })
}
