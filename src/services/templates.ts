import { db } from "@/lib/db"

export async function listTemplates() {
  return db.routineTemplate.findMany({
    where: { isActive: true },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getTemplateByKey(key: string) {
  return db.routineTemplate.findUnique({
    where: { key },
    include: { tasks: { orderBy: { order: "asc" } } },
  })
}
