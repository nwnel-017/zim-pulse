import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireUserSession } from "@/lib/auth/middleware";
import { getSurveyQuestions } from "@/lib/survey/survey";
import SurveyResponse from "./_components/survey-response";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireUserSession();
  const surveyQuestions = await getSurveyQuestions();

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">User Dashboard</p>
        <h1>Welcome back</h1>
        <p className="lead">Thank you for participating.</p>
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
        {surveyQuestions.length > 0 ? (
          <SurveyResponse userId={session.user.id} />
        ) : (
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
        )}
        <div>
          <Link href="/dashboard/user-insights" className="link">
            View User Map
          </Link>
        </div>
        <SignOutButton redirectTo="/sign-in" />
      </section>
    </main>
  );
}
