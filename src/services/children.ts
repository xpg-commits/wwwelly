import { db } from "@/lib/db"

export type CreateChildInput = {
  householdId: string
  name: string
  birthDate?: Date | null
  notes?: string | null
}

export async function createChild(input: CreateChildInput) {
  return db.child.create({ data: input })
}

export async function listChildren(householdId: string) {
  return db.child.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  })
}

export async function getChild(childId: string) {
  return db.child.findUnique({ where: { id: childId } })
}
