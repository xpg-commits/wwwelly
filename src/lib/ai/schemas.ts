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
})

export const TaskPlanSchema = z.object({
  tasks: z.array(TaskDraftSchema),
})

export type TaskDraft = z.infer<typeof TaskDraftSchema>
export type TaskPlan = z.infer<typeof TaskPlanSchema>
