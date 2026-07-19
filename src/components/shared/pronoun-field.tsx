"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESETS = [
  { value: "ella", label: "Ella / la" },
  { value: "él", label: "Él / lo" },
  { value: "elle", label: "Elle / le" },
] as const

const CUSTOM = "otro"
const NONE = "prefiero-no-decirlo"

const presetValues: string[] = PRESETS.map((p) => p.value)

// Presets + a free-text fallback (same idea as Slack's pronoun field) — a
// fixed list can never cover every pronoun, so "otro" always stays available
// instead of forcing a choice from the three most common ones.
export function PronounField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [customMode, setCustomMode] = useState(
    value !== "" && !presetValues.includes(value)
  )

  if (customMode) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe cómo prefieres que nos refiramos a ti"
          autoFocus
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false)
            onChange("")
          }}
          className="shrink-0 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Elegir de la lista
        </button>
      </div>
    )
  }

  return (
    <Select
      value={value === "" ? NONE : value}
      onValueChange={(v) => {
        if (!v) return
        if (v === CUSTOM) {
          setCustomMode(true)
          onChange("")
          return
        }
        onChange(v === NONE ? "" : v)
      }}
      items={{
        [NONE]: "Prefiero no decirlo",
        ...Object.fromEntries(PRESETS.map((p) => [p.value, p.label])),
        [CUSTOM]: "Otro (especifica)",
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Prefiero no decirlo</SelectItem>
        {PRESETS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM}>Otro (especifica)</SelectItem>
      </SelectContent>
    </Select>
  )
}
