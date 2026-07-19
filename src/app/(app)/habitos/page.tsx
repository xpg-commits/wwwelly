import { requireActiveMember } from "@/lib/session"
import { listHabitsForMember } from "@/services/habits"
import { HabitWizard } from "@/components/habits/habit-wizard"
import { HabitRow } from "@/components/habits/habit-row"

export default async function HabitosPage() {
  const { member } = await requireActiveMember()
  const habits = await listHabitsForMember(member.id)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hábitos</h1>
          <p className="text-muted-foreground">
            Cosas que quieres cuidar para ti — solo tú las ves.
          </p>
        </div>
        <HabitWizard />
      </div>

      {habits.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
          Todavía no tienes ningún hábito. Crea el primero.
        </p>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} showArchive />
          ))}
        </div>
      )}
    </div>
  )
}
