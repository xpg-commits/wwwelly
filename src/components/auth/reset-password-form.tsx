"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN"
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (invalidToken || !token) {
    return (
      <p className="text-sm text-destructive">
        Este enlace ya no es válido — puede que haya caducado. Pide uno nuevo desde
        la pantalla de inicio de sesión.
      </p>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)
        const newPassword = String(formData.get("newPassword") ?? "")
        const confirmPassword = String(formData.get("confirmPassword") ?? "")

        if (newPassword.length < 8) {
          setError("La contraseña debe tener al menos 8 caracteres.")
          return
        }
        if (newPassword !== confirmPassword) {
          setError("Las contraseñas no coinciden.")
          return
        }

        setPending(true)
        const { error } = await authClient.resetPassword({ newPassword, token })
        setPending(false)
        if (error) {
          setError(error.message ?? "No se pudo cambiar la contraseña.")
          return
        }
        router.push("/login")
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="newPassword">Contraseña nueva</Label>
        <PasswordInput id="newPassword" name="newPassword" required minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repítela</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  )
}
