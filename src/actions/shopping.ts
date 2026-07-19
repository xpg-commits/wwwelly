"use server"

import { requireActiveMember } from "@/lib/session"
import { db } from "@/lib/db"
import * as shoppingService from "@/services/shopping"

type ActionResult = { success: true } | { success: false; error: string }

export async function addShoppingItemAction(formData: FormData): Promise<ActionResult> {
  const { householdId, member } = await requireActiveMember()

  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { success: false, error: "Escribe qué necesitas comprar." }
  }
  const quantity = String(formData.get("quantity") ?? "").trim() || null

  const list = await shoppingService.getOrCreateDefaultList(householdId)
  await shoppingService.addShoppingItem(list.id, name, member.id, quantity)

  return { success: true }
}

async function assertItemBelongsToHousehold(itemId: string, householdId: string) {
  const item = await db.shoppingItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { householdId: true } } },
  })
  return item?.list.householdId === householdId
}

export async function markItemPurchasedAction(itemId: string): Promise<ActionResult> {
  const { householdId, member } = await requireActiveMember()

  if (!(await assertItemBelongsToHousehold(itemId, householdId))) {
    return { success: false, error: "Producto no encontrado." }
  }

  await shoppingService.markItemPurchased(itemId, member.id)
  return { success: true }
}

export async function reactivateItemAction(itemId: string): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  if (!(await assertItemBelongsToHousehold(itemId, householdId))) {
    return { success: false, error: "Producto no encontrado." }
  }

  await shoppingService.reactivateItem(itemId)
  return { success: true }
}

export async function deleteShoppingItemAction(itemId: string): Promise<ActionResult> {
  const { householdId } = await requireActiveMember()

  if (!(await assertItemBelongsToHousehold(itemId, householdId))) {
    return { success: false, error: "Producto no encontrado." }
  }

  await shoppingService.deleteShoppingItem(itemId)
  return { success: true }
}
