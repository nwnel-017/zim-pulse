import { createSurveyQuestion } from "@/app/admin/actions";
import { DeleteSurveyQuestionForm } from "@/app/admin/_components/delete-survey-question-form";
import { SurveyQuestionCreator } from "@/app/admin/_components/survey-question-creator";
import { SurveyQuestionEditor } from "@/app/admin/_components/survey-question-editor";
import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { surveyQuestionTypeLabels } from "@/lib/survey/question-types";

export default async function AdminPage() {
  const session = await requireAdminSession();
  const [userCount, surveyQuestions] = await Promise.all([
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
    prisma.surveyQuestion.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  return (
    <main className="app-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin Console</p>
        <h1>{session.user.name}</h1>
        <p className="lead">
          Review the current survey setup, add new survey questions, and monitor
          how many non-admin users are in the app.
        </p>
        <section className="admin-stat-grid" aria-label="Admin summary">
          <article className="admin-stat-card">
            <p className="admin-stat-label">Users in app</p>
            <strong className="admin-stat-value">{userCount}</strong>
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

        <section className="admin-section">
          <div className="admin-section-copy">
            <p className="eyebrow">Survey Builder</p>
            <h2>All survey questions</h2>
          </div>

          {surveyQuestions.length ? (
            <ol className="admin-question-list">
              {surveyQuestions.map((question) => (
                <li className="admin-question-card" key={question.id}>
                  <p className="admin-question-type">
                    {surveyQuestionTypeLabels[question.type]}
                  </p>
                  <p className="admin-question-prompt">{question.prompt}</p>
                  <div className="admin-question-actions">
                    <SurveyQuestionEditor
                      prompt={question.prompt}
                      questionId={question.id}
                    />

                    <DeleteSurveyQuestionForm questionId={question.id} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-empty-state">
              No survey questions have been added yet.
            </p>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-section-copy">
            <p className="eyebrow">Add Question</p>
            <h2>Create a survey question</h2>
          </div>

          <SurveyQuestionCreator action={createSurveyQuestion} />
        </section>

        <SignOutButton redirectTo="/admin/sign-in" />
      </section>
    </main>
  );
}
