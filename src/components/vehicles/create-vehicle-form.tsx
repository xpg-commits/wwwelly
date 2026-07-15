"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createVehicleAction } from "@/actions/vehicles"

export function CreateVehicleForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Añadir vehículo
      </Button>
    )
  }

  return (
    <form
      ref={formRef}
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createVehicleAction(formData)
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
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="vehicle-alias">Nombre</Label>
        <Input id="vehicle-alias" name="alias" placeholder="Coche de Juan" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicle-make">Marca (opcional)</Label>
        <Input id="vehicle-make" name="make" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicle-model">Modelo (opcional)</Label>
        <Input id="vehicle-model" name="model" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicle-year">Año (opcional)</Label>
        <Input id="vehicle-year" name="year" type="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vehicle-plate">Matrícula (opcional)</Label>
        <Input id="vehicle-plate" name="plate" />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar vehículo"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
