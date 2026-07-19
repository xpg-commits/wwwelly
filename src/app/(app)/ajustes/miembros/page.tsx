import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InviteMemberForm } from "@/components/household/invite-member-form"
import { PendingInvitationsList } from "@/components/household/pending-invitations-list"

const ROLE_LABEL: Record<string, string> = {
  ADULT: "Adulto",
  TEEN: "Adolescente",
  CHILD: "Niño/a",
}

export default async function MiembrosPage() {
  const reqHeaders = await headers()
  const [household, invitations] = await Promise.all([
    auth.api.getFullOrganization({ headers: reqHeaders }),
    auth.api.listInvitations({ headers: reqHeaders }),
  ])
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending" && invitation.expiresAt > new Date()
  )

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
        <p className="text-muted-foreground">
          Invita a tu pareja, hijos o abuelos a {household?.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitar a alguien</CardTitle>
          <CardDescription>
            Plan gratuito: hasta 2 personas por hogar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm />
        </CardContent>
      </Card>

      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Invitaciones pendientes</h2>
          <PendingInvitationsList invitations={pendingInvitations} />
        </div>
      )}

      <div className="space-y-2">
        {household?.members.map((member) => {
          const visibilityRole = (member as { visibilityRole?: string })
            .visibilityRole
          return (
            <div key={member.id} className="list-row justify-between">
              <div>
                <p className="font-medium">{member.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {member.user.email}
                </p>
              </div>
              <Badge variant="secondary">
                {(visibilityRole && ROLE_LABEL[visibilityRole]) ?? "Adulto"}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
