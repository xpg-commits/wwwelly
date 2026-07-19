import { db } from "@/lib/db"
import { computeAvgPurchaseIntervalDays, isDueForRepurchase } from "@/lib/purchaseInterval"
import { categorizeShoppingItem } from "@/lib/ai/shoppingCategorizer"

export async function getOrCreateDefaultList(householdId: string) {
  const existing = await db.shoppingList.findFirst({ where: { householdId } })
  if (existing) return existing
  return db.shoppingList.create({ data: { householdId } })
}

export async function addShoppingItem(
  listId: string,
  name: string,
  addedByMemberId: string | null,
  quantity?: string | null
) {
  // Best-effort and awaited — this is a single low-frequency write, not a
  // hot path, and having the category right on first render beats a second
  // refresh cycle. Never blocks/fails item creation if it errors.
  const category = await categorizeShoppingItem(name)

  return db.shoppingItem.create({
    data: {
      listId,
      name,
      quantity: quantity ?? null,
      status: "ACTIVE",
      addedByMemberId,
      category,
    },
  })
}

export async function deleteShoppingItem(itemId: string) {
  return db.shoppingItem.delete({ where: { id: itemId } })
}

export async function markItemPurchased(itemId: string, checkedByMemberId: string | null) {
  const purchasedAt = new Date()

  return db.$transaction(async (tx) => {
    await tx.shoppingItemPurchase.create({ data: { itemId, purchasedAt } })

    const purchases = await tx.shoppingItemPurchase.findMany({
      where: { itemId },
      orderBy: { purchasedAt: "asc" },
      select: { purchasedAt: true },
    })

    const avgPurchaseIntervalDays = computeAvgPurchaseIntervalDays(
      purchases.map((p) => p.purchasedAt)
    )

    return tx.shoppingItem.update({
      where: { id: itemId },
      data: {
        status: "PURCHASED",
        lastPurchasedAt: purchasedAt,
        avgPurchaseIntervalDays,
        checkedByMemberId,
      },
    })
  })
}

export async function reactivateItem(itemId: string) {
  return db.shoppingItem.update({
    where: { id: itemId },
    data: { status: "ACTIVE", checkedByMemberId: null },
  })
}

export async function getShoppingItems(listId: string) {
  const items = await db.shoppingItem.findMany({
    where: { listId, status: { in: ["ACTIVE", "PURCHASED"] } },
    include: {
      addedBy: { include: { user: true } },
      checkedBy: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const active = items.filter((i) => i.status === "ACTIVE")
  const suggested = items.filter(
    (i) =>
      i.status === "PURCHASED" &&
      isDueForRepurchase({
        lastPurchasedAt: i.lastPurchasedAt,
        avgPurchaseIntervalDays: i.avgPurchaseIntervalDays,
      })
  )
  // Bought recently, not due yet — sinks to the bottom of the same list
  // (checked, greyed, "comprado por…") instead of disappearing, so
  // avgPurchaseIntervalDays keeps building without losing the item from view.
  const dormant = items.filter(
    (i) => i.status === "PURCHASED" && !suggested.includes(i)
  )

  return { active, suggested, dormant }
}
