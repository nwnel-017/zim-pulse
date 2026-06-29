import Link from "next/link";
import { EmailAuthForm } from "@/app/_components/auth/email-auth-form";
import styles from "@/app/_components/auth/auth-page.module.css";
import { AppHeader } from "@/components/ui/AppHeader";

const isProduction = process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

export default function UserSignInPage() {
  return (
    <main className="page">
      <AppHeader activeItem="home" />

      <section className={styles.authLayout} aria-labelledby="sign-in-heading">
        <div className={styles.copy}>
          <h1
            className="type-display-base type-display-page-title"
            id="sign-in-heading"
          >
            SIGN IN
          </h1>
          <span className={styles.headingRule} aria-hidden="true" />
          <p className={`${styles.lead} type-lead`}>
            Verify your email to continue
          </p>
        </div>

        <EmailAuthForm
          className={styles.formCard}
          description={
            isProduction
              ? "Sign in with your email address. We will send you a one-time link to access your account."
              : "Sign in with your email address and the shared app password. In this environment you will be signed in immediately."
          }
          eyebrow="Existing Account"
          inputLabel="EMAIL ADDRESS"
          inputPlaceholder="email@email.com"
          mode="sign-in"
          showCopy={false}
          showEmailIcon
          submitLabel="LOGIN"
          title="Sign in with email"
        />

        <p className={`${styles.secondaryLink} type-body-small`}>
          Need an account?{" "}
          <Link href="/sign-up">Create one with your email</Link>.
        </p>
      </section>
    </main>
  );
}
