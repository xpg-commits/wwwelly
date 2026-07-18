"use client"

import { useState } from "react"
import Link from "next/link"
import { BrainIcon, LayoutGridIcon, SparklesIcon, UsersIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { cn } from "@/lib/utils"

const SLIDES = [
  {
    icon: BrainIcon,
    title: "Todo lo que llevas en la cabeza",
    body: "Citas, revisiones, la ITV, cuándo tocaba la vacuna del perro… wwwelly lo recuerda por ti, para que tú no tengas que hacerlo.",
  },
  {
    icon: LayoutGridIcon,
    title: "Un sitio para cada parte de tu vida",
    body: "Hogar, mascotas, coche, salud y compras — todo organizado del mismo modo, sin diez apps ni una libreta perdida.",
  },
  {
    icon: SparklesIcon,
    title: "Cuéntaselo, y ella se encarga",
    body: "Escribe una frase o una receta y wwwelly te propone el plan de tareas. Tú solo confirmas.",
  },
  {
    icon: UsersIcon,
    title: "Compartido con tu gente",
    body: "Cada persona del hogar ve lo suyo, y las tareas se pueden repartir entre todos.",
  },
] as const

export function OnboardingSlides() {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]
  const Icon = slide.icon

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
      <div className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
        <Logo size={32} />
        wwwelly
      </div>

      <div key={index} className="stagger-in flex flex-col items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-accent">
          <Icon className="size-9 text-primary" strokeWidth={1.6} />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {slide.title}
          </h2>
          <p className="text-sm text-muted-foreground">{slide.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a la diapositiva ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"
            )}
          />
        ))}
      </div>

      <div className="flex w-full items-center justify-between gap-3">
        {isLast ? (
          <Link href="/registro" className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
            Empezar
          </Link>
        ) : (
          <>
            <Link
              href="/registro"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Saltar
            </Link>
            <Button size="lg" onClick={() => setIndex((i) => i + 1)}>
              Siguiente
            </Button>
          </>
        )}
      </div>

      <Link
        href="/login"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Ya tengo cuenta
      </Link>
    </div>
  )
}
