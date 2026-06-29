import {
  getEditableSurveyResponseQuestions,
  getSurveyResponseSummary,
} from "@/lib/survey/survey";
import SurveyResponseEditor from "./survey-response-editor";
import styles from "./survey-response.module.css";

type SurveyResponseProps = {
  userId: string;
};

const submittedDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

export default async function SurveyResponse({
  userId,
}: SurveyResponseProps) {
  const [surveyResponseSummary, editableQuestions] = await Promise.all([
    getSurveyResponseSummary(userId),
    getEditableSurveyResponseQuestions(userId),
  ]);

  if (!surveyResponseSummary) {
    return null;
  }

  return (
    <section className={styles.surveyResponse}>
      <div className={styles.copy}>
        <p className={`${styles.kicker} type-action-display`}>
          Survey Response
        </p>
        <h2 className={`${styles.title} type-section-title`}>
          Your survey has been submitted.
        </h2>
        <p className={`${styles.description} type-lead`}>
          Your profile answers are stored on your account and available from
          this dashboard.
        </p>
      </div>

      <dl className={styles.metaList}>
        <div className={styles.metaItem}>
          <dt className={`${styles.metaLabel} type-action-display`}>
            Date Submitted
          </dt>
          <dd className={`${styles.metaValue} type-lead`}>
            {submittedDateFormatter.format(surveyResponseSummary.submittedAt)}
          </dd>
        </div>

        <div className={styles.metaItem}>
          <dt className={`${styles.metaLabel} type-action-display`}>
            Responses Saved
          </dt>
          <dd className={`${styles.metaValue} type-lead`}>
            {surveyResponseSummary.responseCount}
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <SurveyResponseEditor questions={editableQuestions} />
      </div>
    </section>
  );
}
