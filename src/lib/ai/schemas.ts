import { z } from "zod"

// General "draft that becomes a real Task row" contract, shared by the AI
// planner AND by routine templates (some seeded templates legitimately tag
// one-off errands like "Comprar los regalos" as SHOPPING — that's a fine use
// of the module for a dated todo, distinct from the AI free-text assistant
// inventing grocery items that belong in /compras instead). See
// AiTaskDraftSchema below for the narrower module set the AI itself is
// constrained to.
export const TaskDraftSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  module: z.enum(["GENERAL", "HOME", "VEHICLE", "PET", "CHILD", "HEALTH", "SHOPPING"]),
  // Days relative to today (0 = today; negative if it should already be done).
  dueDateOffsetDays: z.number().int(),
  // Only set when the user explicitly asked for something recurring ("cada
  // año", "anual", "cada 3 meses"...). REACTIVE re-anchors to whenever the
  // task actually gets completed; FIXED_SCHEDULE re-anchors to the original
  // due date instead, which is what a yearly deadline (ITV, seguro) wants —
  // completing it two weeks late shouldn't drag next year's date with it.
  recurrenceType: z.enum(["REACTIVE", "FIXED_SCHEDULE"]).nullable(),
  recurrenceIntervalDays: z.number().int().positive().nullable(),
  // Links this task to an existing pet/vehicle/child/member of the
  // household. Must be one of the ids handed to the model as context — never
  // a made-up id — and at most one of the four should be set per task.
  petId: z.string().nullable(),
  vehicleId: z.string().nullable(),
  childId: z.string().nullable(),
  relatedMemberId: z.string().nullable(),
  // Who's responsible for doing the task — different from relatedMemberId,
  // which is who the task is *about* (e.g. a health task's subject). Only
  // set when the text names a specific person to do it; left null to fall
  // back to whoever confirms the plan.
  assignedToMemberId: z.string().nullable(),
  // Ordered list of member ids taking turns on this task. Null/empty = fixed
  // (assignedToMemberId never changes across recurrences); 2+ ids = the
  // turn rotates to the next id in this list each time the task recurs,
  // wrapping back to the start. When set, assignedToMemberId should be the
  // first id in this list (whoever starts).
  rotationMemberIds: z.array(z.string()).nullable(),
  // Children (from the Niños module, no login of their own) involved or
  // helping with this task — separate from childId above, which is who the
  // task is *about* (e.g. a pediatric checkup's subject).
  involvedChildIds: z.array(z.string()).nullable(),
})

export const TaskPlanSchema = z.object({
  tasks: z.array(TaskDraftSchema),
})

export type TaskDraft = z.infer<typeof TaskDraftSchema>
export type TaskPlan = z.infer<typeof TaskPlanSchema>

// What the AI (free-text assistant + chore wizard) is actually allowed to
// generate — SHOPPING excluded, since those flows interpret loose language
// and would otherwise reinvent generic "buy milk" tasks that duplicate the
// real /compras list. A narrower module set here is still structurally a
// TaskDraft, so the AI's output can be used anywhere a TaskDraft is expected.
export const AiTaskDraftSchema = TaskDraftSchema.extend({
  module: z.enum(["GENERAL", "HOME", "VEHICLE", "PET", "CHILD", "HEALTH"]),
})

export const AiTaskPlanSchema = z.object({
  tasks: z.array(AiTaskDraftSchema),
})
