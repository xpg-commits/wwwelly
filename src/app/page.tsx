import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Narela
        </h1>
        <p className="max-w-md text-muted-foreground">
          La app que recuerda por ti todo lo que normalmente llevas en la
          cabeza.
        </p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
        Entrar
      </Link>
    </div>
  )
}
