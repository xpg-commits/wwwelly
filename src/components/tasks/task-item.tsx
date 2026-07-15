"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { setTaskStatusAction } from "@/actions/tasks"

type TaskItemProps = {
  id: string
  title: string
  dueDate: Date | null
  overdue?: boolean
  defaultDone?: boolean
  completedAt?: Date | null
  subtitle?: string | null
}

export function TaskItem({
  id,
  title,
  dueDate,
  overdue = false,
  defaultDone = false,
  completedAt,
  subtitle,
}: TaskItemProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const dateLabel = completedAt
    ? `Hecha el ${format(completedAt, "d MMM", { locale: es })}`
    : dueDate
      ? format(dueDate, "d MMM", { locale: es })
      : null

  return (
    <label className="flex items-center gap-3 rounded-md border px-3 py-2.5 has-[[data-disabled]]:opacity-60">
      <Checkbox
        defaultChecked={defaultDone}
        disabled={pending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            const result = await setTaskStatusAction(id, checked === true)
            if (!result.success) {
              toast.error(result.error)
              return
            }
            router.refresh()
          })
        }}
      />
      <span className="flex flex-1 items-center gap-2 text-sm">
        {title}
        {subtitle && <Badge variant="secondary">{subtitle}</Badge>}
      </span>
      {dateLabel && (
        <span
          className={
            overdue
              ? "text-xs font-medium text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {dateLabel}
        </span>
      )}
    </label>
  )
}
