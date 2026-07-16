"use server"

import { headers } from "next/headers"
import { APIError } from "better-auth"

import { auth } from "@/lib/auth"
import { memberLimitForPlan } from "@/lib/plan"

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
      body: { name, slug: slugify(name) },
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

export async function inviteMember(
  formData: FormData
): Promise<ActionResult<{ invitationId: string }>> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) {
    return { success: false, error: "Escribe un email." }
  }

  const reqHeaders = await headers()

  // Better Auth only enforces `membershipLimit` at accept time (see the
  // comment in lib/auth.ts) — checked here too so the inviter gets
  // immediate feedback instead of the invitee hitting a dead end later.
  const household = await auth.api.getFullOrganization({ headers: reqHeaders })
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
    return { success: true, data: { invitationId: invitation.id } }
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
