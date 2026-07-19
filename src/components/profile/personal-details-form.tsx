"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { PronounField } from "@/components/shared/pronoun-field"
import { updateMyProfileAction } from "@/actions/profile"

export function PersonalDetailsForm({
  initialBirthDate,
  initialPronouns,
}: {
  initialBirthDate: string
  initialPronouns: string
}) {
  const [birthDate, setBirthDate] = useState(initialBirthDate)
  const [pronouns, setPronouns] = useState(initialPronouns)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateMyProfileAction({ birthDate, pronouns })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Guardado.")
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Fecha de nacimiento</Label>
        <DatePickerField
          value={birthDate}
          onChange={setBirthDate}
          captionLayout="dropdown"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label>¿Cómo te gustaría que nos refiramos a ti?</Label>
        <PronounField value={pronouns} onChange={setPronouns} />
      </div>
      <Button onClick={save} disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  )
}
