import Link from "next/link"

import { requireActiveMember } from "@/lib/session"
import { listVehicles } from "@/services/vehicles"
import { CreateVehicleForm } from "@/components/vehicles/create-vehicle-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function VehiculosPage() {
  const { householdId } = await requireActiveMember()
  const vehicles = await listVehicles(householdId)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vehículos</h1>
        <p className="text-muted-foreground">
          ITV, seguro, neumáticos y revisiones, todo automático.
        </p>
      </div>

      <CreateVehicleForm />

      {vehicles.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Todavía no has añadido ningún vehículo.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehiculos/${vehicle.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-4">
                  <p className="font-medium">{vehicle.alias}</p>
                  <p className="text-sm text-muted-foreground">
                    {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Sin datos"}
                    {vehicle.plate ? ` · ${vehicle.plate}` : ""}
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
