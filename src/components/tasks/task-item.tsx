"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "motion/react"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { setTaskStatusAction } from "@/actions/tasks"
import { memberColorVar } from "@/lib/memberColors"
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog"

type TaskItemProps = {
  id: string
  title: string
  dueDate: Date | null
  overdue?: boolean
  defaultDone?: boolean
  completedAt?: Date | null
  subtitle?: string | null
  recurring?: boolean
  assignedToColor?: string | null
  index?: number
}

export function TaskItem({
  id,
  title,
  dueDate,
  overdue = false,
  defaultDone = false,
  completedAt,
  subtitle,
  recurring = false,
  assignedToColor = null,
  index = 0,
}: TaskItemProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pulseKey, setPulseKey] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)

  const dateLabel = completedAt
    ? `Hecha el ${format(completedAt, "d MMM", { locale: es })}`
    : dueDate
      ? format(dueDate, "d MMM", { locale: es })
      : null

  return (
    <div
      className="list-row stagger-in has-[[data-disabled]]:opacity-60"
      style={{ "--stagger": index } as React.CSSProperties}
    >
      <motion.span
        key={pulseKey}
        initial={pulseKey > 0 ? { scale: 1.35 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="inline-flex"
      >
        <Checkbox
          defaultChecked={defaultDone}
          disabled={pending}
          onCheckedChange={(checked) => {
            if (checked === true) setPulseKey((k) => k + 1)
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
      </motion.span>
      <button
        type="button"
        className="flex flex-1 items-center gap-2 text-left text-sm"
        onClick={() => setDetailOpen(true)}
      >
        {assignedToColor && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: memberColorVar(assignedToColor) }}
            aria-hidden
          />
        )}
        {title}
        {recurring && <span title="Se repite">🔁</span>}
        {subtitle && <Badge variant="secondary">{subtitle}</Badge>}
      </button>
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
      <TaskDetailDialog taskId={id} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
