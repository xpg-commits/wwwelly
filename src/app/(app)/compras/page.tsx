import { requireActiveMember } from "@/lib/session"
import { getOrCreateDefaultList, getShoppingItems } from "@/services/shopping"
import { SHOPPING_CATEGORIES } from "@/lib/ai/shoppingCategorizer"
import { AddShoppingItemForm } from "@/components/shopping/add-shopping-item-form"
import { ShoppingItemRow } from "@/components/shopping/shopping-item-row"
import { SuggestionRow } from "@/components/shopping/suggestion-row"

export default async function ComprasPage() {
  const { householdId } = await requireActiveMember()
  const list = await getOrCreateDefaultList(householdId)
  const { active, suggested, dormant } = await getShoppingItems(list.id)

  // Fixed taxonomy order, "Otros" last — items without a category (AI
  // categorization failed, or predate this feature) fold into "Otros" too.
  const categories = SHOPPING_CATEGORIES.map((name) => ({
    name,
    activeItems: active.filter((i) => (i.category ?? "Otros") === name),
    dormantItems: dormant.filter((i) => (i.category ?? "Otros") === name),
  })).filter((g) => g.activeItems.length > 0 || g.dormantItems.length > 0)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lista de la compra</h1>
        <p className="text-muted-foreground">
          Los productos que siempre se acaban, sin tener que volver a
          escribirlos cada vez.
        </p>
      </div>

      <AddShoppingItemForm />

      {suggested.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Puede que te esté haciendo falta
          </h2>
          <div className="space-y-1.5">
            {suggested.map((item) => (
              <SuggestionRow
                key={item.id}
                id={item.id}
                name={item.name}
                avgPurchaseIntervalDays={item.avgPurchaseIntervalDays}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        {active.length === 0 && dormant.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            Nada pendiente de comprar.
          </p>
        ) : (
          categories.map((group) => (
            <div key={group.name} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{group.name}</h2>
              <div className="space-y-1.5">
                {group.activeItems.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    novaGroup={item.novaGroup}
                    addedBy={item.addedBy}
                  />
                ))}
                {/* Checked items sink to the bottom of their category, greyed
                    out with who checked them off, instead of vanishing into a
                    separate section — they stay one un-check away. */}
                {group.dormantItems.map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    novaGroup={item.novaGroup}
                    checked
                    checkedBy={item.checkedBy}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
