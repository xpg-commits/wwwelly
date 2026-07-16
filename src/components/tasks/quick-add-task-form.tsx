"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { RecurrenceFields } from "@/components/tasks/recurrence-fields"
import { createTaskAction } from "@/actions/tasks"

export function QuickAddTaskForm({
  hiddenFields,
  onSuccess,
}: {
  hiddenFields?: Record<string, string>
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dueDate, setDueDate] = useState("")
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
      <RecurrenceFields />
    </form>
  )
}
