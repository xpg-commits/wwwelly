import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z } from "zod"

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

// Fixed taxonomy instead of freeform categories — keeps the /compras grouping
// stable and lets "Otros" be a real, expected bucket rather than a symptom of
// a bad classification.
export const SHOPPING_CATEGORIES = [
  "Frutas y verduras",
  "Carne y pescado",
  "Lácteos y huevos",
  "Panadería",
  "Despensa",
  "Congelados",
  "Bebidas",
  "Limpieza y hogar",
  "Higiene y cuidado personal",
  "Otros",
] as const

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number]

const CategorizationSchema = z.object({
  category: z.enum(SHOPPING_CATEGORIES),
})

// Same model/env-var convention as taskPlanner.ts — a classification task,
// not reasoning, so the fast/cheap model is the right call here too.
const CATEGORIZER_MODEL = process.env.ANTHROPIC_TASK_PLANNER_MODEL ?? "claude-haiku-4-5"

// Best-effort — never blocks adding the item if it fails; returns null on
// any error.
export async function categorizeShoppingItem(name: string): Promise<ShoppingCategory | null> {
  try {
    const response = await client.messages.parse({
      model: CATEGORIZER_MODEL,
      max_tokens: 256,
      system:
        "Clasifica el siguiente producto de una lista de la compra en una de estas categorías " +
        `exactas: ${SHOPPING_CATEGORIES.join(", ")}. Si no encaja claramente en ninguna, usa "Otros".`,
      messages: [{ role: "user", content: name }],
      output_config: { format: zodOutputFormat(CategorizationSchema) },
    })
    if (response.stop_reason === "refusal" || !response.parsed_output) return null
    return response.parsed_output.category
  } catch {
    return null
  }
}
