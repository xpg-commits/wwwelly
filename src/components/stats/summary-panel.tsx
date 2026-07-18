"use client"

import { useState, useTransition } from "react"
import { SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { generateSummaryAction } from "@/actions/stats"

export function SummaryPanel() {
  const [pending, startTransition] = useTransition()
  const [summary, setSummary] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {summary ? (
        <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Deja que wwwelly te cuente cómo han ido los últimos meses.
        </p>
      )}
      <Button
        variant={summary ? "outline" : "default"}
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await generateSummaryAction()
            if (!result.success) {
              toast.error(result.error)
              return
            }
            setSummary(result.data.summary)
          })
        }}
      >
        <SparklesIcon className="size-4" />
        {pending ? "Pensando…" : summary ? "Generar de nuevo" : "Generar resumen"}
      </Button>
    </div>
  )
}
