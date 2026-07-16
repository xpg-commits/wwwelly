"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  generateTaskPlanAction,
  confirmTaskPlanAction,
} from "@/actions/ai"
import type { TaskDraft } from "@/lib/ai/schemas"
import type { HouseholdEntityContext } from "@/lib/ai/taskPlanner"

const MODULE_LABEL: Record<TaskDraft["module"], string> = {
  GENERAL: "General",
  HOME: "Hogar",
  VEHICLE: "Vehículo",
  PET: "Mascota",
  CHILD: "Niños",
  HEALTH: "Salud",
  SHOPPING: "Compras",
}

function recurrenceLabel(draft: TaskDraft): string | null {
  if (!draft.recurrenceType || !draft.recurrenceIntervalDays) return null
  const days = draft.recurrenceIntervalDays
  if (days >= 350 && days <= 380) return "🔁 Anual"
  if (days >= 28 && days <= 31) return "🔁 Mensual"
  return `🔁 Cada ${days} días`
}

function linkedEntityLabel(
  draft: TaskDraft,
  entityContext: HouseholdEntityContext
): string | null {
  if (draft.petId) {
    const pet = entityContext.pets.find((p) => p.id === draft.petId)
    return pet ? `🐾 ${pet.label}` : null
  }
  if (draft.vehicleId) {
    const vehicle = entityContext.vehicles.find((v) => v.id === draft.vehicleId)
    return vehicle ? `🚗 ${vehicle.label}` : null
  }
  if (draft.childId) {
    const child = entityContext.children.find((c) => c.id === draft.childId)
    return child ? `👶 ${child.label}` : null
  }
  if (draft.relatedMemberId) {
    const member = entityContext.members.find((m) => m.id === draft.relatedMemberId)
    return member ? `🙋 ${member.label}` : null
  }
  return null
}

type Plan = {
  aiGenerationId: string
  drafts: TaskDraft[]
  entityContext: HouseholdEntityContext
}

export function AssistantForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())

  function reset() {
    setPlan(null)
    setExcluded(new Set())
  }

  return (
    <div className="space-y-6">
      {!plan && (
        <form
          className="space-y-3"
          action={(formData: FormData) => {
            startTransition(async () => {
              const result = await generateTaskPlanAction(formData)
              if (!result.success) {
                toast.error(result.error)
                return
              }
              if (result.data.drafts.length === 0) {
                toast.info(
                  "No he encontrado tareas claras en esa frase. Prueba a dar más detalle."
                )
                return
              }
              setPlan(result.data)
            })
          }}
        >
          <Textarea
            name="inputText"
            placeholder="Ej: mi hija empieza el colegio en septiembre"
            rows={3}
            required
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Pensando…" : "Generar plan"}
          </Button>
        </form>
      )}

      {plan && (
        <div className="space-y-4">
          <div className="space-y-2">
            {plan.drafts.map((draft, index) => {
              const isExcluded = excluded.has(index)
              const date = addDays(new Date(), draft.dueDateOffsetDays)
              return (
                <Card key={index} className={isExcluded ? "opacity-50" : ""}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <Checkbox
                      checked={!isExcluded}
                      onCheckedChange={(checked) => {
                        setExcluded((prev) => {
                          const next = new Set(prev)
                          if (checked) next.delete(index)
                          else next.add(index)
                          return next
                        })
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{draft.title}</p>
                        <Badge variant="secondary">
                          {MODULE_LABEL[draft.module]}
                        </Badge>
                        {recurrenceLabel(draft) && (
                          <Badge variant="outline">{recurrenceLabel(draft)}</Badge>
                        )}
                        {linkedEntityLabel(draft, plan.entityContext) && (
                          <Badge variant="outline">
                            {linkedEntityLabel(draft, plan.entityContext)}
                          </Badge>
                        )}
                      </div>
                      {draft.description && (
                        <p className="text-sm text-muted-foreground">
                          {draft.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(date, "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Button
              disabled={pending || excluded.size === plan.drafts.length}
              onClick={() => {
                const selected = plan.drafts.filter(
                  (_, index) => !excluded.has(index)
                )
                startTransition(async () => {
                  const result = await confirmTaskPlanAction(
                    plan.aiGenerationId,
                    selected
                  )
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  toast.success(
                    `${selected.length} ${selected.length === 1 ? "tarea creada" : "tareas creadas"}.`
                  )
                  onSuccess?.()
                  router.push("/dashboard")
                  router.refresh()
                })
              }}
            >
              {pending ? "Creando…" : "Confirmar y crear tareas"}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={pending}>
              Empezar de nuevo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
