"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

type EmailAuthFormProps = {
  callbackPath?: string;
  description: string;
  eyebrow: string;
  mode: "sign-in" | "sign-up";
  title: string;
};

type UserSignUpResponse = {
  message?: string;
};

const isProduction =
  process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT === "true";

export function EmailAuthForm({
  callbackPath = "/dashboard",
  description,
  eyebrow,
  mode,
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
    <div className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        {(mode === "sign-up" || mode === "sign-in") && !isProduction ? (
          <label className="auth-field">
            <span>App password</span>
            <input
              autoComplete="current-password"
              name="appPassword"
              onChange={(event) => setAppPassword(event.target.value)}
              required
              type="password"
              value={appPassword}
            />
          </label>
        ) : null}

        <button className="auth-button" disabled={pending} type="submit">
          {pending
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

      {notice ? <p>{notice}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
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
