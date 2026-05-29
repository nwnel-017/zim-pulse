import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/middleware";
import { getAdminSurveyEntries } from "@/lib/survey/survey";

const submittedDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminSurveysPage() {
  await requireAdminSession();

  const surveyEntries = await getAdminSurveyEntries();

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <div className="admin-section-copy">
          <p className="eyebrow">Admin Console</p>
          <h1>Survey entries</h1>
          <p className="lead">
            Review submitted survey entries and when each user completed their
            submission.
          </p>
        </div>

        <Link className="auth-link-button ghost-button" href="/admin">
          Back to admin
        </Link>

        <section className="admin-section">
          <div className="admin-section-copy">
            <p className="eyebrow">Submissions</p>
            <h2>All survey entries</h2>
          </div>

          {surveyEntries.length ? (
            <ol className="admin-question-list">
              {surveyEntries.map((entry) => (
                <li className="admin-question-card" key={entry.userId}>
                  <p className="admin-question-type">Submitted survey</p>
                  <p className="admin-survey-email">{entry.email}</p>
                  <p className="admin-question-order">
                    Submitted {submittedDateFormatter.format(entry.submittedAt)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-empty-state">No survey entries have been submitted yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}
