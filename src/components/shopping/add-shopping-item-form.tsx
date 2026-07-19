"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addShoppingItemAction } from "@/actions/shopping"

export function AddShoppingItemForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      className="flex gap-2"
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
      <Input name="name" placeholder="Leche, papel, detergente…" required className="flex-1" />
      <Input name="quantity" placeholder="Cantidad (opcional)" className="w-36" />
      <Button type="submit" disabled={pending}>
        {pending ? "Añadiendo…" : "Añadir"}
      </Button>
    </form>
  )
}
