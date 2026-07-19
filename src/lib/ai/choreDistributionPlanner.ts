import { z } from "zod"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"

import { Anthropic, TASK_PLANNER_MODEL, AiRefusalError, AiInvalidOutputError } from "./taskPlanner"
import { AiTaskDraftSchema } from "./schemas"
import type { ChoreWizardAnswers } from "./choreSchemas"

const client = new Anthropic()

// Generous compared to the free-text assistant's cap of 8 — a full
// household chore setup (baños, cocina, suelos, colada, compra, basura)
// legitimately spans more individual recurring tasks than one off-the-cuff
// sentence would.
const MAX_TASKS = 20

export const ChoreDistributionPlanSchema = z.object({
  tasks: z.array(AiTaskDraftSchema),
  // 2-4 short sentences explaining how the load was balanced across
  // participants — shown to the user in the review screen.
  rationale: z.string(),
})

export type ChoreDistributionPlan = z.infer<typeof ChoreDistributionPlanSchema>

function describeInvolvedChildren(
  ids: string[],
  children: { id: string; name: string }[]
): string {
  if (ids.length === 0) return ""
  const names = ids
    .map((id) => children.find((c) => c.id === id))
    .filter((c): c is { id: string; name: string } => Boolean(c))
    .map((c) => `${c.name} (id=${c.id})`)
    .join(", ")
  return names ? ` Implicando a: ${names}.` : ""
}

function describeAnswers(
  answers: ChoreWizardAnswers,
  children: { id: string; name: string }[]
): string {
  const lines: string[] = []
  const kids = (ids: string[]) => describeInvolvedChildren(ids, children)

  if (answers.bathrooms) {
    const { count, frequencyDays, mode, involvedChildIds } = answers.bathrooms
    lines.push(
      `Baños: ${count} baño${count === 1 ? "" : "s"}, limpieza cada ${frequencyDays} días, modo ${mode}` +
        (count > 1
          ? mode === "FIJO"
            ? " (cada baño con su propia tarea y su propio responsable fijo)"
            : " (una sola tarea que cubre todos los baños, y el turno de quién la hace rota)"
          : "") +
        kids(involvedChildIds)
    )
  }
  if (answers.kitchen) {
    const { hasDishwasher, frequencyDays, mode, involvedChildIds } = answers.kitchen
    lines.push(
      `Cocina: limpieza de encimeras/fogones cada ${frequencyDays} días (modo ${mode}); ` +
        (hasDishwasher ? "tienen lavavajillas (vaciarlo)" : "friegan a mano") +
        "; sacar la basura de cocina." +
        kids(involvedChildIds)
    )
  }
  if (answers.floors) {
    const { frequencyDays, mode, involvedChildIds } = answers.floors
    lines.push(`Suelos y polvo: cada ${frequencyDays} días, modo ${mode}.${kids(involvedChildIds)}`)
  }
  if (answers.laundry) {
    const { doesIroning, frequencyDays, mode, involvedChildIds } = answers.laundry
    lines.push(
      `Colada: poner lavadoras/tender cada ${frequencyDays} días, modo ${mode}` +
        (doesIroning ? "; también planchan." : "; no planchan.") +
        kids(involvedChildIds)
    )
  }
  if (answers.shopping) {
    lines.push(`Compra y despensa: modo ${answers.shopping.mode}.${kids(answers.shopping.involvedChildIds)}`)
  }
  if (answers.trash) {
    const { frequencyDays, recyclingFrequencyDays, mode, involvedChildIds } = answers.trash
    lines.push(
      `Basura: cada ${frequencyDays} días, modo ${mode}. Reciclaje/vidrio/cartón: cada ${recyclingFrequencyDays} días.` +
        kids(involvedChildIds)
    )
  }

  return lines.join("\n")
}

export async function generateChoreDistributionPlan(
  answers: ChoreWizardAnswers,
  members: { id: string; name: string }[],
  children: { id: string; name: string }[] = []
): Promise<ChoreDistributionPlan> {
  const membersList = members.map((m) => `${m.name} (id=${m.id})`).join(", ")
  const categories = describeAnswers(answers, children)

  const response = await client.messages.parse({
    model: TASK_PLANNER_MODEL,
    max_tokens: 3072,
    system:
      "Eres un asistente que ayuda a una familia a repartir las tareas domésticas recurrentes " +
      "de forma equitativa entre los adultos del hogar, en español. Te doy la lista de adultos " +
      "que participan y, categoría por categoría, qué hay que hacer, con qué frecuencia (en " +
      "días) y si el usuario quiere modo FIJO o ROTATIVO para esa categoría. Para cada " +
      "categoría respondida, genera una o varias tareas (crea una tarea POR CADA BAÑO si hay " +
      "más de uno y el modo es FIJO — cada baño con su propio responsable; crea UNA sola tarea " +
      "para todos los baños si el modo es ROTATIVO). Cada tarea debe llevar recurrenceType " +
      "REACTIVE (la siguiente aparece N días después de completarla de verdad, no atada a una " +
      "fecha de calendario fija) y recurrenceIntervalDays igual a la frecuencia dada. " +
      "dueDateOffsetDays: usa 0 (empiezan hoy) salvo que tenga sentido escalonarlas un poco para " +
      "no amontonar todo el primer día. petId/vehicleId/childId/relatedMemberId: siempre null " +
      "(este asistente no vincula tareas a mascotas/vehículos/hijos). " +
      "\n\nPara CADA tarea decide entre estos dos modos: " +
      "\n- Si la categoría es FIJO: elige un assignedToMemberId (uno de los adultos) y deja " +
      "rotationMemberIds en null. Reparte el conjunto TOTAL de tareas fijas de forma " +
      "equilibrada entre todos los adultos — no le des todo a la misma persona. " +
      "\n- Si la categoría es ROTATIVO: rellena rotationMemberIds con TODOS los adultos " +
      "participantes, en el orden en que deben ir turnándose, y pon assignedToMemberId igual " +
      "al primero de esa lista (quien empieza). " +
      "\n\nSi una categoría indica \"Implicando a: NOMBRE (id=ID)\", copia ese/esos id EXACTOS " +
      "en involvedChildIds para TODAS las tareas generadas de esa categoría — son niños que " +
      "ayudan o participan, no responsables ni sustitutos del reparto entre adultos. Si una " +
      "categoría no menciona ningún niño, deja involvedChildIds en null en sus tareas. " +
      "\n\nAl final, escribe un campo rationale con 2 a 4 frases en español explicando el " +
      "criterio de reparto que has usado para que quede equilibrado entre las personas " +
      "(por ejemplo, si alguien ya tiene más tareas fijas por otro motivo, dale menos bloques " +
      "rotativos que empiecen por ella). " +
      `\n\nAdultos que participan en el reparto: ${membersList}.` +
      `\n\nRespuestas del cuestionario:\n${categories}`,
    messages: [
      {
        role: "user",
        content: "Genera el plan de reparto de tareas a partir de estas respuestas.",
      },
    ],
    output_config: { format: zodOutputFormat(ChoreDistributionPlanSchema) },
  })

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError()
  }
  if (!response.parsed_output) {
    throw new AiInvalidOutputError()
  }

  return {
    tasks: response.parsed_output.tasks.slice(0, MAX_TASKS),
    rationale: response.parsed_output.rationale,
  }
}
