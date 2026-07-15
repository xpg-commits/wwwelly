import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Narela</h1>
        <p className="max-w-md text-muted-foreground">
          La app que recuerda por ti todo lo que normalmente llevas en la
          cabeza.
        </p>
      </div>
      <Button render={<a href="/dashboard">Entrar</a>} />
    </div>
  )
}
