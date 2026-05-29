import Link from "next/link";
import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";

export default async function AdminPage() {
  const session = await requireAdminSession();
  const [userCount, surveyQuestionCount] = await Promise.all([
    prisma.user.count({
      where: {
        OR: [
          {
            NOT: {
              role: "admin",
            },
          },
        ],
      },
    }),
    prisma.surveyQuestion.count(),
  ]);

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin Console</p>
        <h1>{session.user.name}</h1>
        <p className="lead">
          Monitor user activity and jump into the survey management pages when
          you need to review submissions or edit questions.
        </p>
        <section className="admin-stat-grid" aria-label="Admin summary">
          <article className="admin-stat-card">
            <p className="admin-stat-label">Users in app</p>
            <strong className="admin-stat-value">{userCount}</strong>
            <Link className="auth-link-button ghost-button" href="/admin/surveys">
              View surveys
            </Link>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-label">Survey questions</p>
            <strong className="admin-stat-value">{surveyQuestionCount}</strong>
            <Link className="auth-link-button ghost-button" href="/admin/questions">
              View or edit questions
            </Link>
          </article>
        </section>
        <dl className="session-list">
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{session.user.role}</dd>
          </div>
        </dl>

        <SignOutButton redirectTo="/admin/sign-in" />
      </section>
    </main>
  );
}
