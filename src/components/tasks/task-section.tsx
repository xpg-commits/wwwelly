import { startOfDay } from "date-fns"

import { TaskItem } from "@/components/tasks/task-item"

type TaskForSection = {
  id: string
  title: string
  dueDate: Date | null
  completedAt?: Date | null
  subtitle?: string | null
  recurrenceType?: string
  assignedTo?: { color: string } | null
}

export function TaskSection({
  title,
  tasks,
  emptyLabel,
  markOverdue = false,
  showAsDone = false,
}: {
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
    <section className="space-y-3.5">
      <h2 className="font-heading text-base font-semibold text-foreground/80">
        {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task, index) => (
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
              assignedToColor={task.assignedTo?.color ?? null}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  )
}
