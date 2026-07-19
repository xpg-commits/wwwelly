"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createHabitAction } from "@/actions/habits"
import { cn } from "@/lib/utils"

const INTERVAL_OPTIONS: Record<string, string> = {
  "60": "Cada hora",
  "120": "Cada 2 horas",
  "180": "Cada 3 horas",
  "240": "Cada 4 horas",
}

type HabitType = "CHECKIN" | "REMINDER"

export function HabitWizard() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"title" | "type">("title")
  const [pending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [type, setType] = useState<HabitType | null>(null)
  const [goalNote, setGoalNote] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState("120")
  const [activeFrom, setActiveFrom] = useState("08:00")
  const [activeTo, setActiveTo] = useState("22:00")

  function reset() {
    setStep("title")
    setTitle("")
    setType(null)
    setGoalNote("")
    setIntervalMinutes("120")
    setActiveFrom("08:00")
    setActiveTo("22:00")
  }

  function create() {
    if (!type) return
    startTransition(async () => {
      const result = await createHabitAction({
        title,
        type,
        goalNote: type === "CHECKIN" ? goalNote : undefined,
        intervalMinutes: type === "REMINDER" ? Number(intervalMinutes) : undefined,
        activeFrom: type === "REMINDER" ? activeFrom : undefined,
        activeTo: type === "REMINDER" ? activeTo : undefined,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Hábito creado.")
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            Nuevo hábito
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo hábito</DialogTitle>
          <DialogDescription>
            {step === "title"
              ? "¿Qué hábito quieres crear?"
              : "¿Cómo quieres seguirlo?"}
          </DialogDescription>
        </DialogHeader>

        {step === "title" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit-title">Nombre</Label>
              <Input
                id="habit-title"
                placeholder="Ej: Beber agua, estirar la espalda…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              disabled={!title.trim()}
              onClick={() => setStep("type")}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === "type" && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setType("CHECKIN")}
                className={cn(
                  "rounded-2xl border p-4 text-left text-sm transition-colors",
                  type === "CHECKIN"
                    ? "border-primary bg-secondary/40"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-medium">Marcar una vez al día</p>
                <p className="text-xs text-muted-foreground">
                  Ej: "¿Has bebido 2 litros de agua hoy?"
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType("REMINDER")}
                className={cn(
                  "rounded-2xl border p-4 text-left text-sm transition-colors",
                  type === "REMINDER"
                    ? "border-primary bg-secondary/40"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-medium">Recordarlo varias veces al día</p>
                <p className="text-xs text-muted-foreground">
                  Ej: "Cada 2 horas, recuérdame beber un vaso"
                </p>
              </button>
            </div>

            {type === "CHECKIN" && (
              <div className="space-y-2">
                <Label htmlFor="habit-goal">¿Algo que recordar? (opcional)</Label>
                <Input
                  id="habit-goal"
                  placeholder="Ej: Al menos 2 litros"
                  value={goalNote}
                  onChange={(e) => setGoalNote(e.target.value)}
                />
              </div>
            )}

            {type === "REMINDER" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={intervalMinutes}
                    onValueChange={(v) => v && setIntervalMinutes(v)}
                    items={INTERVAL_OPTIONS}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERVAL_OPTIONS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="habit-from">Desde</Label>
                    <Input
                      id="habit-from"
                      type="time"
                      value={activeFrom}
                      onChange={(e) => setActiveFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="habit-to">Hasta</Label>
                    <Input
                      id="habit-to"
                      type="time"
                      value={activeTo}
                      onChange={(e) => setActiveTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setStep("title")} disabled={pending}>
                Atrás
              </Button>
              <Button className="flex-1" disabled={!type || pending} onClick={create}>
                {pending ? "Creando…" : "Crear hábito"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
