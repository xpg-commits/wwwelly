"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { TrashIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  logHabitAction,
  undoTodaysLogAction,
  archiveHabitAction,
} from "@/actions/habits"
import type { HabitStatus } from "@/services/habits"

export function HabitRow({
  habit,
  showArchive = false,
}: {
  habit: HabitStatus
  showArchive?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggleCheckin(checked: boolean) {
    startTransition(async () => {
      const result = checked ? await logHabitAction(habit.id) : await undoTodaysLogAction(habit.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  function logReminder() {
    startTransition(async () => {
      const result = await logHabitAction(habit.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="list-row justify-between">
      <div className="flex flex-1 items-center gap-3">
        {habit.type === "CHECKIN" ? (
          <Checkbox
            checked={habit.doneToday}
            disabled={pending}
            onCheckedChange={(checked) => toggleCheckin(checked === true)}
          />
        ) : (
          <Button size="sm" variant={habit.dueNow ? "default" : "outline"} disabled={pending} onClick={logReminder}>
            Ya lo he hecho
          </Button>
        )}
        <div>
          <p className="text-sm font-medium">{habit.title}</p>
          <p className="text-xs text-muted-foreground">
            {habit.type === "CHECKIN"
              ? (habit.goalNote ?? (habit.doneToday ? "Hecho hoy" : "Pendiente hoy"))
              : habit.dueNow
                ? "Toca ahora"
                : habit.nextReminderAt
                  ? `Próximo aviso: ${format(habit.nextReminderAt, "HH:mm", { locale: es })}`
                  : null}
          </p>
        </div>
      </div>
      {showArchive && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Archivar">
                <TrashIcon className="size-3.5" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Archivar {habit.title}?</AlertDialogTitle>
              <AlertDialogDescription>
                Dejará de aparecer en tu lista de hábitos. El historial no se borra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  startTransition(async () => {
                    const result = await archiveHabitAction(habit.id)
                    if (!result.success) {
                      toast.error(result.error)
                      return
                    }
                    router.refresh()
                  })
                }}
              >
                Archivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
