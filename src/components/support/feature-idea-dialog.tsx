"use client"

import { useRef, useTransition } from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendSupportMessageAction } from "@/actions/support"

// A low-friction "suggest a feature" dialog — one textarea, no subject field
// to fill in (hidden, fixed), reusing the same support-email pipeline so
// there's no separate inbox/mechanism to maintain.
//
// Fully controlled (open/onOpenChange from the caller) rather than owning a
// DialogTrigger internally — this needs to be triggerable from inside
// UserMenu's Sheet, and mounting it as a child of that Sheet unmounts it
// (along with its own open state) the moment the Sheet closes. Rendered as a
// sibling of whatever opens it instead.
export function FeatureIdeaDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Te falta algo?</DialogTitle>
          <DialogDescription>
            Describe qué te gustaría que wwwelly hiciera y vemos si podemos
            integrarlo.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          className="space-y-4"
          action={(formData: FormData) => {
            startTransition(async () => {
              const result = await sendSupportMessageAction(formData)
              if (!result.success) {
                toast.error(result.error)
                return
              }
              toast.success("¡Gracias! Nos lo apuntamos.")
              formRef.current?.reset()
              onOpenChange(false)
            })
          }}
        >
          <input type="hidden" name="subject" value="Idea de función" />
          <Textarea
            name="message"
            placeholder="Ej: Me gustaría poder exportar mis tareas a un calendario…"
            rows={5}
            required
            autoFocus
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando…" : "Enviar idea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
