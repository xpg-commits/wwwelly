import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"

import { AiTaskPlanSchema, type TaskDraft } from "./schemas"

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

// Extraction task, not reasoning — a fast/cheap model is the right tradeoff
// here (this is a paid feature, but margin still matters at scale).
// Configurable via env so it can be bumped without a redeploy.
export const TASK_PLANNER_MODEL =
  process.env.ANTHROPIC_TASK_PLANNER_MODEL ?? "claude-haiku-4-5"

const MAX_TASKS = 8

export class AiRefusalError extends Error {
  constructor() {
    super("La IA no ha podido generar un plan para ese texto.")
    this.name = "AiRefusalError"
  }
}

export class AiInvalidOutputError extends Error {
  constructor() {
    super("La IA devolvió un resultado que no se pudo interpretar.")
    this.name = "AiInvalidOutputError"
  }
}

export type HouseholdEntityContext = {
  pets: { id: string; label: string }[]
  vehicles: { id: string; label: string }[]
  children: { id: string; label: string }[]
  members: { id: string; label: string }[]
}

function formatEntityContext(context?: HouseholdEntityContext): string {
  if (!context) return ""
  const sections: string[] = []
  if (context.pets.length > 0) {
    sections.push(
      "Mascotas: " + context.pets.map((p) => `${p.label} (id=${p.id})`).join(", ")
    )
  }
  if (context.vehicles.length > 0) {
    sections.push(
      "Vehículos: " + context.vehicles.map((v) => `${v.label} (id=${v.id})`).join(", ")
    )
  }
  if (context.children.length > 0) {
    sections.push(
      "Hijos/as: " + context.children.map((c) => `${c.label} (id=${c.id})`).join(", ")
    )
  }
  if (context.members.length > 0) {
    sections.push(
      "Miembros del hogar: " +
        context.members.map((m) => `${m.label} (id=${m.id})`).join(", ")
    )
  }
  if (sections.length === 0) return ""
  return (
    "\n\nElementos ya registrados en este hogar (usa el id EXACTO tal cual aparece " +
    "aquí solo si la frase se refiere claramente a uno de ellos — por nombre, tipo, o " +
    "contexto inequívoco; si hay duda o no se menciona ninguno, deja los cuatro campos " +
    "de vínculo en null; nunca inventes un id que no esté en esta lista):\n" +
    sections.join("\n")
  )
}

export async function generatePlanFromText(
  inputText: string,
  entityContext?: HouseholdEntityContext
): Promise<TaskDraft[]> {
  const response = await client.messages.parse({
    model: TASK_PLANNER_MODEL,
    max_tokens: 2048,
    system:
      "Eres un asistente que convierte una frase de un usuario sobre su vida familiar en una " +
      "lista corta de tareas del hogar accionables, en español. Cada tarea lleva un " +
      "dueDateOffsetDays (entero, en días respecto a hoy; 0 significa hoy, puede ser negativo " +
      `si ya debería estar hecho). Genera como máximo ${MAX_TASKS} tareas. Sé conservador: si la ` +
      "frase no da pie a tareas concretas, devuelve una lista vacía en vez de inventar. No " +
      "asumas una fecha exacta que el usuario no ha dado — elige el offset que mejor encaje " +
      '(por ejemplo, "empieza el colegio en septiembre" implica tareas varias semanas antes, no ' +
      "el mismo día). Si el usuario pide explícitamente que algo se repita (\"anual\", \"cada " +
      "año\", \"cada 3 meses\", \"todos los meses\"...), rellena recurrenceIntervalDays (el " +
      "intervalo en días: ~365 para anual, ~30 para mensual) y recurrenceType: usa " +
      "FIXED_SCHEDULE cuando la recurrencia depende de una fecha fija externa que no se mueve " +
      "aunque la tarea se complete tarde (ITV, seguro, impuestos, renovación de documento), y " +
      "REACTIVE cuando depende de cuándo se completa de verdad la propia tarea (cambiar un " +
      "filtro, desparasitar a la mascota). Dos tareas relacionadas (p. ej. un aviso y su " +
      "recordatorio de seguimiento a los pocos días) pueden compartir el mismo intervalo y tipo " +
      "de recurrencia si el usuario describe que ambas se repiten con el ciclo. Si no se pide " +
      "repetición, deja ambos campos en null. Cada tarea también lleva petId, vehicleId, " +
      "childId y relatedMemberId — normalmente los cuatro en null, salvo que la frase se " +
      "refiera claramente a un elemento ya registrado de la lista de contexto que te doy más " +
      "abajo, en cuyo caso rellena solo el campo correspondiente con su id exacto. Además " +
      "lleva assignedToMemberId: solo rellénalo con el id de un miembro de la lista si la " +
      "frase dice explícitamente quién debe encargarse de la tarea (p. ej. \"que la haga " +
      "Juan\", \"asígnaselo a Marta\"); si no se especifica responsable, déjalo en null. " +
      "Cada tarea también lleva rotationMemberIds: este planificador no reparte turnos, así " +
      "que déjalo siempre en null. Lleva además involvedChildIds (niños que ayudan o " +
      "participan en la tarea, no el sujeto de la tarea): rellénalo solo si el texto dice " +
      "explícitamente que un hijo/a participa o ayuda (p. ej. \"que Pablo ayude a...\"); si no, " +
      "déjalo en null." +
      formatEntityContext(entityContext),
    messages: [{ role: "user", content: inputText }],
    output_config: { format: zodOutputFormat(AiTaskPlanSchema) },
  })

  // Structured output doesn't guarantee a refusal still matches the schema —
  // check stop_reason before trusting parsed_output.
  if (response.stop_reason === "refusal") {
    throw new AiRefusalError()
  }
  if (!response.parsed_output) {
    throw new AiInvalidOutputError()
  }

  return response.parsed_output.tasks.slice(0, MAX_TASKS)
}

export { Anthropic }
