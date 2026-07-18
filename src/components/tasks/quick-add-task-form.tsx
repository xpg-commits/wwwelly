"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecurrenceFields } from "@/components/tasks/recurrence-fields"
import { createTaskAction } from "@/actions/tasks"

export function QuickAddTaskForm({
  hiddenFields,
  members,
  currentMemberId,
  childOptions,
  onSuccess,
}: {
  hiddenFields?: Record<string, string>
  members?: { id: string; name: string }[]
  currentMemberId?: string
  // Kids (Niños module profiles) that can be marked as helping/participating
  // in this task — omitted entirely when the household has none registered.
  childOptions?: { id: string; name: string }[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dueDate, setDueDate] = useState("")
  const [involvedChildIds, setInvolvedChildIds] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-2"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createTaskAction(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          formRef.current?.reset()
          setDueDate("")
          setInvolvedChildIds([])
          router.refresh()
          onSuccess?.()
        })
      }}
    >
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="title"
          placeholder="Añadir algo que recordar…"
          required
          className="flex-1"
        />
        <DatePickerField
          name="dueDate"
          value={dueDate}
          onChange={setDueDate}
          placeholder="Fecha"
          className="sm:w-40"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Añadiendo…" : "Añadir"}
        </Button>
      </div>
      {members && members.length > 0 && (
        <Select
          name="assignedToMemberId"
          defaultValue={currentMemberId}
          items={Object.fromEntries(
            members.map((m) => [m.id, m.id === currentMemberId ? `${m.name} (tú)` : m.name])
          )}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="¿Para quién?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentMemberId ? `${m.name} (tú)` : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {childOptions && childOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {childOptions.length > 1 && (
            <span className="text-muted-foreground">Implicar a los niños:</span>
          )}
          {childOptions.map((c) => {
            const checked = involvedChildIds.includes(c.id)
            return (
              <label key={c.id} className="flex items-center gap-1.5">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setInvolvedChildIds((prev) =>
                      v === true ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                    )
                  }
                />
                {childOptions.length === 1 ? `Implicar a ${c.name} en esta tarea` : c.name}
              </label>
            )
          })}
          {involvedChildIds.map((id) => (
            <input key={id} type="hidden" name="involvedChildIds" value={id} />
          ))}
        </div>
      )}
      <RecurrenceFields />
    </form>
  )
}
