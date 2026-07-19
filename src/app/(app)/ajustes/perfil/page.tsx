import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { requireActiveMember } from "@/lib/session"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ColorPickerForm } from "@/components/profile/color-picker-form"
import { PersonalDetailsForm } from "@/components/profile/personal-details-form"
import { EntityPhotoUpload } from "@/components/shared/entity-photo-upload"
import { MyModulesForm } from "@/components/household/my-modules-form"
import { updateMyAvatarAction } from "@/actions/profile"
import { memberColorVar } from "@/lib/memberColors"
import { ALL_FILTER_KEY, isFilterKey, type FilterKey } from "@/lib/modules"

export default async function PerfilPage() {
  const { session, member } = await requireActiveMember()
  const color = (member as { color?: string }).color ?? "terracota"

  const household = await auth.api.getFullOrganization({ headers: await headers() })
  const rawEnabled = (household as { enabledModules?: unknown })?.enabledModules
  const householdEnabledModules: FilterKey[] = Array.isArray(rawEnabled)
    ? rawEnabled.filter(isFilterKey).filter((k) => k !== ALL_FILTER_KEY)
    : []
  const hiddenModules = (member as { hiddenModules?: string[] }).hiddenModules ?? []

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-10">
      <div className="flex items-center gap-4">
        <EntityPhotoUpload
          currentUrl={session.user.image}
          fallbackText={session.user.name.trim().charAt(0).toUpperCase()}
          fallbackColor={memberColorVar(color)}
          uploadAction={updateMyAvatarAction}
          size={72}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tu perfil</h1>
          <p className="text-muted-foreground">
            {session.user.name} · {session.user.email}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu color</CardTitle>
          <CardDescription>
            Así se distinguen tus tareas asignadas de las del resto del hogar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPickerForm currentColor={color} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>
            Usamos tu fecha de nacimiento para avisar de tu cumpleaños en el dashboard del hogar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonalDetailsForm
            initialBirthDate={session.user.birthDate ?? ""}
            initialPronouns={session.user.pronouns ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis módulos</CardTitle>
          <CardDescription>
            Elige qué módulos quieres ver tú — el resto del hogar no se ve afectado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MyModulesForm
            householdEnabledModules={householdEnabledModules}
            initialHidden={hiddenModules.filter(isFilterKey)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
