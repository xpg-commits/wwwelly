import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar en wwwelly</CardTitle>
        <CardDescription>
          La memoria de tu hogar te está esperando.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm googleEnabled={googleEnabled} />
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-foreground underline underline-offset-4">
            Crear una
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
