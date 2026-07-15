import { db } from "@/lib/db"

export type CreatePetInput = {
  householdId: string
  name: string
  species: string
  breed?: string | null
  birthDate?: Date | null
  notes?: string | null
}

export async function createPet(input: CreatePetInput) {
  return db.pet.create({ data: input })
}

export async function listPets(householdId: string) {
  return db.pet.findMany({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  })
}

export async function getPet(petId: string) {
  return db.pet.findUnique({ where: { id: petId } })
}
