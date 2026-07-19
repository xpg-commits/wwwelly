import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>
}) {
  const { next, email } = await searchParams
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  )
  const registerHref = `/registro${next ? `?next=${encodeURIComponent(next)}${email ? `&email=${encodeURIComponent(email)}` : ""}` : ""}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar en wwwelly</CardTitle>
        <CardDescription>
          La memoria de tu hogar te está esperando.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm googleEnabled={googleEnabled} next={next} defaultEmail={email} />
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href={registerHref} className="font-medium text-foreground underline underline-offset-4">
            Crear una
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
