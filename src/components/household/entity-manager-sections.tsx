"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { PencilIcon, TrashIcon } from "lucide-react"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { PetFormDialog } from "@/components/pets/pet-form-dialog"
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog"
import { ChildFormDialog } from "@/components/children/child-form-dialog"
import { deletePetAction } from "@/actions/pets"
import { deleteVehicleAction } from "@/actions/vehicles"
import { deleteChildAction } from "@/actions/children"

type ActionResult = { success: true } | { success: false; error: string }

function EntityRow({
  name,
  subtitle,
  onDelete,
  editTrigger,
}: {
  name: string
  subtitle?: string
  onDelete: () => Promise<ActionResult>
  editTrigger: React.ReactNode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="list-row justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium">{name}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1">
        {editTrigger}
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Eliminar">
                <TrashIcon className="size-3.5" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrará junto con sus tareas asociadas. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await onDelete()
                    if (!result.success) {
                      toast.error(result.error)
                      return
                    }
                    router.refresh()
                  })
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function PetsManagerSection({
  pets,
}: {
  pets: { id: string; name: string; species: string; breed: string | null; birthDate: Date | null }[]
}) {
  return (
    <AccordionItem value="pets">
      <AccordionTrigger>Mascotas ({pets.length})</AccordionTrigger>
      <AccordionContent className="space-y-2">
        {pets.map((pet) => (
          <EntityRow
            key={pet.id}
            name={pet.name}
            subtitle={[pet.species, pet.breed].filter(Boolean).join(" · ")}
            onDelete={() => deletePetAction(pet.id)}
            editTrigger={
              <PetFormDialog
                pet={pet}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Editar">
                    <PencilIcon className="size-3.5" />
                  </Button>
                }
              />
            }
          />
        ))}
        <PetFormDialog trigger={<Button variant="outline" size="sm">Añadir mascota</Button>} />
      </AccordionContent>
    </AccordionItem>
  )
}

export function VehiclesManagerSection({
  vehicles,
}: {
  vehicles: {
    id: string
    alias: string
    make: string | null
    model: string | null
    year: number | null
    plate: string | null
  }[]
}) {
  return (
    <AccordionItem value="vehicles">
      <AccordionTrigger>Vehículos ({vehicles.length})</AccordionTrigger>
      <AccordionContent className="space-y-2">
        {vehicles.map((vehicle) => (
          <EntityRow
            key={vehicle.id}
            name={vehicle.alias}
            subtitle={[vehicle.make, vehicle.model, vehicle.plate].filter(Boolean).join(" · ")}
            onDelete={() => deleteVehicleAction(vehicle.id)}
            editTrigger={
              <VehicleFormDialog
                vehicle={vehicle}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Editar">
                    <PencilIcon className="size-3.5" />
                  </Button>
                }
              />
            }
          />
        ))}
        <VehicleFormDialog trigger={<Button variant="outline" size="sm">Añadir vehículo</Button>} />
      </AccordionContent>
    </AccordionItem>
  )
}

export function ChildrenManagerSection({
  children,
}: {
  children: { id: string; name: string; birthDate: Date | null }[]
}) {
  return (
    <AccordionItem value="children">
      <AccordionTrigger>Niños ({children.length})</AccordionTrigger>
      <AccordionContent className="space-y-2">
        {children.map((child) => (
          <EntityRow
            key={child.id}
            name={child.name}
            onDelete={() => deleteChildAction(child.id)}
            editTrigger={
              <ChildFormDialog
                child={child}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Editar">
                    <PencilIcon className="size-3.5" />
                  </Button>
                }
              />
            }
          />
        ))}
        <ChildFormDialog trigger={<Button variant="outline" size="sm">Añadir hijo/a</Button>} />
      </AccordionContent>
    </AccordionItem>
  )
}
