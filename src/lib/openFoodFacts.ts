// Best-effort NOVA processing-level lookup against Open Food Facts (free,
// public, no API key). Real Fooding/MyRealFood has no public API — NOVA
// (1 = unprocessed, 4 = ultra-processed) is the same underlying concept
// their own classification is built on. Never throws: a shopping item like
// "papel higiénico" just won't match anything, and that's fine — no dot.
const USER_AGENT = "wwwelly/1.0 (+hola@xiomaraperez.com)"

export async function lookupNovaGroup(productName: string): Promise<number | null> {
  try {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl")
    url.searchParams.set("search_terms", productName)
    url.searchParams.set("search_simple", "1")
    url.searchParams.set("action", "process")
    url.searchParams.set("json", "1")
    url.searchParams.set("page_size", "5")
    url.searchParams.set("fields", "nova_group")

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return null

    const data: unknown = await response.json()
    const products =
      data && typeof data === "object" && Array.isArray((data as { products?: unknown }).products)
        ? ((data as { products: unknown[] }).products as Array<{ nova_group?: unknown }>)
        : []

    const match = products.find((p) => typeof p.nova_group === "number")
    return typeof match?.nova_group === "number" ? match.nova_group : null
  } catch {
    return null
  }
}
