import { z } from "zod"

export const TaskDraftSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  module: z.enum([
    "GENERAL",
    "HOME",
    "VEHICLE",
    "PET",
    "CHILD",
    "HEALTH",
    "SHOPPING",
  ]),
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
