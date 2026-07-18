import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { listPets } from "@/services/pets"
import { listVehicles } from "@/services/vehicles"
import { listChildren } from "@/services/children"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { ModuleOrderEditor } from "@/components/household/module-order-editor"
import {
  PetsManagerSection,
  VehiclesManagerSection,
  ChildrenManagerSection,
} from "@/components/household/entity-manager-sections"
import { DEFAULT_MODULE_ORDER, isFilterKey, type FilterKey } from "@/lib/modules"

export default async function ConfiguracionHogarPage() {
  const { householdId } = await requireActiveMember()
  const reqHeaders = await headers()

  const [household, pets, vehicles, children] = await Promise.all([
    auth.api.getFullOrganization({ headers: reqHeaders }),
    listPets(householdId),
    listVehicles(householdId),
    listChildren(householdId),
  ])

  const rawEnabled = (household as { enabledModules?: unknown })?.enabledModules
  const enabledModules = Array.isArray(rawEnabled)
    ? rawEnabled.filter(isFilterKey)
    : DEFAULT_MODULE_ORDER

  const rawOrder = (household as { moduleOrder?: unknown })?.moduleOrder
  const moduleOrder: FilterKey[] = Array.isArray(rawOrder)
    ? rawOrder.filter(isFilterKey)
    : DEFAULT_MODULE_ORDER
  // Anything missing from a stale/partial order (new modules added since it
  // was last saved) still shows up, appended at the end.
  for (const key of DEFAULT_MODULE_ORDER) {
    if (!moduleOrder.includes(key)) moduleOrder.push(key)
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configuración del hogar
        </h1>
        <p className="text-muted-foreground">
          Activa y ordena los módulos de {household?.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulos</CardTitle>
          <CardDescription>
            Flechas para ordenar, el interruptor activa o desactiva — nada se
            borra al desactivar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleOrderEditor order={moduleOrder} enabled={enabledModules} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reparto de tareas</CardTitle>
          <CardDescription>
            Un asistente que pregunta cómo es vuestra casa y propone un reparto
            equitativo de las tareas domésticas entre los adultos del hogar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/ajustes/hogar/reparto" className={buttonVariants({ size: "sm" })}>
            Configurar reparto
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mascotas, vehículos y niños</CardTitle>
          <CardDescription>
            Edítalos, elimínalos o añade nuevos directamente desde aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion multiple>
            <PetsManagerSection pets={pets} />
            <VehiclesManagerSection vehicles={vehicles} />
            <ChildrenManagerSection children={children} />
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
