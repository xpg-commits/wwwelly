import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins/organization"
import { emailOTP } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/lib/db"
import { memberLimitForPlan } from "@/lib/plan"
import { DEFAULT_MEMBER_COLOR } from "@/lib/memberColors"
import { DEFAULT_MODULE_ORDER } from "@/lib/modules"
import { sendEmail } from "@/lib/email"

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
)

// baseURL is trusted automatically, but Vercel also serves the app from its
// own assigned domain (and a fresh one per preview deploy) — trust those too
// so login doesn't 500 with "invalid origin" before a custom domain is wired
// up, or on any preview deployment.
const trustedOrigins = [
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Blocks signUp.email() from creating a session until the emailOTP code
    // below is verified — see emailVerification.autoSignInAfterVerification
    // for what happens once it is.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Recupera tu contraseña de wwwelly",
        html: `
          <p>Hola ${user.name},</p>
          <p>Pulsa el siguiente enlace para elegir una contraseña nueva. Caduca en 1 hora.</p>
          <p><a href="${url}">Restablecer contraseña</a></p>
          <p>Si no lo has pedido tú, puedes ignorar este email.</p>
        `,
      })
    },
  },
  emailVerification: {
    // Verifying the OTP code logs the user straight in — no separate login
    // step after registering.
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      // Captured as a required field in the registration form itself, but
      // nullable here — existing users have none, and enforcing it at the
      // database level would need a backfill that doesn't exist for them.
      // Stored as "yyyy-MM-dd", same convention DatePickerField uses
      // everywhere else in the app.
      birthDate: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  plugins: [
    organization({
      // "Household" is our domain vocabulary for what the plugin calls an
      // "organization" — renamed at the table level instead of adding a
      // separate vocabulary layer, so the Prisma model itself reads as
      // Household/HouseholdMember/HouseholdInvite.
      schema: {
        organization: {
          modelName: "household",
          additionalFields: {
            planTier: {
              type: "string",
              required: true,
              defaultValue: "FREE",
              input: false,
            },
            // Which domain modules (Mascotas, Vehículos...) this household
            // actually uses — hidden from nav when off, so a household
            // without pets/kids/a car isn't stuck looking at empty sections.
            // Includes the synthetic "ALL" key ("Todo") — it's a togglable
            // entry in the same list, not a hardcoded fixture.
            enabledModules: {
              type: "string[]",
              required: true,
              defaultValue: DEFAULT_MODULE_ORDER,
            },
            // Full display order for the module filter chips, including
            // "ALL" — independent from enabledModules so toggling something
            // off doesn't lose its position when re-enabled later.
            moduleOrder: {
              type: "string[]",
              required: true,
              defaultValue: DEFAULT_MODULE_ORDER,
            },
          },
        },
        member: {
          modelName: "householdMember",
          additionalFields: {
            // Independent from the plugin's own `role` (owner/admin/member,
            // which governs household-management permissions): this axis
            // controls what a member is allowed to *see* ("cada uno ve solo
            // lo suyo"). Never branch visibility logic on `role`.
            visibilityRole: {
              type: "string",
              required: true,
              defaultValue: "ADULT",
            },
            displayName: {
              type: "string",
              required: false,
            },
            // Which of the five brand accent colors this member's tasks show
            // up in (task-item.tsx), chosen from their own profile page.
            color: {
              type: "string",
              required: true,
              defaultValue: DEFAULT_MEMBER_COLOR,
            },
          },
        },
        invitation: {
          modelName: "householdInvite",
        },
      },
      // Only enforced by Better Auth at *accept* time, not at invite-creation
      // time (verified against 1.6.23's crud-invites.mjs — createInvitation
      // never reads this option, only acceptInvitation does). It's still
      // worth setting as a safety net against races/stale invites; the
      // user-facing check at invite time lives in src/actions/household.ts.
      membershipLimit: async (_user, organization) =>
        memberLimitForPlan((organization as { planTier?: string }).planTier),
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutos
      // Envía el código automáticamente justo tras registrarse — no hace
      // falta pedirlo aparte desde el cliente.
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") return
        await sendEmail({
          to: email,
          subject: "Tu código de verificación de wwwelly",
          html: `
            <p>Tu código de verificación es:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
            <p>Caduca en 10 minutos. Si no has creado una cuenta en wwwelly, puedes ignorar
            este email.</p>
          `,
        })
      },
    }),
    // Must be the last plugin: lets Server Actions set auth cookies directly.
    nextCookies(),
  ],
})
