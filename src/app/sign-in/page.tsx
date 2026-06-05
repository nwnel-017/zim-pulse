import Link from "next/link";
import { UserSignInForm } from "@/app/_components/auth/email-auth-form";

export default function UserSignInPage() {
  return (
    <main className="auth-shell">
      <UserSignInForm />
      <p className="auth-secondary-link">
        Need an account? <Link href="/sign-up">Create one with your email</Link>.
      </p>
    </main>
  );
}
