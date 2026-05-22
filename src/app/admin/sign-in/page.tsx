import Link from "next/link";
import { AdminSignInForm } from "@/app/admin/_components/admin-sign-in-form";

export default function AdminSignInPage() {
  return (
    <main className="auth-shell">
      <AdminSignInForm />
      <p className="auth-secondary-link">
        Need an admin account? <Link href="/admin/sign-up">Create one temporarily</Link>.
      </p>
      <p className="auth-secondary-link">
        Returning user? <Link href="/sign-in">Go to email sign-in</Link>.
      </p>
    </main>
  );
}
