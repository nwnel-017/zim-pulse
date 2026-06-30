import Link from "next/link";
import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { AppHeader } from "@/components/ui/AppHeader";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import styles from "./page.module.css";

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
    <main className="page">
      <AppHeader activeItem="project" ariaLabel="Admin navigation" />

      <section className={styles.adminDashboard} aria-labelledby="admin-heading">
        <div className={styles.banner}>
          <p className={`${styles.eyebrow} type-display-base`}>admin console</p>
          <h1
            className={`${styles.heading} type-display-base type-display-page-title`}
            id="admin-heading"
          >
            ZimPulse
          </h1>
          <span className={styles.rule} aria-hidden="true" />
          <p className={`${styles.lead} type-lead`}>
            Monitor user activity and jump into the survey management pages when
            you need to review submissions or edit questions.
          </p>
        </div>

        <section className={styles.statGrid} aria-label="Admin summary">
          <article className={styles.statCard}>
            <p className={`${styles.statLabel} type-action-display`}>
              Users in app
            </p>
            <strong className={`${styles.statValue} type-display-base`}>
              {userCount}
            </strong>
            <Link
              className={`${styles.actionLink} type-button-label`}
              href="/admin/surveys"
            >
              View surveys
            </Link>
          </article>
          <article className={styles.statCard}>
            <p className={`${styles.statLabel} type-action-display`}>
              Survey questions
            </p>
            <strong className={`${styles.statValue} type-display-base`}>
              {surveyQuestionCount}
            </strong>
            <Link
              className={`${styles.actionLink} type-button-label`}
              href="/admin/questions"
            >
              View or edit questions
            </Link>
          </article>
          <article className={styles.statCard}>
            <p className={`${styles.statLabel} type-action-display`}>
              User globe
            </p>
            <strong className={`${styles.statValue} type-display-base`}>
              Insights
            </strong>
            <Link
              className={`${styles.actionLink} type-button-label`}
              href="/admin/globe"
            >
              View globe
            </Link>
          </article>
        </section>

        <dl className={styles.sessionList}>
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{session.user.role}</dd>
          </div>
        </dl>

        <div className={`${styles.actions} type-button-label`}>
          <SignOutButton redirectTo="/sign-in" />
        </div>
      </section>
    </main>
  );
}
