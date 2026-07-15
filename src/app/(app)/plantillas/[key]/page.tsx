import { notFound } from "next/navigation"

import { getTemplateByKey } from "@/services/templates"
import { TemplateApplyForm } from "@/components/templates/template-apply-form"

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  const template = await getTemplateByKey(key)
  if (!template || !template.isActive) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {template.icon} {template.name}
        </h1>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <TemplateApplyForm
        templateKey={template.key}
        triggerLabel={`¿Qué día? (${template.tasks.length} tareas se repartirán alrededor de esa fecha)`}
        tasks={template.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          dayOffset: t.dayOffset,
          module: t.module,
        }))}
      />
    </div>
  )
}
