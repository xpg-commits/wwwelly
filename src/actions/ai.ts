"use server"

import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

import { headers } from "next/headers"

import { requireActiveMember } from "@/lib/session"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertAiQuotaAvailable, AiQuotaExceededError } from "@/lib/aiQuota"
import {
  generatePlanFromText,
  AiRefusalError,
  AiInvalidOutputError,
  TASK_PLANNER_MODEL,
  type HouseholdEntityContext,
} from "@/lib/ai/taskPlanner"
import { TaskDraftSchema, type TaskDraft } from "@/lib/ai/schemas"
import { applyTaskPlan } from "@/services/tasks"
import { listPets } from "@/services/pets"
import { listVehicles } from "@/services/vehicles"
import { listChildren } from "@/services/children"

async function buildEntityContext(householdId: string): Promise<HouseholdEntityContext> {
  const [pets, vehicles, children, household] = await Promise.all([
    listPets(householdId),
    listVehicles(householdId),
    listChildren(householdId),
    auth.api.getFullOrganization({ headers: await headers() }),
  ])

  return {
    pets: pets.map((p) => ({ id: p.id, label: `${p.name} (${p.species})` })),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      label: [v.alias, v.make, v.model].filter(Boolean).join(" "),
    })),
    children: children.map((c) => ({ id: c.id, label: c.name })),
    members: (household?.members ?? []).map((m) => ({
      id: m.id,
      label:
        (m as { displayName?: string | null }).displayName ?? m.user.name ?? m.user.email,
    })),
  }
}

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function generateTaskPlanAction(
  formData: FormData
): Promise<
  ActionResult<{
    aiGenerationId: string
    drafts: TaskDraft[]
    entityContext: HouseholdEntityContext
  }>
> {
  const inputText = String(formData.get("inputText") ?? "").trim()
  if (!inputText) {
    return { success: false, error: "Escribe una frase primero." }
  }

  const { householdId, session } = await requireActiveMember()

  try {
    await assertAiQuotaAvailable(householdId)
  } catch (error) {
    if (error instanceof AiQuotaExceededError) {
      return { success: false, error: error.message }
    }
    throw error
  }

  const generation = await db.aiGeneration.create({
    data: {
      householdId,
      requestedById: session.user.id,
      inputText,
      status: "PENDING",
      model: TASK_PLANNER_MODEL,
    },
  })

  try {
    const entityContext = await buildEntityContext(householdId)
    const drafts = await generatePlanFromText(inputText, entityContext)
    await db.aiGeneration.update({
      where: { id: generation.id },
      data: { status: "COMPLETED" },
    })
    return {
      success: true,
      data: { aiGenerationId: generation.id, drafts, entityContext },
    }
  } catch (error) {
    const message = await describeAiError(error)
    await db.aiGeneration.update({
      where: { id: generation.id },
      data: {
        status: error instanceof AiRefusalError ? "REFUSED" : "FAILED",
        errorMessage: message,
      },
    })
    return { success: false, error: message }
  }
}

export async function confirmTaskPlanAction(
  aiGenerationId: string,
  drafts: TaskDraft[]
): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  const generation = await db.aiGeneration.findUnique({
    where: { id: aiGenerationId },
  })
  if (!generation || generation.householdId !== householdId) {
    return { success: false, error: "No se encontró ese plan." }
  }

  // Never trust drafts a client component sends back verbatim — the user may
  // have edited them (or the request may not even come from our UI).
  const parsed = z.array(TaskDraftSchema).safeParse(drafts)
  if (!parsed.success) {
    return { success: false, error: "El plan de tareas no es válido." }
  }
  if (parsed.data.length === 0) {
    return { success: false, error: "No hay tareas que confirmar." }
  }

  // The entity ids on each draft came back from the client — re-verify they
  // still belong to this household before trusting them, same reasoning as
  // every other client-supplied foreign key in this app. A stale/tampered id
  // just drops the link rather than failing the whole confirm.
  const [pets, vehicles, children, household] = await Promise.all([
    listPets(householdId),
    listVehicles(householdId),
    listChildren(householdId),
    auth.api.getFullOrganization({ headers: await headers() }),
  ])
  const validPetIds = new Set(pets.map((p) => p.id))
  const validVehicleIds = new Set(vehicles.map((v) => v.id))
  const validChildIds = new Set(children.map((c) => c.id))
  const validMemberIds = new Set((household?.members ?? []).map((m) => m.id))

  const sanitized = parsed.data.map((draft) => ({
    ...draft,
    petId: draft.petId && validPetIds.has(draft.petId) ? draft.petId : null,
    vehicleId: draft.vehicleId && validVehicleIds.has(draft.vehicleId) ? draft.vehicleId : null,
    childId: draft.childId && validChildIds.has(draft.childId) ? draft.childId : null,
    relatedMemberId:
      draft.relatedMemberId && validMemberIds.has(draft.relatedMemberId)
        ? draft.relatedMemberId
        : null,
  }))

  await applyTaskPlan(householdId, sanitized, {
    source: "AI",
    aiGenerationId,
  })

  return { success: true, data: undefined }
}

async function describeAiError(error: unknown): Promise<string> {
  if (error instanceof AiRefusalError || error instanceof AiInvalidOutputError) {
    return error.message
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "El asistente está muy solicitado ahora mismo. Inténtalo en unos segundos."
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "No se pudo contactar con el asistente. Revisa tu conexión e inténtalo de nuevo."
  }
  if (error instanceof Anthropic.APIError) {
    console.error("AI plan generation failed", error)
    return "Ha ocurrido un error generando el plan. Inténtalo de nuevo."
  }
  console.error("AI plan generation failed with an unexpected error", error)
  return "Ha ocurrido un error generando el plan. Inténtalo de nuevo."
}
