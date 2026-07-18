"use server"

import { headers } from "next/headers"
import { APIError } from "better-auth"

import { auth } from "@/lib/auth"
import { isFilterKey } from "@/lib/modules"

type ActionResult = { success: true } | { success: false; error: string }

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
