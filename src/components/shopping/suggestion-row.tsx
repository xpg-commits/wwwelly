"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { reactivateItemAction } from "@/actions/shopping"

export function SuggestionRow({
  id,
  name,
  avgPurchaseIntervalDays,
}: {
  id: string
  name: string
  avgPurchaseIntervalDays: number | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between rounded-xl bg-accent/50 px-3.5 py-3">
      <div>
        <p className="text-sm">¿Necesitas volver a comprar {name.toLowerCase()}?</p>
        {avgPurchaseIntervalDays && (
          <p className="text-xs text-muted-foreground">
            Sueles comprarlo cada {avgPurchaseIntervalDays} días.
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await reactivateItemAction(id)
            if (!result.success) {
              toast.error(result.error)
              return
            }
            router.refresh()
          })
        }
      >
        {pending ? "Añadiendo…" : "Añadir a la lista"}
      </Button>
    </div>
  )
}
