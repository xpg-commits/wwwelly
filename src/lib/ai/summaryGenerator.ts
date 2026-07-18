import Anthropic from "@anthropic-ai/sdk"

import type { HouseholdStats } from "@/services/stats"

const client = new Anthropic()

// Same model choice as the task planner — this is a short, structured-input
// text generation, not open-ended reasoning.
const SUMMARY_MODEL = process.env.ANTHROPIC_TASK_PLANNER_MODEL ?? "claude-haiku-4-5"

export async function generateHouseholdSummary(
  householdName: string,
  stats: HouseholdStats
): Promise<string> {
  if (stats.totalCompleted === 0) {
    return "Todavía no hay tareas completadas en los últimos meses — en cuanto empecéis a marcar cosas como hechas, aquí aparecerá un resumen de cómo va todo."
  }

  const memberLines = stats.byMember
    .map((m) => `- ${m.name}: ${m.count} tareas completadas`)
    .join("\n")
  const weeklyTrend = stats.weekly.map((w) => `${w.weekLabel}: ${w.count}`).join(", ")

  const response = await client.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 400,
    system:
      "Eres el asistente de una app familiar de gestión del hogar (wwwelly). Te doy datos " +
      "agregados de tareas completadas en las últimas 12 semanas y debes escribir un resumen " +
      "breve (2-4 frases), cálido y motivador, en español, dirigido a toda la familia. Pon en " +
      "valor lo que ha hecho cada miembro por su nombre (sin inventar datos que no te doy). No " +
      "uses un tono corporativo ni de informe — como si un amigo cercano estuviera contento de " +
      "cómo ha ido todo. No repitas los números en crudo más de una vez.",
    messages: [
      {
        role: "user",
        content:
          `Hogar: ${householdName}\n` +
          `Total tareas completadas (últimas 12 semanas): ${stats.totalCompleted}\n` +
          `Por miembro:\n${memberLines}\n` +
          `Tendencia semanal: ${weeklyTrend}`,
      },
    ],
  })

  const textBlock = response.content.find((block) => block.type === "text")
  return textBlock?.type === "text"
    ? textBlock.text
    : "No he podido generar el resumen esta vez — inténtalo de nuevo en un momento."
}
