import { z } from "zod"

// "FIJO" = siempre la misma persona; "ROTATIVO" = el turno rota entre los
// participantes cada vez que la tarea se completa (ver rotationMemberIds en
// Task). Quién exactamente hace cada tarea lo decide la IA al generar el
// plan, buscando equilibrar la carga total — el usuario solo dice qué hay
// que hacer, con qué frecuencia, y si quiere turno fijo o rotativo.
export const ChoreModeSchema = z.enum(["FIJO", "ROTATIVO"])

const frequencyDays = z.number().int().positive()
// Child ids (Niños module profiles) marked as helping/participating in a
// category's tasks — carried straight through into each resulting
// TaskDraft.involvedChildIds, not something the AI decides.
const involvedChildIds = z.array(z.string()).default([])

export const ChoreWizardAnswersSchema = z.object({
  // Miembros ADULT del hogar que entran en el reparto — validado contra el
  // hogar real en la server action, nunca solo confiado del cliente.
  participantMemberIds: z.array(z.string()).min(1),
  bathrooms: z
    .object({
      count: z.number().int().min(1).max(10),
      frequencyDays,
      mode: ChoreModeSchema,
      involvedChildIds,
    })
    .nullable(),
  kitchen: z
    .object({
      hasDishwasher: z.boolean(),
      frequencyDays,
      mode: ChoreModeSchema,
      involvedChildIds,
    })
    .nullable(),
  floors: z.object({ frequencyDays, mode: ChoreModeSchema, involvedChildIds }).nullable(),
  laundry: z
    .object({
      doesIroning: z.boolean(),
      frequencyDays,
      mode: ChoreModeSchema,
      involvedChildIds,
    })
    .nullable(),
  shopping: z.object({ mode: ChoreModeSchema, involvedChildIds }).nullable(),
  trash: z
    .object({
      frequencyDays,
      recyclingFrequencyDays: frequencyDays,
      mode: ChoreModeSchema,
      involvedChildIds,
    })
    .nullable(),
})

export type ChoreWizardAnswers = z.infer<typeof ChoreWizardAnswersSchema>
export type ChoreMode = z.infer<typeof ChoreModeSchema>
