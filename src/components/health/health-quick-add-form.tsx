"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-2 sm:flex-row"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createTaskAction(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          formRef.current?.reset()
          router.refresh()
        })
      }}
    >
      <input type="hidden" name="module" value="HEALTH" />
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
      <Input name="dueDate" type="date" className="sm:w-40" />
      <Button type="submit" disabled={pending}>
        {pending ? "Añadiendo…" : "Añadir"}
      </Button>
    </form>
  )
}
