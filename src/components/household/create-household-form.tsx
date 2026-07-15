"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createHousehold } from "@/actions/household"

export function CreateHouseholdForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-4"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await createHousehold(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          router.push("/dashboard")
          router.refresh()
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del hogar</Label>
        <Input id="name" name="name" placeholder="Casa de Laura" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear hogar"}
      </Button>
    </form>
  )
}
