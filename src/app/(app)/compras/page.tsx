import { requireActiveMember } from "@/lib/session"
import { getOrCreateDefaultList, getShoppingItems } from "@/services/shopping"
import { AddShoppingItemForm } from "@/components/shopping/add-shopping-item-form"
import { ShoppingItemRow } from "@/components/shopping/shopping-item-row"
import { SuggestionRow } from "@/components/shopping/suggestion-row"

export default async function ComprasPage() {
  const { householdId } = await requireActiveMember()
  const list = await getOrCreateDefaultList(householdId)
  const { active, suggested, dormant } = await getShoppingItems(list.id)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
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

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Lista de la compra
        </h2>
        {active.length === 0 && dormant.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            Nada pendiente de comprar.
          </p>
        ) : (
          <div className="space-y-1.5">
            {active.map((item) => (
              <ShoppingItemRow
                key={item.id}
                id={item.id}
                name={item.name}
                novaGroup={item.novaGroup}
                addedBy={item.addedBy}
              />
            ))}
            {/* Checked items sink to the bottom of the same list, greyed out
                with who checked them off, instead of vanishing into a
                separate section — they stay one un-check away. */}
            {dormant.map((item) => (
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
        )}
      </section>
    </div>
  )
}
