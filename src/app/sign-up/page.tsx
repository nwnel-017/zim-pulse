import Link from "next/link";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

export default function UserSignUpPage() {
  return (
    <main className="auth-shell">
      <EmailAuthForm
        description="Create your account with only your email address. We will send you a one-time link to finish signing up."
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
