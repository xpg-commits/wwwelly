"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { generateChoreDistributionPlanAction } from "@/actions/chores"
import type { ChoreWizardAnswers, ChoreMode } from "@/lib/ai/choreSchemas"
import type { ChoreWizardMember, ChoreWizardChild } from "@/actions/chores"
import type { TaskDraft } from "@/lib/ai/schemas"
import { ChorePlanReview } from "@/components/household/chore-plan-review"

const FREQUENCY_OPTIONS = [
  { days: 1, label: "Todos los días" },
  { days: 3, label: "Cada 2-3 días" },
  { days: 7, label: "Cada semana" },
  { days: 14, label: "Cada 2 semanas" },
  { days: 30, label: "Cada mes" },
]

const MODE_ITEMS = { FIJO: "Fijo — siempre la misma persona", ROTATIVO: "Rotativo — el turno va cambiando" }

const DEFAULT_ANSWERS: Omit<ChoreWizardAnswers, "participantMemberIds"> = {
  bathrooms: { count: 1, frequencyDays: 7, mode: "FIJO", involvedChildIds: [] },
  kitchen: { hasDishwasher: false, frequencyDays: 2, mode: "ROTATIVO", involvedChildIds: [] },
  floors: { frequencyDays: 7, mode: "ROTATIVO", involvedChildIds: [] },
  laundry: { doesIroning: false, frequencyDays: 7, mode: "FIJO", involvedChildIds: [] },
  shopping: { mode: "ROTATIVO", involvedChildIds: [] },
  trash: { frequencyDays: 2, recyclingFrequencyDays: 14, mode: "ROTATIVO", involvedChildIds: [] },
}

type PlanResult = {
  aiGenerationId: string
  tasks: TaskDraft[]
  rationale: string
  members: ChoreWizardMember[]
  children: ChoreWizardChild[]
}

