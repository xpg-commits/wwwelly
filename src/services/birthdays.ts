import { format } from "date-fns"

import { db } from "@/lib/db"

export type TodaysBirthday = { memberId: string; name: string }

// birthDate is stored as "yyyy-MM-dd" (Better Auth additionalField on User,
// see src/lib/auth.ts) — comparing the trailing "MM-dd" slice against today
// is enough, no need to parse it into a real Date.
export async function getTodaysBirthdays(householdId: string): Promise<TodaysBirthday[]> {
  const todayMonthDay = format(new Date(), "MM-dd")

  const members = await db.householdMember.findMany({
    where: { organizationId: householdId },
    select: { id: true, displayName: true, user: { select: { name: true, birthDate: true } } },
  })

  return members
    .filter((m) => m.user.birthDate && m.user.birthDate.slice(5, 10) === todayMonthDay)
    .map((m) => ({ memberId: m.id, name: m.displayName ?? m.user.name }))
}
