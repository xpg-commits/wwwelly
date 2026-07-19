"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { GoogleButton } from "@/components/auth/google-button"
import { authClient } from "@/lib/auth-client"

const schema = z
  .object({
    name: z.string().min(1, "Dinos cómo te llamas."),
    email: z.string().email("Introduce un email válido."),
    birthDate: z.string().min(1, "Indica tu fecha de nacimiento."),
    password: z.string().min(8, "Al menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Al menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep] = useState<"form" | "verify">("form")
  const [email, setEmail] = useState("")

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", birthDate: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null)
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      birthDate: values.birthDate,
    })
    if (error) {
      setServerError(error.message ?? "No se pudo crear la cuenta.")
      return
    }
    setEmail(values.email)
    setStep("verify")
  }

  if (step === "verify") {
    return <VerifyEmailStep email={email} />
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    captionLayout="dropdown"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repite la contraseña</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>
      </Form>
      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            o
            <div className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton label="Continuar con Google" />
        </>
      )}
    </div>
  )
}

// Segundo paso: el registro ya creó la cuenta (sin sesión, a la espera de
// verificar) y disparó el envío del código — aquí solo se comprueba.
function VerifyEmailStep({ email }: { email: string }) {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendPending, setResendPending] = useState(false)
  const [resent, setResent] = useState(false)

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp })
    setPending(false)
    if (error) {
      setError(error.message ?? "Código incorrecto o caducado.")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  async function resend() {
    setResendPending(true)
    setResent(false)
    await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })
    setResendPending(false)
    setResent(true)
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm">
          Te hemos mandado un código a <span className="font-medium">{email}</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Introdúcelo aquí para confirmar que es tu email — lo necesitarás si
          alguna vez tienes que recuperar la contraseña.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp">Código de verificación</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending || otp.length < 6}>
        {pending ? "Comprobando…" : "Verificar"}
      </Button>
      <button
        type="button"
        onClick={resend}
        disabled={resendPending}
        className="w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
      >
        {resendPending ? "Reenviando…" : resent ? "Código reenviado" : "Reenviar código"}
      </button>
    </form>
  )
}
