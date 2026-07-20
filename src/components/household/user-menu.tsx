"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckIcon, PlusIcon, SettingsIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FeatureIdeaDialog } from "@/components/support/feature-idea-dialog"
import { CreateHouseholdForm } from "@/components/household/create-household-form"
import { activateHouseholdAction } from "@/actions/household"
import { authClient } from "@/lib/auth-client"
import { memberColorVar } from "@/lib/memberColors"

const MENU_LINKS = [
  { href: "/ajustes/perfil", label: "Mi perfil" },
  { href: "/ajustes/hogar", label: "Configuración del hogar" },
  { href: "/ajustes/miembros", label: "Miembros del hogar" },
  { href: "/ajustes/cuenta", label: "Cuenta" },
  { href: "/ajustes/soporte", label: "Soporte" },
]

// The header's settings entry point: a plain gear icon (not the user's own
// avatar/initial — that's identity, not a settings affordance) that opens an
// offcanvas from the right, not a dropdown. Items are plain single-line text,
// no icons — the gear already says "this is settings".
export function UserMenu({
  name,
  color,
  image,
  households,
  activeHouseholdId,
}: {
  name: string
  color: string
  image?: string | null
  households: { id: string; name: string }[]
  activeHouseholdId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ideaOpen, setIdeaOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const initial = name.trim().charAt(0).toUpperCase() || "?"

  function switchHousehold(id: string) {
    if (id === activeHouseholdId) return
    startTransition(async () => {
      const result = await activateHouseholdAction(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Configuración"
        data-tour="user-menu"
      >
        <SettingsIcon className="size-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 gap-1 p-5">
          <SheetHeader className="flex-row items-center gap-2.5 p-0 pb-2">
            <Avatar className="size-9">
              {image && <AvatarImage src={image} />}
              <AvatarFallback
                style={{ backgroundColor: memberColorVar(color), color: "white" }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <SheetTitle className="whitespace-nowrap">{name}</SheetTitle>
          </SheetHeader>

          <div className="mt-1 space-y-1">
            <p className="px-1 text-xs font-medium text-muted-foreground">Tus hogares</p>
            {households.map((h) => (
              <button
                key={h.id}
                type="button"
                disabled={pending}
                onClick={() => switchHousehold(h.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span className="truncate">{h.name}</span>
                {h.id === activeHouseholdId && (
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setCreateOpen(true)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusIcon className="size-4" />
              Crear otro hogar
            </button>
          </div>

          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              setOpen(false)
              setIdeaOpen(true)
            }}
          >
            ¿Te falta algo?
          </Button>
          <nav className="mt-2 flex flex-col">
            {MENU_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 border-t pt-2">
            <button
              type="button"
              className="w-full whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-muted"
              onClick={() => {
                authClient.signOut().then(() => {
                  router.push("/")
                  router.refresh()
                })
              }}
            >
              Salir
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <FeatureIdeaDialog open={ideaOpen} onOpenChange={setIdeaOpen} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear otro hogar</DialogTitle>
            <DialogDescription>
              Pasarás a verlo a él — puedes volver a cambiar de hogar cuando quieras desde aquí mismo.
            </DialogDescription>
          </DialogHeader>
          <CreateHouseholdForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
