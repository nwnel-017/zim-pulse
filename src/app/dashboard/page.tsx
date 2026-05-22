import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireUserSession } from "@/lib/auth/middleware";

export default async function DashboardPage() {
  const session = await requireUserSession();

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">User Dashboard</p>
        <h1>Welcome back</h1>
        <p className="lead">
          You are signed in through the email link flow.
        </p>
        <dl className="session-list">
          <div>
            <dt>Name</dt>
            <dd>{session.user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{session.user.role}</dd>
          </div>
        </dl>
        <SignOutButton redirectTo="/sign-in" />
      </section>
    </main>
  );
}
