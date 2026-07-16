"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QuickAddTaskForm } from "@/components/tasks/quick-add-task-form"
import { AssistantForm } from "@/components/ai/assistant-form"

// The one place in the app where a new task gets created from scratch:
// either type it yourself, or describe the situation and let Narela turn it
// into a plan. Available everywhere via the header, not just the dashboard.
export function AddTaskDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="size-4" />
            Añadir tarea
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir tarea</DialogTitle>
          <DialogDescription>
            A mano, o cuéntaselo a Narela y te propone el plan.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              ✍️ Escribir yo
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex-1">
              💬 Hablar con Narela
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-2">
            <QuickAddTaskForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="assistant" className="pt-2">
            <AssistantForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
