"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Days-per-unit used to convert the visible "cada X días/meses/años" picker
// into the single recurrenceIntervalDays (always stored in days) the rest
// of the app expects — same approximation already used by the AI planner's
// prompt (~30 días/mes, ~365 días/año), not a new precision expectation.
const UNIT_DAYS = { DIAS: 1, MESES: 30, ANIOS: 365 } as const
type Unit = keyof typeof UNIT_DAYS
const UNIT_ITEMS: Record<Unit, string> = { DIAS: "días", MESES: "meses", ANIOS: "años" }

// Renders plain named inputs inside whatever <form> wraps it — no local
// submit logic here, the parent form's FormData just won't contain these
// fields at all while collapsed, which is exactly "no repite".
export function RecurrenceFields() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState<Unit>("DIAS")

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Repetir
      </button>
    )
  }

  const intervalDays = Math.max(1, Math.round(amount * UNIT_DAYS[unit]))

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Repetir cada</span>
      <Input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value) || 1)}
        className="w-20"
      />
      <Select
        value={unit}
        onValueChange={(v) => v && setUnit(v as Unit)}
        items={UNIT_ITEMS}
      >
        <SelectTrigger className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DIAS">días</SelectItem>
          <SelectItem value="MESES">meses</SelectItem>
          <SelectItem value="ANIOS">años</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">,</span>
      <Select
        name="recurrenceType"
        defaultValue="REACTIVE"
        items={{
          REACTIVE: "desde que la completo",
          FIXED_SCHEDULE: "desde la fecha prevista",
        }}
      >
        <SelectTrigger className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="REACTIVE">desde que la completo</SelectItem>
          <SelectItem value="FIXED_SCHEDULE">desde la fecha prevista</SelectItem>
        </SelectContent>
      </Select>
      <input type="hidden" name="recurrenceIntervalDays" value={intervalDays} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
      >
        Quitar
      </Button>
    </div>
  )
}
