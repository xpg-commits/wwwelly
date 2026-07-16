import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

import { auth } from "@/lib/auth"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { CreateHouseholdForm } from "@/components/household/create-household-form"
import { AutoActivateHousehold } from "@/components/household/auto-activate-household"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddTaskDialog } from "@/components/tasks/add-task-dialog"

const MODULE_LINKS = [
  { href: "/hogar", label: "🏠 Hogar" },
  { href: "/mascotas", label: "🐶 Mascotas" },
  { href: "/vehiculos", label: "🚗 Vehículos" },
  { href: "/ninos", label: "👶 Niños" },
  { href: "/salud", label: "💊 Salud" },
  { href: "/compras", label: "🛒 Compras" },
  { href: "/plantillas", label: "📋 Plantillas de rutinas" },
]

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
    // No active household on THIS session doesn't mean the user has none —
    // a fresh login doesn't inherit it. Only offer "create a household" once
    // we've confirmed they truly have zero memberships.
    const existingHouseholds = await auth.api.listOrganizations({ headers: reqHeaders })
    if (existingHouseholds.length > 0) {
      return <AutoActivateHousehold organizationId={existingHouseholds[0].id} />
    }

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
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <header className="flex items-center justify-between bg-card/80 px-6 py-3 shadow-[0_1px_0_rgba(80,50,20,0.05)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-heading font-semibold tracking-tight">
            Narela
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {household?.name}
          </span>
        </div>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
            >
              Módulos
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {MODULE_LINKS.map((item) => (
                <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/ajustes/miembros"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Miembros
          </Link>
          <SignOutButton />
          <AddTaskDialog />
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
