"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  confirmChoreDistributionPlanAction,
  type ChoreWizardMember,
  type ChoreWizardChild,
} from "@/actions/chores"
import type { TaskDraft } from "@/lib/ai/schemas"

function recurrenceLabel(draft: TaskDraft): string | null {
  if (!draft.recurrenceType || !draft.recurrenceIntervalDays) return null
  const days = draft.recurrenceIntervalDays
  if (days >= 28 && days <= 31) return "Cada mes"
  if (days <= 2) return "Cada día"
  return `Cada ${days} días`
}

function memberName(id: string | null, members: ChoreWizardMember[]): string {
  return members.find((m) => m.id === id)?.name ?? "Sin asignar"
}

export function ChorePlanReview({
  plan,
  onReset,
  onConfirmed,
}: {
  plan: {
    aiGenerationId: string
    tasks: TaskDraft[]
    rationale: string
    members: ChoreWizardMember[]
    children: ChoreWizardChild[]
  }
  onReset: () => void
  onConfirmed: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [drafts, setDrafts] = useState<TaskDraft[]>(plan.tasks)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())

  function updateDraft(index: number, patch: Partial<TaskDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Propuesta de reparto</h2>
        <p className="text-sm text-muted-foreground">{plan.rationale}</p>
      </div>

      <div className="space-y-2">
        {drafts.map((draft, index) => {
          const isExcluded = excluded.has(index)
          const date = addDays(new Date(), draft.dueDateOffsetDays)
          const isRotating = (draft.rotationMemberIds ?? []).length > 1

          return (
            <Card key={index} className={isExcluded ? "opacity-50" : ""}>
              <CardContent className="space-y-2.5 py-3">
                <div className="flex items-start gap-3">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{draft.title}</p>
                      {recurrenceLabel(draft) && (
                        <Badge variant="outline">{recurrenceLabel(draft)}</Badge>
                      )}
                    </div>
                    {draft.description && (
                      <p className="text-sm text-muted-foreground">{draft.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Empieza el {format(date, "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                {isRotating ? (
                  <p className="pl-7 text-xs text-muted-foreground">
                    Rotativo:{" "}
                    {(draft.rotationMemberIds ?? [])
                      .map((id) => memberName(id, plan.members))
                      .join(" → ")}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-xs text-muted-foreground">Fijo:</span>
                    <Select
                      value={draft.assignedToMemberId ?? ""}
                      onValueChange={(v) => updateDraft(index, { assignedToMemberId: v || null })}
                      items={Object.fromEntries(plan.members.map((m) => [m.id, m.name]))}
                    >
                      <SelectTrigger className="h-7 w-auto text-xs" size="sm">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {plan.members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(draft.involvedChildIds ?? []).length > 0 && (
                  <p className="pl-7 text-xs text-muted-foreground">
                    Con{" "}
                    {(draft.involvedChildIds ?? [])
                      .map((id) => plan.children.find((c) => c.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button
          disabled={pending || excluded.size === drafts.length}
          onClick={() => {
            const selected = drafts.filter((_, index) => !excluded.has(index))
            startTransition(async () => {
              const result = await confirmChoreDistributionPlanAction(
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
              onConfirmed()
            })
          }}
        >
          {pending ? "Creando…" : "Confirmar y crear tareas"}
        </Button>
        <Button variant="ghost" onClick={onReset} disabled={pending}>
          Empezar de nuevo
        </Button>
      </div>
    </div>
  )
}
