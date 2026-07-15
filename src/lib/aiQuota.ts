import { startOfDay } from "date-fns"

import { db } from "@/lib/db"

const DAILY_GENERATIONS_PER_HOUSEHOLD = 20

export class AiQuotaExceededError extends Error {
  constructor() {
    super("Has alcanzado el límite diario del asistente para este hogar.")
    this.name = "AiQuotaExceededError"
  }
}

// Independent of (and additional to) the Anthropic SDK's own request-level
// rate limiting — this is what actually protects against a household
// hammering the "generar" button, not a single call's retries.
export async function assertAiQuotaAvailable(householdId: string) {
  const count = await db.aiGeneration.count({
    where: { householdId, createdAt: { gte: startOfDay(new Date()) } },
  })
  if (count >= DAILY_GENERATIONS_PER_HOUSEHOLD) {
    throw new AiQuotaExceededError()
  }
}
