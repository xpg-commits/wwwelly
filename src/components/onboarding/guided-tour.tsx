"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LayoutGridIcon, PlusCircleIcon, UserCircleIcon, ListChecksIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Each step points at a real element via data-tour="<target>" somewhere in
// the dashboard/header — the spotlight measures and highlights the actual
// thing, not a mock of it.
const STEPS = [
  {
    target: "task-list",
    icon: ListChecksIcon,
    title: "Tu día, de un vistazo",
    body: "Hoy, Esta semana y Más adelante — sin listas eternas.",
  },
  {
    target: "module-filter",
    icon: LayoutGridIcon,
    title: "Estos chips filtran",
    body: "Toca Hogar, Mascotas, Vehículos… \"Todo\" lo vuelve a juntar.",
  },
  {
    target: "add-task-fab",
    icon: PlusCircleIcon,
    title: "El botón + lo crea todo",
    body: "Escríbela tú a mano, o cuéntasela a wwwelly y te propone el plan.",
  },
  {
    target: "user-menu",
    icon: UserCircleIcon,
    title: "Tu perfil vive aquí",
    body: "Perfil, configuración del hogar, miembros, cuenta y soporte.",
  },
] as const

type Rect = { top: number; left: number; width: number; height: number }

function tourStorageKey(memberId: string) {
  return `wwwelly-tour-seen-${memberId}`
}

function measure(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const PAD = 10

export function GuidedTour({ memberId }: { memberId: string }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (!localStorage.getItem(tourStorageKey(memberId))) {
      // Let the dashboard finish its own entrance animations before
      // measuring real positions.
      const t = setTimeout(() => setActive(true), 700)
      return () => clearTimeout(t)
    }
  }, [memberId])

  useEffect(() => {
    if (!active) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    function update() {
      setRect(measure(STEPS[step].target))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [active, step])

  if (!active) return null

  function finish() {
    localStorage.setItem(tourStorageKey(memberId), "1")
    setActive(false)
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const spotlight = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  // Card goes below the target if there's room, otherwise above; clamped
  // horizontally so it never runs off a narrow screen.
  const cardWidth = 300
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 390
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800
  const spaceBelow = spotlight ? viewportH - (spotlight.top + spotlight.height) : 999
  const placeBelow = spotlight ? spaceBelow > 180 || spotlight.top < 180 : true
  const cardTop = spotlight
    ? placeBelow
      ? spotlight.top + spotlight.height + 14
      : Math.max(16, spotlight.top - 14 - 160)
    : viewportH / 2 - 80
  const cardLeft = spotlight
    ? Math.min(
        Math.max(16, spotlight.left + spotlight.width / 2 - cardWidth / 2),
        viewportW - cardWidth - 16
      )
    : viewportW / 2 - cardWidth / 2

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark wash with a spotlight hole punched out via a huge box-shadow —
          animates smoothly between steps instead of jump-cutting. */}
      <motion.div
        className="pointer-events-none fixed rounded-2xl"
        style={{ boxShadow: "0 0 0 9999px rgba(20,16,40,0.72)" }}
        initial={false}
        animate={
          spotlight ?? { top: viewportH / 2, left: viewportW / 2, width: 0, height: 0 }
        }
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      />
      {/* Click anywhere outside the card to skip */}
      <button
        aria-label="Cerrar recorrido"
        onClick={finish}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          style={{ top: cardTop, left: cardLeft, width: cardWidth }}
          className="absolute rounded-2xl bg-card p-4 shadow-[0_12px_32px_-6px_rgba(20,16,40,0.35)] ring-1 ring-foreground/[0.06]"
        >
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Icon className="size-4.5 text-primary" strokeWidth={1.8} />
            </div>
            <h2 className="font-heading text-sm font-semibold">{current.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{current.body}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step ? "w-5 bg-primary" : "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={finish}>
                Saltar
              </Button>
              <Button
                size="sm"
                onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              >
                {isLast ? "Entendido" : "Siguiente"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
