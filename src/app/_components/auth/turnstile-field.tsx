"use client";

import Script from "next/script";
import styles from "@/app/_components/auth/turnstile-field.module.css";

type TurnstileFieldProps = {
  siteKey: string | undefined;
};

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  if (!siteKey) {
    return null;
  }

  return (
    <div className={styles.field}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className={`cf-turnstile ${styles.widget}`}
        data-action="turnstile-spin-v1"
        data-sitekey={siteKey}
      />
      <p className={styles.helpText}>Complete the verification to continue.</p>
    </div>
  );
}
