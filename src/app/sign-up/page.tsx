import Link from "next/link";
import { EmailAuthForm } from "@/app/_components/auth/email-auth-form";

const isProduction = process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

export default function UserSignUpPage() {
  return (
    <main className="auth-shell">
      <EmailAuthForm
        description={isProduction
          ? "Create your account with only your email address. We will send you a one-time link to finish signing up."
          : "Create your account with your email address and the shared app password. In this environment you will be signed in immediately."}
        eyebrow="New Account"
        mode="sign-up"
        title="Sign up with email"
      />
      <p className="auth-secondary-link">
        Already registered? <Link href="/sign-in">Sign in with your email</Link>.
      </p>
    </main>
  );
}
