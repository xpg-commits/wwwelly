import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

// Shown on the dashboard while the household hasn't organized any Hogar
// tasks yet — covers both "just created the household" (zero home tasks by
// definition) and "invited people but never got round to organizing" (still
// zero home tasks, so it keeps nudging). Disappears for good the moment a
// single HOME-module task exists, however it got there.
//
// "Organizar tareas" is always offered, regardless of household size — the
// reparto wizard works solo too (everything just defaults to fijo when
// there's only one adult). Inviting people / adding kids are suggestions
// shown alongside it, never a gate blocking the one person who actually
// wants to use the app on their own.
export function GettingStartedBanner({
  adultCount,
  childCount,
}: {
  adultCount: number
  childCount: number
}) {
  const isSolo = adultCount <= 1

  return (
    <Card className="border-none bg-accent/50">
      <CardContent className="space-y-3 py-5">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            ¡Acabas de aterrizar!
          </h2>
          <p className="text-sm text-muted-foreground">
            Si te parece, vamos a empezar por lo más importante…
          </p>
        </div>

        <p className="text-sm">
          {isSolo
            ? "Si vais a repartir las tareas entre varios, invita antes a los adultos de tu hogar. Si prefieres organizarte ya, puedes empezar directamente — se puede ajustar más adelante."
            : "Ya estáis todos — vamos a organizar las tareas del hogar entre todos."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/ajustes/hogar/reparto" className={buttonVariants({ size: "sm" })}>
            Organizar tareas
          </Link>
          {isSolo && (
            <Link
              href="/ajustes/miembros"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Invitar a mi hogar
            </Link>
          )}
          {childCount === 0 && (
            <Link
              href="/ninos"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ¿Hay niños en casa? Añádelos aquí
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
