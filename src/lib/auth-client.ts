import { createAuthClient } from "better-auth/react"
import {
  organizationClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins"
// Type-only — erased at compile time, never bundles server code (db,
// Resend, etc.) into the client. Only here so inferAdditionalFields can see
// the shape of user.additionalFields (birthDate) declared in auth.ts.
import type { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  plugins: [organizationClient(), emailOTPClient(), inferAdditionalFields<typeof auth>()],
})

export const { signIn, signUp, signOut, useSession } = authClient
