import { SignOutButton } from "@/app/_components/auth/sign-out-button";
import { requireUserSession } from "@/lib/auth/middleware";
import { getSurveyQuestions } from "@/lib/survey/survey";
import SurveyResponse from "./_components/survey-response";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Bebas_Neue, Caveat, Inter } from "next/font/google";
import styles from "./page.module.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default async function DashboardPage() {
  const session = await requireUserSession();
  const surveyQuestions = await getSurveyQuestions();

  return (
    <main className={`${styles.page} ${bebasNeue.variable} ${caveat.variable} ${inter.variable}`}>
      <AppHeader activeItem="project" ariaLabel="Dashboard navigation" />

      <section className={styles.dashboard} aria-labelledby="dashboard-heading">
        <div className={styles.banner}>
          <p className={styles.eyebrow}>thank you for participating!</p>
          <span className={styles.rule} aria-hidden="true" />
        </div>

        <div className={styles.greeting}>
          <p>
            Hi <strong>{session.user.email}</strong>,
          </p>
          <p>thank you for participating.</p>
        </div>

        {surveyQuestions.length > 0 ? (
          <SurveyResponse userId={session.user.id} />
        ) : null}

        <div className={styles.actions}>
          <Link href="/dashboard/user-insights">View user map</Link>
          <SignOutButton redirectTo="/sign-in" />
        </div>
      </section>
    </main>
  );
}
