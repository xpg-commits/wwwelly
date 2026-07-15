"use server"

import { z } from "zod"

import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import { TaskDraftSchema, type TaskDraft } from "@/lib/ai/schemas"
import { applyTaskPlan } from "@/services/tasks"

type ActionResult = { success: true } | { success: false; error: string }

export async function applyTemplateAction(
  templateKey: string,
  triggerDateISO: string,
  drafts: TaskDraft[]
): Promise<ActionResult> {
  const { householdId, session } = await requireActiveMember()

  const template = await db.routineTemplate.findUnique({ where: { key: templateKey } })
  if (!template || !template.isActive) {
    return { success: false, error: "Plantilla no encontrada." }
  }

  const triggerDate = new Date(triggerDateISO)
  if (Number.isNaN(triggerDate.getTime())) {
    return { success: false, error: "Elige una fecha válida." }
  }

  // Never trust drafts a client component sends back verbatim.
  const parsed = z.array(TaskDraftSchema).safeParse(drafts)
  if (!parsed.success || parsed.data.length === 0) {
    return { success: false, error: "No hay tareas que confirmar." }
  }

  await db.routineApplication.create({
    data: {
      householdId,
      templateId: template.id,
      triggerDate,
      appliedById: session.user.id,
    },
  })

  await applyTaskPlan(householdId, parsed.data, {
    source: "TEMPLATE",
    anchorDate: triggerDate,
  })

  return { success: true }
}
