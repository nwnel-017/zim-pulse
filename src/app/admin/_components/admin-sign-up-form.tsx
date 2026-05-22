"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminSignUpResponse = {
  message?: string;
};

export function AdminSignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/admin-sign-up", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        signupCode,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | AdminSignUpResponse
      | null;

    if (!response.ok) {
      setError(result?.message ?? "Unable to create the admin account.");
      setPending(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="auth-card">
      <div className="auth-copy">
        <p className="eyebrow">Temporary Admin Access</p>
        <h1>Create an admin account</h1>
        <p>
          This temporary flow creates an email-and-password account, then
          promotes it to the
          <code> admin </code>
          role on the server.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Name</span>
          <input
            autoComplete="name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Admin user"
            required
            type="text"
            value={name}
          />
        </label>

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
            autoComplete="new-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <label className="auth-field">
          <span>Admin signup code</span>
          <input
            autoComplete="one-time-code"
            name="signupCode"
            onChange={(event) => setSignupCode(event.target.value)}
            required
            type="password"
            value={signupCode}
          />
        </label>

        <button className="auth-button" disabled={pending} type="submit">
          {pending ? "Creating admin..." : "Create admin account"}
        </button>
      </form>

      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
