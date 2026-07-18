import Link from "next/link"

import { requireActiveMember } from "@/lib/session"
import { listChildren } from "@/services/children"
import { CreateChildForm } from "@/components/children/create-child-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function NinosPage() {
  const { householdId } = await requireActiveMember()
  const children = await listChildren(householdId)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Niños</h1>
        <p className="text-muted-foreground">
          Colegio, actividades, excursiones, cumpleaños y ropa.
        </p>
      </div>

      <CreateChildForm />

      {children.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Todavía no has añadido ningún hijo/a.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((child) => (
            <Link key={child.id} href={`/ninos/${child.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-4">
                  <p className="font-medium">{child.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
