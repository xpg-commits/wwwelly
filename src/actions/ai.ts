"use server"

import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import { assertAiQuotaAvailable, AiQuotaExceededError } from "@/lib/aiQuota"
import {
  generatePlanFromText,
  AiRefusalError,
  AiInvalidOutputError,
  TASK_PLANNER_MODEL,
} from "@/lib/ai/taskPlanner"
import { TaskDraftSchema, type TaskDraft } from "@/lib/ai/schemas"
import { applyTaskPlan } from "@/services/tasks"

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function generateTaskPlanAction(
  formData: FormData
): Promise<ActionResult<{ aiGenerationId: string; drafts: TaskDraft[] }>> {
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
    const drafts = await generatePlanFromText(inputText)
    await db.aiGeneration.update({
      where: { id: generation.id },
      data: { status: "COMPLETED" },
    })
    return { success: true, data: { aiGenerationId: generation.id, drafts } }
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

  await applyTaskPlan(householdId, parsed.data, {
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
