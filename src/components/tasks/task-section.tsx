import { startOfDay } from "date-fns"

import { TaskItem } from "@/components/tasks/task-item"

type TaskForSection = {
  id: string
  title: string
  dueDate: Date | null
  completedAt?: Date | null
  subtitle?: string | null
  recurrenceType?: string
}

export function TaskSection({
  icon,
  title,
  tasks,
  emptyLabel,
  markOverdue = false,
  showAsDone = false,
}: {
  icon: string
  title: string
  tasks: TaskForSection[]
  emptyLabel: string
  markOverdue?: boolean
  showAsDone?: boolean
}) {
  // Compare by calendar day, not exact timestamp — a task due later today
  // (dueDate stored at midnight) isn't "overdue" yet just because it's past
  // 00:00.
  const todayStart = startOfDay(new Date())

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-base font-semibold text-foreground/80">
        {icon} {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-muted/60 px-3.5 py-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              dueDate={task.dueDate}
              overdue={markOverdue && Boolean(task.dueDate && task.dueDate < todayStart)}
              defaultDone={showAsDone}
              completedAt={showAsDone ? task.completedAt : null}
              subtitle={task.subtitle}
              recurring={Boolean(task.recurrenceType && task.recurrenceType !== "NONE")}
            />
          ))}
        </div>
      )}
    </section>
  )
}
