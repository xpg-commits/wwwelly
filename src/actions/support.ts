"use server"

import { requireActiveMember } from "@/lib/session"
import { sendEmail } from "@/lib/email"

type ActionResult = { success: true } | { success: false; error: string }

const SUPPORT_EMAIL = "hola@xiomaraperez.com"

export async function sendSupportMessageAction(formData: FormData): Promise<ActionResult> {
  const { session } = await requireActiveMember()

  const subject = String(formData.get("subject") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()
  if (!subject || !message) {
    return { success: false, error: "Rellena el asunto y el mensaje." }
  }

  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Soporte wwwelly] ${subject}`,
      html: `
        <p><strong>De:</strong> ${session.user.name} (${session.user.email})</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    })
  } catch {
    return { success: false, error: "No se pudo enviar el mensaje. Inténtalo de nuevo." }
  }

  return { success: true }
}
