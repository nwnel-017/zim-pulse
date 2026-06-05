import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/middleware";
import {
  getAdminSurveyEntryByUserId,
  getEditableSurveyResponseQuestions,
  getSurveyResponseSummary,
} from "@/lib/survey/survey";
import { surveyQuestionTypeLabels } from "@/lib/survey/question-types";
import type { SurveyAnswerValue } from "@/types/survey";

type AdminSurveyViewPageProps = {
  params: Promise<{
    surveyId: string;
  }>;
};

const submittedDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatAnswer(answer: SurveyAnswerValue) {
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ") : "No response saved.";
  }

  if (typeof answer === "string") {
    return answer.trim().length ? answer : "No response saved.";
  }

  return answer.label.trim().length ? answer.label : "No response saved.";
}

export default async function AdminSurveyViewPage({
  params,
}: AdminSurveyViewPageProps) {
  await requireAdminSession();

  const { surveyId } = await params;
  const [surveyEntry, surveyResponseSummary, questions] = await Promise.all([
    getAdminSurveyEntryByUserId(surveyId),
    getSurveyResponseSummary(surveyId),
    getEditableSurveyResponseQuestions(surveyId),
  ]);

  if (
    !surveyEntry ||
    surveyEntry.role === "admin" ||
    !surveyResponseSummary
  ) {
    notFound();
  }

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <div className="admin-section-copy">
          <p className="eyebrow">Admin Console</p>
          <h1>Survey response</h1>
          <p className="lead">
            Review every saved answer for this survey submission.
          </p>
        </div>

        <div className="admin-inline-actions">
          <Link className="auth-link-button ghost-button" href="/admin/surveys">
            Back to surveys
          </Link>
        </div>

        <section className="admin-section">
          <div className="admin-section-copy">
            <p className="eyebrow">Submission Details</p>
            <h2>{surveyEntry.email}</h2>
            <p className="admin-question-order">
              Submitted{" "}
              {submittedDateFormatter.format(surveyResponseSummary.submittedAt)}
            </p>
            <p className="admin-question-type">
              Responses saved: {surveyResponseSummary.responseCount}
            </p>
          </div>

          {questions.length ? (
            <ol className="admin-question-list">
              {questions.map((question, index) => {
                const formattedAnswer = formatAnswer(question.currentAnswer);

                return (
                  <li className="admin-question-card" key={question.id}>
                    <p className="admin-question-order">
                      Question order: {index + 1}
                    </p>
                    <p className="admin-question-type">
                      {surveyQuestionTypeLabels[question.type]}
                    </p>
                    <p className="admin-question-type">
                      {question.required ? "Required question" : "Optional question"}
                    </p>
                    <p className="admin-question-prompt">{question.prompt}</p>
                    <p className="admin-question-type">
                      Response:{" "}
                      <span>{formattedAnswer}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="admin-empty-state">
              No responses have been saved for this survey yet.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
