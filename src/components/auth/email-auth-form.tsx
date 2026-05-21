"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

type EmailAuthFormProps = {
  callbackPath?: string;
  description: string;
  eyebrow: string;
  mode: "sign-in" | "sign-up";
  title: string;
};

export function EmailAuthForm({
  callbackPath = "/dashboard",
  description,
  eyebrow,
  mode,
  title,
}: EmailAuthFormProps) {
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

        <button className="auth-button" disabled={pending} type="submit">
          {pending
            ? mode === "sign-up"
              ? "Sending link..."
              : "Sending link..."
            : mode === "sign-up"
              ? "Email me a sign-up link"
              : "Email me a sign-in link"}
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
