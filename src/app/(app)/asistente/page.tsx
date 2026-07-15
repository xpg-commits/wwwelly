import { AssistantForm } from "@/components/ai/assistant-form"

export default function AsistentePage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Asistente</h1>
        <p className="text-muted-foreground">
          Cuéntale una situación y te propondrá las tareas que suele traer
          consigo, con fechas. Tú decides cuáles se quedan.
        </p>
      </div>
      <AssistantForm />
    </div>
  )
}
