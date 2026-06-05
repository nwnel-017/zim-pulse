import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins/magic-link";
import { sendAuthEmail } from "@/lib/email/email";
import { authPool } from "@/lib/prisma/db";

const isProduction = process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

export const auth = betterAuth({
  appName: "ZimPulse",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: authPool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: !isProduction,
    disableSignUp: false,
    requireEmailVerification: isProduction,
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    magicLink({
      async sendMagicLink({ email, url }) {
        await sendAuthEmail({
          email,
          subject: "Your ZimPulse sign-in link",
          text: `Open this link to sign in or create your account: ${url}`,
        });
      },
    }),
    nextCookies(),
  ],
});
