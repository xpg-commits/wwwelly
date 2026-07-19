"use server"

import { headers } from "next/headers"
import { APIError } from "better-auth"

import { auth } from "@/lib/auth"
import { memberLimitForPlan } from "@/lib/plan"
import { DEFAULT_MODULE_ORDER } from "@/lib/modules"
import { sendEmail } from "@/lib/email"

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || "hogar"}-${suffix}`
}

export async function createHousehold(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { success: false, error: "Ponle un nombre a tu hogar." }
  }

  try {
    await auth.api.createOrganization({
      body: {
        name,
        slug: slugify(name),
        enabledModules: DEFAULT_MODULE_ORDER,
        moduleOrder: DEFAULT_MODULE_ORDER,
      },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo crear el hogar." }
    }
    throw error
  }

  // Navigation is done client-side (router.push + router.refresh) instead of
  // redirect() here: this action is invoked via a manual await from a client
  // event handler, not as a direct <form action={...}> reference, so Next
  // doesn't auto-follow a server-thrown redirect in that call shape.
  return { success: true, data: undefined }
}

// A brand-new session (e.g. a fresh login) doesn't inherit the household the
// user was last active in — Better Auth leaves activeOrganizationId null
// until something sets it explicitly. Without this, a returning user with
// an existing household would see the "create your household" screen again.
export async function activateHouseholdAction(organizationId: string): Promise<ActionResult> {
  try {
    await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo activar el hogar." }
    }
    throw error
  }

  return { success: true, data: undefined }
}

function inviteEmailContent({
  inviterName,
  householdName,
  inviteUrl,
}: {
  inviterName: string
  householdName: string
  inviteUrl: string
}) {
  return {
    subject: `${inviterName} te ha invitado a ${householdName} en wwwelly`,
    html: `
      <p>Hola,</p>
      <p><strong>${inviterName}</strong> te ha invitado a unirte a
      <strong>${householdName}</strong> en wwwelly, la app que organiza
      y reparte las tareas del hogar entre todos.</p>
      <p><a href="${inviteUrl}">Aceptar invitación</a></p>
      <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
    `,
  }
}

export async function inviteMember(
  formData: FormData
): Promise<ActionResult<{ invitationId: string; inviteUrl: string }>> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) {
    return { success: false, error: "Escribe un email." }
  }

  const reqHeaders = await headers()

  // Better Auth only enforces `membershipLimit` at accept time (see the
  // comment in lib/auth.ts) — checked here too so the inviter gets
  // immediate feedback instead of the invitee hitting a dead end later.
  const [household, session] = await Promise.all([
    auth.api.getFullOrganization({ headers: reqHeaders }),
    auth.api.getSession({ headers: reqHeaders }),
  ])
  if (household) {
    const limit = memberLimitForPlan((household as { planTier?: string }).planTier)
    if (household.members.length >= limit) {
      return {
        success: false,
        error: "Este hogar ya tiene el máximo de miembros del plan gratuito.",
      }
    }
  }

  try {
    const invitation = await auth.api.createInvitation({
      body: { email, role: "member" },
      headers: reqHeaders,
    })

    const inviteUrl = `${process.env.BETTER_AUTH_URL}/invitacion/${invitation.id}`

    // Best-effort — a failed/unconfigured email shouldn't block the invite
    // itself, since the link is always shown to the inviter as a fallback
    // they can share manually (WhatsApp, etc.).
    try {
      await sendEmail({
        to: email,
        ...inviteEmailContent({
          inviterName: session?.user.name ?? "Alguien",
          householdName: household?.name ?? "su hogar",
          inviteUrl,
        }),
      })
    } catch (emailError) {
      console.error("[inviteMember] no se pudo enviar el email de invitación", emailError)
    }

    return { success: true, data: { invitationId: invitation.id, inviteUrl } }
  } catch (error) {
    if (error instanceof APIError) {
      const message =
        error.status === "FORBIDDEN"
          ? "Este hogar ya tiene el máximo de miembros del plan gratuito."
          : (error.body?.message ?? "No se pudo enviar la invitación.")
      return { success: false, error: message }
    }
    throw error
  }
}

export async function cancelInvitationAction(invitationId: string): Promise<ActionResult> {
  try {
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo cancelar la invitación." }
    }
    throw error
  }

  return { success: true, data: undefined }
}

export async function resendInvitationAction(invitationId: string): Promise<ActionResult> {
  const reqHeaders = await headers()

  try {
    const [household, session, invitations] = await Promise.all([
      auth.api.getFullOrganization({ headers: reqHeaders }),
      auth.api.getSession({ headers: reqHeaders }),
      auth.api.listInvitations({ headers: reqHeaders }),
    ])

    const invitation = invitations.find((i) => i.id === invitationId)
    if (!invitation) {
      return { success: false, error: "La invitación ya no existe." }
    }

    // Bumps expiresAt another invitationExpiresIn window (default 48h) —
    // doesn't create a new row/id, and doesn't send an email itself since
    // this app doesn't set organization.sendInvitationEmail — we send our
    // own below, same as inviteMember does on first send.
    await auth.api.createInvitation({
      body: { email: invitation.email, role: invitation.role, resend: true },
      headers: reqHeaders,
    })

    const inviteUrl = `${process.env.BETTER_AUTH_URL}/invitacion/${invitationId}`
    await sendEmail({
      to: invitation.email,
      ...inviteEmailContent({
        inviterName: session?.user.name ?? "Alguien",
        householdName: household?.name ?? "su hogar",
        inviteUrl,
      }),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo reenviar la invitación." }
    }
    throw error
  }

  return { success: true, data: undefined }
}

export async function acceptInvite(invitationId: string): Promise<ActionResult> {
  try {
    const result = await auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    })
    if (result?.invitation.organizationId) {
      await auth.api.setActiveOrganization({
        body: { organizationId: result.invitation.organizationId },
        headers: await headers(),
      })
    }
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo aceptar la invitación." }
    }
    throw error
  }

  return { success: true, data: undefined }
}