// Reused at the bottom of every category step — lets you tag which kids
// help out with that category's tasks, separate from the fijo/rotativo
// reparto between adults.
function InvolveChildrenField({
  childOptions,
  value,
  onChange,
}: {
  childOptions: ChoreWizardChild[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  if (childOptions.length === 0) return null
  return (
    <div className="space-y-1.5">
      <Label>
        {childOptions.length > 1 ? "Implicar a los niños" : `Implicar a ${childOptions[0].name}`}
      </Label>
      <div className="flex flex-wrap gap-3">
        {childOptions.map((c) => {
          const checked = value.includes(c.id)
          return (
            <label key={c.id} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) =>
                  onChange(v === true ? [...value, c.id] : value.filter((id) => id !== c.id))
                }
              />
              {c.name}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function FrequencySelect({
  value,
  onChange,
}: {
  value: number
  onChange: (days: number) => void
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => v && onChange(Number(v))}
      items={Object.fromEntries(FREQUENCY_OPTIONS.map((o) => [String(o.days), o.label]))}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FREQUENCY_OPTIONS.map((o) => (
          <SelectItem key={o.days} value={String(o.days)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ModeSelect({
  value,
  onChange,
  canRotate,
}: {
  value: ChoreMode
  onChange: (mode: ChoreMode) => void
  // With a single participant there's no one to rotate with — "Rotativo"
  // wouldn't do anything different from "Fijo", so it isn't offered at all
  // rather than showing a choice that has no real effect.
  canRotate: boolean
}) {
  if (!canRotate) {
    return (
      <p className="rounded-lg border border-input bg-transparent px-3.5 py-2 text-sm text-muted-foreground">
        Fijo — con un solo adulto no hay turno que rotar
      </p>
    )
  }
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as ChoreMode)} items={MODE_ITEMS}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="FIJO">Fijo — siempre la misma persona</SelectItem>
        <SelectItem value="ROTATIVO">Rotativo — el turno va cambiando</SelectItem>
      </SelectContent>
    </Select>
  )
}

// Shared shell for a category step: a toggle to include/skip it, and the
// fields (frequency + fijo/rotativo, plus whatever else) shown only while
// included — every category besides "Baños" and "Participantes" can be
// skipped entirely if it doesn't apply to this household.
function CategoryStep<T>({
  title,
  description,
  value,
  defaultValue,
  onChange,
  children,
}: {
  title: string
  description: string
  value: T | null
  defaultValue: T
  onChange: (value: T | null) => void
  children: (value: T, set: (patch: Partial<T>) => void) => React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch
          checked={value !== null}
          onCheckedChange={(checked) => onChange(checked ? defaultValue : null)}
        />
        <Label>Esto aplica en mi casa</Label>
      </div>
      {value !== null &&
        children(value, (patch) => onChange({ ...value, ...patch }))}
    </div>
  )
}

export function ChoreWizard({
  adults,
  childOptions = [],
}: {
  adults: ChoreWizardMember[]
  childOptions?: ChoreWizardChild[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [participantMemberIds, setParticipantMemberIds] = useState<string[]>(
    adults.map((a) => a.id)
  )
  const [answers, setAnswers] =
    useState<Omit<ChoreWizardAnswers, "participantMemberIds">>(DEFAULT_ANSWERS)
  const [plan, setPlan] = useState<PlanResult | null>(null)

  const steps = [
    "Participantes",
    "Baños",
    "Cocina",
    "Suelos",
    "Colada",
    "Compra",
    "Basura",
    "Resumen",
  ]
  const isLast = step === steps.length - 1

  const canAdvance = step === 0 ? participantMemberIds.length > 0 : true
  // With a single participant, "rotativo" would just mean "the same person,
  // forever" — meaningless, so every category is forced back to fijo before
  // generating, regardless of what was picked while more people were checked.
  const canRotate = participantMemberIds.length >= 2

  function generate() {
    const forceFijo = <T extends { mode: ChoreMode } | null>(v: T): T =>
      v ? { ...v, mode: "FIJO" } : v
    const finalAnswers = canRotate
      ? answers
      : {
          bathrooms: forceFijo(answers.bathrooms),
          kitchen: forceFijo(answers.kitchen),
          floors: forceFijo(answers.floors),
          laundry: forceFijo(answers.laundry),
          shopping: forceFijo(answers.shopping),
          trash: forceFijo(answers.trash),
        }

    startTransition(async () => {
      const result = await generateChoreDistributionPlanAction({
        participantMemberIds,
        ...finalAnswers,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (result.data.tasks.length === 0) {
        toast.info("No se ha propuesto ninguna tarea — revisa tus respuestas.")
        return
      }
      setPlan(result.data)
    })
  }

  if (plan) {
    return (
      <ChorePlanReview
        plan={plan}
        onReset={() => {
          setPlan(null)
          setStep(0)
        }}
        onConfirmed={() => {
          router.push("/ajustes/hogar")
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i <= step ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      <div key={step} className="stagger-in min-h-[280px]">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                ¿Quién participa en el reparto?
              </h2>
              <p className="text-sm text-muted-foreground">
                Solo los adultos que marques aquí entrarán en las tareas rotativas y fijas
                que propongamos.
              </p>
            </div>
            <div className="space-y-1">
              {adults.map((a) => {
                const checked = participantMemberIds.includes(a.id)
                return (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) =>
                        setParticipantMemberIds((prev) =>
                          c === true ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                        )
                      }
                    />
                    <span className="text-sm">{a.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <CategoryStep
            title="Baños"
            description="Cuántos baños tenéis y cómo repartir su limpieza."
            value={answers.bathrooms}
            defaultValue={DEFAULT_ANSWERS.bathrooms!}
            onChange={(v) => setAnswers((a) => ({ ...a, bathrooms: v }))}
          >
            {(v, set) => (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Número de baños</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={v.count}
                    onChange={(e) => set({ count: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia de limpieza</Label>
                  <FrequencySelect
                    value={v.frequencyDays}
                    onChange={(frequencyDays) => set({ frequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{v.count > 1 ? "¿Cada baño con su dueño, o el turno rota?" : "Modo"}</Label>
                  <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                  <InvolveChildrenField
                    childOptions={childOptions}
                    value={v.involvedChildIds}
                    onChange={(involvedChildIds) => set({ involvedChildIds })}
                  />
                </div>
              </div>
            )}
          </CategoryStep>
        )}

        {step === 2 && (
          <CategoryStep
            title="Cocina"
            description="Encimeras, fogones, y sacar la basura de cocina."
            value={answers.kitchen}
            defaultValue={DEFAULT_ANSWERS.kitchen!}
            onChange={(v) => setAnswers((a) => ({ ...a, kitchen: v }))}
          >
            {(v, set) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={v.hasDishwasher}
                    onCheckedChange={(c) => set({ hasDishwasher: c === true })}
                  />
                  <Label>Tenéis lavavajillas</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia de limpieza</Label>
                  <FrequencySelect
                    value={v.frequencyDays}
                    onChange={(frequencyDays) => set({ frequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modo</Label>
                  <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                  <InvolveChildrenField
                    childOptions={childOptions}
                    value={v.involvedChildIds}
                    onChange={(involvedChildIds) => set({ involvedChildIds })}
                  />
                </div>
              </div>
            )}
          </CategoryStep>
        )}

        {step === 3 && (
          <CategoryStep
            title="Suelos y polvo"
            description="Aspirar, fregar, quitar el polvo."
            value={answers.floors}
            defaultValue={DEFAULT_ANSWERS.floors!}
            onChange={(v) => setAnswers((a) => ({ ...a, floors: v }))}
          >
            {(v, set) => (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Frecuencia</Label>
                  <FrequencySelect
                    value={v.frequencyDays}
                    onChange={(frequencyDays) => set({ frequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modo</Label>
                  <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                  <InvolveChildrenField
                    childOptions={childOptions}
                    value={v.involvedChildIds}
                    onChange={(involvedChildIds) => set({ involvedChildIds })}
                  />
                </div>
              </div>
            )}
          </CategoryStep>
        )}

        {step === 4 && (
          <CategoryStep
            title="Colada"
            description="Poner lavadoras, tender o secadora, doblar y guardar."
            value={answers.laundry}
            defaultValue={DEFAULT_ANSWERS.laundry!}
            onChange={(v) => setAnswers((a) => ({ ...a, laundry: v }))}
          >
            {(v, set) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={v.doesIroning}
                    onCheckedChange={(c) => set({ doesIroning: c === true })}
                  />
                  <Label>También plancháis</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia</Label>
                  <FrequencySelect
                    value={v.frequencyDays}
                    onChange={(frequencyDays) => set({ frequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modo</Label>
                  <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                  <InvolveChildrenField
                    childOptions={childOptions}
                    value={v.involvedChildIds}
                    onChange={(involvedChildIds) => set({ involvedChildIds })}
                  />
                </div>
              </div>
            )}
          </CategoryStep>
        )}

        {step === 5 && (
          <CategoryStep
            title="Compra y despensa"
            description="Hacer la lista, ir a comprar, reponer lo que falta."
            value={answers.shopping}
            defaultValue={DEFAULT_ANSWERS.shopping!}
            onChange={(v) => setAnswers((a) => ({ ...a, shopping: v }))}
          >
            {(v, set) => (
              <div className="space-y-1.5">
                <Label>Modo</Label>
                <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                <InvolveChildrenField
                  childOptions={childOptions}
                  value={v.involvedChildIds}
                  onChange={(involvedChildIds) => set({ involvedChildIds })}
                />
              </div>
            )}
          </CategoryStep>
        )}

        {step === 6 && (
          <CategoryStep
            title="Basura y reciclaje"
            description="Sacar la basura y bajar el reciclaje/vidrio/cartón."
            value={answers.trash}
            defaultValue={DEFAULT_ANSWERS.trash!}
            onChange={(v) => setAnswers((a) => ({ ...a, trash: v }))}
          >
            {(v, set) => (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Frecuencia de sacar la basura</Label>
                  <FrequencySelect
                    value={v.frequencyDays}
                    onChange={(frequencyDays) => set({ frequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia de reciclaje</Label>
                  <FrequencySelect
                    value={v.recyclingFrequencyDays}
                    onChange={(recyclingFrequencyDays) => set({ recyclingFrequencyDays })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modo</Label>
                  <ModeSelect value={v.mode} onChange={(mode) => set({ mode })} canRotate={canRotate} />
                  <InvolveChildrenField
                    childOptions={childOptions}
                    value={v.involvedChildIds}
                    onChange={(involvedChildIds) => set({ involvedChildIds })}
                  />
                </div>
              </div>
            )}
          </CategoryStep>
        )}

        {isLast && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">Listo para generar</h2>
              <p className="text-sm text-muted-foreground">
                wwwelly propondrá un reparto de tareas a partir de tus respuestas — podrás
                revisarlo y ajustarlo antes de crear nada.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Participan: {adults.filter((a) => participantMemberIds.includes(a.id)).map((a) => a.name).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
        >
          Atrás
        </Button>
        {isLast ? (
          <Button onClick={generate} disabled={pending}>
            {pending ? "Generando…" : "Generar propuesta"}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  )
}
