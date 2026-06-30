import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { requireAdminSession } from "@/lib/auth/middleware";
import {
  getAdminSurveyEntryByUserId,
  getEditableSurveyResponseQuestions,
  getSurveyResponseSummary,
} from "@/lib/survey/survey";
import { surveyQuestionTypeLabels } from "@/lib/survey/question-types";
import type { SurveyAnswerValue } from "@/types/survey";
import styles from "./page.module.css";

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
    if (!answer.length) {
      return "No response saved.";
    }

    return answer
      .map((value) => typeof value === "string" ? value : value.label)
      .join(", ");
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
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Admin survey navigation" />

      <section className={styles.surveyView} aria-labelledby="survey-heading">
        <div className={styles.copy}>
          <p className={`${styles.eyebrow} type-display-base`}>
            admin console
          </p>
          <h1
            className={`${styles.heading} type-display-base type-display-page-title`}
            id="survey-heading"
          >
            Survey response
          </h1>
          <span className={styles.rule} aria-hidden="true" />
          <p className={`${styles.lead} type-lead`}>
            Review every saved answer for this survey submission.
          </p>
        </div>

        <div className={styles.actions}>
          <Link
            className={`${styles.actionLink} type-button-label`}
            href="/admin/surveys"
          >
            Back to surveys
          </Link>
        </div>

        <section className={styles.details}>
          <div className={styles.detailsCopy}>
            <p className={`${styles.sectionLabel} type-action-display`}>
              Submission Details
            </p>
            <h2 className={`${styles.email} type-section-title`}>
              {surveyEntry.email}
            </h2>
            <p className={`${styles.metaText} type-lead`}>
              Submitted{" "}
              {submittedDateFormatter.format(surveyResponseSummary.submittedAt)}
            </p>
            <p className={`${styles.metaLabel} type-action-display`}>
              Responses saved: {surveyResponseSummary.responseCount}
            </p>
          </div>

          {questions.length ? (
            <ol className={styles.questionList}>
              {questions.map((question, index) => {
                const formattedAnswer = formatAnswer(question.currentAnswer);

                return (
                  <li className={styles.questionCard} key={question.id}>
                    <p className={`${styles.questionOrder} type-body-small`}>
                      Question order: {index + 1}
                    </p>
                    <p className={`${styles.questionType} type-action-display`}>
                      {surveyQuestionTypeLabels[question.type]}
                    </p>
                    <p className={`${styles.questionType} type-action-display`}>
                      {question.required ? "Required question" : "Optional question"}
                    </p>
                    <p className={`${styles.questionPrompt} type-lead`}>
                      {question.prompt}
                    </p>
                    <p className={`${styles.response} type-body-small`}>
                      Response:{" "}
                      <span>{formattedAnswer}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={`${styles.emptyState} type-lead`}>
              No responses have been saved for this survey yet.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
