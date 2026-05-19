import Link from "next/link";
import { AdminSignUpForm } from "@/components/auth/admin-sign-up-form";

export default function AdminSignUpPage() {
  return (
    <main className="auth-shell">
      <AdminSignUpForm />
      <p className="auth-secondary-link">
        Already have an admin account? <Link href="/admin/sign-in">Sign in here</Link>.
      </p>
      <p className="auth-secondary-link">
        Need regular user access? <Link href="/sign-in">Use the email sign-in</Link>.
      </p>
    </main>
  );
}
