import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"

import { TaskPlanSchema, type TaskDraft } from "./schemas"

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

export async function generatePlanFromText(inputText: string): Promise<TaskDraft[]> {
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
      "el mismo día).",
    messages: [{ role: "user", content: inputText }],
    output_config: { format: zodOutputFormat(TaskPlanSchema) },
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
