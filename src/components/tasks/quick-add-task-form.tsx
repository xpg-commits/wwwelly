"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTaskAction } from "@/actions/tasks"

export function QuickAddTaskForm({
  hiddenFields,
}: {
  hiddenFields?: Record<string, string>
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
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <Input
        name="title"
        placeholder="Añadir algo que recordar…"
        required
        className="flex-1"
      />
      <Input name="dueDate" type="date" className="sm:w-40" />
      <Button type="submit" disabled={pending}>
        {pending ? "Añadiendo…" : "Añadir"}
      </Button>
    </form>
  )
}
