import Link from "next/link"

import { listTemplates } from "@/services/templates"
import { Card, CardContent } from "@/components/ui/card"

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

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <Link key={template.id} href={`/plantillas/${template.key}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardContent className="py-4">
                <p className="font-medium">
                  {template.icon} {template.name}
                </p>
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
