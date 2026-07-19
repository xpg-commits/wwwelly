"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function WrongAccountNotice({
  invitationId,
  inviteEmail,
}: {
  invitationId: string
  inviteEmail: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut()
          const next = `/invitacion/${invitationId}`
          router.push(`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(inviteEmail)}`)
          router.refresh()
        })
      }
    >
      {pending ? "Cerrando sesión…" : "Cerrar sesión y continuar"}
    </Button>
  )
}
