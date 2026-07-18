"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getTaskDetailAction,
  updateTaskAction,
  setTaskStatusAction,
  type TaskDetail,
  type TaskDetailMember,
  type TaskDetailChild,
} from "@/actions/tasks"

const UNASSIGNED = "__unassigned__"

export function TaskDetailDialog({
  taskId,
  open,
  onOpenChange,
}: {
  taskId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [members, setMembers] = useState<TaskDetailMember[]>([])
  const [childOptions, setChildOptions] = useState<TaskDetailChild[]>([])

  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignee, setAssignee] = useState(UNASSIGNED)
  const [involvedChildIds, setInvolvedChildIds] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getTaskDetailAction(taskId).then((result) => {
      if (!result.success) {
        toast.error(result.error)
        onOpenChange(false)
        return
      }
      const { task: t, members: m, children: c } = result.data
      setTask(t)
      setMembers(m)
      setChildOptions(c)
      setTitle(t.title)
      setDueDate(t.dueDate ? format(t.dueDate, "yyyy-MM-dd") : "")
      setAssignee(t.assignedToMemberId ?? UNASSIGNED)
      setInvolvedChildIds(t.involvedChildIds)
      setDone(t.status === "DONE")
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId])

  function save() {
    if (!task) return
    const formData = new FormData()
    formData.set("title", title)
    formData.set("dueDate", dueDate)
    if (assignee !== UNASSIGNED) formData.set("assignedToMemberId", assignee)
    for (const id of involvedChildIds) formData.append("involvedChildIds", id)

    startTransition(async () => {
      const result = await updateTaskAction(task.id, formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (done !== (task.status === "DONE")) {
        await setTaskStatusAction(task.id, done)
      }
      toast.success("Tarea actualizada.")
      router.refresh()
      onOpenChange(false)
    })
  }

  const createdByName = task?.createdBy
    ? (task.createdBy.displayName ?? task.createdBy.user.name)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            Cámbiala, reasígnala, o márcala hecha desde aquí.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox checked={done} onCheckedChange={(c) => setDone(c === true)} />
              <Label className="cursor-pointer" onClick={() => setDone((d) => !d)}>
                {done ? "Hecha" : "Pendiente"}
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <DatePickerField value={dueDate} onChange={setDueDate} placeholder="Sin fecha" />
            </div>

            {members.length > 0 && (
              <div className="space-y-2">
                <Label>Asignada a</Label>
                <Select
                  value={assignee}
                  onValueChange={(value) => setAssignee(value ?? UNASSIGNED)}
                  items={{
                    [UNASSIGNED]: "Sin asignar",
                    ...Object.fromEntries(members.map((m) => [m.id, m.name])),
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {childOptions.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {childOptions.length > 1
                    ? "Implicar a los niños"
                    : `Implicar a ${childOptions[0].name}`}
                </Label>
                <div className="flex flex-wrap gap-3">
                  {childOptions.map((c) => {
                    const checked = involvedChildIds.includes(c.id)
                    return (
                      <label key={c.id} className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setInvolvedChildIds((prev) =>
                              v === true
                                ? [...prev, c.id]
                                : prev.filter((id) => id !== c.id)
                            )
                          }
                        />
                        {c.name}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {task && (
              <p className="text-xs text-muted-foreground">
                Creada
                {createdByName ? ` por ${createdByName}` : ""} el{" "}
                {format(task.createdAt, "d MMM yyyy", { locale: es })}
                {task.completedAt &&
                  ` · Hecha el ${format(task.completedAt, "d MMM yyyy", { locale: es })}`}
              </p>
            )}

            <div className="flex gap-2">
              <Button onClick={save} disabled={pending}>
                {pending ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
