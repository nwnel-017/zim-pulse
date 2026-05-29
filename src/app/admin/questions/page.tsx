import Link from "next/link";
import { SurveyQuestionsManager } from "@/app/admin/_components/survey-questions-manager";
import { requireAdminSession } from "@/lib/auth/middleware";
import { getSurveyQuestions } from "@/lib/survey/survey";

export default async function AdminQuestionsPage() {
  await requireAdminSession();

  const surveyQuestions = await getSurveyQuestions();

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <div className="admin-section-copy">
          <p className="eyebrow">Admin Console</p>
          <h1>Survey questions</h1>
          <p className="lead">
            View, edit, and create the questions used in the survey flow.
          </p>
        </div>

        <Link className="auth-link-button ghost-button" href="/admin">
          Back to admin
        </Link>

        <SurveyQuestionsManager surveyQuestions={surveyQuestions} />
      </section>
    </main>
  );
}
