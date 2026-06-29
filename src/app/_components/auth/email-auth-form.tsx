"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileField } from "@/app/_components/auth/turnstile-field";
import { authClient } from "@/lib/auth/auth-client";
import EmailIcon from "@/components/ui/icons/Email";

type EmailAuthFormProps = {
  callbackPath?: string;
  className?: string;
  description: string;
  eyebrow: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  mode: "sign-in" | "sign-up";
  showCopy?: boolean;
  showEmailIcon?: boolean;
  submitLabel?: string;
  title: string;
};

type UserSignUpResponse = {
  message?: string;
};

const isProduction =
  process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      reset: () => void;
    };
  }
}

async function verifyTurnstileToken(token: string) {
  const response = await fetch("/api/turnstile/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json().catch(() => null)) as {
    success?: unknown;
  } | null;

  return result?.success === true;
}

export function EmailAuthForm({
  callbackPath = "/dashboard",
  className,
  description,
  eyebrow,
  inputLabel = "Email",
  inputPlaceholder = "you@example.com",
  mode,
  showCopy = true,
  showEmailIcon = false,
  submitLabel,
  title,
}: EmailAuthFormProps) {
  const router = useRouter();
  const [appPassword, setAppPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    if (!turnstileSiteKey) {
      setError("Verification is not configured.");
      setPending(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const turnstileToken = formData.get("cf-turnstile-response");

    if (typeof turnstileToken !== "string" || !turnstileToken) {
      setError("Complete the verification before continuing.");
      setPending(false);
      return;
    }

    try {
      const verified = await verifyTurnstileToken(turnstileToken);

      if (!verified) {
        window.turnstile?.reset();
        setError("Verification failed. Try again.");
        setPending(false);
        return;
      }
    } catch (error) {
      window.turnstile?.reset();
      setError(
        error instanceof Error
          ? error.message
          : "Verification failed. Try again.",
      );
      setPending(false);
      return;
    }

    if (mode === "sign-up") {
      if (!isProduction) {
        const response = await fetch("/api/dev/user-sign-up", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            appPassword,
            email,
          }),
        });

        const result = (await response
          .json()
          .catch(() => null)) as UserSignUpResponse | null;

        if (!response.ok) {
          setError(result?.message ?? "Unable to create your account.");
          setPending(false);
          return;
        }

        router.replace(callbackPath);
        router.refresh();
        return;
      }

      const { error: signUpError } = await authClient.signIn.magicLink({
        email,
        newUserCallbackURL: callbackPath,
      });

      if (signUpError) {
        setError(signUpError.message ?? "Unable to create your account.");
        setPending(false);
        return;
      }

      setNotice(
        "Check your email for the sign-in link to finish creating your account.",
      );
      setPending(false);
      return;
    }

    if (!isProduction) {
      const response = await fetch("/api/dev/user-sign-in", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          appPassword,
          email,
        }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as UserSignUpResponse | null;

      if (!response.ok) {
        setError(result?.message ?? "Unable to sign in.");
        setPending(false);
        return;
      }

      router.replace(callbackPath);
      router.refresh();
      return;
    }

    const { error: signInError } = await authClient.signIn.magicLink({
      email,
      callbackURL: callbackPath,
    });

    if (signInError) {
      setError(signInError.message ?? "Unable to sign in.");
      setPending(false);
      return;
    }

    setNotice("Check your email for the sign-in link.");
    setPending(false);
  }

  return (
    <div className={className ? `auth-card ${className}` : "auth-card"}>
      {showCopy ? (
        <div className="auth-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="type-label-display">{inputLabel}</span>
          <span className="auth-input-row">
            {showEmailIcon ? (
              <span className="auth-mail-icon" aria-hidden="true">
                <EmailIcon />
              </span>
            ) : null}
            <input
              autoComplete="email"
              className="type-input-text"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={inputPlaceholder}
              required
              type="email"
              value={email}
            />
          </span>
        </label>

        {(mode === "sign-up" || mode === "sign-in") && !isProduction ? (
          <label className="auth-field">
            <span className="type-label-display">App password</span>
            <input
              autoComplete="current-password"
              className="type-input-text"
              name="appPassword"
              onChange={(event) => setAppPassword(event.target.value)}
              required
              type="password"
              value={appPassword}
            />
          </label>
        ) : null}

        <TurnstileField siteKey={turnstileSiteKey} />

        <button
          className="auth-button type-button-label"
          disabled={pending}
          type="submit"
        >
          {!pending && submitLabel
            ? submitLabel
            : pending
              ? mode === "sign-up"
                ? isProduction
                  ? "Sending link..."
                : "Creating account..."
              : isProduction
                ? "Sending link..."
                : "Signing in..."
            : mode === "sign-up"
              ? isProduction
                ? "Email me a sign-up link"
                : "Create account"
              : isProduction
                ? "Email me a sign-in link"
                : "Sign in"}
        </button>
      </form>

      {notice ? <p className="type-form-message">{notice}</p> : null}
      {error ? <p className="auth-error type-form-message">{error}</p> : null}
    </div>
  );
}

export function UserSignInForm() {
  return (
    <EmailAuthForm
      description="Sign in with your email. We will send you a one-time link to access your account."
      eyebrow="User Access"
      mode="sign-in"
      title="Sign in with email"
    />
  );
}
