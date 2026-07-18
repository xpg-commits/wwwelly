import { requireActiveMember } from "@/lib/session"
import { getHouseholdStats } from "@/services/stats"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { WeeklyChart } from "@/components/stats/weekly-chart"
import { SummaryPanel } from "@/components/stats/summary-panel"
import { memberColorVar } from "@/lib/memberColors"

export default async function ResumenPage() {
  const { householdId } = await requireActiveMember()
  const stats = await getHouseholdStats(householdId)

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-12 pb-16">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Resumen
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Los últimos 3 meses de {stats.totalCompleted}{" "}
          {stats.totalCompleted === 1 ? "tarea completada" : "tareas completadas"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>wwwelly te cuenta</CardTitle>
          <CardDescription>Un resumen escrito, no solo números.</CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tareas completadas por semana</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyChart data={stats.weekly} />
        </CardContent>
      </Card>

      {stats.byMember.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quién ha hecho qué</CardTitle>
            <CardDescription>Cada miembro, en su color.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byMember.map((m) => {
              const max = stats.byMember[0].count
              const widthPct = max > 0 ? Math.round((m.count / max) * 100) : 0
              return (
                <div key={m.memberId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground">{m.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: memberColorVar(m.color),
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
