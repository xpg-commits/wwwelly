"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { applyTemplateAction } from "@/actions/templates"
import type { TaskDraft } from "@/lib/ai/schemas"

const MODULE_LABEL: Record<TaskDraft["module"], string> = {
  GENERAL: "General",
  HOME: "Hogar",
  VEHICLE: "Vehículo",
  PET: "Mascota",
  CHILD: "Niños",
  HEALTH: "Salud",
  SHOPPING: "Compras",
}

type TemplateTask = {
  title: string
  description: string | null
  dayOffset: number
  module: TaskDraft["module"]
}

export function TemplateApplyForm({
  templateKey,
  tasks,
  triggerLabel,
}: {
  templateKey: string
  tasks: TemplateTask[]
  triggerLabel: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [triggerDate, setTriggerDate] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const drafts: TaskDraft[] = tasks.map((t) => ({
    title: t.title,
    description: t.description,
    module: t.module,
    dueDateOffsetDays: t.dayOffset,
    recurrenceType: null,
    recurrenceIntervalDays: null,
    petId: null,
    vehicleId: null,
    childId: null,
    relatedMemberId: null,
  }))

  if (!triggerDate) {
    return (
      <div className="space-y-3">
        <Label>{triggerLabel}</Label>
        <DatePickerField value={triggerDate} onChange={setTriggerDate} />
      </div>
    )
  }

  const anchor = new Date(`${triggerDate}T00:00:00`)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Fecha elegida: {format(anchor, "d MMM yyyy", { locale: es })}
        </p>
        <button
          type="button"
          onClick={() => setTriggerDate("")}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Cambiar fecha
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  <Badge variant="secondary">{MODULE_LABEL[task.module]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(addDays(anchor, task.dayOffset), "d MMM yyyy", { locale: es })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        disabled={pending || confirmed}
        onClick={() => {
          startTransition(async () => {
            const result = await applyTemplateAction(templateKey, anchor.toISOString(), drafts)
            if (!result.success) {
              toast.error(result.error)
              return
            }
            setConfirmed(true)
            toast.success(`${tasks.length} tareas creadas.`)
            router.push("/dashboard")
            router.refresh()
          })
        }}
      >
        {pending ? "Creando…" : `Confirmar y crear ${tasks.length} tareas`}
      </Button>
    </div>
  )
}
