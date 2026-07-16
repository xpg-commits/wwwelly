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
})

export const TaskPlanSchema = z.object({
  tasks: z.array(TaskDraftSchema),
})

export type TaskDraft = z.infer<typeof TaskDraftSchema>
export type TaskPlan = z.infer<typeof TaskPlanSchema>
