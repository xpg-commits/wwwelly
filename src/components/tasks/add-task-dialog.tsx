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
export function AddTaskDialog({
  members,
  currentMemberId,
  floating = false,
  navIcon = false,
}: {
  members: { id: string; name: string }[]
  currentMemberId: string
  floating?: boolean
  // Sits inline inside the bottom nav pill, popped up slightly as the
  // row's one elevated "primary action" button.
  navIcon?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          navIcon ? (
            <Button
              size="icon-lg"
              className="size-12 -translate-y-2.5 rounded-full shadow-[0_4px_14px_-2px_rgba(70,60,140,0.45)] transition-all duration-200 active:scale-90"
              aria-label="Añadir tarea"
              data-tour="add-task-fab"
            >
              <PlusIcon className="size-5" />
            </Button>
          ) : floating ? (
            <Button
              size="icon-lg"
              className="size-14 rounded-full shadow-[0_6px_20px_-2px_rgba(70,60,140,0.4)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_26px_-2px_rgba(70,60,140,0.5)] active:translate-y-0"
              aria-label="Añadir tarea"
              data-tour="add-task-fab"
            >
              <PlusIcon className="size-6" />
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5">
              <PlusIcon className="size-4" />
              Añadir tarea
            </Button>
          )
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
            <QuickAddTaskForm
              members={members}
              currentMemberId={currentMemberId}
              onSuccess={() => setOpen(false)}
            />
          </TabsContent>
          <TabsContent value="assistant" className="pt-2">
            <AssistantForm onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
