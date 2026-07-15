"use server"

import { requireActiveMember } from "@/lib/session"
import * as childService from "@/services/children"

type ActionResult = { success: true } | { success: false; error: string }

export async function createChildAction(formData: FormData): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { success: false, error: "Ponle un nombre." }
  }

  const birthDateRaw = String(formData.get("birthDate") ?? "").trim()

  await childService.createChild({
    householdId,
    name,
    birthDate: birthDateRaw ? new Date(`${birthDateRaw}T00:00:00`) : null,
  })

  return { success: true }
}
