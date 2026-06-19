import Link from "next/link";
import { EmailAuthForm } from "@/app/_components/auth/email-auth-form";
import { AppHeader } from "@/components/ui/AppHeader";
import styles from "./page.module.css";

const isProduction = process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

export default function UserSignUpPage() {
  return (
    <main className="page">
      <AppHeader activeItem="home" />

      <section className={styles.authLayout} aria-labelledby="sign-up-heading">
        <div className={styles.copy}>
          <h1 className={styles.heading} id="sign-up-heading">
            WELCOME
          </h1>
          <span className={styles.headingRule} aria-hidden="true" />
          <p className={styles.lead}>Verify your email to get started</p>
        </div>

        <EmailAuthForm
          className={styles.formCard}
          description={
            isProduction
              ? "Create your account with only your email address. We will send you a one-time link to finish signing up."
              : "Create your account with your email address and the shared app password. In this environment you will be signed in immediately."
          }
          eyebrow="New Account"
          inputLabel="EMAIL ADDRESS"
          inputPlaceholder="email@email.com"
          mode="sign-up"
          showCopy={false}
          showEmailIcon
          submitLabel="LOGIN"
          title="Sign up with email"
        />

        <p className={styles.secondaryLink}>
          Already registered? <Link href="/sign-in">Sign in with your email</Link>.
        </p>
      </section>
    </main>
  );
}
