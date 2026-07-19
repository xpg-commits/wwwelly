"use server"

import { headers } from "next/headers"
import { APIError } from "better-auth"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireActiveMember } from "@/lib/session"
import { isFilterKey } from "@/lib/modules"

type ActionResult = { success: true } | { success: false; error: string }

export async function updateHouseholdNameAction(name: string): Promise<ActionResult> {
  const trimmed = name.trim()
  if (!trimmed) {
    return { success: false, error: "Ponle un nombre al hogar." }
  }

  try {
    await auth.api.updateOrganization({
      body: { data: { name: trimmed } },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo guardar." }
    }
    throw error
  }

  return { success: true }
}

// Personal, not household-wide — which modules THIS member has chosen to
// hide from their own dashboard/nav, on top of whatever the household has
// enabled. Written directly via Prisma (same pattern as updateMyColorAction
// in actions/profile.ts) rather than auth.api.updateOrganization, since this
// is a HouseholdMember field, not an organization one.
export async function updateMyHiddenModulesAction(hiddenModules: string[]): Promise<ActionResult> {
  const { member } = await requireActiveMember()
  const filtered = hiddenModules.filter(isFilterKey)

  await db.householdMember.update({
    where: { id: member.id },
    data: { hiddenModules: filtered },
  })

  return { success: true }
}

export async function updateEnabledModulesAction(
  enabledModules: string[]
): Promise<ActionResult> {
  const filtered = enabledModules.filter(isFilterKey)

  try {
    await auth.api.updateOrganization({
      body: { data: { enabledModules: filtered } },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo guardar." }
    }
    throw error
  }

  return { success: true }
}

export async function updateModuleOrderAction(order: string[]): Promise<ActionResult> {
  const filtered = order.filter(isFilterKey)

  try {
    await auth.api.updateOrganization({
      body: { data: { moduleOrder: filtered } },
      headers: await headers(),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, error: error.body?.message ?? "No se pudo guardar." }
    }
    throw error
  }

  return { success: true }
}
