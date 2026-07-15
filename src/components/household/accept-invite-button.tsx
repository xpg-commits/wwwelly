"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { acceptInvite } from "@/actions/household"

export function AcceptInviteButton({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acceptInvite(invitationId)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          router.push("/dashboard")
          router.refresh()
        })
      }
    >
      {pending ? "Uniéndote…" : "Unirme al hogar"}
    </Button>
  )
}
