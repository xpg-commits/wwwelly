"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteMember } from "@/actions/household"

export function InviteMemberForm() {
  const [pending, startTransition] = useTransition()
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <form
        className="flex items-end gap-2"
        action={(formData: FormData) => {
          startTransition(async () => {
            const result = await inviteMember(formData)
            if (!result.success) {
              toast.error(result.error)
              return
            }
            setInviteLink(result.data.inviteUrl)
            toast.success("Invitación enviada por email.")
          })
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="email">Invitar por email</Label>
          <Input id="email" name="email" type="email" placeholder="pareja@ejemplo.com" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Invitando…" : "Invitar"}
        </Button>
      </form>
      {inviteLink && (
        <p className="break-all rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Le hemos mandado un email, pero también puedes compartirle este
          enlace directamente:{" "}
          <span className="font-medium text-foreground">{inviteLink}</span>
        </p>
      )}
    </div>
  )
}
