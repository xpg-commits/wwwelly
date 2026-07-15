"use server"

import { requireActiveMember } from "@/lib/session"
import * as vehicleService from "@/services/vehicles"

type ActionResult = { success: true } | { success: false; error: string }

export async function createVehicleAction(formData: FormData): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const alias = String(formData.get("alias") ?? "").trim()
  if (!alias) {
    return { success: false, error: "Ponle un nombre al vehículo." }
  }

  const make = String(formData.get("make") ?? "").trim()
  const model = String(formData.get("model") ?? "").trim()
  const plate = String(formData.get("plate") ?? "").trim()
  const yearRaw = String(formData.get("year") ?? "").trim()

  await vehicleService.createVehicle({
    householdId,
    alias,
    make: make || null,
    model: model || null,
    plate: plate || null,
    year: yearRaw ? Number(yearRaw) : null,
  })

  return { success: true }
}
