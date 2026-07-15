import Link from "next/link"

import { requireActiveMember } from "@/lib/session"
import { listPets } from "@/services/pets"
import { CreatePetForm } from "@/components/pets/create-pet-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function MascotasPage() {
  const { householdId } = await requireActiveMember()
  const pets = await listPets(householdId)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">🐶 Mascotas</h1>
          <p className="text-muted-foreground">
            Vacunas, veterinario y desparasitaciones, todo en un sitio.
          </p>
        </div>
      </div>

      <CreatePetForm />

      {pets.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Todavía no has añadido ninguna mascota.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/mascotas/${pet.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-4">
                  <p className="font-medium">{pet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
