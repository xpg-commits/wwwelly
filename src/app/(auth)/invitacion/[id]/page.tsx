import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AcceptInviteButton } from "@/components/household/accept-invite-button"
import { WrongAccountNotice } from "@/components/household/wrong-account-notice"

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const reqHeaders = await headers()

  // Read straight from the DB instead of auth.api.getInvitation — that
  // endpoint requires the caller to already be logged in AS the invitee,
  // so it can't tell an anonymous or wrong-account visitor who the
  // invitation is even for. A plain read is safe here: holding the id
  // (an unguessable link) is the same bar the email link itself relies on.
  const invite = await db.householdInvite.findUnique({
    where: { id },
    include: { household: { select: { name: true } } },
  })

  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitación no disponible</CardTitle>
          <CardDescription>
            Este enlace ya no es válido — puede que haya caducado o que ya se haya usado.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session) {
    const next = `/invitacion/${id}`
    redirect(`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(invite.email)}`)
  }

  if (session.user.email !== invite.email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Te han invitado a {invite.household.name}</CardTitle>
          <CardDescription>
            Esta invitación es para <strong>{invite.email}</strong>, pero has iniciado
            sesión como {session.user.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WrongAccountNotice invitationId={id} inviteEmail={invite.email} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Te han invitado a {invite.household.name}</CardTitle>
        <CardDescription>
          Acepta para empezar a compartir tareas, mascotas, vehículos y más.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteButton invitationId={id} />
      </CardContent>
    </Card>
  )
}
