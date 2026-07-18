"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { requireActiveMember } from "@/lib/session"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertAiQuotaAvailable, AiQuotaExceededError } from "@/lib/aiQuota"
import {
  generateChoreDistributionPlan,
} from "@/lib/ai/choreDistributionPlanner"
import { AiRefusalError, TASK_PLANNER_MODEL } from "@/lib/ai/taskPlanner"
import { ChoreWizardAnswersSchema, type ChoreWizardAnswers } from "@/lib/ai/choreSchemas"
import { TaskDraftSchema, type TaskDraft } from "@/lib/ai/schemas"
import { applyTaskPlan } from "@/services/tasks"
import { describeAiError } from "@/actions/ai"

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ChoreWizardMember = { id: string; name: string }
export type ChoreWizardChild = { id: string; name: string }

async function getAdultMembers() {
  const active = await requireActiveMember()
  const [household, childRows] = await Promise.all([
    auth.api.getFullOrganization({ headers: await headers() }),
    db.child.findMany({
      where: { householdId: active.householdId },
      select: { id: true, name: true },
    }),
  ])
  const adults: ChoreWizardMember[] = (household?.members ?? [])
    .filter((m) => (m as { visibilityRole?: string }).visibilityRole === "ADULT")
    .map((m) => ({
      id: m.id,
      name: (m as { displayName?: string | null }).displayName ?? m.user.name,
    }))
  return { ...active, adults, children: childRows as ChoreWizardChild[] }
}

export async function generateChoreDistributionPlanAction(
  answers: ChoreWizardAnswers
): Promise<
  ActionResult<{
    aiGenerationId: string
    tasks: TaskDraft[]
    rationale: string
    members: ChoreWizardMember[]
    children: ChoreWizardChild[]
  }>
> {
  const parsedAnswers = ChoreWizardAnswersSchema.safeParse(answers)
  if (!parsedAnswers.success) {
    return { success: false, error: "Las respuestas del cuestionario no son válidas." }
  }

  const { householdId, session, adults, children } = await getAdultMembers()

  // Never trust the participant list a client sends verbatim — only real
  // ADULT members of this household can enter the rotation.
  const validAdultIds = new Set(adults.map((a) => a.id))
  const participantMemberIds = parsedAnswers.data.participantMemberIds.filter((id) =>
    validAdultIds.has(id)
  )
  if (participantMemberIds.length === 0) {
    return { success: false, error: "Selecciona al menos un adulto para el reparto." }
  }
  const participants = adults.filter((a) => participantMemberIds.includes(a.id))

  // Same reasoning for each category's involved-children picks — only real
  // children of this household, never trusted verbatim from the client.
  const validChildIds = new Set(children.map((c) => c.id))
  const sanitizeChildIds = (ids: string[]) => ids.filter((id) => validChildIds.has(id))
  const parsedData = parsedAnswers.data
  const sanitizedAnswers: ChoreWizardAnswers = {
    ...parsedData,
    bathrooms: parsedData.bathrooms
      ? { ...parsedData.bathrooms, involvedChildIds: sanitizeChildIds(parsedData.bathrooms.involvedChildIds) }
      : null,
    kitchen: parsedData.kitchen
      ? { ...parsedData.kitchen, involvedChildIds: sanitizeChildIds(parsedData.kitchen.involvedChildIds) }
      : null,
    floors: parsedData.floors
      ? { ...parsedData.floors, involvedChildIds: sanitizeChildIds(parsedData.floors.involvedChildIds) }
      : null,
    laundry: parsedData.laundry
      ? { ...parsedData.laundry, involvedChildIds: sanitizeChildIds(parsedData.laundry.involvedChildIds) }
      : null,
    shopping: parsedData.shopping
      ? { ...parsedData.shopping, involvedChildIds: sanitizeChildIds(parsedData.shopping.involvedChildIds) }
      : null,
    trash: parsedData.trash
      ? { ...parsedData.trash, involvedChildIds: sanitizeChildIds(parsedData.trash.involvedChildIds) }
      : null,
  }

  try {
    await assertAiQuotaAvailable(householdId)
  } catch (error) {
    if (error instanceof AiQuotaExceededError) {
      return { success: false, error: error.message }
    }
    throw error
  }

  const answersForPlanner: ChoreWizardAnswers = { ...sanitizedAnswers, participantMemberIds }

  const generation = await db.aiGeneration.create({
    data: {
      householdId,
      requestedById: session.user.id,
      inputText: JSON.stringify(answersForPlanner),
      status: "PENDING",
      model: TASK_PLANNER_MODEL,
    },
  })

  try {
    const plan = await generateChoreDistributionPlan(answersForPlanner, participants, children)
    await db.aiGeneration.update({
      where: { id: generation.id },
      data: { status: "COMPLETED" },
    })
    return {
      success: true,
      data: {
        aiGenerationId: generation.id,
        tasks: plan.tasks,
        rationale: plan.rationale,
        members: participants,
        children,
      },
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

export async function confirmChoreDistributionPlanAction(
  aiGenerationId: string,
  drafts: TaskDraft[]
): Promise<ActionResult> {
  const { householdId, member } = await requireActiveMember()

  const generation = await db.aiGeneration.findUnique({ where: { id: aiGenerationId } })
  if (!generation || generation.householdId !== householdId) {
    return { success: false, error: "No se encontró ese plan." }
  }

  // Never trust drafts a client component sends back verbatim — the user may
  // have edited assignments/rotations (or excluded some tasks) before
  // confirming.
  const parsed = z.array(TaskDraftSchema).safeParse(drafts)
  if (!parsed.success) {
    return { success: false, error: "El plan de tareas no es válido." }
  }
  if (parsed.data.length === 0) {
    return { success: false, error: "No hay tareas que confirmar." }
  }

  const [household, childRows] = await Promise.all([
    auth.api.getFullOrganization({ headers: await headers() }),
    db.child.findMany({ where: { householdId }, select: { id: true } }),
  ])
  const validMemberIds = new Set((household?.members ?? []).map((m) => m.id))
  const validChildIds = new Set(childRows.map((c) => c.id))

  const sanitized = parsed.data.map((draft) => ({
    ...draft,
    assignedToMemberId:
      draft.assignedToMemberId && validMemberIds.has(draft.assignedToMemberId)
        ? draft.assignedToMemberId
        : null,
    rotationMemberIds: (draft.rotationMemberIds ?? []).filter((id) => validMemberIds.has(id)),
    involvedChildIds: (draft.involvedChildIds ?? []).filter((id) => validChildIds.has(id)),
    // This planner never links pets/vehicles/health subjects — drop any of
    // those defensively even if a tampered draft set one.
    petId: null,
    vehicleId: null,
    childId: null,
    relatedMemberId: null,
  }))

  await applyTaskPlan(householdId, sanitized, {
    source: "AI",
    aiGenerationId,
    createdByMemberId: member.id,
  })

  return { success: true, data: undefined }
}
