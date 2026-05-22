"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";

export function AdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });

    if (error) {
      setError(error.message ?? "Unable to sign in.");
      setPending(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">Admin Access</p>
        <h1>Sign in with email and password</h1>
        <p>
          Admin accounts are expected to be created separately. Public email
          registration is disabled.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <button className="auth-button" disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
