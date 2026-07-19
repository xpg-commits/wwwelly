"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import { isMemberColorKey } from "@/lib/memberColors"
import { uploadImage, InvalidImageError } from "@/lib/upload"

type ActionResult = { success: true } | { success: false; error: string }

export async function updateMyColorAction(color: string): Promise<ActionResult> {
  const { member } = await requireActiveMember()

  if (!isMemberColorKey(color)) {
    return { success: false, error: "Color no válido." }
  }

  await db.householdMember.update({
    where: { id: member.id },
    data: { color },
  })

  return { success: true }
}

export async function updateMyProfileAction(
  data: { birthDate?: string; pronouns?: string }
): Promise<ActionResult> {
  await requireActiveMember()

  await auth.api.updateUser({
    body: {
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
      ...(data.pronouns !== undefined && { pronouns: data.pronouns }),
    },
    headers: await headers(),
  })

  return { success: true }
}

export async function updateMyAvatarAction(formData: FormData): Promise<ActionResult> {
  await requireActiveMember()

  const file = formData.get("photo")
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Elige una imagen." }
  }

  try {
    const url = await uploadImage(file, "avatars")
    await auth.api.updateUser({ body: { image: url }, headers: await headers() })
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return { success: false, error: error.message }
    }
    throw error
  }

  return { success: true }
}
