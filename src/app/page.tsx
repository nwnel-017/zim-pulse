import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import GroupIcon from "@/components/ui/icons/Group";
import WorldIcon from "@/components/ui/icons/World";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className="page">
      <AppHeader activeItem="home" />

      <section className={styles.hero} aria-labelledby="landing-heading">
        <div className={styles.heroText}>
          <h1
            className={`${styles.heading} type-display-base type-display-hero`}
            id="landing-heading"
          >
            <span>WHERE ARE</span>
            <span>ZIMBABWEANS AROUND</span>
            <span>THE WORLD?</span>
          </h1>
          <p className={`${styles.lead} type-lead type-lead-compact`}>
            Help build a real-time global map of the Zimbabwean diaspora
          </p>

          <Link
            className={`${styles.cta} type-action-display type-action-link`}
            href="/sign-up"
          >
            add yourself to the map
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="ZimPulse map statistics">
        <article className={styles.statCard}>
          <span
            className={styles.statIcon}
            aria-hidden="true"
          >
            <GroupIcon />
          </span>
          <p className={`${styles.statValue} type-display-base type-display-value`}>
            4,382 Zimbabweans mapped
          </p>
          <p className={`${styles.statLabel} type-action-display type-stat-label`}>
            FULLY ANONYMOUS
          </p>
        </article>

        <article className={styles.statCard}>
          <span
            className={styles.statIcon}
            aria-hidden="true"
          >
            <WorldIcon />
          </span>
          <p className={`${styles.statValue} type-display-base type-display-value`}>
            78 countries represented
          </p>
          <p className={`${styles.statLabel} type-action-display type-stat-label`}>
            RESEARCH DRIVEN
          </p>
        </article>
      </section>

      <footer className={`${styles.footer} type-action-display type-footer-display`}>
        <span className={`${styles.footerText} type-action-display`}>
          <Link href="#privacy">PRIVACY</Link>
          <Link href="#methodology">METHODOLOGY</Link>
          <Link href="#contact">CONTACT</Link>
        </span>
      </footer>
    </main>
  );
}
