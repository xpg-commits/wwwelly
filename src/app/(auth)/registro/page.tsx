import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>
}) {
  const { next, email } = await searchParams
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  )
  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}${email ? `&email=${encodeURIComponent(email)}` : ""}` : ""}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea tu cuenta</CardTitle>
        <CardDescription>
          En un minuto tienes tu hogar listo para dejar de recordarlo todo tú.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegisterForm googleEnabled={googleEnabled} next={next} defaultEmail={email} />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href={loginHref} className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
