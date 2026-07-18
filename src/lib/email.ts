import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// From address needs a domain verified in Resend to work in production —
// until then Resend only delivers to the account owner's own inbox, which is
// fine for getting this wired up before a custom domain is verified there.
const FROM = process.env.RESEND_FROM_EMAIL ?? "wwwelly <onboarding@resend.dev>"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY no configurada — no se envió "${subject}" a ${to}.`
    )
    return
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) {
    console.error("[email] Resend error:", error)
    throw new Error("No se pudo enviar el email.")
  }
}
