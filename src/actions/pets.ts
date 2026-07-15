"use server"

import { requireActiveMember } from "@/lib/session"
import * as petService from "@/services/pets"

type ActionResult = { success: true } | { success: false; error: string }

export async function createPetAction(formData: FormData): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const name = String(formData.get("name") ?? "").trim()
  const species = String(formData.get("species") ?? "").trim()
  if (!name || !species) {
    return { success: false, error: "Ponle un nombre y una especie a la mascota." }
  }

  const breed = String(formData.get("breed") ?? "").trim()
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim()

  await petService.createPet({
    householdId,
    name,
    species,
    breed: breed || null,
    birthDate: birthDateRaw ? new Date(`${birthDateRaw}T00:00:00`) : null,
  })

  return { success: true }
}
