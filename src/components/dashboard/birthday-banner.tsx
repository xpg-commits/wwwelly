import { Card, CardContent } from "@/components/ui/card"
import type { TodaysBirthday } from "@/services/birthdays"

// A plain notice, not a task — today's birthdays are announced here and
// nowhere else (no Task row, no checkbox, nothing to complete).
export function BirthdayBanner({
  birthdays,
  viewerMemberId,
}: {
  birthdays: TodaysBirthday[]
  viewerMemberId: string
}) {
  if (birthdays.length === 0) return null

  const isViewerBirthday = birthdays.some((b) => b.memberId === viewerMemberId)
  const others = birthdays.filter((b) => b.memberId !== viewerMemberId)

  return (
    <Card className="border-none bg-secondary/60">
      <CardContent className="space-y-1 py-4">
        {isViewerBirthday && <p className="font-medium">Es tu cumpleaños</p>}
        {others.length > 0 && (
          <p className="font-medium">
            Es el cumpleaños de {others.map((o) => o.name).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
