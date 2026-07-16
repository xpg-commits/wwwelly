"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { Label } from "@/components/ui/label"
import { createPetAction } from "@/actions/pets"

export function CreatePetForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Añadir mascota
      </Button>
    )
  }

  return (
    <form
      ref={formRef}
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createPetAction(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          formRef.current?.reset()
          setBirthDate("")
          setOpen(false)
          router.refresh()
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="pet-name">Nombre</Label>
        <Input id="pet-name" name="name" placeholder="Toby" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pet-species">Especie</Label>
        <Input id="pet-species" name="species" placeholder="Perro" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pet-breed">Raza (opcional)</Label>
        <Input id="pet-breed" name="breed" />
      </div>
      <div className="space-y-2">
        <Label>Fecha de nacimiento (opcional)</Label>
        <DatePickerField
          name="birthDate"
          value={birthDate}
          onChange={setBirthDate}
          captionLayout="dropdown"
        />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar mascota"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
