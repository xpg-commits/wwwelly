"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

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
import { cancelInvitationAction, resendInvitationAction } from "@/actions/household"

export function PendingInvitationsList({
  invitations,
}: {
  invitations: { id: string; email: string }[]
}) {
  if (invitations.length === 0) return null

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </div>
  )
}

function InvitationRow({ invitation }: { invitation: { id: string; email: string } }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function resend() {
    startTransition(async () => {
      const result = await resendInvitationAction(invitation.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Invitación reenviada.")
      router.refresh()
    })
  }

  return (
    <div className="list-row justify-between">
      <div>
        <p className="font-medium">{invitation.email}</p>
        <p className="text-sm text-muted-foreground">Invitación pendiente</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={pending} onClick={resend}>
          Reenviar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="sm" disabled={pending}>
                Cancelar
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar la invitación a {invitation.email}?</AlertDialogTitle>
              <AlertDialogDescription>
                Ya no podrá unirse al hogar con ese enlace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await cancelInvitationAction(invitation.id)
                    if (!result.success) {
                      toast.error(result.error)
                      return
                    }
                    router.refresh()
                  })
                }}
              >
                Cancelar invitación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
