import { Card, CardContent } from "@/components/ui/card"
import type { Birthday } from "@/services/birthdays"

// "tu" gets the you-specific phrasing; anything else is treated as the
// (already comma-joined) name(s) of other members sharing this day count.
function countdownLabel(daysUntil: number, subject: "tu" | string): string {
  const isViewer = subject === "tu"

  if (daysUntil === 0) {
    return isViewer ? "🎉 Es tu cumpleaños ¡Felicidades!" : `🎉 ¡Es el cumpleaños de ${subject}!`
  }

  const verb = daysUntil === 1 ? "Queda" : "Quedan"
  const dayWord = daysUntil === 1 ? "día" : "días"
  return isViewer
    ? `🎉 ${verb} ${daysUntil} ${dayWord} para tu cumpleaños`
    : `🎉 ${verb} ${daysUntil} ${dayWord} para el cumpleaños de ${subject}`
}

// A plain notice, not a task — birthdays are announced here and nowhere else
// (no Task row, no checkbox, nothing to complete). Starts counting down a
// week out, so it's not a surprise the day it actually arrives.
export function BirthdayBanner({
  birthdays,
  viewerMemberId,
}: {
  birthdays: Birthday[]
  viewerMemberId: string
}) {
  if (birthdays.length === 0) return null

  // Grouped by daysUntil — two members with different countdowns each get
  // their own line, soonest first.
  const byDaysUntil = new Map<number, Birthday[]>()
  for (const b of birthdays) {
    byDaysUntil.set(b.daysUntil, [...(byDaysUntil.get(b.daysUntil) ?? []), b])
  }

  const lines = [...byDaysUntil.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([daysUntil, group]) => {
      const isViewer = group.some((b) => b.memberId === viewerMemberId)
      const others = group.filter((b) => b.memberId !== viewerMemberId)
      return [
        isViewer ? countdownLabel(daysUntil, "tu") : null,
        others.length > 0 ? countdownLabel(daysUntil, others.map((o) => o.name).join(", ")) : null,
      ].filter((line): line is string => line !== null)
    })

  return (
    <Card className="border-none bg-secondary/60">
      <CardContent className="space-y-1 py-4">
        {lines.map((line) => (
          <p key={line} className="font-medium">
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}
