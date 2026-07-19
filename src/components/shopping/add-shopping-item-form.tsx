"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addShoppingItemAction } from "@/actions/shopping"

export function AddShoppingItemForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await addShoppingItemAction(formData)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          formRef.current?.reset()
          router.refresh()
        })
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="shopping-name">Producto</Label>
        <Input id="shopping-name" name="name" placeholder="Leche, papel, detergente…" required />
      </div>
      <div className="space-y-1.5 sm:w-36">
        <Label htmlFor="shopping-quantity">Cantidad (opcional)</Label>
        <Input id="shopping-quantity" name="quantity" placeholder="Ej: 2kg, 1 docena…" />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Añadiendo…" : "Añadir"}
      </Button>
    </form>
  )
}
