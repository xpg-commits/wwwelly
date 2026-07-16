"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type Person = { value: string; label: string }

export function HealthQuickAddForm({
  members,
  children,
}: {
  members: Person[]
  children: Person[]
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
        })
      }}
    >
      <input type="hidden" name="module" value="HEALTH" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="title"
          placeholder="Ej: revisión pediatra"
          required
          className="flex-1"
        />
        <Select name="personSelector" required>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="¿Para quién?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
            {children.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
