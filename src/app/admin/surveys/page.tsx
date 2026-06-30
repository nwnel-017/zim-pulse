import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { requireAdminSession } from "@/lib/auth/middleware";
import { getAdminSurveyEntries } from "@/lib/survey/survey";
import styles from "./page.module.css";

const submittedDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminSurveysPage() {
  await requireAdminSession();

  const surveyEntries = await getAdminSurveyEntries();

  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Admin surveys navigation" />

      <section className={styles.surveysPage} aria-labelledby="surveys-heading">
        <div className={styles.banner}>
          <p className={`${styles.eyebrow} type-display-base`}>admin console</p>
          <h1
            className={`${styles.heading} type-display-base type-display-page-title`}
            id="surveys-heading"
          >
            Survey entries
          </h1>
          <span className={styles.rule} aria-hidden="true" />
          <p className={`${styles.lead} type-lead`}>
            Review submitted survey entries and when each user completed their
            submission.
          </p>
        </div>

        <Link className={`${styles.actionLink} type-button-label`} href="/admin">
          Back to admin
        </Link>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={`${styles.sectionEyebrow} type-action-display`}>
              Submissions
            </p>
            <h2 className={`${styles.sectionHeading} type-display-base`}>
              All survey entries
            </h2>
          </div>

          {surveyEntries.length ? (
            <ol className={styles.entryList}>
              {surveyEntries.map((entry) => (
                <li className={styles.entryCard} key={entry.userId}>
                  <p className={`${styles.entryType} type-action-display`}>
                    Submitted survey
                  </p>
                  <p className={`${styles.entryEmail} type-lead`}>
                    {entry.email}
                  </p>
                  <p className={styles.entryMeta}>
                    Submitted {submittedDateFormatter.format(entry.submittedAt)}
                  </p>
                  <div className={styles.entryActions}>
                    <Link
                      className={`${styles.actionLink} type-button-label`}
                      href={`/admin/surveys/view/${entry.userId}`}
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={`${styles.emptyState} type-lead`}>
              No survey entries have been submitted yet.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
