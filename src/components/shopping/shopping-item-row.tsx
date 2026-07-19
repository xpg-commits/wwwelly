"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TrashIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  markItemPurchasedAction,
  reactivateItemAction,
  deleteShoppingItemAction,
} from "@/actions/shopping"
import { memberColorVar } from "@/lib/memberColors"
import { novaGroupColor, novaGroupLabel } from "@/lib/novaGroup"

type Member = { color: string; displayName: string | null; user: { name: string } } | null

export function ShoppingItemRow({
  id,
  name,
  quantity,
  novaGroup,
  addedBy,
  checked = false,
  checkedBy,
}: {
  id: string
  name: string
  quantity?: string | null
  novaGroup?: number | null
  addedBy?: Member
  checked?: boolean
  checkedBy?: Member
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const dotColor = novaGroupColor(novaGroup)
  const addedByName = addedBy?.displayName ?? addedBy?.user.name

  return (
    <div
      className={`list-row justify-between has-[[data-disabled]]:opacity-60 ${checked ? "bg-muted/50" : ""}`}
    >
      <label className="flex flex-1 items-center gap-3">
        <Checkbox
          checked={checked}
          disabled={pending}
          onCheckedChange={(value) => {
            startTransition(async () => {
              const result =
                value === true
                  ? await markItemPurchasedAction(id)
                  : await reactivateItemAction(id)
              if (!result.success) {
                toast.error(result.error)
                return
              }
              router.refresh()
            })
          }}
        />
        {dotColor && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
            title={novaGroupLabel(novaGroup) ?? undefined}
            aria-hidden
          />
        )}
        <span className={`flex-1 text-sm ${checked ? "text-muted-foreground line-through" : ""}`}>
          {name}
          {quantity && <span className="text-muted-foreground"> · {quantity}</span>}
        </span>
        {addedBy && !checked && (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: memberColorVar(addedBy.color) }}
            title={`Añadido por ${addedByName}`}
          >
            {addedByName?.trim().charAt(0).toUpperCase() ?? "?"}
          </span>
        )}
        {checked && checkedBy && (
          <span className="text-xs text-muted-foreground">
            {checkedBy.displayName ?? checkedBy.user.name}
          </span>
        )}
      </label>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label="Eliminar"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra de la lista y deja de sugerirse cuando toque volver a comprarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteShoppingItemAction(id)
                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }
                  router.refresh()
                })
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
