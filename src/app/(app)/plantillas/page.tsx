import Link from "next/link"

import { listTemplates } from "@/services/templates"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export default async function PlantillasPage() {
  const templates = await listTemplates()

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plantillas de rutinas</h1>
        <p className="text-muted-foreground">
          Elige tu situación y te preparamos el plan completo, con fechas.
        </p>
      </div>

      <Card className="border-none bg-accent/50">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-medium">
              ¿Buscas organizar el día a día del hogar, no una situación puntual?
            </p>
            <p className="text-sm text-muted-foreground">
              El asistente de reparto propone un reparto equitativo de las tareas
              domésticas entre los adultos.
            </p>
          </div>
          <Link href="/ajustes/hogar/reparto" className={buttonVariants({ size: "sm" })}>
            Ir al reparto de tareas
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <Link key={template.id} href={`/plantillas/${template.key}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="py-4">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {template._count.tasks} tareas
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
