import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireUserSession } from "@/lib/auth/middleware";
import { getSurveyQuestions } from "@/lib/survey/survey";
import SurveyResponse from "./_components/survey-response";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const session = await requireUserSession();
  const surveyQuestions = await getSurveyQuestions();

  return (
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Dashboard navigation" />

      <section className={styles.dashboard} aria-labelledby="dashboard-heading">
        <div className={styles.banner}>
          <p className={`${styles.eyebrow} type-display-base`}>
            thank you for participating!
          </p>
          <span className={styles.rule} aria-hidden="true" />
        </div>

        <div className={`${styles.greeting} type-lead`}>
          <p>
            Hi <strong>{session.user.email}</strong>,
          </p>
          <p>thank you for participating.</p>
        </div>

        {surveyQuestions.length > 0 ? (
          <SurveyResponse userId={session.user.id} />
        ) : null}

        <div className={`${styles.actions} type-button-label`}>
          <Link href="/dashboard/user-insights">View user map</Link>
          <SignOutButton redirectTo="/sign-in" />
        </div>
      </section>
    </main>
  );
}
