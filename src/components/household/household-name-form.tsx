"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateHouseholdNameAction } from "@/actions/household-settings"

export function HouseholdNameForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateHouseholdNameAction(name)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Guardado.")
      router.refresh()
    })
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button onClick={save} disabled={pending || !name.trim()}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </div>
  )
}
