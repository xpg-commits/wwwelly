"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createChildAction } from "@/actions/children"

export function CreateChildForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Añadir hijo/a
      </Button>
    )
  }

  return (
    <form
      ref={formRef}
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createChildAction(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          formRef.current?.reset()
          setOpen(false)
          router.refresh()
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="child-name">Nombre</Label>
        <Input id="child-name" name="name" placeholder="Marta" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="child-birthdate">Fecha de nacimiento (opcional)</Label>
        <Input id="child-birthdate" name="birthDate" type="date" />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
