"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { markItemPurchasedAction } from "@/actions/shopping"

export function ShoppingItemRow({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <label className="list-row has-[[data-disabled]]:opacity-60">
      <Checkbox
        disabled={pending}
        onCheckedChange={(checked) => {
          if (checked !== true) return
          startTransition(async () => {
            const result = await markItemPurchasedAction(id)
            if (!result.success) {
              toast.error(result.error)
              return
            }
            router.refresh()
          })
        }}
      />
      <span className="flex-1 text-sm">{name}</span>
    </label>
  )
}
