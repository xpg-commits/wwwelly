import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

import { auth } from "@/lib/auth"
import { listChildren } from "@/services/children"
import { CreateHouseholdForm } from "@/components/household/create-household-form"
import { AutoActivateHousehold } from "@/components/household/auto-activate-household"
import { UserMenu } from "@/components/household/user-menu"
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
import {
  ALL_FILTER_KEY,
  DEFAULT_MODULE_ORDER,
  filterHref,
  filterLabel,
  isFilterKey,
  withBackfilledOrder,
  type FilterKey,
} from "@/lib/modules"
import { Logo } from "@/components/brand/logo"
import { PageTransition } from "@/components/layout/page-transition"
import { BottomNav } from "@/components/layout/bottom-nav"

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
      <div className="flex flex-1 items-center justify-center px-4 py-12">
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

  const householdId = session.session.activeOrganizationId
  const [household, childRows, myHouseholds] = await Promise.all([
    auth.api.getFullOrganization({ headers: reqHeaders }),
    listChildren(householdId),
    auth.api.listOrganizations({ headers: reqHeaders }),
  ])
  const childOptions = childRows.map((c) => ({ id: c.id, name: c.name }))

  const myMember = household?.members.find((m) => m.userId === session.user.id)
  const myColor = (myMember as { color?: string } | undefined)?.color ?? "terracota"
  const myHiddenModules = (myMember as { hiddenModules?: string[] } | undefined)?.hiddenModules ?? []

  const rawEnabled = (household as { enabledModules?: unknown })?.enabledModules
  const householdEnabled = Array.isArray(rawEnabled) ? rawEnabled.filter(isFilterKey) : DEFAULT_MODULE_ORDER
  // Household-wide enabled set, minus whatever THIS person has personally
  // hidden from their own view (my-modules-form.tsx) — never the other way
  // around, a module the household hasn't enabled can't be un-hidden here.
  const enabledSet = new Set<FilterKey>(
    householdEnabled.filter((key) => key === ALL_FILTER_KEY || !myHiddenModules.includes(key))
  )
  const rawOrder = (household as { moduleOrder?: unknown })?.moduleOrder
  const order: FilterKey[] = withBackfilledOrder(
    Array.isArray(rawOrder) ? rawOrder.filter(isFilterKey) : DEFAULT_MODULE_ORDER
  )

  const moduleLinks = [
    ...order
      .filter((key) => enabledSet.has(key))
      .map((key) => ({
        key,
        href: key === ALL_FILTER_KEY ? "/dashboard" : (filterHref(key) ?? "/dashboard"),
        label: filterLabel(key),
      })),
    { key: "TEMPLATES", href: "/plantillas", label: "Plantillas de rutinas" },
  ]
  const memberOptions = (household?.members ?? []).map((m) => ({
    id: m.id,
    name: (m as { displayName?: string | null }).displayName ?? m.user.name,
  }))

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between bg-card/80 px-6 py-3 shadow-[0_1px_0_rgba(80,50,20,0.05)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-heading font-semibold tracking-tight"
          >
            <Logo size={22} />
            wwwelly
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {household?.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop only — mobile gets the bottom nav instead of a menu. */}
          <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
              >
                Módulos
                <ChevronDownIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {moduleLinks.map((item) => (
                  <DropdownMenuItem key={item.key} render={<Link href={item.href} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <AddTaskDialog
              members={memberOptions}
              currentMemberId={myMember?.id ?? ""}
              childOptions={childOptions}
            />
          </nav>
          <UserMenu
            name={session.user.name}
            color={myColor}
            image={session.user.image}
            households={myHouseholds.map((h) => ({ id: h.id, name: h.name }))}
            activeHouseholdId={householdId}
          />
        </div>
      </header>
      <main className="flex flex-1 flex-col pb-24 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav
        enabledModules={Array.from(enabledSet)}
        moduleOrder={order}
        members={memberOptions}
        currentMemberId={myMember?.id ?? ""}
        childOptions={childOptions}
      />
    </div>
  )
}
