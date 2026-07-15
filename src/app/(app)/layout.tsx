import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { CreateHouseholdForm } from "@/components/household/create-household-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session) {
    redirect("/login")
  }

  if (!session.session.activeOrganizationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Crea tu hogar</CardTitle>
            <CardDescription>
              Todo lo que registres vivirá aquí, no en tu cabeza.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateHouseholdForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  const household = await auth.api.getFullOrganization({ headers: reqHeaders })

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Narela
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden text-foreground sm:inline">
            {household?.name}
          </span>
          <Link href="/hogar" className="hover:text-foreground">
            Hogar
          </Link>
          <Link href="/mascotas" className="hover:text-foreground">
            Mascotas
          </Link>
          <Link href="/vehiculos" className="hover:text-foreground">
            Vehículos
          </Link>
          <Link href="/ninos" className="hover:text-foreground">
            Niños
          </Link>
          <Link href="/salud" className="hover:text-foreground">
            Salud
          </Link>
          <Link href="/asistente" className="hover:text-foreground">
            Asistente
          </Link>
          <Link href="/ajustes/miembros" className="hover:text-foreground">
            Miembros
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
