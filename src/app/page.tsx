import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className="page">
      <AppHeader activeItem="home" />

      <section className={styles.hero} aria-labelledby="landing-heading">
        <div className={styles.heroText}>
          <h1 className={styles.heading} id="landing-heading">
            <span>WHERE ARE</span>
            <span>ZIMBABWEANS AROUND</span>
            <span>THE WORLD?</span>
          </h1>
          <p className={styles.lead}>
            Help build a real-time global map of the Zimbabwean diaspora
          </p>

          <Link className={styles.cta} href="/sign-up">
            add yourself to the map
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="ZimPulse map statistics">
        <article className={styles.statCard}>
          <span
            className={`${styles.statIcon} ${styles.groupIcon}`}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
          <p className={styles.statValue}>4,382 Zimbabweans mapped</p>
          <p className={styles.statLabel}>FULLY ANONYMOUS</p>
        </article>

        <article className={styles.statCard}>
          <span
            className={`${styles.statIcon} ${styles.globeIcon}`}
            aria-hidden="true"
          />
          <p className={styles.statValue}>78 countries represented</p>
          <p className={styles.statLabel}>RESEARCH DRIVEN</p>
        </article>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerText}>
          <Link href="#privacy">PRIVACY</Link>
          <Link href="#methodology">METHODOLOGY</Link>
          <Link href="#contact">CONTACT</Link>
        </span>
      </footer>
    </main>
  );
}
