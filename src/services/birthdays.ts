import { differenceInCalendarDays, startOfDay } from "date-fns"

import { db } from "@/lib/db"

export type Birthday = { memberId: string; name: string; daysUntil: number }

// How many days ahead the countdown starts showing up on the dashboard.
const LOOKAHEAD_DAYS = 7

// birthDate is stored as "yyyy-MM-dd" (Better Auth additionalField on User,
// see src/lib/auth.ts) — only the "MM-dd" part matters here, the year is
// irrelevant to a recurring birthday.
function daysUntilNextBirthday(birthDate: string, today: Date): number {
  const [, month, day] = birthDate.split("-").map(Number)
  let next = startOfDay(new Date(today.getFullYear(), month - 1, day))
  if (next < today) {
    next = startOfDay(new Date(today.getFullYear() + 1, month - 1, day))
  }
  return differenceInCalendarDays(next, today)
}

export async function getUpcomingBirthdays(householdId: string): Promise<Birthday[]> {
  const today = startOfDay(new Date())

  const members = await db.householdMember.findMany({
    where: { organizationId: householdId },
    select: { id: true, displayName: true, user: { select: { name: true, birthDate: true } } },
  })

  const birthdays: Birthday[] = []
  for (const m of members) {
    if (!m.user.birthDate) continue
    const daysUntil = daysUntilNextBirthday(m.user.birthDate, today)
    if (daysUntil <= LOOKAHEAD_DAYS) {
      birthdays.push({ memberId: m.id, name: m.displayName ?? m.user.name, daysUntil })
    }
  }
  return birthdays
}
