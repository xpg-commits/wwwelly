"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Si esa dirección tiene una cuenta en wwwelly, te hemos mandado un enlace para
        elegir una contraseña nueva. Revisa tu bandeja de entrada — y si no lo ves
        en un par de minutos, échale un ojo a la carpeta de spam.
      </p>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        const email = String(new FormData(e.currentTarget).get("email") ?? "")
        setPending(true)
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        })
        setPending(false)
        if (error) {
          setError(error.message ?? "No se pudo enviar el email.")
          return
        }
        setSent(true)
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  )
}
